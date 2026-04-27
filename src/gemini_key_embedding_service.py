import os
import io
import re
import time
import numpy as np
from PIL import Image
from google import genai
from google.genai import types
from google.genai.errors import ClientError


class GeminiKeyEmbeddingService:
    """
    Embedding service using only a Gemini API key — no billing or GCP project needed.

    Pipeline per frame:
        1. gemini-2.0-flash describes the image (scene, objects, actions, logos)
        2. text-embedding-004 embeds that description (768-dim semantic vector)

    Handles 429 rate limits by reading the retryDelay from the API response
    and sleeping exactly that long before retrying (up to 3 attempts).
    """

    EMBEDDING_DIM = 3072  # gemini-embedding-001 output dimension

    _DESCRIBE_PROMPT = (
        "Describe this video frame in detail for copyright detection: "
        "list the scene setting, sport type, visible team colors/logos/jerseys, "
        "player actions, scoreboard text, broadcast overlays, camera angle, "
        "and any distinctive visual elements. Be specific and thorough."
    )

    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")
        self._client = genai.Client(api_key=api_key)

    @staticmethod
    def _retry_delay_seconds(error: ClientError) -> float:
        """Extract retryDelay from a 429 ClientError, default 30s if not found."""
        try:
            details = error.args[0] if error.args else ""
            match = re.search(r"retryDelay.*?(\d+(?:\.\d+)?)", str(details))
            if match:
                return float(match.group(1)) + 1.0
        except Exception:
            pass
        return 30.0

    def _call_with_retry(self, fn, *args, max_retries=3, **kwargs):
        """Call fn(*args, **kwargs), retrying on 429 with the API-suggested delay."""
        for attempt in range(max_retries):
            try:
                return fn(*args, **kwargs)
            except ClientError as e:
                if e.code == 429 and attempt < max_retries - 1:
                    wait = self._retry_delay_seconds(e)
                    print(f"  ⏳ Rate limited — waiting {wait:.0f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait)
                else:
                    raise

    def _describe_image(self, image: Image.Image) -> str:
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        response = self._call_with_retry(
            self._client.models.generate_content,
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                self._DESCRIBE_PROMPT,
            ],
        )
        return response.text.strip()

    def get_image_embedding(self, image: Image.Image) -> np.ndarray:
        description = self._describe_image(image)
        result = self._call_with_retry(
            self._client.models.embed_content,
            model="gemini-embedding-001",
            contents=description,
            config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY"),
        )
        vec = np.array(result.embeddings[0].values, dtype=np.float32)
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def get_embedding_from_url(self, url: str) -> np.ndarray:
        import requests
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        return self.get_image_embedding(image)
