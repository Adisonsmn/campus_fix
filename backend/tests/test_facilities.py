import pytest

from app import store

VALID = {
    "name": "Lab D204",
    "building": "Faculty of Engineering",
    "floor": "Floor 2",
    "type": "Laboratory",
    "description": "New networking lab.",
}


def test_list_returns_all_seeded_facilities_ordered_by_id(client):
    response = client.get("/api/facilities")

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert ids == sorted(ids)
    assert len(ids) == len(store.SEED_FACILITIES)


def test_create_returns_201_with_server_generated_id(client):
    response = client.post("/api/facilities", json=VALID)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == max(store.SEED_FACILITIES) + 1
    assert body["name"] == "Lab D204"
    assert client.get(f"/api/facilities/{body['id']}").json() == body


def test_create_trims_text_and_stores_optional_fields_as_null(client):
    response = client.post(
        "/api/facilities",
        json={"name": "  Hall X  ", "building": " Main ", "type": " Other "},
    )

    body = response.json()
    assert response.status_code == 201
    assert (body["name"], body["building"], body["type"]) == ("Hall X", "Main", "Other")
    assert body["floor"] is None
    assert body["description"] is None


def test_get_detail(client):
    response = client.get("/api/facilities/1")

    assert response.status_code == 200
    assert response.json()["name"] == "Lab B103"


def test_update_replaces_fields_and_keeps_id(client):
    response = client.put("/api/facilities/1", json={**VALID, "name": "Lab B103 (renovated)"})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "Lab B103 (renovated)"
    assert client.get("/api/facilities/1").json() == body


def test_update_can_clear_optional_fields(client):
    response = client.put(
        "/api/facilities/1",
        json={"name": "Lab B103", "building": "Faculty of Engineering", "type": "Laboratory"},
    )

    assert response.json()["floor"] is None
    assert response.json()["description"] is None


def test_delete_unreferenced_facility_returns_204_without_body(client):
    response = client.delete("/api/facilities/9")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/api/facilities/9").status_code == 404


def test_deleted_ids_are_not_reused(client):
    highest = max(store.SEED_FACILITIES)
    created = client.post("/api/facilities", json=VALID).json()
    client.delete(f"/api/facilities/{created['id']}")

    again = client.post("/api/facilities", json=VALID).json()

    assert created["id"] == highest + 1
    assert again["id"] == highest + 2


def test_delete_facility_referenced_by_reports_is_409_and_changes_nothing(client):
    before = client.get("/api/facilities").json()

    response = client.delete("/api/facilities/1")

    assert response.status_code == 409
    assert "referenced by 2 report(s)" in response.json()["detail"]
    assert client.get("/api/facilities").json() == before
    assert client.get("/api/reports", params={"facility_id": 1}).json()


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_unknown_facility_returns_404(client, method):
    kwargs = {"json": VALID} if method == "put" else {}

    response = getattr(client, method)("/api/facilities/9999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Facility 9999 does not exist."}


def test_non_integer_id_returns_422(client):
    assert client.get("/api/facilities/abc").status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {**VALID, "name": "A"},
        {**VALID, "name": "   "},
        {**VALID, "building": ""},
        {**VALID, "floor": "x" * 31},
        {**VALID, "type": ""},
        {**VALID, "description": "x" * 501},
        {**VALID, "id": 99},
        {k: v for k, v in VALID.items() if k != "name"},
        {**VALID, "name": 123},
    ],
)
def test_invalid_create_payload_returns_422_and_adds_nothing(client, payload):
    response = client.post("/api/facilities", json=payload)

    assert response.status_code == 422
    assert len(client.get("/api/facilities").json()) == len(store.SEED_FACILITIES)


def test_invalid_update_payload_returns_422_and_changes_nothing(client):
    before = client.get("/api/facilities/1").json()

    response = client.put("/api/facilities/1", json={**VALID, "name": "A"})

    assert response.status_code == 422
    assert client.get("/api/facilities/1").json() == before


def test_update_with_invalid_payload_on_missing_facility_reports_validation_first(client):
    assert client.put("/api/facilities/9999", json={**VALID, "name": "A"}).status_code == 422


def test_search_matches_name_or_building_case_insensitively(client):
    by_name = client.get("/api/facilities", params={"q": "computer"}).json()
    by_building = client.get("/api/facilities", params={"q": "CENTRAL library"}).json()

    assert [f["name"] for f in by_name] == ["Computer Lab 3.02"]
    assert {f["building"] for f in by_building} == {"Central Library"}
    assert [f["id"] for f in by_building] == [6, 7, 8]


def test_type_filter_is_exact_and_case_insensitive(client):
    result = client.get("/api/facilities", params={"type": "laboratory"}).json()

    assert result
    assert {f["type"] for f in result} == {"Laboratory"}
    assert client.get("/api/facilities", params={"type": "lab"}).json() == []


def test_filters_combine_and_blank_values_are_ignored(client):
    combined = client.get("/api/facilities", params={"q": "science", "type": "Laboratory"}).json()
    blank = client.get("/api/facilities", params={"q": "  ", "type": ""}).json()

    assert [f["name"] for f in combined] == ["Chemistry Lab C-110", "Physics Lab P-105"]
    assert len(blank) == len(store.SEED_FACILITIES)


def test_failed_delete_does_not_hold_the_lock(client):
    client.delete("/api/facilities/1")

    assert client.post("/api/facilities", json=VALID).status_code == 201
