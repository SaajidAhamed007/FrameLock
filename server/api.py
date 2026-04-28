import sys
import os
import datetime
import time
import uuid
from contextlib import contextmanager

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from psycopg2 import pool
from psycopg2.extras import RealDictCursor, Json

from src.analyzer import Analyzer
from src.video_processor import VideoProcessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "sports_media")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "2121")

_db_pool: Optional[pool.SimpleConnectionPool] = None


def get_db_pool() -> pool.SimpleConnectionPool:
    global _db_pool
    if _db_pool is None:
        _db_pool = pool.SimpleConnectionPool(
            1,
            10,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            connect_timeout=5,
        )
    return _db_pool


@contextmanager
def db_cursor():
    conn = get_db_pool().getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        get_db_pool().putconn(conn)


def init_db() -> None:
    with db_cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id UUID PRIMARY KEY,
                status TEXT NOT NULL,
                progress JSONB,
                results JSONB,
                report JSONB,
                error TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS assets (
                id UUID PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                monitoring_frequency TEXT,
                last_checked TIMESTAMPTZ,
                status TEXT NOT NULL DEFAULT 'idle'
            )
            """
        )


def parse_iso_datetime(value: Optional[str]) -> Optional[datetime.datetime]:
    if not value:
        return None
    cleaned = value.replace("Z", "+00:00")
    return datetime.datetime.fromisoformat(cleaned)


def parse_uuid(value: str) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(value)
    except ValueError:
        return None


def serialize_job(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "status": row["status"],
        "progress": row.get("progress") or {},
        "results": row.get("results"),
        "report": row.get("report"),
        "error": row.get("error"),
    }


def serialize_asset(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "url": row["url"],
        "title": row["title"],
        "addedAt": row["added_at"].isoformat() if row.get("added_at") else None,
        "monitoringFrequency": row.get("monitoring_frequency"),
        "lastChecked": row["last_checked"].isoformat() if row.get("last_checked") else None,
        "status": row.get("status", "idle"),
    }


def create_job(job_id: str, status: str, progress: Dict[str, Any]) -> Dict[str, Any]:
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO jobs (id, status, progress)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (uuid.UUID(job_id), status, Json(progress)),
        )
        return serialize_job(cursor.fetchone())


def update_job(
    job_id: str,
    status: Optional[str] = None,
    progress: Optional[Dict[str, Any]] = None,
    results: Optional[Dict[str, Any]] = None,
    report: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    fields: List[str] = []
    values: List[Any] = []

    if status is not None:
        fields.append("status = %s")
        values.append(status)
    if progress is not None:
        fields.append("progress = %s")
        values.append(Json(progress))
    if results is not None:
        fields.append("results = %s")
        values.append(Json(results))
    if report is not None:
        fields.append("report = %s")
        values.append(Json(report))
    if error is not None:
        fields.append("error = %s")
        values.append(error)

    if not fields:
        return get_job(job_id)

    fields.append("updated_at = NOW()")
    values.append(uuid.UUID(job_id))

    with db_cursor() as cursor:
        cursor.execute(
            f"UPDATE jobs SET {', '.join(fields)} WHERE id = %s RETURNING *",
            values,
        )
        row = cursor.fetchone()
        return serialize_job(row) if row else None


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    parsed_id = parse_uuid(job_id)
    if not parsed_id:
        return None
    with db_cursor() as cursor:
        cursor.execute("SELECT * FROM jobs WHERE id = %s", (parsed_id,))
        row = cursor.fetchone()
        return serialize_job(row) if row else None


def list_assets_db() -> List[Dict[str, Any]]:
    with db_cursor() as cursor:
        cursor.execute("SELECT * FROM assets ORDER BY added_at DESC")
        rows = cursor.fetchall() or []
        return [serialize_asset(row) for row in rows]


def get_asset_db(asset_id: str) -> Optional[Dict[str, Any]]:
    parsed_id = parse_uuid(asset_id)
    if not parsed_id:
        return None
    with db_cursor() as cursor:
        cursor.execute("SELECT * FROM assets WHERE id = %s", (parsed_id,))
        row = cursor.fetchone()
        return serialize_asset(row) if row else None


def create_asset_db(url: str, title: str) -> Dict[str, Any]:
    asset_id = uuid.uuid4()
    with db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO assets (id, url, title)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (asset_id, url, title),
        )
        return serialize_asset(cursor.fetchone())


def update_asset_db(asset_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    fields: List[str] = []
    values: List[Any] = []

    if "monitoringFrequency" in updates:
        fields.append("monitoring_frequency = %s")
        values.append(updates["monitoringFrequency"])
    if "lastChecked" in updates:
        fields.append("last_checked = %s")
        values.append(updates["lastChecked"])
    if "status" in updates:
        fields.append("status = %s")
        values.append(updates["status"])

    if not fields:
        return get_asset_db(asset_id)

    parsed_id = parse_uuid(asset_id)
    if not parsed_id:
        return None
    values.append(parsed_id)

    with db_cursor() as cursor:
        cursor.execute(
            f"UPDATE assets SET {', '.join(fields)} WHERE id = %s RETURNING *",
            values,
        )
        row = cursor.fetchone()
        return serialize_asset(row) if row else None


def delete_asset_db(asset_id: str) -> Optional[Dict[str, Any]]:
    parsed_id = parse_uuid(asset_id)
    if not parsed_id:
        return None
    with db_cursor() as cursor:
        cursor.execute("DELETE FROM assets WHERE id = %s RETURNING *", (parsed_id,))
        row = cursor.fetchone()
        return serialize_asset(row) if row else None


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.on_event("shutdown")
def shutdown() -> None:
    global _db_pool
    if _db_pool is not None:
        _db_pool.closeall()
        _db_pool = None

class AnalyzeRequest(BaseModel):
    url: str
    frames: int = 3
    candidate_frames: int = 0
    threshold: float = 0.85


class AssetCreateRequest(BaseModel):
    url: str
    title: str | None = None


class AssetUpdateRequest(BaseModel):
    monitoringFrequency: str | None = None
    lastChecked: str | None = None
    status: str | None = None

def run_analysis_task(job_id: str, req: AnalyzeRequest):
    update_job(
        job_id,
        status="active",
        progress={"stage": "extracting", "percent": 10, "details": "Extracting input video..."},
    )
    try:
        analyzer = Analyzer(
            n_frames=req.frames,
            m_frames=req.candidate_frames,
            threshold=req.threshold,
            max_candidates=10 # Search for 10 candidate videos
        )
        update_job(
            job_id,
            progress={"stage": "detecting", "percent": 50, "details": "Analyzing candidates..."},
        )
        
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
        
        update_job(
            job_id,
            status="completed",
            progress={"stage": "done", "percent": 100, "details": "Analysis complete"},
            results=mapped_results,
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        update_job(job_id, status="failed", error=str(e))


@app.post("/api/analyze")
def start_analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    create_job(job_id, "pending", {"stage": "queued", "percent": 0, "details": "Job queued"})
    import threading
    t = threading.Thread(target=run_analysis_task, args=(job_id, req))
    t.start()
    return {"job_id": job_id, "status": "pending", "message": "Analysis started successfully"}

@app.get("/api/analyze/{job_id}")
def get_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", {}),
        "error": job.get("error"),
    }

@app.get("/api/results/{job_id}")
def get_results(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "completed":
        return {"status": job["status"], "message": "Job not completed yet"}

    return job.get("results")


def build_report(job_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
    detections = results.get("detections", [])
    input_video = results.get("input_video", {})
    risk_summary = results.get("risk_summary", {})

    total_detections = len(detections)
    high_risk = risk_summary.get("high", 0)
    medium_risk = risk_summary.get("medium", 0)
    low_risk = risk_summary.get("low", 0)
    avg_similarity = sum(d.get("similarity", 0) for d in detections) / max(total_detections, 1)

    insights: List[str] = []
    if high_risk > 0:
        insights.append(
            f"CRITICAL: {high_risk} high-risk matches detected with similarity scores above 85%. Immediate action recommended."
        )
    if avg_similarity > 0.8:
        insights.append(
            f"High average similarity ({avg_similarity:.1%}) indicates potential widespread infringement across {total_detections} videos."
        )
    if total_detections > 5:
        insights.append(f"Large-scale distribution detected: Content found on {total_detections} different videos/channels.")
        top_channels: Dict[str, int] = {}
        for detection in detections:
            channel = detection.get("channel", "Unknown")
            top_channels[channel] = top_channels.get(channel, 0) + 1
        sorted_channels = sorted(top_channels.items(), key=lambda x: x[1], reverse=True)[:3]
        for channel, count in sorted_channels:
            insights.append(f"- {channel}: {count} match(es)")
    if medium_risk > 0:
        insights.append(f"{medium_risk} medium-risk matches (60-85% similarity) require review and potential action.")
    if low_risk > 0:
        insights.append(f"{low_risk} low-risk matches detected but may require monitoring.")

    recommendations: List[str] = []
    if high_risk > 0:
        recommendations.append("File DMCA takedown notices with YouTube for high-risk matches")
        recommendations.append("Monitor infringing accounts for future uploads")
    if total_detections > 3:
        recommendations.append("Consider broader copyright protection measures")
        recommendations.append("Implement automated monitoring for detected channels")
    if avg_similarity > 0.75:
        recommendations.append("Escalate to legal team for potential litigation")
    recommendations.append("Re-scan this video periodically to track new instances")

    return {
        "job_id": job_id,
        "generated_at": datetime.datetime.utcnow().isoformat(),
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
            "risk_level": "CRITICAL"
            if high_risk > 0
            else "HIGH"
            if medium_risk > 2
            else "MEDIUM"
            if medium_risk > 0
            else "LOW",
        },
        "ai_insights": insights,
        "recommendations": recommendations,
        "detections": [
            {
                "rank": i + 1,
                "title": detection.get("title", ""),
                "channel": detection.get("channel", ""),
                "similarity": detection.get("similarity", 0),
                "risk": detection.get("risk", "low"),
                "url": detection.get("url", ""),
            }
            for i, detection in enumerate(detections[:20])
        ],
    }

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
    job = get_job(job_id)
    if not job or job.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Job not found or not completed")

    results = job.get("results", {})
    report = build_report(job_id, results)
    update_job(job_id, report=report)
    return report


@app.get("/api/reports/{job_id}")
def get_report(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("report"):
        return job["report"]
    if job.get("status") != "completed":
        return {"status": job.get("status"), "message": "Job not completed yet"}

    results = job.get("results", {})
    report = build_report(job_id, results)
    update_job(job_id, report=report)
    return report


@app.get("/api/video-info")
def get_video_info(url: str):
    try:
        processor = VideoProcessor()
        info = processor.get_video_info(url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "id": info.get("id", ""),
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", ""),
        "uploader": info.get("uploader", "Unknown Channel"),
        "url": info.get("url", url),
    }


@app.get("/api/assets")
def list_assets():
    return {"assets": list_assets_db()}


@app.get("/api/assets/{asset_id}")
def get_asset(asset_id: str):
    asset = get_asset_db(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.post("/api/assets")
def register_asset(req: AssetCreateRequest):
    title = req.title
    if not title:
        try:
            processor = VideoProcessor()
            info = processor.get_video_info(req.url)
            title = info.get("title", "Untitled Video")
        except Exception:
            title = "Untitled Video"

    return create_asset_db(req.url, title)


@app.patch("/api/assets/{asset_id}")
def update_asset(asset_id: str, req: AssetUpdateRequest):
    updates: Dict[str, Any] = {}
    if req.monitoringFrequency is not None:
        updates["monitoringFrequency"] = req.monitoringFrequency
    if req.lastChecked is not None:
        try:
            updates["lastChecked"] = parse_iso_datetime(req.lastChecked)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid lastChecked format") from exc
    if req.status is not None:
        updates["status"] = req.status

    asset = update_asset_db(asset_id, updates)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: str):
    removed = delete_asset_db(asset_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"deleted": True, "asset": removed}

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
