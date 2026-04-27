"""
Test Configuration
==================
Shared constants, sample URLs, and helper utilities for the test suite.

NOTE: Integration tests require an active internet connection and may take
several minutes due to video downloads and model loading.
"""

import os
import time
import functools

# ---------------------------------------------------------------------------
# Sample YouTube URLs for testing
# ---------------------------------------------------------------------------
# Choose videos that are SHORT, PUBLIC, and UNLIKELY to be taken down.
# Replace these with your own choices before running integration tests.

# A well-known, short music video (Rick Astley - Never Gonna Give You Up)
SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# A very short video (<15 seconds) for edge-case testing
SHORT_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with a <10s clip

# A longer video (>10 min) for performance testing
LONG_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with a >10min video

# A niche/unique video unlikely to have duplicates (for no-match testing)
NICHE_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with a unique video

# An invalid/restricted URL for error handling tests
INVALID_URL = "https://www.youtube.com/watch?v=INVALID_VIDEO_ID_12345"

# A video known to exist as reuploads (for exact reupload detection)
REUPLOAD_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with known reupload

# A video with modified/cropped versions available
MODIFIED_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace as needed

# Your chosen "hero case" demo video
HERO_DEMO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with your demo pick


# ---------------------------------------------------------------------------
# Test output directory
# ---------------------------------------------------------------------------
TEST_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "_test_output")
os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def timed(func):
    """Decorator that prints execution time of a test."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"  [TIMER] {func.__name__}: {elapsed:.2f}s")
        return result
    return wrapper
