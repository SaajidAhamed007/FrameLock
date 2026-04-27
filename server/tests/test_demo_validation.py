"""
=============================================================================
Tests 18-20: Demo Validation Tests (MOST IMPORTANT)
=============================================================================
These validate that the demo will work reliably and produce impressive output.
"""

import unittest
import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.analyzer import Analyzer
from tests.test_config import HERO_DEMO_URL, SAMPLE_VIDEO_URL, TEST_OUTPUT_DIR, timed


class TestHeroCaseValidation(unittest.TestCase):
    """Test 18: Validate your chosen demo example end-to-end."""

    @timed
    def test_hero_case(self):
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(HERO_DEMO_URL)

        candidates = results.get("candidates", [])
        matches = results.get("matches", [])
        input_vid = results.get("input_video", {})

        print(f"\n  === HERO CASE RESULTS ===")
        print(f"  Input: {input_vid.get('title', 'N/A')}")
        print(f"  Candidates: {len(candidates)}")
        print(f"  Matches: {len(matches)}")

        if candidates:
            print(f"\n  Top 5 candidates:")
            for c in candidates[:5]:
                flag = " << MATCH" if c["is_match"] else ""
                print(f"    {c['max_similarity']:.4f} | {c['title'][:55]}{flag}")

        # Hero case should produce at least some candidates
        self.assertGreater(len(candidates), 0, "Hero case should find candidates")

        # Save results for reference
        output_path = os.path.join(TEST_OUTPUT_DIR, "hero_case_results.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n  Results saved to: {output_path}")


class TestVisualInterpretability(unittest.TestCase):
    """Test 19: Ensure CLI output is understandable."""

    @timed
    def test_output_formatting(self):
        """Verify all output fields are present and readable."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=5)
        results = analyzer.run(SAMPLE_VIDEO_URL)

        # Check structure completeness
        self.assertIn("input_video", results)
        self.assertIn("candidates", results)
        self.assertIn("matches", results)
        self.assertIn("threshold", results)
        self.assertIn("n_frames", results)

        # Check candidate fields
        for c in results["candidates"]:
            self.assertIn("title", c)
            self.assertIn("url", c)
            self.assertIn("max_similarity", c)
            self.assertIn("avg_similarity", c)
            self.assertIn("is_match", c)
            # Scores should be displayable floats
            self.assertIsInstance(c["max_similarity"], float)
            self.assertIsInstance(c["avg_similarity"], float)

        print("  [RESULT] Output structure is complete and well-formatted")


class TestWorstCaseDemoBackup(unittest.TestCase):
    """Test 20: Prepare and save a reliable fallback demo output."""

    @timed
    def test_backup_demo(self):
        """Run on a known working case and save output as backup."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(SAMPLE_VIDEO_URL)

        candidates = results.get("candidates", [])
        self.assertGreater(len(candidates), 0, "Backup demo must produce results")

        # Save as backup
        output_path = os.path.join(TEST_OUTPUT_DIR, "backup_demo_results.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"  [RESULT] Backup demo saved to: {output_path}")
        print(f"  [RESULT] {len(candidates)} candidates, "
              f"{len(results.get('matches', []))} matches")


if __name__ == "__main__":
    unittest.main(verbosity=2)
