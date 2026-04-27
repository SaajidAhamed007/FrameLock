# 3. Workflow Mapping

## 3.1 Primary Workflow: Detect Similar Videos

This is the core flow where a user inputs a YouTube URL, the backend processes it asynchronously, and the UI displays the final results.

### Sequence Diagram

```text
User (UI)                  API Gateway              Background Worker
   |                           |                           |
   |-- 1. POST /api/analyze -->|                           |
   |                           |-- 2. Enqueue Job -------->|
   |<-- 3. 202 (job_id) -------|                           |
   |                           |                           |-- 4. Vectorise Input
   |-- 5. GET /analyze/{id} -->|                           |
   |<-- 6. 200 (status) -------|                           |-- 7. Search YouTube
   |                           |                           |-- 8. Vectorise Candidates
   |-- 9. GET /analyze/{id} -->|                           |-- 10. Similarity Scoring
   |<-- 10. 200 (completed) ---|                           |-- 11. Save Results
   |                           |                           |
   |-- 12. GET /results/{id} ->|                           |
   |<-- 13. 200 (Results JSON)-|                           |
```

### State Transitions
- **`pending`**: Job is in the queue, waiting for an available worker thread.
- **`active_extracting`**: Worker is fetching the input video stream and generating the base embeddings.
- **`active_searching`**: System is pinging YouTube for candidates.
- **`active_comparing`**: System is extracting and embedding candidate frames, then running cosine similarity matrix math.
- **`completed`**: Analysis finished successfully. Results are ready to be fetched.
- **`failed`**: An unrecoverable error occurred (e.g., video deleted, Geo-blocked).

## 3.2 Secondary Workflow: Pre-upload Check

A synchronous or short-polling flow to verify local files before uploading them to social platforms.

### Sequence Diagram

```text
User (UI)                  API Gateway              Background Worker
   |                           |                           |
   |-- 1. Upload File -------->|                           |
   |   (POST /api/precheck)    |                           |
   |                           |-- 2. Save to Temp OS Dir  |
   |                           |-- 3. Local Vectorise ---->|
   |                           |                           |-- 4. Compare vs Known Database
   |                           |<-- 5. Return Conflicts ---|
   |<-- 6. 200 (Conflicts JSON)|                           |
   |                           |-- 7. Delete Temp File     |
```

### State Transitions
- **`uploading`**: Browser is sending the multipart file to the backend.
- **`processing`**: Backend is locally executing `FFmpeg` and running the CLIP embeddings.
- **`completed`**: Similarity matrix returned against the protected internal database.
