import pytest
from pydantic import ValidationError

from app.schemas import (
    AssignmentCreate,
    AssignmentStatus,
    AssignmentUpdate,
    AvailabilityStatus,
    FacilityIn,
    Priority,
    ReportIn,
    ReportStatus,
    TechnicianIn,
)

VALID_REPORT = {
    "title": "Projector not displaying",
    "description": "The projector turns on but displays a blank screen.",
    "facility_id": 1,
    "reporter_name": "Demo Student",
}


def test_status_labels_use_exact_wording():
    assert [s.value for s in ReportStatus] == ["Open", "Assigned", "In Progress", "Resolved"]
    assert [s.value for s in AssignmentStatus] == ["Assigned", "In Progress", "Completed"]
    assert [p.value for p in Priority] == ["Low", "Medium", "High"]
    assert [a.value for a in AvailabilityStatus] == ["Available", "Unavailable"]


def test_report_trims_text_and_defaults_priority_to_medium():
    report = ReportIn.model_validate({**VALID_REPORT, "title": "  Broken projector  "})

    assert report.title == "Broken projector"
    assert report.priority is Priority.MEDIUM


@pytest.mark.parametrize("field", ["id", "status", "created_at", "updated_at"])
def test_report_rejects_server_controlled_fields(field):
    with pytest.raises(ValidationError) as error:
        ReportIn.model_validate({**VALID_REPORT, field: "Resolved" if field == "status" else 1})

    assert error.value.errors()[0]["type"] == "extra_forbidden"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("title", "ab"),
        ("title", "   "),
        ("title", "x" * 121),
        ("description", "too short"),
        ("description", "x" * 2001),
        ("reporter_name", "A"),
        ("facility_id", 0),
        ("priority", "Urgent"),
    ],
)
def test_report_rejects_invalid_values(field, value):
    with pytest.raises(ValidationError):
        ReportIn.model_validate({**VALID_REPORT, field: value})


def test_report_requires_every_mandatory_field():
    for field in ("title", "description", "facility_id", "reporter_name"):
        payload = {k: v for k, v in VALID_REPORT.items() if k != field}
        with pytest.raises(ValidationError):
            ReportIn.model_validate(payload)


def test_facility_rules():
    valid = {"name": "Lab B103", "building": "Engineering", "type": "Laboratory"}
    assert FacilityIn.model_validate(valid).floor is None

    for field, value in [("name", "A"), ("building", " "), ("floor", "x" * 31), ("type", "")]:
        with pytest.raises(ValidationError):
            FacilityIn.model_validate({**valid, field: value})
    with pytest.raises(ValidationError):
        FacilityIn.model_validate({**valid, "description": "x" * 501})
    with pytest.raises(ValidationError):
        FacilityIn.model_validate({**valid, "id": 5})


def test_technician_rules():
    valid = {"name": "Dewi Lestari", "specialization": "HVAC", "email": "dewi@example.com"}
    technician = TechnicianIn.model_validate(valid)
    assert technician.availability_status is AvailabilityStatus.AVAILABLE

    with pytest.raises(ValidationError):
        TechnicianIn.model_validate({**valid, "email": "not-an-email"})
    with pytest.raises(ValidationError):
        TechnicianIn.model_validate({**valid, "availability_status": "Busy"})
    with pytest.raises(ValidationError):
        TechnicianIn.model_validate({**valid, "phone": "1" * 31})


def test_assignment_create_requires_references_and_limits_instructions():
    assert (
        AssignmentCreate.model_validate({"report_id": 3, "technician_id": 1}).instructions is None
    )

    with pytest.raises(ValidationError):
        AssignmentCreate.model_validate({"report_id": 3})
    with pytest.raises(ValidationError):
        AssignmentCreate.model_validate({"report_id": 3, "technician_id": 1, "status": "Assigned"})
    with pytest.raises(ValidationError):
        AssignmentCreate.model_validate(
            {"report_id": 3, "technician_id": 1, "instructions": "x" * 1001}
        )


def test_assignment_update_needs_at_least_one_field():
    with pytest.raises(ValidationError):
        AssignmentUpdate.model_validate({})

    assert AssignmentUpdate.model_validate({"status": "In Progress"}).status is (
        AssignmentStatus.IN_PROGRESS
    )
    assert AssignmentUpdate.model_validate({"technician_id": 2}).technician_id == 2


def test_assignment_update_reports_which_fields_were_sent():
    update = AssignmentUpdate.model_validate({"repair_notes": "Done"})

    assert update.model_fields_set == {"repair_notes"}


def test_assignment_update_makes_report_id_immutable():
    with pytest.raises(ValidationError) as error:
        AssignmentUpdate.model_validate({"report_id": 9, "status": "In Progress"})

    assert error.value.errors()[0]["type"] == "extra_forbidden"


def test_assignment_update_limits_notes_and_status_values():
    with pytest.raises(ValidationError):
        AssignmentUpdate.model_validate({"repair_notes": "x" * 2001})
    with pytest.raises(ValidationError):
        AssignmentUpdate.model_validate({"status": "Resolved"})
