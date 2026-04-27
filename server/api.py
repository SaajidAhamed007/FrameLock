import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import time
import datetime
from typing import Dict, Any, List

from src.analyzer import Analyzer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store
jobs: Dict[str, Dict[str, Any]] = {}

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
            max_candidates=10 # Search for 10 candidate videos
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
        
        for c in raw_results.get("candidates", []):
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
                "channel": c.get("uploader", "Unknown Channel"),
                "thumbnailUrl": c["thumbnail_url"],
                "views": int(10000 * float(sim)),
                "similarity": float(sim),
                "risk": risk,
                "platform": "youtube",
                "uploadedAt": "2024-03-20T12:00:00Z",
                "duration": "10:00",
                "url": c["url"]
            })
            
            propagation_nodes.append({
                "id": det_id,
                "title": c["title"][:20] + "...",
                "views": int(10000 * float(sim)),
                "risk": risk,
                "similarity": float(sim),
                "x": 0, # Frontend will handle force layout or ignore these
                "y": 0,
                "connections": ["original"]
            })
            propagation_nodes[0]["connections"].append(det_id)

        mapped_results = {
            "job_id": job_id,
            "status": "completed",
            "input_video": {
                "title": raw_results["input_video"].get("title", "Unknown"),
                "thumbnailUrl": raw_results["input_video"].get("thumbnail_url", ""),
                "duration": "00:00",
                "resolution": "1080p",
                "uploadedAt": "2024-03-27T10:00:00Z",
                "platform": "youtube",
                "channel": raw_results["input_video"].get("uploader", "Unknown Channel")
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
                },
                {
                    "label": "Candidate Key",
                    "value": f"{len(detections)}",
                    "change": f"Frame matches: {len(detections)}",
                    "positive": True
                }
            ],
            "detections": detections,
            "propagation_nodes": propagation_nodes
        }
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = {"stage": "done", "percent": 100, "details": "Analysis complete"}
        jobs[job_id]["results"] = mapped_results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


@app.post("/api/analyze")
def start_analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "status": "pending",
        "progress": {"stage": "queued", "percent": 0, "details": "Job queued"}
    }
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

@app.post("/api/report/generate")
def generate_report(job_id: str):
    """Generate an AI-powered comprehensive report for a completed analysis."""
    if job_id not in jobs or jobs[job_id]["status"] != "completed":
        return {"error": "Job not found or not completed"}, 400
    
    results = jobs[job_id].get("results", {})
    detections = results.get("detections", [])
    input_video = results.get("input_video", {})
    risk_summary = results.get("risk_summary", {})
    
    # Calculate statistics
    total_detections = len(detections)
    high_risk = risk_summary.get("high", 0)
    medium_risk = risk_summary.get("medium", 0)
    low_risk = risk_summary.get("low", 0)
    avg_similarity = sum(d.get("similarity", 0) for d in detections) / max(total_detections, 1)
    
    # Generate AI insights using simple heuristics (can be replaced with actual LLM)
    insights = []
    
    if high_risk > 0:
        insights.append(f"🚨 CRITICAL: {high_risk} high-risk matches detected with similarity scores above 85%. Immediate action recommended.")
    
    if avg_similarity > 0.8:
        insights.append(f"⚠️ High average similarity ({avg_similarity:.1%}) indicates potential widespread infringement across {total_detections} videos.")
    
    if total_detections > 5:
        insights.append(f"📊 Large-scale distribution detected: Content found on {total_detections} different videos/channels.")
        top_channels = {}
        for d in detections:
            channel = d.get("channel", "Unknown")
            top_channels[channel] = top_channels.get(channel, 0) + 1
        sorted_channels = sorted(top_channels.items(), key=lambda x: x[1], reverse=True)[:3]
        for channel, count in sorted_channels:
            insights.append(f"   • {channel}: {count} match(es)")
    
    if medium_risk > 0:
        insights.append(f"⚠️ {medium_risk} medium-risk matches (60-85% similarity) require review and potential action.")
    
    if low_risk > 0:
        insights.append(f"ℹ️ {low_risk} low-risk matches detected but may require monitoring.")
    
    # Recommendations
    recommendations = []
    if high_risk > 0:
        recommendations.append("File DMCA takedown notices with YouTube for high-risk matches")
        recommendations.append("Monitor infringing accounts for future uploads")
    
    if total_detections > 3:
        recommendations.append("Consider broader copyright protection measures")
        recommendations.append("Implement automated monitoring for detected channels")
    
    if avg_similarity > 0.75:
        recommendations.append("Escalate to legal team for potential litigation")
    
    recommendations.append(f"Re-scan this video periodically to track new instances")
    
    report = {
        "job_id": job_id,
        "generated_at": str(datetime.datetime.now()),
        "original_video": {
            "title": input_video.get("title", "Unknown"),
            "channel": input_video.get("uploader", "Unknown"),
            "url": input_video.get("url", ""),
        },
        "executive_summary": {
            "total_matches": total_detections,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "average_similarity": round(avg_similarity, 4),
            "risk_level": "CRITICAL" if high_risk > 0 else "HIGH" if medium_risk > 2 else "MEDIUM" if medium_risk > 0 else "LOW"
        },
        "ai_insights": insights,
        "recommendations": recommendations,
        "detections": [
            {
                "rank": i + 1,
                "title": d.get("title", ""),
                "channel": d.get("channel", ""),
                "similarity": d.get("similarity", 0),
                "risk": d.get("risk", "low"),
                "url": d.get("url", ""),
            }
            for i, d in enumerate(detections[:20])  # Top 20 detections
        ]
    }
    
    return report

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
