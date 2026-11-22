import copy

import pytest

from app import store

VALID = {
    "title": "Cracked window",
    "description": "The window in the corridor has a long crack across the glass.",
    "facility_id": 3,
    "reporter_name": "Alya Putri",
    "priority": "High",
}


def test_create_returns_201_open_with_server_fields(client):
    response = client.post("/api/reports", json=VALID)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == max(store.SEED_REPORTS) + 1
    assert body["status"] == "Open"
    assert body["created_at"] == body["updated_at"]
    assert body["title"] == "Cracked window"
    assert client.get(f"/api/reports/{body['id']}").json() == body


def test_create_defaults_priority_and_trims_text(client):
    payload = {**VALID, "title": "  Cracked window  ", "reporter_name": " Alya "}
    del payload["priority"]

    body = client.post("/api/reports", json=payload).json()

    assert body["priority"] == "Medium"
    assert body["title"] == "Cracked window"
    assert body["reporter_name"] == "Alya"


def test_create_with_unknown_facility_is_404_and_adds_nothing(client):
    response = client.post("/api/reports", json={**VALID, "facility_id": 9999})

    assert response.status_code == 404
    assert response.json() == {"detail": "Facility 9999 does not exist."}
    assert len(client.get("/api/reports").json()) == len(store.SEED_REPORTS)


@pytest.mark.parametrize(
    "payload",
    [
        {**VALID, "title": "ab"},
        {**VALID, "title": "x" * 121},
        {**VALID, "description": "too short"},
        {**VALID, "description": "x" * 2001},
        {**VALID, "reporter_name": "A"},
        {**VALID, "facility_id": 0},
        {**VALID, "priority": "Urgent"},
        {**VALID, "status": "Resolved"},
        {**VALID, "created_at": "2020-01-01T00:00:00+00:00"},
        {**VALID, "id": 5},
        {k: v for k, v in VALID.items() if k != "facility_id"},
    ],
)
def test_invalid_create_payload_is_422_and_adds_nothing(client, payload):
    response = client.post("/api/reports", json=payload)

    assert response.status_code == 422
    assert len(client.get("/api/reports").json()) == len(store.SEED_REPORTS)


def test_update_open_report_replaces_fields_and_bumps_updated_at(client):
    before = client.get("/api/reports/1").json()

    response = client.put("/api/reports/1", json={**VALID, "title": "Projector dead"})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == "Projector dead"
    assert body["facility_id"] == 3
    assert body["status"] == "Open"
    assert body["created_at"] == before["created_at"]
    assert body["updated_at"] > before["updated_at"]
    assert client.get("/api/reports/1").json() == body


@pytest.mark.parametrize("report_id", [2, 3, 4, 5])
def test_update_after_assignment_is_409_and_changes_nothing(client, report_id):
    before = client.get(f"/api/reports/{report_id}").json()

    response = client.put(f"/api/reports/{report_id}", json=VALID)

    assert response.status_code == 409
    assert client.get(f"/api/reports/{report_id}").json() == before


def test_open_report_that_has_an_assignment_cannot_be_edited_or_deleted(client):
    # Defensive rule: an assignment blocks changes even if the status still reads Open.
    store.assignments[99] = {
        "id": 99,
        "report_id": 1,
        "technician_id": 1,
        "status": "Assigned",
        "instructions": None,
        "repair_notes": None,
        "assigned_at": "2026-11-21T00:00:00+00:00",
        "updated_at": "2026-11-21T00:00:00+00:00",
    }

    assert client.put("/api/reports/1", json=VALID).status_code == 409
    assert client.delete("/api/reports/1").status_code == 409


def test_update_with_unknown_facility_is_404_and_changes_nothing(client):
    before = client.get("/api/reports/1").json()

    response = client.put("/api/reports/1", json={**VALID, "facility_id": 9999})

    assert response.status_code == 404
    assert client.get("/api/reports/1").json() == before


def test_update_cannot_set_status(client):
    before = client.get("/api/reports/1").json()

    response = client.put("/api/reports/1", json={**VALID, "status": "Resolved"})

    assert response.status_code == 422
    assert client.get("/api/reports/1").json() == before


def test_invalid_update_payload_is_422_and_changes_nothing(client):
    before = client.get("/api/reports/1").json()

    assert client.put("/api/reports/1", json={**VALID, "title": "ab"}).status_code == 422
    assert client.get("/api/reports/1").json() == before


def test_delete_open_report_returns_204_without_body(client):
    response = client.delete("/api/reports/8")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/api/reports/8").status_code == 404


@pytest.mark.parametrize("report_id", [2, 3, 5])
def test_delete_after_assignment_is_409_and_changes_nothing(client, report_id):
    reports_before = copy.deepcopy(store.reports)
    assignments_before = copy.deepcopy(store.assignments)

    response = client.delete(f"/api/reports/{report_id}")

    assert response.status_code == 409
    assert store.reports == reports_before
    assert store.assignments == assignments_before


def test_deleted_report_ids_are_not_reused(client):
    highest = max(store.SEED_REPORTS)
    created = client.post("/api/reports", json=VALID).json()
    client.delete(f"/api/reports/{created['id']}")

    again = client.post("/api/reports", json=VALID).json()

    assert created["id"] == highest + 1
    assert again["id"] == highest + 2


@pytest.mark.parametrize("method", ["put", "delete"])
def test_unknown_report_returns_404(client, method):
    kwargs = {"json": VALID} if method == "put" else {}

    response = getattr(client, method)("/api/reports/9999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Report 9999 does not exist."}


def test_new_report_blocks_deleting_its_facility(client):
    created = client.post("/api/reports", json={**VALID, "facility_id": 9}).json()

    assert client.delete("/api/facilities/9").status_code == 409

    client.delete(f"/api/reports/{created['id']}")
    assert client.delete("/api/facilities/9").status_code == 204


def test_moving_a_report_to_another_facility_updates_both_facility_filters(client):
    client.put("/api/reports/1", json={**VALID, "facility_id": 9})

    assert {r["id"] for r in client.get("/api/reports", params={"facility_id": 9}).json()} == {1}
    assert {r["id"] for r in client.get("/api/reports", params={"facility_id": 1}).json()} == {9}
