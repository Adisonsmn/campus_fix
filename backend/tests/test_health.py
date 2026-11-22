def test_health_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_swagger_and_openapi_are_available(client):
    assert client.get("/docs").status_code == 200

    schema = client.get("/openapi.json").json()
    assert "/api/health" in schema["paths"]
    assert schema["info"]["title"] == "CampusFix API"


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert "detail" in response.json()
