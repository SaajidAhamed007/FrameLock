"""
Benchmark: Sync vs Async Vectorisation
=======================================
Measures the actual time difference between sequential and pipelined
frame-fetch + embed to determine if the async approach is worth it.
"""

import io
import time
import sys
import os

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.video_processor import VideoProcessor
from src.embedding_service import EmbeddingService
from src.vectorise import VideoFrameIterator, VectorEmbedding


TEST_URL = "https://www.youtube.com/watch?v=WXSLN5ZF9cs"
N_FRAMES = 3


def benchmark_sync():
    """Fully sequential: fetch all frames, then embed all frames."""
    print("\n=== SYNC (Sequential) ===")
    start = time.time()

    video = VideoFrameIterator(TEST_URL, n_frames=N_FRAMES)
    t_meta = time.time() - start
    print(f"  Metadata:  {t_meta:.2f}s")

    # Phase 1: Fetch all frames sequentially
    fetch_start = time.time()
    frames = []
    for frame in video:
        frames.append(frame)
    t_fetch = time.time() - fetch_start
    print(f"  Fetch all: {t_fetch:.2f}s ({len(frames)} frames)")

    # Phase 2: Embed all frames sequentially
    embed_start = time.time()
    VectorEmbedding._ensure_embedding_service()
    service = VectorEmbedding._embedding_service
    embeddings = []
    for f in frames:
        emb = service.get_image_embedding(f)
        embeddings.append(emb)
    t_embed = time.time() - embed_start
    print(f"  Embed all: {t_embed:.2f}s")

    total = time.time() - start
    print(f"  TOTAL:     {total:.2f}s")
    return total, t_fetch, t_embed


def benchmark_async():
    """Pipelined: fetch N+1 while embedding N."""
    print("\n=== ASYNC (Pipelined) ===")
    start = time.time()

    video = VideoFrameIterator(TEST_URL, n_frames=N_FRAMES)
    t_meta = time.time() - start
    print(f"  Metadata:  {t_meta:.2f}s")

    vector = VectorEmbedding()

    # Pipelined loop
    loop_start = time.time()
    frame = video.next_frame()
    while frame is not None:
        vector.add(frame)  # Non-blocking
        print(f"    Submitted frame {vector.submitted_count}, "
              f"embedded so far: {vector.frame_count}")
        frame = video.next_frame()  # Fetch next while embed runs

    # Wait for stragglers
    wait_start = time.time()
    vector._wait_for_pending()
    t_wait = time.time() - wait_start

    t_loop = time.time() - loop_start
    print(f"  Pipeline:  {t_loop:.2f}s (incl {t_wait:.2f}s wait)")

    total = time.time() - start
    print(f"  TOTAL:     {total:.2f}s")
    return total, t_loop, t_wait


def main():
    print("=" * 60)
    print("  Benchmark: Sync vs Async Vectorisation")
    print(f"  Video: {TEST_URL}")
    print(f"  Frames: {N_FRAMES}")
    print("=" * 60)

    # Pre-load CLIP model so it doesn't affect timing
    print("\nPre-loading CLIP model...")
    VectorEmbedding._ensure_embedding_service()
    print("Model ready.\n")

    t_sync, fetch, embed = benchmark_sync()
    t_async, pipeline, wait = benchmark_async()

    # Results
    print("\n" + "=" * 60)
    print("  RESULTS")
    print("=" * 60)
    print(f"  Sync total:    {t_sync:.2f}s  (fetch={fetch:.2f}s + embed={embed:.2f}s)")
    print(f"  Async total:   {t_async:.2f}s  (pipeline={pipeline:.2f}s, wait={wait:.2f}s)")
    speedup = t_sync - t_async
    pct = (speedup / t_sync * 100) if t_sync > 0 else 0
    print(f"  Difference:    {speedup:+.2f}s  ({pct:+.1f}%)")

    if speedup > 0.5:
        print(f"\n  ✅ Async is FASTER by {speedup:.1f}s — pipelining is effective")
    elif speedup > 0:
        print(f"\n  ⚠️  Async is marginally faster ({speedup:.2f}s) — overlap is minimal")
    else:
        print(f"\n  ❌ Async is NOT faster — overhead negates the benefit")

    # Analysis
    print("\n  ANALYSIS:")
    print(f"  • Fetch time per frame:  ~{fetch/N_FRAMES:.2f}s (I/O bound: FFmpeg + network)")
    print(f"  • Embed time per frame:  ~{embed/N_FRAMES:.2f}s (CPU bound: CLIP inference)")

    if embed / N_FRAMES < fetch / N_FRAMES:
        print(f"  • Embedding is FASTER than fetching → pipelining hides embed time")
        print(f"  • Theoretical max savings: ~{embed:.2f}s (total embed time)")
    else:
        print(f"  • Embedding is SLOWER than fetching → pipelining hides fetch time")
        print(f"  • Bottleneck is CLIP inference, not I/O")

    print("=" * 60)


if __name__ == "__main__":
    main()
