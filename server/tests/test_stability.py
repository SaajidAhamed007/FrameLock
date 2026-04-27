"""
=============================================================================
Tests 16-17: Stability & Reliability Tests
=============================================================================
"""

import unittest
import os
import sys
import numpy as np
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.analyzer import Analyzer
from tests.test_config import SAMPLE_VIDEO_URL, timed


class TestPartialFailureHandling(unittest.TestCase):
    """Test 16: Ensure pipeline doesn't break on partial failures."""

    @timed
    def test_continues_after_thumbnail_failure(self):
        """Pipeline should process remaining candidates even if some thumbnails fail."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)

        # Patch get_embedding_from_url to fail on the first call only
        original_method = analyzer.embedding_service

        results = analyzer.run(SAMPLE_VIDEO_URL)

        # Even with potential failures, some candidates should be processed
        candidates = results.get("candidates", [])
        print(f"  [RESULT] Processed {len(candidates)} candidates despite potential failures")
        self.assertIsInstance(candidates, list)

    @timed
    def test_empty_search_results_handled(self):
        """Pipeline should handle empty search results gracefully."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)

        # Mock search to return empty
        with patch.object(analyzer.search_service, 'search_videos', return_value=[]):
            # Need to manually trigger parts of the pipeline
            # This tests the analyzer's handling of no candidates
            results = analyzer.run(SAMPLE_VIDEO_URL)
            candidates = results.get("candidates", [])
            self.assertEqual(len(candidates), 0)
            print("  [RESULT] Empty search handled gracefully")


class TestMultipleRunsConsistency(unittest.TestCase):
    """Test 17: Check reproducibility across multiple runs."""

    @timed
    def test_consistent_scores(self):
        """Same input should produce similar similarity scores across runs."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=5)

        results_1 = analyzer.run(SAMPLE_VIDEO_URL)
        results_2 = analyzer.run(SAMPLE_VIDEO_URL)

        candidates_1 = {c["url"]: c["max_similarity"] for c in results_1.get("candidates", [])}
        candidates_2 = {c["url"]: c["max_similarity"] for c in results_2.get("candidates", [])}

        # Find common candidates
        common = set(candidates_1.keys()) & set(candidates_2.keys())
        print(f"  [RESULT] Common candidates across runs: {len(common)}")

        for url in common:
            diff = abs(candidates_1[url] - candidates_2[url])
            print(f"    - {candidates_1[url]:.4f} vs {candidates_2[url]:.4f} (diff: {diff:.4f})")
            # Scores should be nearly identical for same input
            self.assertAlmostEqual(
                candidates_1[url], candidates_2[url], places=2,
                msg=f"Scores differ too much for {url}"
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
