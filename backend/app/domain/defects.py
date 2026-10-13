"""Defect classification vocabulary and report metadata."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DefectClass(str, Enum):
    """Classes the model can predict (alphabetical == model output order)."""

    CRACK = "crack"
    INCLUSION = "inclusion"
    NORMAL = "normal"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    NONE = "NONE"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True)
class DefectProfile:
    """Human-readable report for a predicted class."""

    name: str
    severity: Severity
    description: str
    location: str


DEFECT_PROFILES: dict[str, DefectProfile] = {
    DefectClass.CRACK.value: DefectProfile(
        name="Crack",
        severity=Severity.HIGH,
        description="Visible fracture in the crystal structure",
        location="Surface or internal fracture",
    ),
    DefectClass.INCLUSION.value: DefectProfile(
        name="Inclusion",
        severity=Severity.MEDIUM,
        description="Internal inclusion trapped inside the stone",
        location="Internal body of the stone",
    ),
    DefectClass.NORMAL.value: DefectProfile(
        name="Normal",
        severity=Severity.NONE,
        description="No defects detected",
        location="N/A",
    ),
}

UNKNOWN_PROFILE = DefectProfile(
    name="Unknown",
    severity=Severity.UNKNOWN,
    description="Unrecognised defect class",
    location="N/A",
)

DEFAULT_CLASS_NAMES: list[str] = [defect.value for defect in DefectClass]


def profile_for(class_name: str) -> DefectProfile:
    """Return the report profile for a class name, or a safe fallback."""
    return DEFECT_PROFILES.get(class_name, UNKNOWN_PROFILE)
