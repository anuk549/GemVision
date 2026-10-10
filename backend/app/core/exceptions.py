"""Domain exceptions.

Each exception carries the HTTP ``status_code`` and a stable ``error_type`` so a
single exception handler can render consistent error responses.
"""

from __future__ import annotations


class GemVisionError(Exception):
    """Base class for all application errors."""

    status_code: int = 500
    error_type: str = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ModelNotAvailableError(GemVisionError):
    status_code = 503
    error_type = "model_unavailable"


class UnknownModelError(GemVisionError):
    status_code = 400
    error_type = "unknown_model"


class InvalidImageError(GemVisionError):
    status_code = 400
    error_type = "invalid_image"


class ImageTooLargeError(GemVisionError):
    status_code = 413
    error_type = "image_too_large"


class UnsupportedMediaTypeError(GemVisionError):
    status_code = 415
    error_type = "unsupported_media_type"
