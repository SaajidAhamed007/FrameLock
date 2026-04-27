import sys
import os
import io

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
