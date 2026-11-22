"""Pydantic models for request validation and responses (docs/api-contract.md).

Request models reject unknown fields, so a client can never set `id`, Report `status`,
`created_at`, `updated_at` or `assigned_at`.
"""

from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, model_validator


class ReportStatus(StrEnum):
    OPEN = "Open"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class Priority(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class AvailabilityStatus(StrEnum):
    AVAILABLE = "Available"
    UNAVAILABLE = "Unavailable"


class AssignmentStatus(StrEnum):
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


def _text(min_length: int, max_length: int):
    return Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)
    ]


def _optional_text(max_length: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, max_length=max_length)] | None


EntityId = Annotated[int, Field(gt=0)]


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ResponseModel(BaseModel):
    model_config = ConfigDict(use_enum_values=False)


# --- Facility ---------------------------------------------------------------


class FacilityIn(RequestModel):
    name: _text(2, 100)
    building: _text(2, 100)
    floor: _optional_text(30) = None
    type: _text(1, 50)
    description: _optional_text(500) = None


class FacilityOut(ResponseModel):
    id: int
    name: str
    building: str
    floor: str | None
    type: str
    description: str | None


# --- Report -----------------------------------------------------------------


class ReportIn(RequestModel):
    title: _text(3, 120)
    description: _text(10, 2000)
    facility_id: EntityId
    reporter_name: _text(2, 100)
    priority: Priority = Priority.MEDIUM


class ReportOut(ResponseModel):
    id: int
    title: str
    description: str
    facility_id: int
    reporter_name: str
    priority: Priority
    status: ReportStatus
    created_at: str
    updated_at: str


# --- Technician -------------------------------------------------------------


class TechnicianIn(RequestModel):
    name: _text(2, 100)
    specialization: _text(1, 50)
    email: EmailStr
    phone: _optional_text(30) = None
    availability_status: AvailabilityStatus = AvailabilityStatus.AVAILABLE


class TechnicianOut(ResponseModel):
    id: int
    name: str
    specialization: str
    email: str
    phone: str | None
    availability_status: AvailabilityStatus


# --- Assignment -------------------------------------------------------------


class AssignmentCreate(RequestModel):
    report_id: EntityId
    technician_id: EntityId
    instructions: _optional_text(1000) = None


class AssignmentUpdate(RequestModel):
    """Partial update. `report_id` is immutable and rejected as an unknown field."""

    technician_id: EntityId | None = None
    instructions: _optional_text(1000) = None
    status: AssignmentStatus | None = None
    repair_notes: _optional_text(2000) = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "AssignmentUpdate":
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update.")
        return self


class AssignmentOut(ResponseModel):
    id: int
    report_id: int
    technician_id: int
    status: AssignmentStatus
    instructions: str | None
    repair_notes: str | None
    assigned_at: str
    updated_at: str
