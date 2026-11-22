import pytest

from app import store


def test_list_returns_all_seeded_reports(client):
    response = client.get("/api/reports")

    assert response.status_code == 200
    assert len(response.json()) == len(store.SEED_REPORTS)
    assert response.json()[0].keys() >= {"id", "title", "facility_id", "status", "priority"}


def test_list_exposes_only_report_fields(client):
    assert all("_facility_name" not in item for item in client.get("/api/reports").json())


def test_filter_by_facility(client):
    result = client.get("/api/reports", params={"facility_id": 1}).json()

    assert {r["id"] for r in result} == {1, 9}


def test_filter_by_unknown_facility_returns_empty_list(client):
    response = client.get("/api/reports", params={"facility_id": 9999})

    assert response.status_code == 200
    assert response.json() == []


def test_filter_by_status_and_priority(client):
    resolved = client.get("/api/reports", params={"status": "Resolved"}).json()
    high = client.get("/api/reports", params={"priority": "High"}).json()

    assert {r["status"] for r in resolved} == {"Resolved"}
    assert len(resolved) == 3
    assert {r["priority"] for r in high} == {"High"}


def test_filter_by_in_progress_uses_exact_label(client):
    result = client.get("/api/reports", params={"status": "In Progress"}).json()

    assert [r["id"] for r in result] == [2]


def test_filter_by_reporter_name_is_exact(client):
    mine = client.get("/api/reports", params={"reporter_name": "Alya Putri"}).json()

    assert len(mine) == 8
    assert client.get("/api/reports", params={"reporter_name": "Alya"}).json() == []


def test_search_matches_title_or_facility_name(client):
    by_title = client.get("/api/reports", params={"q": "projector"}).json()
    by_facility = client.get("/api/reports", params={"q": "study room 4"}).json()

    assert {r["id"] for r in by_title} == {1, 9}
    assert [r["id"] for r in by_facility] == [5]


def test_filters_combine(client):
    result = client.get("/api/reports", params={"facility_id": 1, "status": "Open"}).json()

    assert {r["id"] for r in result} == {1, 9}
    assert (
        client.get("/api/reports", params={"facility_id": 1, "priority": "High"}).json()[0]["id"]
        == 1
    )


@pytest.mark.parametrize(
    "params", [{"status": "Done"}, {"priority": "Urgent"}, {"facility_id": "x"}]
)
def test_invalid_filter_values_return_422(client, params):
    assert client.get("/api/reports", params=params).status_code == 422


def test_detail(client):
    response = client.get("/api/reports/2")

    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"


def test_unknown_report_returns_404(client):
    response = client.get("/api/reports/9999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Report 9999 does not exist."}
