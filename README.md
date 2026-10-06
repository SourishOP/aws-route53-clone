# Route 53 Clone

A functional clone of the **AWS Route 53** web console, built to recreate the Route 53
user experience and core DNS-management workflows with persistent storage and a real
backend API. DNS resolution itself is mocked — the focus is faithful UI/UX plus full
CRUD on Hosted Zones and DNS Records.

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Frontend   | Next.js 16 (App Router) + TypeScript |
| Backend    | FastAPI (Python)                     |
| Database   | SQLite (via SQLAlchemy)              |
| Auth       | Mocked, signed-cookie sessions       |

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Architecture Overview](#architecture-overview)
5. [Database Schema](#database-schema)
6. [API Overview](#api-overview)
7. [Default Credentials & Seed Data](#default-credentials--seed-data)

---

## Features

### Authentication
- Mocked login / logout
- Session persistence via an HttpOnly signed cookie (survives page reloads)
- Route guard that redirects unauthenticated users to the sign-in page

### Hosted Zones (full CRUD)
- View, search, create, edit, and delete hosted zones
- Public / Private zone types
- New zones automatically receive starter **NS** and **SOA** records (as Route 53 does)
- Sortable, paginated data table with live search

### DNS Records (full CRUD)
- View, search, filter, create, edit, and delete records within a zone
- Supported record types: **A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA**
- Filter by record type, search by name/value, sort, and paginate

### Route 53 Experience
- AWS Cloudscape-styled UI: dark top navigation, left service sidebar, breadcrumbs
- Cloudscape-style data tables, forms, modals, tabs, and flashbar notifications
- Search, filters, pagination, and confirmation modals throughout

### Mocked Sections (placeholders)
- Dashboard, Traffic policies, Health checks, Resolver, Profiles — each a "Coming soon" page

---

## Project Structure

```
Scalar/
├── backend/                  # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── main.py           # App entrypoint, CORS, startup/seed
│   │   ├── database.py       # SQLAlchemy engine/session
│   │   ├── models.py         # ORM models (User, HostedZone, DnsRecord)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # Signed-cookie session helpers + dependency
│   │   ├── utils.py          # Zone-id generator
│   │   ├── seed.py           # Default user + sample data
│   │   └── routers/
│   │       ├── auth.py       # /api/auth/*
│   │       ├── hosted_zones.py  # /api/hosted-zones*
│   │       └── records.py       # /api/hosted-zones/{id}/records*
│   └── requirements.txt
│
└── frontend/                 # Next.js (App Router) + TypeScript
    ├── src/
    │   ├── app/              # Routes (login, hosted-zones, placeholders)
    │   ├── components/       # Shell, TopNav, Sidebar, modals, table helpers
    │   └── lib/              # API client + shared types
    ├── next.config.mjs       # Proxies /api/* to the backend
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- **Node.js** 18+ (tested on Node 24)
- **Python** 3.11+ (tested on Python 3.13)

### 1. Backend (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API (http://127.0.0.1:8000)
uvicorn app.main:app --reload --port 8000
```

On first start the backend creates `route53.db`, seeds a default user, and adds
three sample hosted zones. Interactive API docs are available at
`http://127.0.0.1:8000/docs`.

### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server (http://localhost:3000)
npm run dev
```

The frontend proxies all `/api/*` requests to the backend at
`http://127.0.0.1:8000`, so both servers should be running. Open
`http://localhost:3000` and sign in with the demo credentials below.

To build for production:

```bash
npm run build
npm run start
```

---

## Architecture Overview

```
┌──────────────────────┐        /api/* (proxy)        ┌────────────────────────┐
│   Next.js frontend   │  ─────────────────────────▶  │     FastAPI backend     │
│  (App Router, TS)    │       HttpOnly cookie         │                         │
│                      │                               │  Routers → SQLAlchemy   │
│  - AuthProvider      │  ◀─────────────────────────   │        ORM              │
│  - FlashbarProvider  │        JSON responses         │           │             │
│  - Cloudscape UI     │                               │           ▼             │
└──────────────────────┘                               │       SQLite (route53.db)│
                                                        └────────────────────────┘
```

### Frontend
- **App Router** with route-level pages under `src/app`.
- **`AuthProvider`** calls `/api/auth/me` on load to restore the session, and guards
  routes (redirecting to `/login` when unauthenticated).
- **`FlashbarProvider`** renders AWS-style flashbar notifications for success/error.
- **`lib/api.ts`** is a thin typed `fetch` wrapper that always sends credentials
  (cookies) and normalizes error messages.
- **`next.config.mjs`** rewrites `/api/*` to the backend, so the browser treats API
  calls as same-origin (cookies flow cleanly, no CORS issues in the browser).

### Backend
- **FastAPI** app with three routers (auth, hosted zones, records).
- **SQLAlchemy ORM** models with a one-to-many relationship (zone → records) and
  cascading delete.
- **Mocked auth**: on login a signed cookie (`itsdangerous`) stores the user id;
  protected endpoints depend on `get_current_user`, which validates the cookie.
- **Seed-on-startup** ensures the app is immediately usable with sample data.
- **CORS** is enabled for `localhost:3000` for direct API access during development.

---

## Database Schema

SQLite database `route53.db`, three tables.

### `users`
| Column          | Type     | Notes                               |
| --------------- | -------- | ----------------------------------- |
| `id`            | TEXT PK  | UUID                                |
| `username`      | TEXT     | Unique, indexed                     |
| `password_hash` | TEXT     | PBKDF2 (passlib)                    |
| `account_id`    | TEXT     | Mocked AWS account id               |
| `created_at`    | DATETIME |                                     |

### `hosted_zones`
| Column       | Type     | Notes                                      |
| ------------ | -------- | ------------------------------------------ |
| `id`         | TEXT PK  | UUID (internal id used in URLs)            |
| `zone_id`    | TEXT     | Route 53-style id, e.g. `Z1D633PJN98FT9`   |
| `name`       | TEXT     | Domain name, normalized with trailing dot  |
| `type`       | TEXT     | `Public` or `Private`                      |
| `comment`    | TEXT     | Description                                |
| `private`    | BOOLEAN  | Derived from `type`                        |
| `created_at` | DATETIME |                                            |
| `updated_at` | DATETIME |                                            |

### `dns_records`
| Column           | Type     | Notes                                            |
| ---------------- | -------- | ------------------------------------------------ |
| `id`             | TEXT PK  | UUID                                             |
| `zone_id`        | TEXT FK  | → `hosted_zones.id` (cascade delete)             |
| `name`           | TEXT     | Record name                                      |
| `type`           | TEXT     | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA       |
| `ttl`            | INTEGER  | Seconds                                          |
| `value`          | TEXT     | One or more values (newline-separated)           |
| `routing_policy` | TEXT     | Defaults to `Simple`                             |
| `created_at`     | DATETIME |                                                  |
| `updated_at`     | DATETIME |                                                  |

**Relationship:** one `HostedZone` has many `DnsRecord`s. Deleting a zone cascades
to delete all of its records.

---

## API Overview

Base URL: `http://127.0.0.1:8000` (or `/api/*` through the frontend proxy).
All endpoints except `login` require a valid session cookie.

### Auth
| Method | Path               | Description                        |
| ------ | ------------------ | ---------------------------------- |
| POST   | `/api/auth/login`  | Log in, sets session cookie        |
| POST   | `/api/auth/logout` | Log out, clears session cookie     |
| GET    | `/api/auth/me`     | Current user (restores session)    |

### Hosted Zones
| Method | Path                        | Description                               |
| ------ | --------------------------- | ----------------------------------------- |
| GET    | `/api/hosted-zones`         | List (query: `search`, `page`, `page_size`, `sort`, `order`) |
| POST   | `/api/hosted-zones`         | Create a hosted zone                      |
| GET    | `/api/hosted-zones/{id}`    | Get a single zone                         |
| PUT    | `/api/hosted-zones/{id}`    | Update (description)                       |
| DELETE | `/api/hosted-zones/{id}`    | Delete a zone (and its records)           |

### DNS Records (scoped to a zone)
| Method | Path                                                | Description                                   |
| ------ | --------------------------------------------------- | --------------------------------------------- |
| GET    | `/api/hosted-zones/{zone_id}/records`               | List (query: `search`, `type`, `page`, `page_size`, `sort`, `order`) |
| POST   | `/api/hosted-zones/{zone_id}/records`               | Create a record                               |
| GET    | `/api/hosted-zones/{zone_id}/records/{record_id}`   | Get a single record                           |
| PUT    | `/api/hosted-zones/{zone_id}/records/{record_id}`   | Update a record                               |
| DELETE | `/api/hosted-zones/{zone_id}/records/{record_id}`   | Delete a record                               |

### Health
| Method | Path          | Description     |
| ------ | ------------- | --------------- |
| GET    | `/api/health` | Liveness check  |

**Paginated list response shape:**
```json
{
  "items": [ /* ... */ ],
  "total": 42,
  "page": 1,
  "page_size": 10
}
```

Full interactive documentation (OpenAPI/Swagger) is served at
`http://127.0.0.1:8000/docs`.

---

## Default Credentials & Seed Data

**Login:**
- Username: `admin`
- Password: `admin`

(Prefilled on the sign-in page for convenience.)

**Seeded hosted zones:** `example.com.`, `myapp.io.`, `internal.local.` — each with
a handful of sample records (NS, A, CNAME, MX) to demonstrate the record views.
