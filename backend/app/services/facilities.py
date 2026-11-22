from app import store
from app.errors import ConflictError, NotFoundError
from app.schemas import FacilityIn
from app.store import Record


def _contains(text: str | None, needle: str) -> bool:
    return needle in (text or "").lower()


def list_facilities(q: str | None = None, type_: str | None = None) -> list[Record]:
    with store.lock:
        items = [dict(item) for item in store.facilities.values()]

    if q and q.strip():
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if _contains(item["name"], needle) or _contains(item["building"], needle)
        ]
    if type_ and type_.strip():
        wanted = type_.strip().lower()
        items = [item for item in items if item["type"].lower() == wanted]
    return sorted(items, key=lambda item: item["id"])


def get_facility(facility_id: int) -> Record:
    with store.lock:
        facility = store.facilities.get(facility_id)
        if facility is None:
            raise NotFoundError(f"Facility {facility_id} does not exist.")
        return dict(facility)


def create_facility(data: FacilityIn) -> Record:
    with store.lock:
        facility_id = store.next_id("facilities")
        record: Record = {"id": facility_id, **data.model_dump(mode="json")}
        store.facilities[facility_id] = record
        return dict(record)


def update_facility(facility_id: int, data: FacilityIn) -> Record:
    with store.lock:
        facility = store.facilities.get(facility_id)
        if facility is None:
            raise NotFoundError(f"Facility {facility_id} does not exist.")
        facility.update(data.model_dump(mode="json"))
        return dict(facility)


def delete_facility(facility_id: int) -> None:
    with store.lock:
        if facility_id not in store.facilities:
            raise NotFoundError(f"Facility {facility_id} does not exist.")
        linked = sum(1 for r in store.reports.values() if r["facility_id"] == facility_id)
        if linked:
            raise ConflictError(
                f"Facility {facility_id} is referenced by {linked} report(s) and cannot be deleted."
            )
        del store.facilities[facility_id]
