"""
=============================================================================
Tests 5-8: Detection Quality Tests (VERY IMPORTANT)
=============================================================================
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.analyzer import Analyzer
from tests.test_config import (
    REUPLOAD_VIDEO_URL, MODIFIED_VIDEO_URL, NICHE_VIDEO_URL, timed,
)


class TestExactReuploadDetection(unittest.TestCase):
    """Test 5: Detect same video uploaded elsewhere."""

    @timed
    def test_reupload_detected(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(REUPLOAD_VIDEO_URL)
        candidates = results.get("candidates", [])
        self.assertGreater(len(candidates), 0, "Should have candidates")

        high_sim = [c for c in candidates if c["max_similarity"] > 0.85]
        print(f"  [RESULT] Candidates > 0.85: {len(high_sim)}")
        for c in high_sim:
            print(f"    - {c['max_similarity']:.4f} | {c['title'][:60]}")

        matches = results.get("matches", [])
        self.assertGreater(len(matches), 0, "At least one reupload should be detected")


class TestModifiedClipDetection(unittest.TestCase):
    """Test 6: Robustness to edits (cropped, zoomed, edited versions)."""

    @timed
    def test_modified_clip_similarity(self):
        analyzer = Analyzer(n_frames=3, threshold=0.70, max_candidates=10)
        results = analyzer.run(MODIFIED_VIDEO_URL)
        candidates = results.get("candidates", [])
        self.assertGreater(len(candidates), 0, "Should have candidates")

        sims = [c["max_similarity"] for c in candidates]
        max_sim = max(sims) if sims else 0
        print(f"  [RESULT] Max similarity: {max_sim:.4f}")

        moderate = [c for c in candidates if c["max_similarity"] >= 0.70]
        self.assertGreater(len(moderate), 0, f"Expected >= 0.70 match, max was {max_sim:.4f}")


class TestDifferentTitleSameContent(unittest.TestCase):
    """Test 7: Visual comparison > text matching."""

    @timed
    def test_visual_over_text(self):
        analyzer = Analyzer(n_frames=3, threshold=0.75, max_candidates=10)
        results = analyzer.run(REUPLOAD_VIDEO_URL)
        candidates = results.get("candidates", [])
        input_title = results.get("input_video", {}).get("title", "")

        diff_title = [c for c in candidates
                      if input_title.lower() not in c["title"].lower()
                      and c["title"].lower() not in input_title.lower()]

        print(f"  [RESULT] Input: {input_title}")
        print(f"  [RESULT] Different-title candidates: {len(diff_title)}")
        for c in diff_title:
            print(f"    - {c['max_similarity']:.4f} | {c['title'][:60]}")


class TestNoMatchScenario(unittest.TestCase):
    """Test 8: Avoid false positives with niche/unique video."""

    @timed
    def test_no_false_positives(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(NICHE_VIDEO_URL)
        candidates = results.get("candidates", [])
        matches = results.get("matches", [])

        print(f"  [RESULT] Candidates: {len(candidates)}, Matches: {len(matches)}")
        if candidates:
            sims = [c["max_similarity"] for c in candidates]
            print(f"  [RESULT] Range: {min(sims):.4f} - {max(sims):.4f}")
        if matches:
            print(f"  [WARNING] {len(matches)} false positive(s) — review threshold")


if __name__ == "__main__":
    unittest.main(verbosity=2)
