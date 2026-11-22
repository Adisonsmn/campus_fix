import copy

import pytest

from app import store

VALID = {
    "name": "Rudi Santoso",
    "specialization": "Carpentry",
    "email": "rudi.santoso@example.com",
    "phone": "+62 812-0000-0099",
    "availability_status": "Available",
}


def test_list_returns_all_seeded_technicians_ordered_by_id(client):
    response = client.get("/api/technicians")

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert ids == sorted(ids)
    assert len(ids) == len(store.SEED_TECHNICIANS)


def test_create_returns_201_with_server_generated_id(client):
    response = client.post("/api/technicians", json=VALID)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == max(store.SEED_TECHNICIANS) + 1
    assert body["name"] == "Rudi Santoso"
    assert client.get(f"/api/technicians/{body['id']}").json() == body


def test_create_defaults_availability_and_trims_text(client):
    response = client.post(
        "/api/technicians",
        json={"name": "  Rudi  ", "specialization": " IT ", "email": "rudi@example.com"},
    )

    body = response.json()
    assert response.status_code == 201
    assert (body["name"], body["specialization"]) == ("Rudi", "IT")
    assert body["availability_status"] == "Available"
    assert body["phone"] is None


def test_update_replaces_fields_and_keeps_id(client):
    response = client.put(
        "/api/technicians/1", json={**VALID, "availability_status": "Unavailable"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "Rudi Santoso"
    assert body["availability_status"] == "Unavailable"
    assert client.get("/api/technicians/1").json() == body


def test_update_does_not_touch_assignments(client):
    before = copy.deepcopy(store.assignments)

    client.put("/api/technicians/2", json={**VALID, "availability_status": "Unavailable"})

    assert store.assignments == before


def test_delete_unreferenced_technician_returns_204_without_body(client):
    response = client.delete("/api/technicians/4")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/api/technicians/4").status_code == 404


def test_delete_technician_with_assignments_is_409_and_changes_nothing(client):
    before = client.get("/api/technicians").json()

    response = client.delete("/api/technicians/2")

    assert response.status_code == 409
    assert "referenced by 2 assignment(s)" in response.json()["detail"]
    assert client.get("/api/technicians").json() == before


def test_delete_technician_with_completed_assignment_is_still_blocked(client):
    # Technician 5 only has a Completed assignment; history still references them.
    assert client.delete("/api/technicians/5").status_code == 409


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_unknown_technician_returns_404(client, method):
    kwargs = {"json": VALID} if method == "put" else {}

    response = getattr(client, method)("/api/technicians/9999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Technician 9999 does not exist."}


def test_non_integer_id_returns_422(client):
    assert client.get("/api/technicians/abc").status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {**VALID, "name": "A"},
        {**VALID, "name": "   "},
        {**VALID, "specialization": ""},
        {**VALID, "specialization": "x" * 51},
        {**VALID, "email": "not-an-email"},
        {**VALID, "phone": "1" * 31},
        {**VALID, "availability_status": "Busy"},
        {**VALID, "id": 99},
        {k: v for k, v in VALID.items() if k != "email"},
    ],
)
def test_invalid_create_payload_returns_422_and_adds_nothing(client, payload):
    response = client.post("/api/technicians", json=payload)

    assert response.status_code == 422
    assert len(client.get("/api/technicians").json()) == len(store.SEED_TECHNICIANS)


def test_invalid_update_payload_returns_422_and_changes_nothing(client):
    before = client.get("/api/technicians/1").json()

    response = client.put("/api/technicians/1", json={**VALID, "email": "nope"})

    assert response.status_code == 422
    assert client.get("/api/technicians/1").json() == before


def test_search_matches_name_or_email_case_insensitively(client):
    by_name = client.get("/api/technicians", params={"q": "DEWI"}).json()
    by_email = client.get("/api/technicians", params={"q": "budi.hartono@"}).json()

    assert [t["id"] for t in by_name] == [1]
    assert [t["id"] for t in by_email] == [2]


def test_specialization_and_availability_filters(client):
    electrical = client.get("/api/technicians", params={"specialization": "electrical"}).json()
    unavailable = client.get(
        "/api/technicians", params={"availability_status": "Unavailable"}
    ).json()

    assert [t["id"] for t in electrical] == [2]
    assert [t["id"] for t in unavailable] == [4]


def test_invalid_availability_filter_returns_422(client):
    assert client.get("/api/technicians", params={"availability_status": "Busy"}).status_code == 422


def test_filters_combine_and_blank_values_are_ignored(client):
    combined = client.get(
        "/api/technicians", params={"q": "a", "availability_status": "Available"}
    ).json()
    blank = client.get("/api/technicians", params={"q": "  ", "specialization": ""}).json()

    assert combined
    assert {t["availability_status"] for t in combined} == {"Available"}
    assert len(blank) == len(store.SEED_TECHNICIANS)
