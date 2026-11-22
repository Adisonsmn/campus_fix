from fastapi import APIRouter

from app.schemas import AssignmentOut, AssignmentStatus
from app.services import assignments as service

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentOut])
def list_assignments(
    status: AssignmentStatus | None = None,
    technician_id: int | None = None,
    report_id: int | None = None,
):
    return service.list_assignments(status=status, technician_id=technician_id, report_id=report_id)


@router.get("/{assignment_id}", response_model=AssignmentOut)
def get_assignment(assignment_id: int):
    return service.get_assignment(assignment_id)
