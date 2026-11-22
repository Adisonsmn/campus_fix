"""Read-only report access. Create/update/delete arrive with the Report slice."""

from app import store
from app.errors import NotFoundError
from app.schemas import Priority, ReportStatus
from app.store import Record


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
