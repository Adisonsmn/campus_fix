import pytest
from fastapi.testclient import TestClient

from app import store
from app.config import Settings
from app.main import create_app

TEST_ORIGIN = "http://localhost:5173"


@pytest.fixture(autouse=True)
def fresh_store():
    """Every test starts from, and leaves behind, a pristine copy of the seed data."""
    store.reset_store()
    yield
    store.reset_store()


@pytest.fixture
def app():
    return create_app(Settings(cors_origins=(TEST_ORIGIN,)))


@pytest.fixture
def client(app):
    return TestClient(app)
