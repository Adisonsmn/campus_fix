# CampusFix

CampusFix is a responsive Campus Facility Maintenance System. Students and staff report
facility problems, administrators manage facilities and assign technicians, and
technicians update repair progress.

> Course project (Cloud Computing, Tugas 9). See [Status](#status).

## Roles

| Role               | Route prefix  | What they do                                          |
| ------------------ | ------------- | ----------------------------------------------------- |
| Student / Staff    | `/student`    | Submit and track facility reports                     |
| Administrator      | `/admin`      | Manage facilities, technicians, reports, assignments  |
| Technician         | `/technician` | View assigned work and update repair progress         |

The role is chosen on the landing page and comes from the route namespace. **This is a demo
selector, not authentication.** There are no accounts or passwords.

## Entities

Facility, Report, Technician, Assignment, with relationships validated in the backend.

- Report status: `Open` -> `Assigned` -> `In Progress` -> `Resolved`
- Assignment status: `Assigned` -> `In Progress` -> `Completed`
- Completing an assignment resolves its report.

## Tech stack

| Layer    | Technology                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form, Zod, Lucide |
| Backend  | Python, FastAPI, Pydantic, Uvicorn                                                |
| Data     | Hardcoded in-memory Python dictionaries (**no database**)                         |
| Deploy   | Frontend on Azure Static Web Apps, backend on an Azure VM (Nginx + HTTPS)         |

The frontend talks to the backend over a JSON REST API under `/api`.

## Repository layout

```
backend/    FastAPI app (app/), tests (tests/)
frontend/   React app (src/app, src/components, src/features, src/lib)
```

## Getting started

Prerequisites: Node.js 24 with npm 11.6.2 (newer npm 11 releases reject the lockfile in
`npm ci`) and Python 3.11+.

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env              # optional; defaults work locally
uvicorn app.main:app --reload --port 8000
```

- Health check: <http://localhost:8000/api/health>
- Swagger UI: <http://localhost:8000/docs>

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local        # optional; defaults to http://localhost:8000
npm run dev
```

The app runs at <http://localhost:5173>.

## Configuration

| Variable            | Where    | Purpose                                                              |
| ------------------- | -------- | -------------------------------------------------------------------- |
| `CORS_ORIGINS`      | backend  | Comma-separated allowed frontend origins (no wildcard)               |
| `VITE_API_BASE_URL` | frontend | Origin of the backend, without `/api`. Public: bundled into the build |

Never put secrets in `VITE_` variables. Real `.env` files are git-ignored; only
`.env.example` files are committed.

## Checks

```powershell
# backend (from backend/)
ruff check .
ruff format --check .
pytest

# frontend (from frontend/)
npm run lint
npm run build
npm run format:check
```

## Deployment (Azure)

```
Browser --HTTPS--> Azure Static Web Apps (React build)
Browser --HTTPS--> Azure VM: Nginx :443 --> Uvicorn 127.0.0.1:8000 (one worker)
```

**Frontend.** A push to `main` runs the GitHub Actions workflow in `.github/workflows/`,
which builds `frontend/` with `VITE_API_BASE_URL` set and uploads `frontend/dist`.
`frontend/public/staticwebapp.config.json` makes deep links fall back to `index.html`.
The deployment token is stored as a GitHub Actions secret.

**Backend.** Ubuntu VM with Python 3.12 in `backend/.venv`:

- systemd unit `campusfix` runs Uvicorn on `127.0.0.1:8000`
- `/etc/campusfix.env` sets `CORS_ORIGINS` to the Static Web Apps URL
- Nginx redirects port 80 to 443 and proxies 443 to Uvicorn
- Certbot (Let's Encrypt) issues and renews the certificate
- Network Security Group: 22, 80 and 443 only; port 8000 stays closed

Update the backend on the VM (this resets the data):

```bash
cd ~/campus_fix && git pull
backend/.venv/bin/pip install -r backend/requirements.txt
sudo systemctl restart campusfix
```

The deployment is a temporary course demo; delete the Azure resource group afterwards.

## Important notes

- **Data is not persistent.** Every restart or redeploy resets the backend to its seed data.
- **Run a single worker.** Each Uvicorn worker would hold its own copy of the in-memory
  data, so do not pass `--workers`. Do not use `--reload` in deployment.
- **No real access control.** Because roles are a demo selector, restrict who can reach the
  write endpoints when deploying. CORS is not access control.

## Status

| Area       | State                                         |
| ---------- | --------------------------------------------- |
| Foundation | Done                                          |
| Facility   | Full CRUD (API and admin UI)                  |
| Report     | Full CRUD (API, student pages, admin pages)   |
| Technician | Full CRUD (API and admin UI)                  |
| Assignment | Full CRUD (API, admin and technician pages)   |
| Dashboards | Student, administrator and technician         |
| Deployment | Azure (Static Web Apps and VM)                |

## API

All endpoints are prefixed with `/api`. Interactive documentation is available at `/docs`
while the backend is running.

Currently available:

| Method | Path                    | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/health`           | Health check        |
| GET    | `/api/facilities`       | List facilities     |
| POST   | `/api/facilities`       | Create a facility   |
| GET    | `/api/facilities/{id}`  | Get a facility      |
| PUT    | `/api/facilities/{id}`  | Update a facility   |
| DELETE | `/api/facilities/{id}`  | Delete a facility   |
| GET    | `/api/reports`          | List reports        |
| POST   | `/api/reports`          | Create a report     |
| GET    | `/api/reports/{id}`     | Get a report        |
| PUT    | `/api/reports/{id}`     | Update an Open report |
| DELETE | `/api/reports/{id}`     | Delete an Open report |
| GET    | `/api/assignments`      | List assignments    |
| POST   | `/api/assignments`      | Create an assignment |
| GET    | `/api/assignments/{id}` | Get an assignment   |
| PUT    | `/api/assignments/{id}` | Update an assignment |
| DELETE | `/api/assignments/{id}` | Delete an assignment |
| GET    | `/api/technicians`      | List technicians    |
| POST   | `/api/technicians`      | Create a technician |
| GET    | `/api/technicians/{id}` | Get a technician    |
| PUT    | `/api/technicians/{id}` | Update a technician |
| DELETE | `/api/technicians/{id}` | Delete a technician |

Errors use `404` (not found), `409` (conflict with related data) and `422` (validation).
