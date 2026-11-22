"""Assignment CRUD and the multi-entity business rules (BR-01, BR-02).

Every write holds `store.lock`, validates everything first, and only then mutates, so a
rejected request leaves both the Assignment and the Report untouched.
"""

from app import store
from app.errors import ConflictError, NotFoundError, UnprocessableError
from app.schemas import (
    AssignmentCreate,
    AssignmentStatus,
    AssignmentUpdate,
    AvailabilityStatus,
    ReportStatus,
)
from app.store import Record
from app.utils import utc_now_iso

# Assignment status -> the Report status it implies.
_REPORT_STATUS_FOR = {
    AssignmentStatus.ASSIGNED: ReportStatus.ASSIGNED,
    AssignmentStatus.IN_PROGRESS: ReportStatus.IN_PROGRESS,
    AssignmentStatus.COMPLETED: ReportStatus.RESOLVED,
}

# Only the next step is allowed; anything else is a lifecycle violation.
_NEXT_STATUS = {
    AssignmentStatus.ASSIGNED: AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.IN_PROGRESS: AssignmentStatus.COMPLETED,
}


def _blank_to_none(value: str | None) -> str | None:
    return value if value else None


def list_assignments(
    status: AssignmentStatus | None = None,
    technician_id: int | None = None,
    report_id: int | None = None,
) -> list[Record]:
    with store.lock:
        items = [dict(item) for item in store.assignments.values()]

    if status is not None:
        items = [item for item in items if item["status"] == status.value]
    if technician_id is not None:
        items = [item for item in items if item["technician_id"] == technician_id]
    if report_id is not None:
        items = [item for item in items if item["report_id"] == report_id]
    return sorted(items, key=lambda item: item["id"])


def get_assignment(assignment_id: int) -> Record:
    with store.lock:
        assignment = store.assignments.get(assignment_id)
        if assignment is None:
            raise NotFoundError(f"Assignment {assignment_id} does not exist.")
        return dict(assignment)


def _require_available_technician(technician_id: int) -> None:
    technician = store.technicians.get(technician_id)
    if technician is None:
        raise NotFoundError(f"Technician {technician_id} does not exist.")
    if technician["availability_status"] != AvailabilityStatus.AVAILABLE.value:
        raise ConflictError(f"Technician {technician_id} is Unavailable and cannot take work.")


def create_assignment(data: AssignmentCreate) -> Record:
    with store.lock:
        report = store.reports.get(data.report_id)
        if report is None:
            raise NotFoundError(f"Report {data.report_id} does not exist.")
        if data.technician_id not in store.technicians:
            raise NotFoundError(f"Technician {data.technician_id} does not exist.")

        if report["status"] != ReportStatus.OPEN.value:
            raise ConflictError(
                f"Report {report['id']} is {report['status']}; only Open reports can be assigned."
            )
        if any(a["report_id"] == report["id"] for a in store.assignments.values()):
            raise ConflictError(f"Report {report['id']} already has an assignment.")
        _require_available_technician(data.technician_id)

        now = utc_now_iso()
        assignment_id = store.next_id("assignments")
        record: Record = {
            "id": assignment_id,
            "report_id": data.report_id,
            "technician_id": data.technician_id,
            "status": AssignmentStatus.ASSIGNED.value,
            "instructions": _blank_to_none(data.instructions),
            "repair_notes": None,
            "assigned_at": now,
            "updated_at": now,
        }
        store.assignments[assignment_id] = record
        report["status"] = ReportStatus.ASSIGNED.value
        report["updated_at"] = now
        return dict(record)


def update_assignment(assignment_id: int, data: AssignmentUpdate) -> Record:
    with store.lock:
        assignment = store.assignments.get(assignment_id)
        if assignment is None:
            raise NotFoundError(f"Assignment {assignment_id} does not exist.")

        current = AssignmentStatus(assignment["status"])
        if current is AssignmentStatus.COMPLETED:
            raise ConflictError(
                f"Assignment {assignment_id} is Completed and can no longer change."
            )

        provided = data.model_fields_set
        changes: Record = {}

        # Field rules are judged against the status *before* any transition in this request.
        if "technician_id" in provided and data.technician_id != assignment["technician_id"]:
            if current is not AssignmentStatus.ASSIGNED:
                raise ConflictError("The technician can only be changed while Assigned.")
            assert data.technician_id is not None
            _require_available_technician(data.technician_id)
            changes["technician_id"] = data.technician_id

        if "instructions" in provided:
            instructions = _blank_to_none(data.instructions)
            if instructions != assignment["instructions"]:
                if current is not AssignmentStatus.ASSIGNED:
                    raise ConflictError("Instructions can only be changed while Assigned.")
                changes["instructions"] = instructions

        if "repair_notes" in provided:
            changes["repair_notes"] = _blank_to_none(data.repair_notes)

        next_status: AssignmentStatus | None = None
        if data.status is not None and data.status is not current:
            if _NEXT_STATUS.get(current) is not data.status:
                raise ConflictError(
                    f"An assignment cannot move from {current.value} to {data.status.value}."
                )
            next_status = data.status
            if next_status is AssignmentStatus.COMPLETED:
                notes = changes.get("repair_notes", assignment["repair_notes"])
                if not notes:
                    raise UnprocessableError(
                        "repair_notes", "Add repair notes before completing the work."
                    )

        now = utc_now_iso()
        assignment.update(changes)
        assignment["updated_at"] = now
        if next_status is not None:
            assignment["status"] = next_status.value
            report = store.reports[assignment["report_id"]]
            report["status"] = _REPORT_STATUS_FOR[next_status].value
            report["updated_at"] = now
        return dict(assignment)


def delete_assignment(assignment_id: int) -> None:
    with store.lock:
        assignment = store.assignments.get(assignment_id)
        if assignment is None:
            raise NotFoundError(f"Assignment {assignment_id} does not exist.")
        if assignment["status"] != AssignmentStatus.ASSIGNED.value:
            raise ConflictError(
                f"Assignment {assignment_id} is {assignment['status']}; "
                "only Assigned assignments can be deleted."
            )
        report = store.reports[assignment["report_id"]]
        del store.assignments[assignment_id]
        report["status"] = ReportStatus.OPEN.value
        report["updated_at"] = utc_now_iso()
