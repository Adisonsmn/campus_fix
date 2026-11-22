from fastapi import APIRouter, Query

from app.schemas import FacilityIn, FacilityOut
from app.services import facilities as service

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("", response_model=list[FacilityOut])
def list_facilities(
    q: str | None = Query(None, description="Matches facility name or building."),
    type_: str | None = Query(None, alias="type", description="Exact facility type."),
):
    return service.list_facilities(q=q, type_=type_)


@router.post("", response_model=FacilityOut, status_code=201)
def create_facility(payload: FacilityIn):
    return service.create_facility(payload)


@router.get("/{facility_id}", response_model=FacilityOut)
def get_facility(facility_id: int):
    return service.get_facility(facility_id)


@router.put("/{facility_id}", response_model=FacilityOut)
def update_facility(facility_id: int, payload: FacilityIn):
    return service.update_facility(facility_id, payload)


@router.delete("/{facility_id}", status_code=204)
def delete_facility(facility_id: int) -> None:
    service.delete_facility(facility_id)
