import numpy as np
from PIL import Image
import vertexai
from vertexai.vision_models import MultiModalEmbeddingModel, Image as VertexImage
import io, os

class GeminiEmbeddingService:
    EMBEDDING_DIM = 1408  # Gemini multimodalembedding@001 output

    def __init__(self):
        vertexai.init(
            project=os.environ["GOOGLE_CLOUD_PROJECT"],
            location=os.getenv("VERTEX_LOCATION", "us-central1")
        )
        self.model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")

    def get_image_embedding(self, image: Image.Image) -> np.ndarray:
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        vertex_img = VertexImage(image_bytes=buf.getvalue())
        result = self.model.get_embeddings(image=vertex_img)
        vec = np.array(result.image_embedding, dtype=np.float32)
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def get_embedding_from_url(self, url: str) -> np.ndarray:
        import requests
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        return self.get_image_embedding(image)
