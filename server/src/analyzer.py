"""
Analyzer Module
- Orchestrates the full video similarity detection pipeline
- Uses the vectorise abstraction for clean video → embedding conversion
"""

from .vectorise import vectorise, VideoFrameIterator, VectorEmbedding
from .search_service import SearchService
from .similarity_service import SimilarityService


class Analyzer:
    """Orchestrates the full video similarity detection pipeline."""

    def __init__(self, n_frames: int = 3, m_frames: int = 0, threshold: float = 0.85, max_candidates: int = 10):
        """
        Initialize Analyzer with configurable parameters.

        Args:
            n_frames: Number of frames to extract from the input video.
            m_frames: Number of frames to extract for candidates in addition to thumbnail.
            threshold: Similarity threshold for flagging matches.
            max_candidates: Maximum number of candidate videos to compare.
        """
        self.n_frames = n_frames
        self.m_frames = m_frames
        self.threshold = threshold
        self.max_candidates = max_candidates

        self.search_service = SearchService(max_results=max_candidates)
        self.similarity_service = SimilarityService()

    def run(self, youtube_url: str) -> dict:
        """
        Run the full video similarity detection pipeline.

        Args:
            youtube_url: YouTube video URL to analyze.

        Returns:
            dict with keys:
                - 'input_video': dict with title, id, url
                - 'candidates': list of dicts with title, url, similarity, is_match
                - 'matches': list of candidates above threshold
                - 'threshold': the similarity threshold used
                - 'n_frames': number of frames used
        """
        results = {
            "input_video": {},
            "candidates": [],
            "matches": [],
            "threshold": self.threshold,
            "n_frames": self.n_frames,
        }

        # === Step 1: Vectorise the input video (Async) ===
        print(f"\n[1/4] 🧠 Vectorising input video ({self.n_frames} frames)...")
        try:
            # This returns IMMEDIATELY after submitting frames to background
            input_vector = vectorise(youtube_url, n_frames=self.n_frames)
            results["input_video"] = {
                "title": input_vector.title,
                "id": input_vector.video_id,
                "url": youtube_url,
            }
        except RuntimeError as e:
            print(f"  ✗ {e}")
            return results

        # === Step 2: Search YouTube for candidates ===
        # Note: This runs while the background threads are still embedding!
        print(f"\n[2/4] 🔍 Searching YouTube for similar videos...")
        candidates = self.search_service.search_videos(input_vector.title)
        if not candidates:
            print("  ✗ No candidates found.")
            return results

        # Filter out the input video itself
        candidates = [c for c in candidates if c["id"] != input_vector.video_id]
        print(f"  ✓ {len(candidates)} candidates after filtering self")

        # === Step 3: Compare with candidates ===
        print(f"\n[3/4] 📊 Comparing with {len(candidates)} candidates...")
        
        # This will BLOCK if any background embeddings are still pending
        frame_embeddings = input_vector.get_vectors()

        for i, candidate in enumerate(candidates):
            try:
                # Use vectorise for the candidate (handles thumbnail + M frames)
                print(f"  [{i+1}/{len(candidates)}] Vectorising candidate: {candidate['title'][:40]}...")
                candidate_vector = vectorise(candidate["url"], n_frames=self.m_frames)
                candidate_embeddings = candidate_vector.get_vectors()
                
                max_sim = self.similarity_service.compute_max_similarity(
                    frame_embeddings, candidate_embeddings
                )
                avg_sim = self.similarity_service.compute_avg_similarity(
                    frame_embeddings, candidate_embeddings
                )
                is_match = max_sim >= self.threshold

                result_entry = {
                    "title": candidate["title"],
                    "url": candidate["url"],
                    "thumbnail_url": candidate["thumbnail_url"],
                    "max_similarity": round(max_sim, 4),
                    "avg_similarity": round(avg_sim, 4),
                    "is_match": is_match,
                }
                results["candidates"].append(result_entry)

                if is_match:
                    results["matches"].append(result_entry)

                status = "🔴 MATCH" if is_match else "⚪"
                print(f"  [{i+1}/{len(candidates)}] {status} {max_sim:.4f} — {candidate['title'][:60]}")

            except RuntimeError as e:
                print(f"  [{i+1}/{len(candidates)}] ⚠️  Skipped (thumbnail error): {candidate['title'][:40]}")
                continue

        # === Step 4: Sort & Summarize ===
        print(f"\n[4/4] 📋 Finalizing results...")
        results["candidates"].sort(key=lambda x: x["max_similarity"], reverse=True)
        results["matches"].sort(key=lambda x: x["max_similarity"], reverse=True)

        return results
