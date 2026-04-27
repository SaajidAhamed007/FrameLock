# 1. Module Breakdown

## 1.1 `analyzer.py` (Orchestration)
- **Role**: Orchestrates the entire video similarity detection pipeline. Coordinates fetching video data, searching for candidates, producing embeddings, and scoring similarity.
- **Inputs**: Target YouTube URL, configuration parameters (N frames, M frames, threshold).
- **Outputs**: Dictionary containing `input_video` details, list of `candidates`, list of `matches` above the threshold, and used settings.
- **Dependencies**: `vectorise.py`, `search_service.py`, `similarity_service.py`.
- **API Exposure**: Driven via POST `/api/analyze`.

## 1.2 `video_processor.py` (Frame Extraction)
- **Role**: Uses `yt-dlp` to fetch metadata and direct stream URLs without full downloads. Leverages `FFmpeg` to perform byte-range seeking to extract exact frames.
- **Inputs**: Video stream URL, duration, number of frames to extract.
- **Outputs**: List of PIL Image objects extracted at calculated timestamps.
- **Dependencies**: `yt-dlp`, `imageio-ffmpeg`, `subprocess`, `PIL.Image`.
- **API Exposure**: Used internally; can be leveraged for POST `/api/precheck` local video frame extraction.

## 1.3 `vectorise.py` (Async Pipeline)
- **Role**: Combines network I/O (fetching stream) and CPU processing (creating AI embeddings) via an asynchronous Producer-Consumer pipeline. Uses threading to ensure frames are embedded in parallel as they are extracted.
- **Inputs**: YouTube URL, frame counts.
- **Outputs**: `VectorEmbedding` object which stores asynchronous results.
- **Dependencies**: `video_processor.py`, `embedding_factory.py`.
- **API Exposure**: Hidden from external consumers; forms the async core of background processing for `/api/analyze`.

## 1.4 `embedding_service.py` (Embeddings)
- **Role**: Utilizes a vision model (e.g., CLIP) to turn PIL Image frames into mathematical vector representations (embeddings).
- **Inputs**: PIL Images or URLs.
- **Outputs**: Numpy arrays (vectors).
- **Dependencies**: `torch`, `transformers` (CLIP).
- **API Exposure**: Not directly exposed.

## 1.5 `search_service.py` (Candidate Retrieval)
- **Role**: Uses YouTube search features to fetch top matching videos based on the input video's title.
- **Inputs**: Query string (title).
- **Outputs**: List of candidate video metadata (ID, title, URL, thumbnail).
- **Dependencies**: `yt-dlp` search.
- **API Exposure**: Triggered internally during `/api/analyze`.

## 1.6 `similarity_service.py` (Similarity Scoring)
- **Role**: Computes mathematical cosine similarities between input embeddings and candidate embeddings.
- **Inputs**: Input frame vectors, candidate frame vectors.
- **Outputs**: Maximum and Average similarity float values (0.0 to 1.0).
- **Dependencies**: `numpy`.
- **API Exposure**: Results form the core data of the `/api/results/{id}` response.
