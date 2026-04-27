"""
=============================================================================
Master Test Runner
=============================================================================
Run all tests or specific test groups by priority.

Usage:
    python run_tests.py                     # Run ALL tests
    python run_tests.py core                # Tests 1-4 only
    python run_tests.py detection           # Tests 5-8 only
    python run_tests.py edge                # Tests 9-12 only
    python run_tests.py performance         # Tests 13-15 only
    python run_tests.py stability           # Tests 16-17 only
    python run_tests.py demo               # Tests 18-20 only
    python run_tests.py priority            # Priority order: core -> detection -> demo
"""

import sys
import unittest
import time

# Test module mapping
TEST_GROUPS = {
    "core":        "tests.test_core_functional",       # Tests 1-4
    "detection":   "tests.test_detection_quality",      # Tests 5-8
    "edge":        "tests.test_edge_cases",             # Tests 9-12
    "performance": "tests.test_performance",            # Tests 13-15
    "stability":   "tests.test_stability",              # Tests 16-17
    "demo":        "tests.test_demo_validation",        # Tests 18-20
}

PRIORITY_ORDER = ["core", "detection", "demo", "performance"]


def run_group(group_name):
    """Run a specific test group."""
    if group_name not in TEST_GROUPS:
        print(f"Unknown group: {group_name}")
        print(f"Available: {', '.join(TEST_GROUPS.keys())}")
        return False

    module = TEST_GROUPS[group_name]
    print(f"\n{'='*66}")
    print(f"  Running: {group_name.upper()} tests ({module})")
    print(f"{'='*66}\n")

    loader = unittest.TestLoader()
    suite = loader.loadTestsFromName(module)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def main():
    start = time.time()

    if len(sys.argv) > 1:
        group = sys.argv[1].lower()

        if group == "priority":
            print("Running tests in PRIORITY ORDER...\n")
            for g in PRIORITY_ORDER:
                success = run_group(g)
                if not success:
                    print(f"\n  STOPPED: {g} tests failed.")
                    sys.exit(1)
        elif group == "all":
            for g in TEST_GROUPS:
                run_group(g)
        else:
            run_group(group)
    else:
        # Run all by default
        for g in TEST_GROUPS:
            run_group(g)

    elapsed = time.time() - start
    print(f"\n{'='*66}")
    print(f"  Total test time: {elapsed:.1f}s")
    print(f"{'='*66}")


if __name__ == "__main__":
    main()
