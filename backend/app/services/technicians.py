from app import store
from app.errors import ConflictError, NotFoundError
from app.schemas import AvailabilityStatus, TechnicianIn
from app.store import Record


def _contains(text: str | None, needle: str) -> bool:
    return needle in (text or "").lower()


def list_technicians(
    q: str | None = None,
    specialization: str | None = None,
    availability_status: AvailabilityStatus | None = None,
) -> list[Record]:
    with store.lock:
        items = [dict(item) for item in store.technicians.values()]

    if q and q.strip():
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if _contains(item["name"], needle) or _contains(item["email"], needle)
        ]
    if specialization and specialization.strip():
        wanted = specialization.strip().lower()
        items = [item for item in items if item["specialization"].lower() == wanted]
    if availability_status is not None:
        items = [item for item in items if item["availability_status"] == availability_status]
    return sorted(items, key=lambda item: item["id"])


def get_technician(technician_id: int) -> Record:
    with store.lock:
        technician = store.technicians.get(technician_id)
        if technician is None:
            raise NotFoundError(f"Technician {technician_id} does not exist.")
        return dict(technician)


def create_technician(data: TechnicianIn) -> Record:
    with store.lock:
        technician_id = store.next_id("technicians")
        record: Record = {"id": technician_id, **data.model_dump(mode="json")}
        store.technicians[technician_id] = record
        return dict(record)


def update_technician(technician_id: int, data: TechnicianIn) -> Record:
    with store.lock:
        technician = store.technicians.get(technician_id)
        if technician is None:
            raise NotFoundError(f"Technician {technician_id} does not exist.")
        technician.update(data.model_dump(mode="json"))
        return dict(technician)


def delete_technician(technician_id: int) -> None:
    with store.lock:
        if technician_id not in store.technicians:
            raise NotFoundError(f"Technician {technician_id} does not exist.")
        linked = sum(1 for a in store.assignments.values() if a["technician_id"] == technician_id)
        if linked:
            raise ConflictError(
                f"Technician {technician_id} is referenced by {linked} assignment(s) "
                "and cannot be deleted."
            )
        del store.technicians[technician_id]
