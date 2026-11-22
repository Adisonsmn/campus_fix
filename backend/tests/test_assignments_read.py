import pytest

from app import store


def test_list_returns_all_seeded_assignments_ordered_by_id(client):
    response = client.get("/api/assignments")

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert ids == sorted(ids)
    assert len(ids) == len(store.SEED_ASSIGNMENTS)
    assert response.json()[0].keys() >= {"id", "report_id", "technician_id", "status"}


def test_filter_by_technician_status_and_report(client):
    by_tech = client.get("/api/assignments", params={"technician_id": 2}).json()
    by_status = client.get("/api/assignments", params={"status": "In Progress"}).json()
    by_report = client.get("/api/assignments", params={"report_id": 4}).json()

    assert [a["id"] for a in by_tech] == [2, 5]
    assert [a["id"] for a in by_status] == [1]
    assert [a["id"] for a in by_report] == [3]


def test_filter_on_unassigned_report_returns_empty_list(client):
    assert client.get("/api/assignments", params={"report_id": 1}).json() == []


@pytest.mark.parametrize("params", [{"status": "Done"}, {"technician_id": "x"}])
def test_invalid_filter_values_return_422(client, params):
    assert client.get("/api/assignments", params=params).status_code == 422


def test_detail_and_404(client):
    assert client.get("/api/assignments/1").json()["report_id"] == 2
    missing = client.get("/api/assignments/9999")
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Assignment 9999 does not exist."}
