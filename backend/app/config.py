import os
from dataclasses import dataclass

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


@dataclass(frozen=True)
class Settings:
    cors_origins: tuple[str, ...]


def parse_cors_origins(raw: str) -> tuple[str, ...]:
    """Parse a comma-separated origin list. Wildcards are rejected on purpose."""
    origins: list[str] = []
    for item in raw.split(","):
        origin = item.strip().rstrip("/")
        if not origin:
            continue
        if "*" in origin:
            raise ValueError("CORS_ORIGINS must list explicit origins; wildcards are not allowed.")
        if not origin.startswith(("http://", "https://")):
            raise ValueError(f"CORS origin must start with http:// or https://: {origin!r}")
        origins.append(origin)
    if not origins:
        raise ValueError("CORS_ORIGINS must contain at least one origin.")
    return tuple(origins)


def load_settings() -> Settings:
    return Settings(
        cors_origins=parse_cors_origins(os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS))
    )
