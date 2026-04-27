# 2. API Specification

## 2.1 Start Analysis
- **Method**: POST
- **Route**: `/api/analyze`
- **Purpose**: Initiates an asynchronous video similarity analysis job.
- **Request Structure**:
  - Path Params: `None`
  - Query Params: `None`
  - JSON Body:
    ```json
    {
      "url": "https://youtube.com/watch?v=...",
      "frames": 3,
      "candidate_frames": 1,
      "threshold": 0.85
    }
    ```
- **Response Structure**:
  ```json
  {
    "job_id": "uuid-v4-string",
    "status": "pending",
    "message": "Analysis started successfully"
  }
  ```
- **Status Codes**:
  - `202 Accepted`: Job queued successfully.
  - `400 Bad Request`: Invalid YouTube URL or missing parameters.
  - `429 Too Many Requests`: Rate limit exceeded.
- **Internal Mapping**: Enqueues a task that calls `Analyzer.run(url, frames, candidate_frames, threshold)`.

## 2.2 Get Analysis Status
- **Method**: GET
- **Route**: `/api/analyze/{id}`
- **Purpose**: Polling endpoint to check the current progress of a background analysis job.
- **Request Structure**:
  - Path Params: `id` (string, the job UUID)
- **Response Structure**:
  ```json
  {
    "job_id": "uuid-v4-string",
    "status": "active",
    "progress": {
      "stage": "detect",
      "percent": 45,
      "details": "Vectorising candidate 3 of 10..."
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: Status returned.
  - `404 Not Found`: Job ID does not exist.

## 2.3 Get Analysis Results
- **Method**: GET
- **Route**: `/api/results/{id}`
- **Purpose**: Fetches the full detailed payload once an analysis job completes.
- **Request Structure**:
  - Path Params: `id` (string, the job UUID)
- **Response Structure**:
  *(See Section 8 Data Schemas for the full `AnalysisResult` schema)*
  ```json
  {
    "input_video": { ... },
    "fingerprint": { ... },
    "risk_summary": { ... },
    "detections": [ ... ],
    "propagation_nodes": [ ... ]
  }
  ```
- **Status Codes**:
  - `200 OK`: Results returned.
  - `202 Accepted`: Job still processing (try again later).
  - `404 Not Found`: Job ID not found.
  - `500 Internal Server Error`: Job failed during execution.

## 2.4 Pre-upload Risk Check
- **Method**: POST
- **Route**: `/api/precheck`
- **Purpose**: Analyzes a locally uploaded video file to detect potential copyright conflicts *before* publishing.
- **Request Structure**:
  - `multipart/form-data`:
    - `file`: The video file (e.g., .mp4, .mov)
- **Response Structure**:
  ```json
  {
    "status": "completed",
    "safe_to_upload": false,
    "conflicts": [
      {
        "title": "Existing Copyrighted Video",
        "url": "https://youtube.com/watch?v=...",
        "similarity": 0.94
      }
    ]
  }
  ```
- **Status Codes**:
  - `200 OK`: Scan complete.
  - `400 Bad Request`: Invalid file format or file too large.
  - `415 Unsupported Media Type`: Non-video file.
- **Internal Mapping**: Saves file to temporary storage, passes absolute path to `vectorise()` (bypassing `video_processor` remote fetching), and runs similarity scoring against known protected assets.

## 2.5 System Health
- **Method**: GET
- **Route**: `/api/health`
- **Purpose**: Returns the operational status of the backend API, embedding models, and external dependencies (like YouTube reachability).
- **Response Structure**:
  ```json
  {
    "status": "healthy",
    "services": {
      "api": "up",
      "embedding_model": "loaded",
      "youtube_search": "up"
    },
    "timestamp": "2024-03-27T10:00:00Z"
  }
  ```
- **Status Codes**:
  - `200 OK`: All systems nominal.
  - `503 Service Unavailable`: Dependent service (like Torch/CLIP) failed to load.
