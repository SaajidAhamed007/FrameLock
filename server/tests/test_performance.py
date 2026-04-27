"""
=============================================================================
Tests 13-15: Performance & Tuning Tests
=============================================================================
"""

import unittest
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.analyzer import Analyzer
from tests.test_config import SAMPLE_VIDEO_URL, timed


class TestFrameCountVsPerformance(unittest.TestCase):
    """Test 13: Find optimal N (frame count vs performance trade-off)."""

    @timed
    def test_frame_count_comparison(self):
        results_log = []

        for n_frames in [1, 3, 5]:
            start = time.time()
            analyzer = Analyzer(n_frames=n_frames, threshold=0.85, max_candidates=5)
            results = analyzer.run(SAMPLE_VIDEO_URL)
            elapsed = time.time() - start

            n_matches = len(results.get("matches", []))
            candidates = results.get("candidates", [])
            max_sim = max((c["max_similarity"] for c in candidates), default=0)

            results_log.append({
                "n_frames": n_frames,
                "time": elapsed,
                "matches": n_matches,
                "max_sim": max_sim,
            })

        print("\n  [RESULT] Frame Count vs Performance:")
        print(f"  {'N':>4} | {'Time (s)':>10} | {'Matches':>8} | {'Max Sim':>8}")
        print(f"  {'-'*4}-+-{'-'*10}-+-{'-'*8}-+-{'-'*8}")
        for r in results_log:
            print(f"  {r['n_frames']:>4} | {r['time']:>10.2f} | {r['matches']:>8} | {r['max_sim']:>8.4f}")


class TestThresholdTuning(unittest.TestCase):
    """Test 14: Find best threshold for demo."""

    @timed
    def test_threshold_comparison(self):
        # Run once, then evaluate at different thresholds
        analyzer = Analyzer(n_frames=3, threshold=0.0, max_candidates=10)
        results = analyzer.run(SAMPLE_VIDEO_URL)
        candidates = results.get("candidates", [])

        print("\n  [RESULT] Threshold Tuning:")
        print(f"  {'Threshold':>10} | {'Matches':>8} | {'Precision hint'}")
        print(f"  {'-'*10}-+-{'-'*8}-+-{'-'*20}")

        for threshold in [0.70, 0.75, 0.80, 0.85, 0.90, 0.95]:
            matches = [c for c in candidates if c["max_similarity"] >= threshold]
            hint = "too loose" if len(matches) > 5 else \
                   "sweet spot" if 1 <= len(matches) <= 3 else \
                   "strict" if len(matches) == 0 else "good"
            print(f"  {threshold:>10.2f} | {len(matches):>8} | {hint}")


class TestCandidateSizeImpact(unittest.TestCase):
    """Test 15: Validate search size impact."""

    @timed
    def test_candidate_size_comparison(self):
        results_log = []

        for n_candidates in [5, 10, 15]:
            start = time.time()
            analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=n_candidates)
            results = analyzer.run(SAMPLE_VIDEO_URL)
            elapsed = time.time() - start

            n_processed = len(results.get("candidates", []))
            n_matches = len(results.get("matches", []))
            results_log.append({
                "requested": n_candidates,
                "processed": n_processed,
                "matches": n_matches,
                "time": elapsed,
            })

        print("\n  [RESULT] Candidate Size Impact:")
        print(f"  {'Requested':>10} | {'Processed':>10} | {'Matches':>8} | {'Time (s)':>10}")
        print(f"  {'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*10}")
        for r in results_log:
            print(f"  {r['requested']:>10} | {r['processed']:>10} | {r['matches']:>8} | {r['time']:>10.2f}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
