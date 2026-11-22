"""Assignment reads. Create, update and delete arrive with the Assignment slice."""

from app import store
from app.errors import NotFoundError
from app.schemas import AssignmentStatus
from app.store import Record


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
