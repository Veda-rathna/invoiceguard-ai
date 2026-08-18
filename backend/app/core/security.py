import os
import re
import uuid
from typing import Tuple


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes an uploaded filename to prevent directory traversal and special character exploits.
    """
    base_name = os.path.basename(filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", base_name)
    ext = os.path.splitext(clean_name)[1].lower()
    unique_prefix = uuid.uuid4().hex[:8]
    return f"{unique_prefix}_{clean_name}"


def validate_file_extension(filename: str, allowed_extensions: list) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in allowed_extensions
