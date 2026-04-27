"""
=============================================================================
Tests 1-4: Core Functional Tests (MUST PASS)
=============================================================================
These tests validate that every component of the pipeline works correctly.
"""

import unittest
import os
import sys
import numpy as np
from unittest.mock import patch, MagicMock
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.video_processor import VideoProcessor
from src.search_service import SearchService
from src.embedding_service import EmbeddingService
from src.similarity_service import SimilarityService
from src.analyzer import Analyzer
from tests.test_config import (
    SAMPLE_VIDEO_URL, TEST_OUTPUT_DIR, timed,
)


# ===========================================================================
# Test 1 — Basic End-to-End Success
# ===========================================================================
class TestEndToEnd(unittest.TestCase):
    """
    Goal: Verify the full pipeline works without failure.

    Steps:
        - Provide a valid YouTube URL
        - Run system with N=3, threshold=0.85
    Expected:
        - Video downloads successfully
        - Frames extracted
        - 10 candidates retrieved
        - Similarity scores printed
        - At least one result processed correctly
    """

    @timed
    def test_full_pipeline_success(self):
        """Test 1: Full end-to-end pipeline with a valid YouTube URL."""
        analyzer = Analyzer(n_frames=3, threshold=0.85, max_candidates=10)
        results = analyzer.run(SAMPLE_VIDEO_URL)

        # Video info should be populated
        self.assertIn("input_video", results)
        self.assertTrue(results["input_video"].get("title"), "Input video title should not be empty")
        self.assertTrue(results["input_video"].get("id"), "Input video ID should not be empty")

        # Candidates should have been processed
        self.assertIn("candidates", results)
        self.assertGreater(len(results["candidates"]), 0, "At least one candidate should be processed")

        # Each candidate should have required fields
        for candidate in results["candidates"]:
            self.assertIn("title", candidate)
            self.assertIn("url", candidate)
            self.assertIn("max_similarity", candidate)
            self.assertIn("avg_similarity", candidate)
            self.assertIn("is_match", candidate)

        # Threshold and n_frames recorded
        self.assertEqual(results["threshold"], 0.85)
        self.assertEqual(results["n_frames"], 3)

        print(f"  [RESULT] {len(results['candidates'])} candidates processed, "
              f"{len(results['matches'])} matches found")


# ===========================================================================
# Test 2 — Frame Extraction Validation
# ===========================================================================
class TestFrameExtraction(unittest.TestCase):
    """
    Goal: Ensure N-frame logic works correctly.

    Steps:
        - Run with N=1, N=3, N=5
    Expected:
        - Exactly N frames extracted
        - No crash for edge values
        - Frames distributed across video
    """

    @classmethod
    def setUpClass(cls):
        """Download the video once for all frame extraction tests."""
        cls.processor = VideoProcessor(output_dir=TEST_OUTPUT_DIR)
        cls.video_info = cls.processor.download_video(SAMPLE_VIDEO_URL)
        cls.video_path = cls.video_info["filepath"]

    @timed
    def test_extract_1_frame(self):
        """Test 2a: Extract exactly 1 frame."""
        frames = self.processor.extract_frames(self.video_path, n_frames=1)
        self.assertEqual(len(frames), 1, "Should extract exactly 1 frame")
        self.assertIsInstance(frames[0], Image.Image, "Frame should be a PIL Image")

    @timed
    def test_extract_3_frames(self):
        """Test 2b: Extract exactly 3 frames."""
        frames = self.processor.extract_frames(self.video_path, n_frames=3)
        self.assertEqual(len(frames), 3, "Should extract exactly 3 frames")
        for f in frames:
            self.assertIsInstance(f, Image.Image)

    @timed
    def test_extract_5_frames(self):
        """Test 2c: Extract exactly 5 frames."""
        frames = self.processor.extract_frames(self.video_path, n_frames=5)
        self.assertEqual(len(frames), 5, "Should extract exactly 5 frames")
        for f in frames:
            self.assertIsInstance(f, Image.Image)

    @timed
    def test_frames_are_different(self):
        """Test 2d: Frames from different positions should not be identical."""
        frames = self.processor.extract_frames(self.video_path, n_frames=3)
        # Convert to numpy to compare pixel content
        arrays = [np.array(f) for f in frames]
        # At least the first and last frames should differ
        self.assertFalse(
            np.array_equal(arrays[0], arrays[-1]),
            "First and last frames should be different (distributed across video)"
        )

    @timed
    def test_frames_have_valid_dimensions(self):
        """Test 2e: All frames should have non-zero width/height."""
        frames = self.processor.extract_frames(self.video_path, n_frames=3)
        for i, f in enumerate(frames):
            w, h = f.size
            self.assertGreater(w, 0, f"Frame {i} width should be > 0")
            self.assertGreater(h, 0, f"Frame {i} height should be > 0")


# ===========================================================================
# Test 3 — Embedding Generation
# ===========================================================================
class TestEmbeddingGeneration(unittest.TestCase):
    """
    Goal: Validate embeddings are generated consistently.

    Steps:
        - Run pipeline, log embedding shapes for frames and thumbnails
    Expected:
        - All embeddings same dimension
        - No NaN / empty vectors
    """

    @classmethod
    def setUpClass(cls):
        """Load CLIP model once for all embedding tests."""
        cls.embedding_service = EmbeddingService()

    @timed
    def test_single_image_embedding_shape(self):
        """Test 3a: Single image produces a 512-dim embedding vector."""
        # Create a dummy test image
        test_image = Image.new("RGB", (224, 224), color=(128, 64, 200))
        embedding = self.embedding_service.get_image_embedding(test_image)

        self.assertIsInstance(embedding, np.ndarray)
        self.assertEqual(embedding.shape, (512,), f"Expected 512-dim, got {embedding.shape}")

    @timed
    def test_no_nan_values(self):
        """Test 3b: Embedding should contain no NaN values."""
        test_image = Image.new("RGB", (300, 200), color=(255, 0, 0))
        embedding = self.embedding_service.get_image_embedding(test_image)

        self.assertFalse(np.any(np.isnan(embedding)), "Embedding contains NaN values")

    @timed
    def test_no_zero_vector(self):
        """Test 3c: Embedding should not be the zero vector."""
        test_image = Image.new("RGB", (100, 100), color=(0, 255, 0))
        embedding = self.embedding_service.get_image_embedding(test_image)

        self.assertGreater(np.linalg.norm(embedding), 0.0, "Embedding is a zero vector")

    @timed
    def test_normalized_embedding(self):
        """Test 3d: Embedding should be L2-normalized (magnitude ~1.0)."""
        test_image = Image.new("RGB", (224, 224), color=(50, 100, 150))
        embedding = self.embedding_service.get_image_embedding(test_image)

        norm = np.linalg.norm(embedding)
        self.assertAlmostEqual(norm, 1.0, places=4, msg=f"Embedding norm is {norm}, expected ~1.0")

    @timed
    def test_batch_embeddings_consistent_shape(self):
        """Test 3e: Batch of images should all produce same-dimension embeddings."""
        images = [
            Image.new("RGB", (224, 224), color=(255, 0, 0)),
            Image.new("RGB", (640, 480), color=(0, 255, 0)),
            Image.new("RGB", (100, 300), color=(0, 0, 255)),
        ]
        embeddings = self.embedding_service.get_batch_embeddings(images)

        self.assertEqual(len(embeddings), 3)
        for i, emb in enumerate(embeddings):
            self.assertEqual(emb.shape, (512,), f"Embedding {i} has shape {emb.shape}, expected (512,)")

    @timed
    def test_different_images_different_embeddings(self):
        """Test 3f: Visually different images should produce different embeddings."""
        img_red = Image.new("RGB", (224, 224), color=(255, 0, 0))
        img_blue = Image.new("RGB", (224, 224), color=(0, 0, 255))

        emb_red = self.embedding_service.get_image_embedding(img_red)
        emb_blue = self.embedding_service.get_image_embedding(img_blue)

        self.assertFalse(
            np.allclose(emb_red, emb_blue, atol=1e-3),
            "Embeddings for different images should differ"
        )

    @timed
    def test_embedding_from_url(self):
        """Test 3g: Embedding from a thumbnail URL should have correct shape."""
        # Use a known YouTube thumbnail URL
        test_url = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        embedding = self.embedding_service.get_embedding_from_url(test_url)

        self.assertEqual(embedding.shape, (512,))
        self.assertFalse(np.any(np.isnan(embedding)))


# ===========================================================================
# Test 4 — Similarity Computation
# ===========================================================================
class TestSimilarityComputation(unittest.TestCase):
    """
    Goal: Ensure similarity values are valid.

    Steps:
        - Run pipeline, observe similarity scores
    Expected:
        - Values between -1 and 1
        - No crashes
        - No undefined values
    """

    def setUp(self):
        self.sim = SimilarityService()

    @timed
    def test_identical_vectors_similarity_1(self):
        """Test 4a: Cosine similarity of identical vectors should be 1.0."""
        vec = np.random.randn(512).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        score = self.sim.cosine_similarity(vec, vec)
        self.assertAlmostEqual(score, 1.0, places=5)

    @timed
    def test_opposite_vectors_similarity_neg1(self):
        """Test 4b: Cosine similarity of opposite vectors should be -1.0."""
        vec = np.random.randn(512).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        score = self.sim.cosine_similarity(vec, -vec)
        self.assertAlmostEqual(score, -1.0, places=5)

    @timed
    def test_orthogonal_vectors_similarity_0(self):
        """Test 4c: Cosine similarity of orthogonal vectors should be ~0."""
        vec_a = np.zeros(512, dtype=np.float32)
        vec_b = np.zeros(512, dtype=np.float32)
        vec_a[0] = 1.0
        vec_b[1] = 1.0
        score = self.sim.cosine_similarity(vec_a, vec_b)
        self.assertAlmostEqual(score, 0.0, places=5)

    @timed
    def test_similarity_in_range(self):
        """Test 4d: Random vectors should have similarity between -1 and 1."""
        for _ in range(100):
            a = np.random.randn(512).astype(np.float32)
            b = np.random.randn(512).astype(np.float32)
            score = self.sim.cosine_similarity(a, b)
            self.assertGreaterEqual(score, -1.0)
            self.assertLessEqual(score, 1.0)

    @timed
    def test_zero_vector_handling(self):
        """Test 4e: Zero vector should return 0.0, not crash."""
        vec = np.random.randn(512).astype(np.float32)
        zero = np.zeros(512, dtype=np.float32)
        score = self.sim.cosine_similarity(vec, zero)
        self.assertEqual(score, 0.0, "Zero vector similarity should be 0.0")

    @timed
    def test_max_similarity_across_frames(self):
        """Test 4f: Max similarity should return the highest score across frames."""
        frame_embs = [
            np.random.randn(512).astype(np.float32),
            np.random.randn(512).astype(np.float32),
            np.random.randn(512).astype(np.float32),
        ]
        thumb = np.random.randn(512).astype(np.float32)

        max_sim = self.sim.compute_max_similarity(frame_embs, thumb)
        individual = [self.sim.cosine_similarity(f, thumb) for f in frame_embs]

        self.assertAlmostEqual(max_sim, max(individual), places=5)

    @timed
    def test_avg_similarity_across_frames(self):
        """Test 4g: Avg similarity should return the mean score across frames."""
        frame_embs = [
            np.random.randn(512).astype(np.float32),
            np.random.randn(512).astype(np.float32),
        ]
        thumb = np.random.randn(512).astype(np.float32)

        avg_sim = self.sim.compute_avg_similarity(frame_embs, thumb)
        individual = [self.sim.cosine_similarity(f, thumb) for f in frame_embs]

        self.assertAlmostEqual(avg_sim, sum(individual) / len(individual), places=5)

    @timed
    def test_empty_frames_returns_zero(self):
        """Test 4h: Empty frame list should return 0.0."""
        thumb = np.random.randn(512).astype(np.float32)
        self.assertEqual(self.sim.compute_max_similarity([], thumb), 0.0)
        self.assertEqual(self.sim.compute_avg_similarity([], thumb), 0.0)

    @timed
    def test_no_nan_in_results(self):
        """Test 4i: Similarity computation should never produce NaN."""
        for _ in range(50):
            a = np.random.randn(512).astype(np.float32)
            b = np.random.randn(512).astype(np.float32)
            score = self.sim.cosine_similarity(a, b)
            self.assertFalse(np.isnan(score), "Similarity score is NaN")


if __name__ == "__main__":
    unittest.main(verbosity=2)
