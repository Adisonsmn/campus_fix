from datetime import UTC, datetime


def utc_now_iso() -> str:
    """Server-generated ISO 8601 timestamp in UTC, to the second."""
    return datetime.now(UTC).replace(microsecond=0).isoformat()
