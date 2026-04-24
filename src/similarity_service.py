"""
Similarity Module
- Computes cosine similarity between embedding vectors
- Aggregates similarity across multiple frames vs. candidates
"""

import numpy as np


class SimilarityService:
    """Computes cosine similarity between embeddings."""

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """
        Compute cosine similarity between two vectors.

        Args:
            a: First embedding vector.
            b: Second embedding vector.

        Returns:
            Cosine similarity score in range [-1, 1].
        """
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return float(dot / (norm_a * norm_b))

    @staticmethod
    def compute_max_similarity(frame_embeddings: list, candidate_embeddings: list) -> float:
        """
        Compute the maximum cosine similarity between any input frame
        and any candidate frame.

        Args:
            frame_embeddings: List of embedding vectors from input video.
            candidate_embeddings: List of embedding vectors from candidate video.

        Returns:
            Maximum cosine similarity score.
        """
        if not frame_embeddings or not candidate_embeddings:
            return 0.0

        similarities = [
            SimilarityService.cosine_similarity(f_emb, c_emb)
            for f_emb in frame_embeddings
            for c_emb in candidate_embeddings
        ]
        return max(similarities)

    @staticmethod
    def compute_avg_similarity(frame_embeddings: list, candidate_embeddings: list) -> float:
        """
        Compute the average cosine similarity between all input frames
        and all candidate frames.

        Args:
            frame_embeddings: List of embedding vectors from input video.
            candidate_embeddings: List of embedding vectors from candidate video.

        Returns:
            Average cosine similarity score.
        """
        if not frame_embeddings or not candidate_embeddings:
            return 0.0

        similarities = [
            SimilarityService.cosine_similarity(f_emb, c_emb)
            for f_emb in frame_embeddings
            for c_emb in candidate_embeddings
        ]
        return sum(similarities) / len(similarities)
