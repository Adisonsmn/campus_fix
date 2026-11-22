from fastapi import APIRouter, Query

from app.schemas import Priority, ReportIn, ReportOut, ReportStatus
from app.services import reports as service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(
    q: str | None = Query(None, description="Matches report title or facility name."),
    status: ReportStatus | None = None,
    facility_id: int | None = None,
    priority: Priority | None = None,
    reporter_name: str | None = Query(None, description="Exact match (demo 'My Reports')."),
):
    return service.list_reports(
        q=q,
        status=status,
        facility_id=facility_id,
        priority=priority,
        reporter_name=reporter_name,
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int):
    return service.get_report(report_id)


@router.post("", response_model=ReportOut, status_code=201)
def create_report(payload: ReportIn):
    return service.create_report(payload)


@router.put("/{report_id}", response_model=ReportOut)
def update_report(report_id: int, payload: ReportIn):
    return service.update_report(report_id, payload)


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int) -> None:
    service.delete_report(report_id)
