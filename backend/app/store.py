"""In-memory data store: hardcoded Python dictionaries, no database, no disk writes.

This module is the single source of truth for all four entities. Records are plain
dicts keyed by integer id. Changes live in RAM and are lost when the process restarts.

Run exactly one Uvicorn worker: each worker would otherwise hold its own copy of this
state. Overlapping requests inside that one process are serialized for multi-step
writes by holding `lock`, which is re-entrant so service functions may nest.
"""

import copy
import threading
from typing import Any

Record = dict[str, Any]

# ---------------------------------------------------------------------------
# Seed data (fictional). Every reference below points at an existing record and
# every Report status matches its Assignment status (BR-01).
# ---------------------------------------------------------------------------

SEED_FACILITIES: dict[int, Record] = {
    1: {
        "id": 1,
        "name": "Lab B103",
        "building": "Faculty of Engineering",
        "floor": "Floor 1",
        "type": "Laboratory",
        "description": "Practical sessions lab with a ceiling projector.",
    },
    2: {
        "id": 2,
        "name": "Computer Lab 3.02",
        "building": "Faculty of Engineering",
        "floor": "Floor 3",
        "type": "Laboratory",
        "description": "40 workstations for programming courses.",
    },
    3: {
        "id": 3,
        "name": "Classroom A201",
        "building": "Faculty of Engineering",
        "floor": "Floor 2",
        "type": "Classroom",
        "description": "Lecture room for up to 60 students.",
    },
    4: {
        "id": 4,
        "name": "Chemistry Lab C-110",
        "building": "Science Building",
        "floor": "Floor 1",
        "type": "Laboratory",
        "description": None,
    },
    5: {
        "id": 5,
        "name": "Physics Lab P-105",
        "building": "Science Building",
        "floor": "Floor 1",
        "type": "Laboratory",
        "description": None,
    },
    6: {
        "id": 6,
        "name": "Study Room 2",
        "building": "Central Library",
        "floor": "Floor 2",
        "type": "Library",
        "description": "Quiet group study room.",
    },
    7: {
        "id": 7,
        "name": "Study Room 4",
        "building": "Central Library",
        "floor": "Floor 2",
        "type": "Library",
        "description": "Quiet group study room.",
    },
    8: {
        "id": 8,
        "name": "Reading Hall",
        "building": "Central Library",
        "floor": "Ground floor",
        "type": "Library",
        "description": "Open reading area with shared Wi-Fi.",
    },
    9: {
        "id": 9,
        "name": "Restroom 1F",
        "building": "Faculty of Engineering",
        "floor": "Floor 1",
        "type": "Restroom",
        "description": None,
    },
}

SEED_TECHNICIANS: dict[int, Record] = {
    1: {
        "id": 1,
        "name": "Dewi Lestari",
        "specialization": "HVAC",
        "email": "dewi.lestari@example.com",
        "phone": "+62 812-0000-0001",
        "availability_status": "Available",
    },
    2: {
        "id": 2,
        "name": "Budi Hartono",
        "specialization": "Electrical",
        "email": "budi.hartono@example.com",
        "phone": "+62 812-0000-0002",
        "availability_status": "Available",
    },
    3: {
        "id": 3,
        "name": "Sari Wijaya",
        "specialization": "IT",
        "email": "sari.wijaya@example.com",
        "phone": None,
        "availability_status": "Available",
    },
    4: {
        "id": 4,
        "name": "Agus Pratama",
        "specialization": "Plumbing",
        "email": "agus.pratama@example.com",
        "phone": "+62 812-0000-0004",
        "availability_status": "Unavailable",
    },
    5: {
        "id": 5,
        "name": "Maya Anggraini",
        "specialization": "General",
        "email": "maya.anggraini@example.com",
        "phone": None,
        "availability_status": "Available",
    },
}

SEED_REPORTS: dict[int, Record] = {
    1: {
        "id": 1,
        "title": "Broken projector",
        "description": (
            "The projector does not power on. The power light stays off even though the "
            "cable and wall socket are connected. The lab has a practical session on "
            "Monday morning."
        ),
        "facility_id": 1,
        "reporter_name": "Alya Putri",
        "priority": "High",
        "status": "Open",
        "created_at": "2026-11-20T14:20:00+00:00",
        "updated_at": "2026-11-20T14:20:00+00:00",
    },
    2: {
        "id": 2,
        "title": "AC not cooling",
        "description": (
            "The air conditioner in Classroom A201 runs but blows air that is not cold. "
            "The room becomes too warm during the afternoon lectures and students have "
            "started leaving the door open."
        ),
        "facility_id": 3,
        "reporter_name": "Alya Putri",
        "priority": "Medium",
        "status": "In Progress",
        "created_at": "2026-11-18T08:42:00+00:00",
        "updated_at": "2026-11-19T09:05:00+00:00",
    },
    3: {
        "id": 3,
        "title": "Loose power socket at study desk",
        "description": "The power socket at the desk by the window is loose and sparks sometimes.",
        "facility_id": 6,
        "reporter_name": "Alya Putri",
        "priority": "Medium",
        "status": "Assigned",
        "created_at": "2026-11-16T10:30:00+00:00",
        "updated_at": "2026-11-17T09:00:00+00:00",
    },
    4: {
        "id": 4,
        "title": "Wi-Fi keeps dropping in reading hall",
        "description": "The Wi-Fi disconnects every few minutes in the middle of the reading hall.",
        "facility_id": 8,
        "reporter_name": "Alya Putri",
        "priority": "Medium",
        "status": "Assigned",
        "created_at": "2026-11-14T13:10:00+00:00",
        "updated_at": "2026-11-15T08:20:00+00:00",
    },
    5: {
        "id": 5,
        "title": "Broken chair in study room",
        "description": "One chair in Study Room 4 has a cracked seat and is unsafe to sit on.",
        "facility_id": 7,
        "reporter_name": "Alya Putri",
        "priority": "Low",
        "status": "Resolved",
        "created_at": "2026-11-12T09:15:00+00:00",
        "updated_at": "2026-11-13T15:40:00+00:00",
    },
    6: {
        "id": 6,
        "title": "Flickering ceiling lights",
        "description": "Two ceiling lights flicker constantly and cause headaches during lab work.",
        "facility_id": 4,
        "reporter_name": "Alya Putri",
        "priority": "Medium",
        "status": "Resolved",
        "created_at": "2026-11-08T11:00:00+00:00",
        "updated_at": "2026-11-09T16:30:00+00:00",
    },
    7: {
        "id": 7,
        "title": "Keyboard keys stuck at workstation",
        "description": (
            "Several keys on the keyboard at workstation 12 stay pressed and type twice."
        ),
        "facility_id": 2,
        "reporter_name": "Alya Putri",
        "priority": "Low",
        "status": "Resolved",
        "created_at": "2026-11-05T08:50:00+00:00",
        "updated_at": "2026-11-06T14:10:00+00:00",
    },
    8: {
        "id": 8,
        "title": "Door lock jammed",
        "description": (
            "The lab door lock jams and the key cannot turn, so the room cannot be locked."
        ),
        "facility_id": 5,
        "reporter_name": "Alya Putri",
        "priority": "High",
        "status": "Open",
        "created_at": "2026-11-21T07:45:00+00:00",
        "updated_at": "2026-11-21T07:45:00+00:00",
    },
    9: {
        "id": 9,
        "title": "Projector remote control missing",
        "description": (
            "The remote control for the ceiling projector has been missing since last week."
        ),
        "facility_id": 1,
        "reporter_name": "Budi Santoso",
        "priority": "Low",
        "status": "Open",
        "created_at": "2026-11-19T10:05:00+00:00",
        "updated_at": "2026-11-19T10:05:00+00:00",
    },
    10: {
        "id": 10,
        "title": "Whiteboard surface damaged",
        "description": (
            "The whiteboard surface is scratched and markers no longer wipe off cleanly."
        ),
        "facility_id": 6,
        "reporter_name": "Citra Dewi",
        "priority": "Medium",
        "status": "Open",
        "created_at": "2026-11-21T12:30:00+00:00",
        "updated_at": "2026-11-21T12:30:00+00:00",
    },
}

SEED_ASSIGNMENTS: dict[int, Record] = {
    1: {
        "id": 1,
        "report_id": 2,
        "technician_id": 1,
        "status": "In Progress",
        "instructions": "Check the AC compressor and refrigerant pressure.",
        "repair_notes": (
            "Checked the unit. Refrigerant pressure is low and a replacement part is on order."
        ),
        "assigned_at": "2026-11-18T10:15:00+00:00",
        "updated_at": "2026-11-19T09:05:00+00:00",
    },
    2: {
        "id": 2,
        "report_id": 3,
        "technician_id": 2,
        "status": "Assigned",
        "instructions": "Inspect the socket and the wiring behind it before reuse.",
        "repair_notes": None,
        "assigned_at": "2026-11-17T09:00:00+00:00",
        "updated_at": "2026-11-17T09:00:00+00:00",
    },
    3: {
        "id": 3,
        "report_id": 4,
        "technician_id": 3,
        "status": "Assigned",
        "instructions": None,
        "repair_notes": None,
        "assigned_at": "2026-11-15T08:20:00+00:00",
        "updated_at": "2026-11-15T08:20:00+00:00",
    },
    4: {
        "id": 4,
        "report_id": 5,
        "technician_id": 5,
        "status": "Completed",
        "instructions": None,
        "repair_notes": "Replaced the cracked chair with a spare from storage.",
        "assigned_at": "2026-11-12T11:00:00+00:00",
        "updated_at": "2026-11-13T15:40:00+00:00",
    },
    5: {
        "id": 5,
        "report_id": 6,
        "technician_id": 2,
        "status": "Completed",
        "instructions": "Check the ballast and replace faulty tubes.",
        "repair_notes": "Replaced two faulty tubes and one ballast. Lights are stable.",
        "assigned_at": "2026-11-08T13:00:00+00:00",
        "updated_at": "2026-11-09T16:30:00+00:00",
    },
    6: {
        "id": 6,
        "report_id": 7,
        "technician_id": 3,
        "status": "Completed",
        "instructions": None,
        "repair_notes": "Swapped the keyboard with a new unit and tested every key.",
        "assigned_at": "2026-11-05T10:30:00+00:00",
        "updated_at": "2026-11-06T14:10:00+00:00",
    },
}

# ---------------------------------------------------------------------------
# Live state (module-level dicts so every importer shares the same objects).
# ---------------------------------------------------------------------------

facilities: dict[int, Record] = {}
reports: dict[int, Record] = {}
technicians: dict[int, Record] = {}
assignments: dict[int, Record] = {}

_TABLES: dict[str, dict[int, Record]] = {
    "facilities": facilities,
    "reports": reports,
    "technicians": technicians,
    "assignments": assignments,
}
_SEEDS: dict[str, dict[int, Record]] = {
    "facilities": SEED_FACILITIES,
    "reports": SEED_REPORTS,
    "technicians": SEED_TECHNICIANS,
    "assignments": SEED_ASSIGNMENTS,
}
_next_ids: dict[str, int] = {}

lock = threading.RLock()


def reset_store() -> None:
    """Restore all tables to a fresh copy of the seed data (startup and tests)."""
    with lock:
        for name, table in _TABLES.items():
            table.clear()
            table.update(copy.deepcopy(_SEEDS[name]))
            _next_ids[name] = max(table, default=0) + 1


def next_id(entity: str) -> int:
    """Return a unique server-generated id. Safe under concurrent requests."""
    with lock:
        value = _next_ids[entity]
        _next_ids[entity] = value + 1
        return value


reset_store()
