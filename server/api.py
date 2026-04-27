import sys
import os
import io
import json

from dotenv import load_dotenv
load_dotenv()  # Load .env at server startup

# Fix Windows console encoding for Unicode output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import time
from typing import Dict, Any, List

from src.analyzer import Analyzer
from google import genai
from google.genai import types
import tenacity

# Initialize Gemini Client at top level
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. AI reporting will be unavailable.")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

def generate_report_for_job(job_id: str, results: Dict[str, Any]):
    if not gemini_client:
        print(f"Skipping report for {job_id}: No API Key")
        jobs[job_id]["report"] = {"error": "Gemini API Key not configured"}
        return

    # Prepare the data context for the prompt
    input_video = results.get("input_video", {})
    detections = results.get("detections", [])
    risk = results.get("risk_summary", {})
    metrics = results.get("metrics", [])
    
    reach = next((m["value"] for m in metrics if m["label"] == "Estimated Audience Reach"), "0")
    rev_loss = next((m["value"] for m in metrics if m["label"] == "Potential Revenue Loss"), "$0")
    
    # Limit to top 5 detections for stability
    top_detections = sorted(detections, key=lambda x: x.get('views', 0), reverse=True)[:5]
    
    prompt = f"""You are an AI analyst generating a professional media protection report.

Your task is to analyze detected unauthorized media usage and produce a structured, high-quality intelligence report.

-----------------------------------
INPUT DATA
-----------------------------------

Original Video:
- Title: {input_video.get('title', 'Unknown')}
- Source: {input_video.get('platform', 'youtube')}
- Duration: {input_video.get('duration', '00:00')}

Detection Data (top 5):
{json.dumps([{ 'title': d['title'], 'channel': d['channel'], 'similarity': d['similarity'], 'views': d['views'], 'risk': d['risk'] } for d in top_detections], indent=2)}

Metrics:
- Total Detections: {len(detections)}
- High Risk: {risk.get('high', 0)}
- Medium Risk: {risk.get('medium', 0)}
- Low Risk: {risk.get('low', 0)}
- Total Reach: {reach}
- Estimated Revenue Loss: {rev_loss}

-----------------------------------
OUTPUT REQUIREMENTS
-----------------------------------

Generate a structured report with the following sections:

1. EXECUTIVE SUMMARY: High-level overview (3-4 sentences), key findings, overall risk.
2. KEY THREATS: Top 3 most critical detections. Include title, similarity %, views, why it is high risk.
3. PROPAGATION ANALYSIS: How content spread, clusters/patterns, viral nodes.
4. IMPACT ASSESSMENT: Estimated audience reach, financial implications, brand risk.
5. ANOMALY DETECTION: Identify unusual patterns (sudden spikes, repeated channels, coordinated uploads).
6. RECOMMENDED ACTIONS: Prioritized actions (takedown targets, monitoring suggestions).
7. CONFIDENCE ANALYSIS: Why matches are reliable (visual similarity, etc).

-----------------------------------
STYLE REQUIREMENTS
-----------------------------------
- Professional and concise
- Avoid generic statements
- Use specific data points
- No fluff
- Tone: analytical, decision-oriented

-----------------------------------
OUTPUT FORMAT
-----------------------------------
Return strictly valid JSON exactly matching this structure, with no markdown code blocks:
{{
  "executive_summary": "...",
  "key_threats": [{{"title": "...", "similarity": "...", "views": "...", "risk_reason": "..."}}],
  "propagation_analysis": "...",
  "impact_assessment": "...",
  "anomalies": "...",
  "recommendations": ["..."],
  "confidence_analysis": "..."
}}
"""
    # Debug logs
    print(f"[DEBUG] Generating report for job {job_id}")
    print(f"[DEBUG] Prompt length: {len(prompt)} characters")
    print(f"[DEBUG] Detection count passed: {len(top_detections)}")

    @tenacity.retry(
        wait=tenacity.wait_exponential(multiplier=2, min=3, max=20),
        stop=tenacity.stop_after_attempt(3), # Reduced attempts for background task
        retry=tenacity.retry_if_exception_type(Exception),
        before_sleep=lambda retry_state: print(f"Retrying AI report generation for {job_id} (attempt {retry_state.attempt_number})...")
    )
    def call_gemini():
        return gemini_client.models.generate_content(
            model="gemini-1.5-flash-latest",   # ✅ FIXED
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=2048
            )
    )

    try:
        response = call_gemini()
        # Safe JSON parsing
        try:
            cleaned_text = response.text.strip()
            # Basic markdown block removal if present
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```")[1]
                if cleaned_text.startswith("json"):
                    cleaned_text = cleaned_text[4:]
            
            jobs[job_id]["report"] = json.loads(cleaned_text)
            print(f"[DEBUG] Report generated and parsed successfully for {job_id}")
        except Exception as json_err:
            print(f"[WARNING] Failed to parse AI response as JSON: {json_err}")
            # Fallback to raw text
            jobs[job_id]["report"] = {
                "executive_summary": response.text,
                "is_raw": True,
                "error": "Failed to parse structured JSON, returning raw analysis."
            }
        save_jobs() # Persist the report
    except Exception as e:
        print(f"Error generating AI report after retries for {job_id}: {e}")
        jobs[job_id]["report"] = {"error": f"AI Generation failed: {str(e)}"}


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistence helpers for POC
JOBS_FILE = "jobs_db.json"

def save_jobs():
    try:
        with open(JOBS_FILE, "w") as f:
            json.dump(jobs, f)
    except Exception as e:
        print(f"Error saving jobs: {e}")

def load_jobs():
    if os.path.exists(JOBS_FILE):
        try:
            with open(JOBS_FILE, "r") as f:
                loaded = json.load(f)
                # Cleanup: jobs that were active/pending are now interrupted
                for jid, job in loaded.items():
                    if job.get("status") in ["active", "pending"]:
                        job["status"] = "failed"
                        job["error"] = "Analysis interrupted by server restart"
                return loaded
        except Exception as e:
            print(f"Error loading jobs: {e}")
    return {}

# In-memory job store (initialized from file)
jobs: Dict[str, Dict[str, Any]] = load_jobs()

class AnalyzeRequest(BaseModel):
    url: str
    frames: int = 3
    candidate_frames: int = 0
    threshold: float = 0.85

def run_analysis_task(job_id: str, req: AnalyzeRequest):
    jobs[job_id]["status"] = "active"
    jobs[job_id]["progress"] = {"stage": "extracting", "percent": 10, "details": "Extracting input video..."}
    try:
        analyzer = Analyzer(
            n_frames=req.frames,
            m_frames=req.candidate_frames,
            threshold=req.threshold,
            max_candidates=10
        )
        jobs[job_id]["progress"] = {"stage": "detecting", "percent": 50, "details": "Analyzing candidates..."}
        
        raw_results = analyzer.run(req.url)
        
        # Map raw results to the JSON schema defined in docs
        
        # Risk Distribution Logic
        high_risk = 0
        med_risk = 0
        low_risk = 0
        
        detections = []
        propagation_nodes = [
            {
                "id": "original",
                "title": raw_results["input_video"].get("title", "Unknown"),
                "views": 1000000,
                "risk": "original",
                "similarity": 1.0,
                "x": 50,
                "y": 50,
                "connections": []
            }
        ]
        
        import math
        candidates_list = raw_results.get("candidates", [])
        for i, c in enumerate(candidates_list):
            sim = c["max_similarity"]
            if sim >= 0.85:
                risk = "high"
                high_risk += 1
            elif sim >= 0.70:
                risk = "medium"
                med_risk += 1
            else:
                risk = "low"
                low_risk += 1
                
            det_id = str(uuid.uuid4())
            detections.append({
                "id": det_id,
                "title": c["title"],
                "channel": "YouTube Channel", # Placeholder
                "thumbnailUrl": c["thumbnail_url"],
                "views": int(10000 * float(sim)),
                "similarity": float(sim),
                "risk": risk,
                "platform": "youtube",
                "uploadedAt": "2024-03-20T12:00:00Z",
                "duration": "10:00",
                "url": c["url"]
            })
            
            # Position nodes in a circle around the center (50, 50)
            angle = (i / max(1, len(candidates_list))) * 2 * math.pi
            # Higher similarity means it's closer to the original node
            radius = 40 - (float(sim) * 15)
            x = 50 + radius * math.cos(angle)
            y = 50 + radius * math.sin(angle)
            
            propagation_nodes.append({
                "id": det_id,
                "title": c["title"][:20] + "...",
                "views": int(10000 * float(sim)),
                "risk": risk,
                "similarity": float(sim),
                "x": x,
                "y": y,
                "connections": ["original"]
            })
            propagation_nodes[0]["connections"].append(det_id)

        def format_duration(seconds):
            if not seconds: return "00:00"
            m = int(seconds // 60)
            s = int(seconds % 60)
            return f"{m:02d}:{s:02d}"

        mapped_results = {
            "job_id": job_id,
            "status": "completed",
            "input_video": {
                "title": raw_results["input_video"].get("title", "Unknown"),
                "thumbnailUrl": raw_results["input_video"].get("thumbnail_url") or "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=1200",
                "duration": format_duration(raw_results["input_video"].get("duration")),
                "resolution": "1080p",
                "uploadedAt": "2024-03-27T10:00:00Z",
                "platform": "youtube"
            },
            "fingerprint": {
                "id": f"FP-{uuid.uuid4().hex[:8].upper()}",
                "framesAnalyzed": raw_results["n_frames"],
                "model": "CLIP ViT-B/32",
                "createdAt": "2024-03-27T10:05:00Z"
            },
            "risk_summary": {
                "high": high_risk,
                "medium": med_risk,
                "low": low_risk
            },
            "metrics": [
                {
                    "label": "Total Reach Impact",
                    "value": "2.4M",
                    "change": "+12.4%",
                    "positive": False
                },
                {
                    "label": "Estimated Revenue Loss",
                    "value": "$14,200",
                    "change": "+8.1%",
                    "positive": False
                }
            ],
            "detections": detections,
            "propagation_nodes": propagation_nodes
        }
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = {"stage": "done", "percent": 100, "details": "Analysis complete"}
        jobs[job_id]["results"] = mapped_results
        
        # Start AI report generation in background after analysis completes
        print(f"Triggering background AI report generation for {job_id}...")
        save_jobs() # Persist analysis results before starting report
        generate_report_for_job(job_id, mapped_results)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        save_jobs()


@app.post("/api/analyze")
def start_analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "status": "pending",
        "progress": {"stage": "queued", "percent": 0, "details": "Job queued"}
    }
    save_jobs()
    import threading
    t = threading.Thread(target=run_analysis_task, args=(job_id, req))
    t.start()
    return {"job_id": job_id, "status": "pending", "message": "Analysis started successfully"}

@app.get("/api/analyze/{job_id}")
def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", {}),
        "error": job.get("error")
    }

@app.get("/api/results/{job_id}")
def get_results(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    if job["status"] != "completed":
        return {"status": job["status"], "message": "Job not completed yet"}
    
    return job["results"]

@app.post("/api/precheck")
def precheck(file: UploadFile = File(...)):
    # Mocking precheck response for POC
    time.sleep(2)
    return {
        "status": "completed",
        "safe_to_upload": False,
        "conflicts": [
            {
                "title": "Existing Copyrighted Video",
                "url": "https://youtube.com/watch?v=123",
                "similarity": 0.94
            }
        ]
    }

@app.get("/api/debug/threads")
def debug_threads():
    import traceback
    import sys
    stacks = []
    for thread_id, frame in sys._current_frames().items():
        stacks.append(f"Thread ID: {thread_id}")
        stacks.append("".join(traceback.format_stack(frame)))
        stacks.append("-" * 40)
    return {"threads": "\n".join(stacks)}

@app.get("/api/reports/{job_id}")
def get_ai_report(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs[job_id]
    
    # Check if report is already generated
    if "report" in job:
        return job["report"]
        
    # Check if analysis is even done
    if job["status"] != "completed":
        return {"status": "pending", "message": "Analysis is still running. Report will be generated upon completion."}
        
    # If analysis is done but report is missing (e.g. background task crashed)
    # We could trigger it here, but per requirements we just return the stored report
    return {"status": "processing", "message": "Report generation in progress..."}

