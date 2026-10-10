"""Pure domain concepts (no framework or infrastructure dependencies)."""

from app.domain.defects import (
    DEFAULT_CLASS_NAMES,
    UNKNOWN_PROFILE,
    DefectClass,
    DefectProfile,
    Severity,
    profile_for,
)

__all__ = [
    "DEFAULT_CLASS_NAMES",
    "UNKNOWN_PROFILE",
    "DefectClass",
    "DefectProfile",
    "Severity",
    "profile_for",
]
