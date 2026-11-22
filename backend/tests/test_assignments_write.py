import copy

import pytest

from app import store

# Seed reference (see app/store.py):
#   reports 1, 8, 9, 10 are Open and unassigned; 3, 4 Assigned; 2 In Progress; 5, 6, 7 Resolved
#   assignments 2, 3 are Assigned; 1 is In Progress (has notes); 4, 5, 6 are Completed
#   technicians 1, 2, 3, 5 are Available; technician 4 is Unavailable
CREATE = {"report_id": 1, "technician_id": 1, "instructions": "Check the lamp and power cable."}


def snapshot():
    return copy.deepcopy(store.reports), copy.deepcopy(store.assignments)


def report_status(client, report_id):
    return client.get(f"/api/reports/{report_id}").json()["status"]


# --- create ------------------------------------------------------------------


def test_create_returns_201_assigned_and_moves_report_to_assigned(client):
    response = client.post("/api/assignments", json=CREATE)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == max(store.SEED_ASSIGNMENTS) + 1
    assert body["status"] == "Assigned"
    assert body["repair_notes"] is None
    assert body["assigned_at"] == body["updated_at"]
    assert client.get(f"/api/assignments/{body['id']}").json() == body
    assert report_status(client, 1) == "Assigned"


def test_create_bumps_report_updated_at(client):
    before = client.get("/api/reports/1").json()["updated_at"]

    client.post("/api/assignments", json=CREATE)

    assert client.get("/api/reports/1").json()["updated_at"] > before


def test_create_without_instructions_or_with_blank_stores_null(client):
    first = client.post("/api/assignments", json={"report_id": 1, "technician_id": 1}).json()
    second = client.post(
        "/api/assignments", json={"report_id": 8, "technician_id": 1, "instructions": "   "}
    ).json()

    assert first["instructions"] is None
    assert second["instructions"] is None


def test_create_missing_report_or_technician_is_404_and_changes_nothing(client):
    before = snapshot()

    no_report = client.post("/api/assignments", json={**CREATE, "report_id": 9999})
    no_tech = client.post("/api/assignments", json={**CREATE, "technician_id": 9999})
    neither = client.post(
        "/api/assignments", json={**CREATE, "report_id": 9999, "technician_id": 9999}
    )

    assert no_report.status_code == no_tech.status_code == neither.status_code == 404
    assert no_report.json() == {"detail": "Report 9999 does not exist."}
    assert no_tech.json() == {"detail": "Technician 9999 does not exist."}
    assert snapshot() == before


@pytest.mark.parametrize("report_id", [2, 3, 5])
def test_create_for_report_that_is_not_open_is_409(client, report_id):
    before = snapshot()

    response = client.post("/api/assignments", json={**CREATE, "report_id": report_id})

    assert response.status_code == 409
    assert "only Open reports can be assigned" in response.json()["detail"]
    assert snapshot() == before


def test_assigning_the_same_report_twice_is_409(client):
    assert client.post("/api/assignments", json=CREATE).status_code == 201
    before = snapshot()

    response = client.post("/api/assignments", json={**CREATE, "technician_id": 2})

    assert response.status_code == 409
    assert snapshot() == before


def test_open_report_that_already_has_an_assignment_is_409(client):
    # Defensive rule independent of the report status.
    store.assignments[99] = {
        **store.assignments[2],
        "id": 99,
        "report_id": 1,
    }

    response = client.post("/api/assignments", json=CREATE)

    assert response.status_code == 409
    assert "already has an assignment" in response.json()["detail"]


def test_create_with_unavailable_technician_is_409_and_report_stays_open(client):
    before = snapshot()

    response = client.post("/api/assignments", json={**CREATE, "technician_id": 4})

    assert response.status_code == 409
    assert "Unavailable" in response.json()["detail"]
    assert snapshot() == before
    assert report_status(client, 1) == "Open"


def test_available_flag_is_not_a_workload_limit(client):
    # PRD: availability is a manual flag, so one technician can hold several assignments.
    client.post("/api/assignments", json={**CREATE, "report_id": 1, "technician_id": 2})
    response = client.post("/api/assignments", json={**CREATE, "report_id": 8, "technician_id": 2})

    assert response.status_code == 201


@pytest.mark.parametrize(
    "payload",
    [
        {"technician_id": 1},
        {"report_id": 1},
        {**CREATE, "report_id": 0},
        {**CREATE, "technician_id": "x"},
        {**CREATE, "instructions": "x" * 1001},
        {**CREATE, "status": "Completed"},
        {**CREATE, "id": 7},
    ],
)
def test_invalid_create_payload_is_422_and_changes_nothing(client, payload):
    before = snapshot()

    response = client.post("/api/assignments", json=payload)

    assert response.status_code == 422
    assert snapshot() == before


# --- update: reassign and instructions ---------------------------------------


def test_reassign_while_assigned_changes_only_the_technician(client):
    before = client.get("/api/assignments/2").json()

    response = client.put("/api/assignments/2", json={"technician_id": 5})

    assert response.status_code == 200
    body = response.json()
    assert body["technician_id"] == 5
    assert body["status"] == "Assigned"
    assert body["instructions"] == before["instructions"]
    assert body["assigned_at"] == before["assigned_at"]
    assert body["updated_at"] > before["updated_at"]
    assert report_status(client, 3) == "Assigned"


def test_reassign_to_unavailable_technician_is_409_and_changes_nothing(client):
    before = snapshot()

    response = client.put("/api/assignments/2", json={"technician_id": 4})

    assert response.status_code == 409
    assert snapshot() == before


def test_reassign_to_unknown_technician_is_404(client):
    response = client.put("/api/assignments/2", json={"technician_id": 9999})

    assert response.status_code == 404
    assert response.json() == {"detail": "Technician 9999 does not exist."}


def test_reassign_after_work_started_is_409(client):
    before = snapshot()

    response = client.put("/api/assignments/1", json={"technician_id": 2})

    assert response.status_code == 409
    assert snapshot() == before


def test_sending_the_current_technician_is_not_a_reassignment(client):
    # The edit form may send the whole record; an unchanged value must not be rejected.
    assert client.put("/api/assignments/1", json={"technician_id": 1}).status_code == 200


def test_edit_instructions_while_assigned_and_clear_them(client):
    edited = client.put("/api/assignments/2", json={"instructions": "  New plan  "}).json()
    cleared = client.put("/api/assignments/2", json={"instructions": None}).json()

    assert edited["instructions"] == "New plan"
    assert cleared["instructions"] is None


def test_change_instructions_after_work_started_is_409(client):
    before = snapshot()

    response = client.put("/api/assignments/1", json={"instructions": "Different plan"})

    assert response.status_code == 409
    assert snapshot() == before


# --- update: lifecycle -------------------------------------------------------


def test_start_work_moves_assignment_and_report_to_in_progress(client):
    response = client.put("/api/assignments/2", json={"status": "In Progress"})

    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"
    assert report_status(client, 3) == "In Progress"


def test_complete_with_notes_moves_report_to_resolved(client):
    client.put("/api/assignments/2", json={"status": "In Progress"})

    response = client.put(
        "/api/assignments/2", json={"status": "Completed", "repair_notes": "Replaced the socket."}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Completed"
    assert body["repair_notes"] == "Replaced the socket."
    assert report_status(client, 3) == "Resolved"


def test_complete_can_reuse_notes_already_saved(client):
    # Assignment 1 is In Progress and already has repair notes.
    response = client.put("/api/assignments/1", json={"status": "Completed"})

    assert response.status_code == 200
    assert report_status(client, 2) == "Resolved"


@pytest.mark.parametrize("notes", [{}, {"repair_notes": None}, {"repair_notes": "   "}])
def test_complete_without_notes_is_422_in_pydantic_list_form(client, notes):
    client.put("/api/assignments/2", json={"status": "In Progress"})
    before = snapshot()

    response = client.put("/api/assignments/2", json={"status": "Completed", **notes})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["body", "repair_notes"]
    assert snapshot() == before


def test_cannot_skip_from_assigned_to_completed(client):
    before = snapshot()

    response = client.put(
        "/api/assignments/2", json={"status": "Completed", "repair_notes": "Done already."}
    )

    assert response.status_code == 409
    assert snapshot() == before


def test_cannot_revert_in_progress_to_assigned(client):
    before = snapshot()

    response = client.put("/api/assignments/1", json={"status": "Assigned"})

    assert response.status_code == 409
    assert snapshot() == before


@pytest.mark.parametrize("assignment_id", [4, 5, 6])
@pytest.mark.parametrize(
    "payload",
    [
        {"status": "In Progress"},
        {"status": "Completed"},
        {"repair_notes": "Edited later"},
        {"instructions": "Edited later"},
        {"technician_id": 1},
    ],
)
def test_completed_assignment_is_read_only(client, assignment_id, payload):
    before = snapshot()

    response = client.put(f"/api/assignments/{assignment_id}", json=payload)

    assert response.status_code == 409
    assert snapshot() == before


def test_same_status_is_a_no_op_not_a_transition(client):
    response = client.put(
        "/api/assignments/1", json={"status": "In Progress", "repair_notes": "Still waiting."}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"
    assert response.json()["repair_notes"] == "Still waiting."
    assert report_status(client, 2) == "In Progress"


def test_repair_notes_can_be_saved_while_assigned_and_in_progress(client):
    assigned = client.put("/api/assignments/2", json={"repair_notes": "Parts ordered."})
    started = client.put("/api/assignments/1", json={"repair_notes": "Part arrived."})

    assert assigned.status_code == started.status_code == 200
    assert assigned.json()["repair_notes"] == "Parts ordered."
    assert started.json()["repair_notes"] == "Part arrived."


def test_field_rules_use_the_status_before_the_transition(client):
    # Starting work and editing instructions in one request is legal: it is still Assigned.
    ok = client.put("/api/assignments/2", json={"status": "In Progress", "instructions": "Go."})

    assert ok.status_code == 200
    assert ok.json()["instructions"] == "Go."
    assert ok.json()["status"] == "In Progress"


def test_combined_illegal_request_is_rejected_whole(client):
    # In Progress cannot be reassigned, so the legal status change must not be applied either.
    before = snapshot()

    response = client.put("/api/assignments/1", json={"status": "Completed", "technician_id": 2})

    assert response.status_code == 409
    assert snapshot() == before


def test_status_change_bumps_report_updated_at(client):
    before = client.get("/api/reports/3").json()["updated_at"]

    client.put("/api/assignments/2", json={"status": "In Progress"})

    assert client.get("/api/reports/3").json()["updated_at"] > before


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"report_id": 5},
        {"status": "Done"},
        {"technician_id": 0},
        {"repair_notes": "x" * 2001},
        {"instructions": "x" * 1001},
        {"id": 3},
        {"assigned_at": "2020-01-01T00:00:00+00:00"},
    ],
)
def test_invalid_update_payload_is_422_and_changes_nothing(client, payload):
    before = snapshot()

    response = client.put("/api/assignments/2", json=payload)

    assert response.status_code == 422
    assert snapshot() == before


# --- delete ------------------------------------------------------------------


def test_delete_assigned_assignment_reopens_the_report(client):
    response = client.delete("/api/assignments/2")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/api/assignments/2").status_code == 404
    assert report_status(client, 3) == "Open"


def test_report_is_editable_and_assignable_again_after_assignment_delete(client):
    client.delete("/api/assignments/2")

    payload = {
        "title": "Loose socket (updated)",
        "description": "The socket at the window desk is still loose and sparks.",
        "facility_id": 6,
        "reporter_name": "Alya Putri",
        "priority": "High",
    }
    assert client.put("/api/reports/3", json=payload).status_code == 200
    assert (
        client.post("/api/assignments", json={"report_id": 3, "technician_id": 1}).status_code
        == 201
    )


@pytest.mark.parametrize("assignment_id", [1, 4])
def test_delete_started_or_completed_assignment_is_409(client, assignment_id):
    before = snapshot()

    response = client.delete(f"/api/assignments/{assignment_id}")

    assert response.status_code == 409
    assert snapshot() == before


@pytest.mark.parametrize("method", ["put", "delete"])
def test_unknown_assignment_returns_404(client, method):
    kwargs = {"json": {"instructions": "x"}} if method == "put" else {}

    response = getattr(client, method)("/api/assignments/9999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Assignment 9999 does not exist."}


def test_deleted_assignment_ids_are_not_reused(client):
    highest = max(store.SEED_ASSIGNMENTS)
    created = client.post("/api/assignments", json=CREATE).json()
    client.delete(f"/api/assignments/{created['id']}")

    again = client.post("/api/assignments", json=CREATE).json()

    assert created["id"] == highest + 1
    assert again["id"] == highest + 2


# --- cross-entity protections and the full workflow --------------------------


def test_assigned_report_and_its_technician_are_protected_from_deletion(client):
    created = client.post("/api/assignments", json={**CREATE, "technician_id": 3}).json()

    assert client.delete("/api/reports/1").status_code == 409
    assert client.delete("/api/technicians/3").status_code == 409

    client.delete(f"/api/assignments/{created['id']}")
    assert client.delete("/api/reports/1").status_code == 204


def test_full_workflow_open_to_resolved(client):
    created = client.post("/api/assignments", json=CREATE).json()
    assert report_status(client, 1) == "Assigned"

    client.put(f"/api/assignments/{created['id']}", json={"status": "In Progress"})
    assert report_status(client, 1) == "In Progress"

    done = client.put(
        f"/api/assignments/{created['id']}",
        json={"status": "Completed", "repair_notes": "Replaced the projector lamp."},
    )

    assert done.json()["status"] == "Completed"
    assert report_status(client, 1) == "Resolved"
    assert (
        client.put(f"/api/assignments/{created['id']}", json={"status": "In Progress"}).status_code
        == 409
    )
    assert client.delete(f"/api/assignments/{created['id']}").status_code == 409
    assert client.delete("/api/reports/1").status_code == 409


def test_filters_see_new_assignments(client):
    created = client.post("/api/assignments", json={**CREATE, "technician_id": 5}).json()

    mine = client.get("/api/assignments", params={"technician_id": 5}).json()
    by_report = client.get("/api/assignments", params={"report_id": 1}).json()

    assert created["id"] in {a["id"] for a in mine}
    assert [a["id"] for a in by_report] == [created["id"]]
