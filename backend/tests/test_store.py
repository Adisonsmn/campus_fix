import threading

import pytest

from app import store
from app.schemas import (
    AssignmentOut,
    FacilityIn,
    FacilityOut,
    ReportIn,
    ReportOut,
    TechnicianIn,
    TechnicianOut,
)

REPORT_STATUS_BY_ASSIGNMENT = {
    "Assigned": "Assigned",
    "In Progress": "In Progress",
    "Completed": "Resolved",
}


def test_record_ids_match_their_keys():
    for table in (store.facilities, store.reports, store.technicians, store.assignments):
        for key, record in table.items():
            assert record["id"] == key


def test_report_references_existing_facility():
    for report in store.reports.values():
        assert report["facility_id"] in store.facilities


def test_assignment_references_existing_report_and_technician():
    for assignment in store.assignments.values():
        assert assignment["report_id"] in store.reports
        assert assignment["technician_id"] in store.technicians


def test_at_most_one_assignment_per_report():
    report_ids = [a["report_id"] for a in store.assignments.values()]

    assert len(report_ids) == len(set(report_ids))


def test_report_status_matches_assignment_status():
    assigned_reports = {a["report_id"]: a for a in store.assignments.values()}

    for report in store.reports.values():
        assignment = assigned_reports.get(report["id"])
        if assignment is None:
            assert report["status"] == "Open", f"report {report['id']} has no assignment"
        else:
            assert report["status"] == REPORT_STATUS_BY_ASSIGNMENT[assignment["status"]]


def test_completed_assignments_have_repair_notes():
    for assignment in store.assignments.values():
        if assignment["status"] == "Completed":
            assert assignment["repair_notes"]


def test_seed_records_satisfy_response_schemas():
    for record in store.facilities.values():
        FacilityOut.model_validate(record)
    for record in store.reports.values():
        ReportOut.model_validate(record)
    for record in store.technicians.values():
        TechnicianOut.model_validate(record)
    for record in store.assignments.values():
        AssignmentOut.model_validate(record)


def test_seed_records_satisfy_input_rules():
    """Seed data must itself be valid, or editing a seeded record would fail."""
    for record in store.facilities.values():
        FacilityIn.model_validate({k: v for k, v in record.items() if k != "id"})
    for record in store.technicians.values():
        TechnicianIn.model_validate({k: v for k, v in record.items() if k != "id"})
    for record in store.reports.values():
        payload = {k: record[k] for k in ReportIn.model_fields}
        ReportIn.model_validate(payload)


def test_seed_has_a_deletable_facility_and_technician_and_an_unavailable_technician():
    used_facilities = {r["facility_id"] for r in store.reports.values()}
    used_technicians = {a["technician_id"] for a in store.assignments.values()}

    assert set(store.facilities) - used_facilities
    assert set(store.technicians) - used_technicians
    assert any(t["availability_status"] == "Unavailable" for t in store.technicians.values())


def test_reset_restores_seed_and_keeps_table_identity():
    table = store.reports
    seed_count = len(table)
    table[999] = {"id": 999}
    table[1]["status"] = "Resolved"

    store.reset_store()

    assert store.reports is table
    assert 999 not in table
    assert len(table) == seed_count
    assert table[1]["status"] == "Open"


def test_mutating_live_data_does_not_touch_seed_constants():
    store.reports[1]["title"] = "changed"
    store.reset_store()

    assert store.SEED_REPORTS[1]["title"] == "Broken projector"


def test_ids_continue_after_highest_seed_id():
    assert store.next_id("facilities") == max(store.SEED_FACILITIES) + 1
    assert store.next_id("facilities") == max(store.SEED_FACILITIES) + 2
    assert store.next_id("reports") == max(store.SEED_REPORTS) + 1


def test_reset_restarts_id_counters():
    store.next_id("technicians")
    store.reset_store()

    assert store.next_id("technicians") == max(store.SEED_TECHNICIANS) + 1


def test_next_id_unknown_entity_fails():
    with pytest.raises(KeyError):
        store.next_id("widgets")


def test_next_id_is_unique_across_threads():
    results: list[int] = []
    results_lock = threading.Lock()

    def worker():
        for _ in range(200):
            value = store.next_id("reports")
            with results_lock:
                results.append(value)

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert len(results) == 1600
    assert len(set(results)) == 1600


def test_lock_is_reentrant_for_nested_service_calls():
    with store.lock, store.lock:
        assert store.next_id("assignments") > 0
