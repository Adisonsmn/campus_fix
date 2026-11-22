# CampusFix backend

FastAPI REST API. All data lives in Python dictionaries in `app/store.py`. There is no
database and nothing is written to disk. **Restarting or redeploying the server resets
every change back to the seed data.**

## Setup (Python 3.11+)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
```

## Run

```powershell
uvicorn app.main:app --reload --port 8000
```

- Health: <http://localhost:8000/api/health>
- Swagger UI: <http://localhost:8000/docs>

Always run **one worker** (do not pass `--workers`). Each worker would hold its own copy
of the in-memory data. Do not use `--reload` in deployment.

## Configuration

| Variable       | Default                                       | Purpose                                                           |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed frontend origins. Wildcards are rejected. |

See `.env.example`. CORS is not access control: demo roles are not authentication, so
restrict who can reach the write endpoints when deploying (PRD section 3).

## Checks

```powershell
ruff check .
ruff format --check .
pytest
```

Tests reset the store before and after every test, so they never affect each other.

## Layout

```
app/
  main.py        app factory, CORS, router wiring
  config.py      environment settings
  errors.py      NotFoundError (404), ConflictError (409), 422 and 500 handlers
  schemas.py     Pydantic request/response models and status enums
  store.py       in-memory dicts, seed data, id generation, lock
  routers/       one router per resource (health now; entities in later phases)
tests/
```

Entity endpoints (facilities, reports, technicians, assignments) are added slice by slice.
Multi-step writes must hold `store.lock` and validate everything before changing data.
