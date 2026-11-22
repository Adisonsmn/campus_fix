import pytest

from app.config import DEFAULT_CORS_ORIGINS, load_settings, parse_cors_origins
from tests.conftest import TEST_ORIGIN


def test_parse_cors_origins_trims_and_strips_trailing_slash():
    result = parse_cors_origins(" https://main.example.amplifyapp.com/ , http://localhost:5173 ,")

    assert result == ("https://main.example.amplifyapp.com", "http://localhost:5173")


@pytest.mark.parametrize("raw", ["*", "https://*.example.com", "http://ok.test,*"])
def test_wildcard_origins_are_rejected(raw):
    with pytest.raises(ValueError, match="wildcard"):
        parse_cors_origins(raw)


@pytest.mark.parametrize("raw", ["localhost:5173", "ftp://example.com"])
def test_origins_need_http_scheme(raw):
    with pytest.raises(ValueError, match="http"):
        parse_cors_origins(raw)


@pytest.mark.parametrize("raw", ["", " , "])
def test_empty_origin_list_is_rejected(raw):
    with pytest.raises(ValueError, match="at least one"):
        parse_cors_origins(raw)


def test_load_settings_reads_environment(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://app.example.com")

    assert load_settings().cors_origins == ("https://app.example.com",)


def test_load_settings_falls_back_to_local_dev_origins(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert load_settings().cors_origins == parse_cors_origins(DEFAULT_CORS_ORIGINS)
    assert "*" not in load_settings().cors_origins


def test_cors_allows_configured_origin(client):
    response = client.get("/api/health", headers={"Origin": TEST_ORIGIN})

    assert response.headers["access-control-allow-origin"] == TEST_ORIGIN


def test_cors_preflight_allows_crud_methods_for_configured_origin(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": TEST_ORIGIN,
            "Access-Control-Request-Method": "DELETE",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == TEST_ORIGIN
    assert "DELETE" in response.headers["access-control-allow-methods"]


def test_cors_does_not_allow_other_origins(client):
    response = client.get("/api/health", headers={"Origin": "https://evil.example.com"})

    assert "access-control-allow-origin" not in response.headers
