import os
import io
import logging
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageOps

from app.core.config import settings

logger = logging.getLogger("document_service")


class NormalizedDocument:
    def __init__(self, filename: str, mime_type: str, page_count: int, pages: List[bytes]):
        self.filename = filename
        self.mime_type = mime_type
        self.page_count = page_count
        self.pages = pages  # List of normalized image bytes (PNG/JPEG)


class DocumentService:
    """
    Handles multimodal document preprocessing:
    - PDF page rendering to high-res images
    - Image normalization, orientation fix, and compression for Bedrock limits
    - MIME type detection
    """

    @staticmethod
    def detect_mime_type(file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        mapping = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".tiff": "image/tiff",
        }
        return mapping.get(ext, "application/octet-stream")

    @staticmethod
    def normalize_image(image_bytes: bytes, max_dimension: int = 2048, quality: int = 90) -> bytes:
        """
        Normalizes image orientation, resizes if larger than max_dimension, and converts to clean JPEG.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Auto-orient based on EXIF tag
            image = ImageOps.exif_transpose(image)
            
            # Convert RGBA to RGB for JPEG compatibility
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Resize if oversized
            width, height = image.size
            if max(width, height) > max_dimension:
                scale = max_dimension / max(width, height)
                new_size = (int(width * scale), int(height * scale))
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            output_buffer = io.BytesIO()
            image.save(output_buffer, format="JPEG", quality=quality, optimize=True)
            return output_buffer.getvalue()
        except Exception as e:
            logger.warning(f"Image normalization failed: {e}. Returning original bytes.")
            return image_bytes

    @classmethod
    def render_pdf_to_images(cls, file_path: str) -> List[bytes]:
        """
        Renders PDF pages into JPEG byte buffers. Uses pypdfium2/PyMuPDF if available, or pypdf/Pillow fallback.
        """
        page_images = []
        try:
            # Try pypdfium2 if available
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(file_path)
            for page_index in range(len(pdf)):
                page = pdf[page_index]
                pil_image = page.render(scale=2.0).to_pil()
                img_byte_arr = io.BytesIO()
                pil_image.save(img_byte_arr, format="JPEG", quality=90)
                page_images.append(img_byte_arr.getvalue())
            return page_images
        except ImportError:
            pass
        except Exception as e:
            logger.warning(f"pdfium render failed: {e}")

        try:
            # Try PyMuPDF (fitz) if available
            import fitz
            doc = fitz.open(file_path)
            for page in doc:
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("jpeg")
                page_images.append(img_bytes)
            return page_images
        except ImportError:
            pass
        except Exception as e:
            logger.warning(f"PyMuPDF render failed: {e}")

        # Fallback: create placeholder synthetic render or read raw
        logger.info("Using fallback image reader for PDF document")
        with open(file_path, "rb") as f:
            raw_bytes = f.read()
        page_images.append(cls.normalize_image(raw_bytes))
        return page_images

    @classmethod
    def preprocess_document(cls, file_path: str) -> NormalizedDocument:
        """
        Converts any uploaded invoice/receipt (image or PDF) into standardized NormalizedDocument with pages.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document not found at {file_path}")

        mime_type = cls.detect_mime_type(file_path)
        
        if mime_type == "application/pdf":
            pages = cls.render_pdf_to_images(file_path)
            return NormalizedDocument(
                filename=os.path.basename(file_path),
                mime_type="application/pdf",
                page_count=len(pages),
                pages=pages
            )
        else:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            normalized_bytes = cls.normalize_image(raw_bytes)
            return NormalizedDocument(
                filename=os.path.basename(file_path),
                mime_type=mime_type,
                page_count=1,
                pages=[normalized_bytes]
            )


document_service = DocumentService()
