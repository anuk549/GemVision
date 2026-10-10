"""Shared response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    type: str = Field(..., description="Stable machine-readable error code")
    message: str = Field(..., description="Human-readable error message")


class ErrorResponse(BaseModel):
    """Consistent error envelope returned by all error handlers."""

    error: ErrorDetail


class Message(BaseModel):
    detail: str
