# 📄 Software Requirements Specification (SRS)  
## AI-Based Video Similarity Detection Prototype (Optimized POC)

---

# 1. 🧠 System Description

## 1.1 Overview

The system is a **high-performance proof-of-concept application** that demonstrates AI-based detection of visually similar videos on YouTube without requiring full video downloads.

It:
- Takes a **YouTube video URL as input**
- Extracts **N representative frames (configurable)** directly over the network via FFmpeg stream seeking
- Processes candidate videos by extracting **M frames (configurable)** plus thumbnails
- Uses **AI embeddings (CLIP)** to represent visual content
- Overlaps I/O-bound frame fetching with CPU-bound AI inference asynchronously
- Searches YouTube for related videos concurrently with processing
- Computes pairwise cosine similarity between the input video frames and candidate frames
- Flags potential matches based on a similarity threshold

---

## 1.2 Purpose

The purpose of this prototype is to:

- Demonstrate feasibility of **visual similarity detection**
- Validate use of **multimodal embeddings (visual)**
- Prove the viability of **zero-disk-footprint remote stream seeking** to dramatically reduce latency and bandwidth
- Provide a working foundation for a larger **digital asset protection system**

---

## 1.3 Key Features

- Remote YouTube video frame extraction (no full downloads)
- Configurable frame sampling for input video (N frames)
- Configurable frame sampling for candidate videos (M frames)
- Pipelined asynchronous visual embedding generation
- YouTube search (top 10 results)
- Multi-frame pairwise similarity scoring (many-to-many comparisons)
- Threshold-based match detection

---

# 2. ⚙️ Specific Requirements (Functional)

---

## 2.1 Functional Requirements

### FR1 — Video Input
- System shall accept a YouTube video URL as input along with N and M frame counts.

---

### FR2 — Remote Metadata & Stream Fetching
- System shall fetch direct stream URLs and metadata (duration, thumbnail) without downloading the media file.

---

### FR3 — Stream Frame Extraction
- System shall extract **N frames** at calculated, evenly-spaced intervals directly from the remote stream using FFmpeg byte-range seeking.

---

### FR4 — Parallel Embedding Generation
- System shall generate CLIP embeddings for frames asynchronously, overlapping the inference with the network fetch of subsequent frames.

---

### FR5 — Candidate Retrieval
- System shall retrieve **top 10 YouTube videos** based on the input video's title concurrently while the input video's frames are being embedded.

---

### FR6 — Candidate Processing
- System shall extract the candidate thumbnail and **M additional frames** from candidate video streams, converting them into vector embeddings.

---

### FR7 — Similarity Computation
- System shall compute a pairwise matrix of cosine similarities between all input frame embeddings and all candidate frame embeddings.

---

### FR8 — Match Detection & Display
- System shall flag candidates where the maximum pairwise similarity exceeds the configured threshold (e.g., 0.85).
- System shall display the list of candidates, their match status, and scores in the CLI.

---

## 2.2 Use Cases

### UC1 — Detect Similar Videos

**Actor:** User  

**Flow:**
1. User inputs YouTube URL, N, and M values.
2. System fetches metadata and starts remote frame extraction.
3. System pipelines frame embeddings in background threads.
4. Concurrently, system searches YouTube for candidates.
5. System extracts M frames + thumbnails for candidates.
6. System computes many-to-many similarity.
7. System displays match results.

---

# 3. ⚠️ Constraints (Non-Functional Requirements)

---

## 3.1 Performance

- Total execution time for 3 frames, 3 candidates: **≤ 15 seconds**
- Local Disk Usage: **0 Bytes** (No video files downloaded)
- System must overlap I/O bound fetch tasks with CPU bound inference tasks

---

## 3.2 Usability

- CLI-based interaction
- Clear progress tracking in terminal output

---

## 3.3 Reliability

- System should handle missing thumbnails gracefully
- System should handle unavailable candidate videos without crashing

---

## 3.4 Scalability (Not Required for POC)

- Currently single-threaded with one background worker for embedding
- No database or persistent storage

---

# 4. 🧩 Modules and Components

---

## 4.1 Core Modules

### 1. Vectorise Abstraction (`vectorise.py`)
- Provides `VideoFrameIterator` for remote sequence fetching.
- Provides `VectorEmbedding` for thread-safe asynchronous embedding accumulation.
- Pipelines fetch and embed.

### 2. Video Processing Module (`video_processor.py`)
- Resolves YouTube stream URLs.
- Calculates equal-gap timestamps.
- Performs remote FFmpeg input-seeking frame extraction.

### 3. Search Module (`search_service.py`)
- Retrieves candidate videos from YouTube search.

### 4. Embedding Module (`embedding_service.py`)
- Manages local CLIP model and executes image inference.

### 5. Similarity Module (`similarity_service.py`)
- Computes pairwise cosine similarity between lists of vectors.

### 6. Analyzer Module (`analyzer.py`)
- Orchestrates the components into the pipeline flow.

---

# 5. 🚀 System Architecture and Features

---

## 5.1 Decoupled Vectorisation Pipeline
The system utilizes a decoupled abstraction for converting a video to a mathematical representation. Frame extraction (network I/O) and AI embedding (CPU compute) are fully separated but pipelined.
- **`VideoFrameIterator`**: Treats a remote YouTube video stream as a standard Python iterator, calculating timestamps and fetching frames dynamically without keeping the entire file in memory.
- **`VectorEmbedding`**: A thread-safe accumulator that accepts image frames and continuously updates a unified mathematical representation in the background.

## 5.2 Zero-Disk Remote Stream Seeking
Instead of downloading video files to local storage, the system utilizes `imageio-ffmpeg` to parse stream metadata and perform **byte-range seeking**.
- Only the specific I-frames and nearby bytes required to reconstruct the requested frame timestamp are fetched from the remote server.
- The system operates entirely in-memory using pipes to pass pixel data directly to the Python application.
- **Impact:** Reduces processing latency from minutes (full download) to milliseconds per frame, with zero local disk footprint.

## 5.3 Asynchronous Producer-Consumer Execution
The system masks the high compute latency of the AI model and the network latency of FFmpeg by running them concurrently:
- **Producer:** The main thread fetches frames over the network sequentially.
- **Consumer:** A background `ThreadPoolExecutor` immediately begins running the CLIP inference on the fetched frame.
- **Overlap:** While frame `N` is being embedded by the CPU, frame `N+1` is being fetched over the network.
- **Parallel Search:** The YouTube API candidate search runs concurrently with the input video embedding, further masking network latency.

## 5.4 Multi-Frame Matrix Comparison
Rather than comparing a single thumbnail, the system calculates similarities across a temporal cross-section of the video.
- Extracts `N` frames evenly spaced across the input video.
- Extracts `M` frames (plus the thumbnail) across all candidate videos.
- Computes a full Cartesian product of cosine similarities (all input frames against all candidate frames) to find the absolute maximum matching visual signature.

---

# 6. 📏 Constraints and Acceptance Criteria

---

## Constraints

- Must run locally without external paid APIs (except YouTube public search)
- Uses bundled `imageio-ffmpeg` binaries for cross-platform support

## Acceptance Criteria

- Video stream URL is resolved without downloading.
- Frames are extracted over the network via FFmpeg.
- Background embedding threads correctly sync and join at the barrier before similarity check.
- N frames of input and M frames of candidates are correctly processed.
- Results table shows accurate cosine calculations.

---

# 7. 👤 Use Case and Actions

---

## Use Case: Zero-Download Similarity Detection

### Actor: User  

### Actions:
1. Provide YouTube URL, `--frames N`, `--candidate-frames M`
2. Trigger analysis  
3. View pipelined status logs  
4. View matches table  

---

### System Actions:
1. Fetch metadata and stream URLs.
2. Initialize VectorEmbedding async wrapper.
3. FFmpeg remote-seeks to timestamps.
4. ThreadPool queues image arrays to CLIP.
5. YouTube search runs concurrently.
6. Candidates undergo `vectorise()` flow for M frames.
7. Matrix similarity computation.
8. Table output.

---

# 8. 🏗️ Classes and Modules

---

## Classes

### 1. VideoProcessor
- `get_video_info(url)`  
- `calculate_frame_timestamps(duration, n_frames)`
- `_grab_frame_at_timestamp(stream_url, timestamp)`  

### 2. Vectorise Components
- `VideoFrameIterator(url, n_frames)`
- `VectorEmbedding()`
- `vectorise(url, n_frames)`

### 3. SearchService
- `search_videos(query)`  

### 4. EmbeddingService
- `get_image_embedding(image)`
- `get_embedding_from_url(url)`

### 5. SimilarityService
- `compute_max_similarity(frame_embeddings_list, candidate_embeddings_list)`  
- `compute_avg_similarity(frame_embeddings_list, candidate_embeddings_list)`  

### 6. Analyzer
- `run(youtube_url)`  

---

# 9. 🔄 Sequence of Actions (System Flow)

---

```text
User Input (URL, N, M)
   ↓
Analyzer.run()
   |--- [Async] vectorise(Input, N)
   |       |-- VideoFrameIterator fetches stream & timestamps
   |       |-- Submits thumbnail to VectorEmbedding
   |       |-- Loop FFmpeg remote frame grabs
   |       |-- Submit to VectorEmbedding (background CLIP inference)
   |
   |--- [Concurrent] SearchService.search_videos()
   |
   |--- Sync point: Wait for Input embeddings to finish
   |
   |--- For each candidate:
   |       |-- [Async] vectorise(Candidate, M)
   |
   |--- SimilarityService computes pairwise matches
   ↓
Output displayed
```

# 10. 🔁 States and Transitions

## States

- Initialization
- Concurrent Pipeline (Stream Fetch + Background Embed + Search)
- Candidate Processing
- Matrix Comparison
- Completed

### Failure States

- Stream Unavailable / Geo-blocked
- Network Timeout
- Candidate Unavailable (Skipped gracefully)

# 11. 🛠️ Tools and Implementation Specifications

## 11.1 Programming Language

Python 3.x

## 11.2 Libraries / Packages

### Video Handling
- yt-dlp → metadata and stream URL resolution
- imageio-ffmpeg → bundled FFmpeg binary and remote stream seeking

### AI / Embeddings
- transformers → CLIP model (openai/clip-vit-base-patch32)
- torch → inference

### Image Processing
- Pillow → image manipulation
- numpy → array handling and matrix math

### Networking
- requests → thumbnail fetching

## 11.3 System Requirements
- Python ≥ 3.10
- Internet connection (high bandwidth recommended for remote seeking)