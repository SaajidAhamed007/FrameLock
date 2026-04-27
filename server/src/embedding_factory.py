import os

def get_embedding_service():
    backend = os.getenv("EMBEDDING_BACKEND", "local").lower()
    if backend == "gemini":
        from .gemini_embedding_service import GeminiEmbeddingService
        return GeminiEmbeddingService()
    elif backend == "gemini-key":
        from .gemini_key_embedding_service import GeminiKeyEmbeddingService
        return GeminiKeyEmbeddingService()
    else:
        from .embedding_service import EmbeddingService
        return EmbeddingService()
