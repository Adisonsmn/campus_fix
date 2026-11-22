from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, load_settings
from app.errors import register_exception_handlers
from app.routers import facilities, health, reports


def create_api_router() -> APIRouter:
    api = APIRouter(prefix="/api")
    api.include_router(health.router)
    api.include_router(facilities.router)
    api.include_router(reports.router)
    return api


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    app = FastAPI(
        title="CampusFix API",
        description=(
            "Campus facility maintenance API. Data is held in server memory only and "
            "resets whenever the server restarts. Demo roles are not authentication."
        ),
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Accept"],
    )
    register_exception_handlers(app)
    app.include_router(create_api_router())
    return app


app = create_app()
