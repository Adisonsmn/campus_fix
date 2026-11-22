import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict

from app.errors import ConflictError, NotFoundError


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    count: int


@pytest.fixture
def error_client(app):
    @app.get("/_test/not-found")
    def not_found():
        raise NotFoundError("Facility 99 does not exist.")

    @app.get("/_test/conflict")
    def conflict():
        raise ConflictError("Facility 1 is referenced by 2 report(s) and cannot be deleted.")

    @app.post("/_test/validate")
    def validate(payload: Payload):
        return payload

    @app.get("/_test/boom")
    def boom():
        raise RuntimeError("secret internal detail /srv/app/store.py")

    return TestClient(app, raise_server_exceptions=False)


def test_not_found_maps_to_404_with_string_detail(error_client):
    response = error_client.get("/_test/not-found")

    assert response.status_code == 404
    assert response.json() == {"detail": "Facility 99 does not exist."}


def test_conflict_maps_to_409_with_string_detail(error_client):
    response = error_client.get("/_test/conflict")

    assert response.status_code == 409
    assert "cannot be deleted" in response.json()["detail"]


def test_validation_error_maps_to_422_with_loc_msg_type(error_client):
    response = error_client.post("/_test/validate", json={"title": 5, "extra": "x"})

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert isinstance(errors, list) and errors
    for error in errors:
        assert set(error) == {"loc", "msg", "type"}
    assert any(error["loc"] == ["body", "count"] for error in errors)


def test_validation_error_does_not_echo_submitted_input(error_client):
    response = error_client.post("/_test/validate", json={"title": "x", "count": "private-value"})

    assert response.status_code == 422
    assert "private-value" not in response.text


def test_malformed_json_returns_422(error_client):
    response = error_client.post(
        "/_test/validate", content="{not json", headers={"Content-Type": "application/json"}
    )

    assert response.status_code == 422


def test_unexpected_error_returns_generic_500_without_internals(error_client):
    response = error_client.get("/_test/boom")

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error."}
    assert "secret" not in response.text
    assert "Traceback" not in response.text
