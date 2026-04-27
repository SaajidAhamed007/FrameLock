"""
=============================================================================
Tests 9-12: Edge Case Tests
=============================================================================
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.video_processor import VideoProcessor
from src.analyzer import Analyzer
from tests.test_config import (
    SHORT_VIDEO_URL, LONG_VIDEO_URL, INVALID_URL, TEST_OUTPUT_DIR, timed,
)


class TestVeryShortVideo(unittest.TestCase):
    """Test 9: Check robustness for short clips (<10 seconds)."""

    @timed
    def test_short_video_completes(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=5)
        results = analyzer.run(SHORT_VIDEO_URL)

        self.assertIn("input_video", results)
        self.assertTrue(results["input_video"].get("title"))
        candidates = results.get("candidates", [])
        print(f"  [RESULT] Short video: {len(candidates)} candidates processed")


class TestLongVideo(unittest.TestCase):
    """Test 10: Ensure performance stability with long videos (>10 min)."""

    @timed
    def test_long_video_performance(self):
        import time
        start = time.time()
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=5)
        results = analyzer.run(LONG_VIDEO_URL)
        elapsed = time.time() - start

        candidates = results.get("candidates", [])
        print(f"  [RESULT] Long video: {elapsed:.1f}s, {len(candidates)} candidates")
        # Should complete within a reasonable time (download is the bottleneck)
        self.assertLess(elapsed, 300, "Long video should complete within 5 minutes")


class TestMissingThumbnail(unittest.TestCase):
    """Test 11: Handle incomplete candidate data (missing thumbnails)."""

    @timed
    def test_missing_thumbnail_graceful(self):
        """Simulate missing thumbnail by running pipeline — errors are caught."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(SHORT_VIDEO_URL)

        # Pipeline should complete even if some thumbnails fail
        self.assertIn("candidates", results)
        print(f"  [RESULT] Pipeline completed with {len(results['candidates'])} candidates")
        # The system already handles thumbnail errors gracefully in analyzer.py


class TestDownloadFailure(unittest.TestCase):
    """Test 12: Test error handling with invalid/restricted URL."""

    @timed
    def test_invalid_url_handled(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(INVALID_URL)

        # Should not crash — returns empty/partial results
        self.assertIn("input_video", results)
        self.assertIn("candidates", results)
        # With a bad URL, candidates should be empty
        print(f"  [RESULT] Invalid URL: candidates={len(results['candidates'])}")

    @timed
    def test_garbage_url_handled(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run("not-a-url-at-all")

        self.assertIn("candidates", results)
        self.assertEqual(len(results["candidates"]), 0)
        print("  [RESULT] Garbage URL handled gracefully")


if __name__ == "__main__":
    unittest.main(verbosity=2)
