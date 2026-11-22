"""Report CRUD. Status is never client-controlled: it only changes through assignments."""

from app import store
from app.errors import ConflictError, NotFoundError
from app.schemas import Priority, ReportIn, ReportStatus
from app.store import Record
from app.utils import utc_now_iso


def list_reports(
    q: str | None = None,
    status: ReportStatus | None = None,
    facility_id: int | None = None,
    priority: Priority | None = None,
    reporter_name: str | None = None,
) -> list[Record]:
    with store.lock:
        items = [
            {
                **report,
                "_facility_name": store.facilities.get(report["facility_id"], {}).get("name"),
            }
            for report in store.reports.values()
        ]

    if q and q.strip():
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle in item["title"].lower() or needle in (item["_facility_name"] or "").lower()
        ]
    if status is not None:
        items = [item for item in items if item["status"] == status.value]
    if facility_id is not None:
        items = [item for item in items if item["facility_id"] == facility_id]
    if priority is not None:
        items = [item for item in items if item["priority"] == priority.value]
    if reporter_name is not None:
        items = [item for item in items if item["reporter_name"] == reporter_name]

    for item in items:
        del item["_facility_name"]
    return sorted(items, key=lambda item: item["id"])


def get_report(report_id: int) -> Record:
    with store.lock:
        report = store.reports.get(report_id)
        if report is None:
            raise NotFoundError(f"Report {report_id} does not exist.")
        return dict(report)


def _require_facility(facility_id: int) -> None:
    if facility_id not in store.facilities:
        raise NotFoundError(f"Facility {facility_id} does not exist.")


def _require_editable(report: Record, action: str) -> None:
    """Reports may only be edited or deleted while Open and not linked to an assignment."""
    if report["status"] != ReportStatus.OPEN.value:
        raise ConflictError(
            f"Report {report['id']} is {report['status']} and can no longer be {action}."
        )
    if any(a["report_id"] == report["id"] for a in store.assignments.values()):
        raise ConflictError(f"Report {report['id']} has an assignment and cannot be {action}.")


def create_report(data: ReportIn) -> Record:
    with store.lock:
        _require_facility(data.facility_id)
        now = utc_now_iso()
        report_id = store.next_id("reports")
        record: Record = {
            "id": report_id,
            **data.model_dump(mode="json"),
            "status": ReportStatus.OPEN.value,
            "created_at": now,
            "updated_at": now,
        }
        store.reports[report_id] = record
        return dict(record)


def update_report(report_id: int, data: ReportIn) -> Record:
    with store.lock:
        report = store.reports.get(report_id)
        if report is None:
            raise NotFoundError(f"Report {report_id} does not exist.")
        _require_editable(report, "edited")
        _require_facility(data.facility_id)
        report.update(data.model_dump(mode="json"))
        report["updated_at"] = utc_now_iso()
        return dict(report)


def delete_report(report_id: int) -> None:
    with store.lock:
        report = store.reports.get(report_id)
        if report is None:
            raise NotFoundError(f"Report {report_id} does not exist.")
        _require_editable(report, "deleted")
        del store.reports[report_id]
