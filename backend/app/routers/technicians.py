from fastapi import APIRouter, Query

from app.schemas import AvailabilityStatus, TechnicianIn, TechnicianOut
from app.services import technicians as service

router = APIRouter(prefix="/technicians", tags=["technicians"])


@router.get("", response_model=list[TechnicianOut])
def list_technicians(
    q: str | None = Query(None, description="Matches technician name or email."),
    specialization: str | None = Query(None, description="Exact specialization."),
    availability_status: AvailabilityStatus | None = None,
):
    return service.list_technicians(
        q=q, specialization=specialization, availability_status=availability_status
    )


@router.post("", response_model=TechnicianOut, status_code=201)
def create_technician(payload: TechnicianIn):
    return service.create_technician(payload)


@router.get("/{technician_id}", response_model=TechnicianOut)
def get_technician(technician_id: int):
    return service.get_technician(technician_id)


@router.put("/{technician_id}", response_model=TechnicianOut)
def update_technician(technician_id: int, payload: TechnicianIn):
    return service.update_technician(technician_id, payload)


@router.delete("/{technician_id}", status_code=204)
def delete_technician(technician_id: int) -> None:
    service.delete_technician(technician_id)
