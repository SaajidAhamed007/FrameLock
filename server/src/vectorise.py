"""
Vectorise Module
================
High-level abstraction for converting a YouTube video into a vector embedding.

Features:
    - VideoFrameIterator: iterator wrapper around a YouTube video
    - VectorEmbedding: thread-safe, async-capable embedding accumulator
    - vectorise(): single entry-point that pipelines fetch + embed in parallel

Usage:
    from src.vectorise import vectorise

    # One function call: URL + N → vector wrapper
    vector = vectorise("https://www.youtube.com/watch?v=...", n_frames=3)

    # Get the combined embedding
    embedding = vector.get_vector()          # numpy array (512,)

    # Get individual frame embeddings
    all_embeddings = vector.get_vectors()     # list of numpy arrays
"""

import io
import time
import threading
import requests
import concurrent.futures
import numpy as np
from PIL import Image

from .video_processor import VideoProcessor


# ---------------------------------------------------------------------------
# VideoFrameIterator — iterator wrapper around a video
# ---------------------------------------------------------------------------
class VideoFrameIterator:
    """
    Iterator that yields frames from a YouTube video one at a time.

    Created from a URL and N. Internally fetches metadata, calculates
    timestamps using the offset formula, and grabs each frame via
    FFmpeg remote seeking on demand.

    Usage:
        it = VideoFrameIterator("https://youtube.com/watch?v=...", n_frames=3)
        frame = it.next_frame()   # PIL Image or None
    """

    def __init__(self, url: str, n_frames: int = 3):
        """
        Initialize the iterator by fetching video metadata and
        calculating frame timestamps.

        Args:
            url: YouTube video URL.
            n_frames: Number of frames to extract.
        """
        self._processor = VideoProcessor()
        self._video_info = self._processor.get_video_info(url)
        self._timestamps = self._processor.calculate_frame_timestamps(
            self._video_info["duration"], n_frames
        )
        self._index = 0
        self._n_frames = n_frames

    # -- Public properties --------------------------------------------------

    @property
    def title(self) -> str:
        return self._video_info["title"]

    @property
    def video_id(self) -> str:
        return self._video_info["id"]

    @property
    def duration(self) -> float:
        return self._video_info["duration"]

    @property
    def thumbnail(self) -> str:
        return self._video_info.get("thumbnail", "")

    @property
    def stream_url(self) -> str:
        return self._video_info["stream_url"]

    @property
    def thumbnail_url(self) -> str:
        return self._video_info.get("thumbnail", "")

    @property
    def timestamps(self) -> list:
        return list(self._timestamps)

    @property
    def total_frames(self) -> int:
        return self._n_frames

    @property
    def frames_remaining(self) -> int:
        return max(0, self._n_frames - self._index)

    # -- Iterator methods ---------------------------------------------------

    def next_frame(self) -> Image.Image | None:
        """
        Grab and return the next frame from the video stream.

        Returns:
            PIL Image of the frame, or None if no more frames remain.
        """
        if self._index >= len(self._timestamps):
            return None

        ts = self._timestamps[self._index]
        self._index += 1

        try:
            frame = self._processor._grab_frame_at_timestamp(
                self._video_info["stream_url"], ts
            )
            return frame
        except RuntimeError:
            # If a frame fails, skip it but don't stop the iterator
            return self.next_frame() if self._index < len(self._timestamps) else None

    def reset(self):
        """Reset the iterator to the beginning."""
        self._index = 0

    # -- Python iterator protocol -------------------------------------------

    def __iter__(self):
        self.reset()
        return self

    def __next__(self) -> Image.Image:
        frame = self.next_frame()
        if frame is None:
            raise StopIteration
        return frame


# ---------------------------------------------------------------------------
# VectorEmbedding — async-capable wrapper for accumulated vector embeddings
# ---------------------------------------------------------------------------
class VectorEmbedding:
    """
    Thread-safe wrapper that accumulates frame embeddings into a combined vector.

    The `add(frame)` method is NON-BLOCKING — it submits the embedding work
    to a background thread and returns immediately. This allows the caller
    to continue fetching the next frame while the current one is being embedded.

    Thread safety:
        - A threading.Lock guards the internal embeddings list
        - A single-worker ThreadPoolExecutor serialises CLIP inference
          (running two inferences in parallel on CPU is slower, not faster)
        - get_vector() / get_vectors() automatically wait for all pending
          add() calls to complete before returning

    Usage:
        vec = VectorEmbedding()
        vec.add(pil_image_1)   # returns immediately
        vec.add(pil_image_2)   # returns immediately (queued behind frame 1)
        vec.add(pil_image_3)   # returns immediately (queued behind frame 2)
        combined = vec.get_vector()    # blocks until all 3 are done, then returns
    """

    # Shared embedding service (loaded once, reused across all instances)
    _embedding_service = None
    _service_lock = threading.Lock()

    def __init__(self, title: str = "Unknown", video_id: str = "", duration: float = 0.0, thumbnail: str = ""):
        self.title = title
        self.video_id = video_id
        self.duration = duration
        self.thumbnail = thumbnail
        self._embeddings = []
        self._lock = threading.Lock()
        self._ensure_embedding_service()

    @classmethod
    def _ensure_embedding_service(cls):
        """Thread-safe lazy-load of the embedding service (CLIP or Gemini)."""
        if cls._embedding_service is None:
            with cls._service_lock:
                if cls._embedding_service is None:
                    from .embedding_factory import get_embedding_service
                    cls._embedding_service = get_embedding_service()

    def _embed_and_store(self, frame: Image.Image, index: int):
        """
        Embeds a single frame and appends the result to the list synchronously.
        """
        embedding = self._embedding_service.get_image_embedding(frame)
        with self._lock:
            self._embeddings.append(embedding)

    def add(self, frame: Image.Image):
        """
        Submit a frame for embedding (SYNCHRONOUS to avoid thread deadlocks).
        """
        index = len(self._embeddings) + 1
        self._embed_and_store(frame, index)

    def _wait_for_pending(self):
        """No-op since it is synchronous."""
        pass

    def get_vector(self) -> np.ndarray:
        """
        Get the combined (mean-pooled) embedding vector.

        BLOCKS until all pending add() calls are finished.

        Returns:
            Normalized mean of all stored frame embeddings as numpy array.
            Returns a zero vector if no frames have been added.
        """
        self._wait_for_pending()

        with self._lock:
            if not self._embeddings:
                dim = self._embedding_service.EMBEDDING_DIM if self._embedding_service else 1408
                return np.zeros(dim, dtype=np.float32)
            combined = np.mean(self._embeddings, axis=0)

        # Re-normalize after averaging
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        return combined

    def get_vectors(self) -> list:
        """
        Get all individual frame embedding vectors.

        BLOCKS until all pending add() calls are finished.

        Returns:
            List of numpy arrays, one per frame.
        """
        self._wait_for_pending()
        with self._lock:
            return list(self._embeddings)

    @property
    def frame_count(self) -> int:
        """Number of frames that have been fully embedded so far."""
        with self._lock:
            return len(self._embeddings)

    @property
    def pending_count(self) -> int:
        """Number of add() calls still being processed."""
        return 0

    @property
    def submitted_count(self) -> int:
        """Total number of add() calls submitted (done + pending)."""
        return self.frame_count

    @property
    def is_empty(self) -> bool:
        return len(self._embeddings) == 0

    def close(self):
        """No-op since it is synchronous."""
        pass




# ---------------------------------------------------------------------------
# vectorise() — the single entry-point function
# ---------------------------------------------------------------------------
def vectorise(url: str, n_frames: int = 3) -> VectorEmbedding:
    """
    Convert a YouTube video into a vector embedding.

    This is the primary abstraction: pass a URL and N, get back a
    VectorEmbedding wrapper containing the combined visual representation.

    Pipeline architecture (async):
        The frame fetching (I/O-bound: FFmpeg subprocess over network) and
        embedding (CPU-bound: CLIP inference) are pipelined in parallel.

        Main thread:   fetch1 ──→ fetch2 ──→ fetch3 ──→ wait
        Background:              embed1 ──→ embed2 ──→ embed3

        While frame N+1 is being fetched, frame N is being embedded.
        This overlaps I/O wait with CPU work, reducing total time.

    Args:
        url: YouTube video URL.
        n_frames: Number of frames to extract and embed.

    Returns:
        VectorEmbedding wrapper with the combined video embedding.

    Example:
        vector = vectorise("https://youtube.com/watch?v=...", n_frames=3)
        embedding = vector.get_vector()   # numpy array (512,)
    """
    # Step 1: Create the frame iterator (fetches metadata)
    video = VideoFrameIterator(url, n_frames=n_frames)
    print(f"  Video: {video.title} ({video.duration}s)")
    print(f"  Timestamps: {video.timestamps}")

    # Step 2: Create the async vector wrapper with metadata
    vector = VectorEmbedding(
        title=video.title,
        video_id=video.video_id,
        duration=video.duration,
        thumbnail=video.thumbnail_url
    )

    # Step 3: Pipelined loop — fetch and embed overlap
    # First, embed the thumbnail as an additional frame
    if video.thumbnail_url:
        try:
            response = requests.get(video.thumbnail_url, timeout=10)
            response.raise_for_status()
            thumb_img = Image.open(io.BytesIO(response.content)).convert("RGB")
            vector.add(thumb_img)
            print(f"  -> Submitted thumbnail (embedded: {vector.frame_count})")
        except Exception as e:
            print(f"  ⚠️  Could not fetch/embed thumbnail: {e}")

    # Now loop through the extracted video frames
    total_to_submit = video.total_frames + (1 if video.thumbnail_url else 0)
    
    frame = video.next_frame()
    while frame is not None:
        vector.add(frame)  # Non-blocking: embedding runs in background
        submitted = vector.submitted_count
        done = vector.frame_count
        print(f"  -> Submitted frame {submitted}/{total_to_submit} "
              f"(embedded: {done})")
        frame = video.next_frame()  # Fetch next while previous embeds

    # Return immediately — don't wait here.
    # get_vector() / get_vectors() will block internally if
    # any embeddings are still pending when the caller needs them.
    print(f"  -> All {vector.submitted_count} frames submitted "
          f"({vector.pending_count} still embedding)")

    return vector
