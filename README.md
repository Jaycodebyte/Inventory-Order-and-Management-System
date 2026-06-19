# Inventory & Order Management System

A production-ready, full-stack Inventory & Order Management System built with **FastAPI (Python)**, **React (Vite)**, and **PostgreSQL**. Fully containerized with Docker Compose.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                 │
│  React 19 + Vite + Tailwind CSS + Nginx              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Dashboard│ │ Products │ │Customers │ │  Orders │ │
│  │   Page   │ │   Page   │ │   Page   │ │   Page  │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Axios)
                       ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Render / Railway)               │
│  FastAPI + SQLAlchemy + Alembic + Pydantic            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Products │ │Customers │ │  Orders  │ │Inventory│ │
│  │  Router  │ │  Router  │ │  Router  │ │ Service │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database (Aiven / Neon)       │
│  Tables: products, customers, orders, order_items     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, React Hook Form, Lucide React |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2, Gunicorn + Uvicorn |
| **Database** | PostgreSQL 15 |
| **Infra** | Docker Compose, Nginx |

## Features

### Dashboard
- Real-time stats cards (Total Products, Customers, Orders, Low-Stock Alerts)
- Low-stock product table with instant visibility

### Product Management
- Full CRUD with modal forms
- Unique SKU enforcement
- Search, sort, and pagination
- Positive price/quantity validation
- Protected deletion (blocks if product has order history)

### Customer Management
- Add, view, search, delete customers
- Duplicate email detection
- Email format validation via regex
- Protected deletion (blocks if customer has placed orders)

### Order Management
- Multi-item order creation with stock validation
- Real-time available stock display
- Auto-calculated order total
- Inventory decremented atomically on order placement
- Row-level locking to prevent race conditions
- Stock restoration on order deletion
- Detailed invoice view

### UI/UX
- Responsive SaaS-style design (mobile-friendly)
- Toast notifications (success / error / warning)
- Loading skeletons and shimmer animations
- Confirm dialogs for destructive actions
- 404 and empty-state pages

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15 (or Docker)
- Docker & Docker Compose (optional)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd inventory-order-management-system
```

Create environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python -m app.utils.seed
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

### 4. Docker Setup (One-Command)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Environment Variables

### Root `.env` (shared)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `inventory_db` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `change-me` | Database password |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `SECRET_KEY` | `change-this...` | App secret key |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | CORS whitelist (JSON array) |
| `VITE_API_URL` | `http://localhost:8000/api` | Frontend API target |

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | No* | Full connection string (overrides POSTGRES_*) |
| `POSTGRES_*` | Yes* | Individual DB connection params |
| `SECRET_KEY` | Yes | App secret for security |
| `BACKEND_CORS_ORIGINS` | Yes | CORS origins as JSON array |

\* Either `DATABASE_URL` or the individual `POSTGRES_*` variables must be set.

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API URL (e.g. `http://localhost:8000/api`) |

> **IMPORTANT:** `BACKEND_CORS_ORIGINS` must be a valid **JSON array string** (e.g. `["http://localhost:3000"]`), not comma-separated. This is required by pydantic-settings v2+.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health + DB status |
| `GET` | `/api/dashboard/stats` | Aggregated counts + low stock list |
| **Products** | | |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products` | List products (search, sort, paginate) |
| `GET` | `/api/products/{id}` | Get product by ID |
| `PUT` | `/api/products/{id}` | Update product |
| `DELETE` | `/api/products/{id}` | Delete product |
| **Customers** | | |
| `POST` | `/api/customers` | Create customer |
| `GET` | `/api/customers` | List customers (search, paginate) |
| `GET` | `/api/customers/{id}` | Get customer by ID |
| `DELETE` | `/api/customers/{id}` | Delete customer |
| **Orders** | | |
| `POST` | `/api/orders` | Place order (auto-decrements stock) |
| `GET` | `/api/orders` | List orders |
| `GET` | `/api/orders/{id}` | Get order with invoice details |
| `DELETE` | `/api/orders/{id}` | Delete order (restores stock) |

## Project Structure

```
inventory-order-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/              # ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic (place_order)
│   │   └── utils/               # Seed data script
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   ├── Procfile                 # Render/Railway start command
│   ├── runtime.txt              # Python version for Render
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, Modal, ConfirmDialog, Navbar, Sidebar
│   │   ├── context/             # Toast context + provider
│   │   ├── pages/               # Dashboard, Products, Customers, Orders
│   │   └── services/            # Axios API client
│   ├── Dockerfile               # Multi-stage build (Nginx)
│   ├── nginx.conf               # SPA routing config
│   └── vercel.json              # Vercel deployment config
├── docker-compose.yml           # Full-stack orchestration
├── .env.example                 # Environment template
├── .gitignore
└── README.md
```

## Docker Images

Pre-built images are available on Docker Hub:

| Image | Pull Command |
|---|---|
| **Backend** | `docker pull jay00000/inventory-backend:latest` |
| **Frontend** | `docker pull jay00000/inventory-frontend:latest` |

The `docker-compose.yml` references these images by default. To build locally instead, comment out the `image:` lines.

## Deployment Guide

### Frontend → Vercel

1. Push code to GitHub.
2. In Vercel, import the repo.
3. Set **Root Directory** to `frontend/`.
4. Add environment variable:
   - `VITE_API_URL` → `https://your-backend.onrender.com/api`
5. Deploy (Vercel auto-detects Vite).

Alternatively, use the Vercel CLI:

```bash
cd frontend
vercel --prod
vercel env add VITE_API_URL
```

### Backend → Render

1. Create a **PostgreSQL** database on Render (free tier).
2. Create a **Web Service** pointing to the repo.
3. Set:
   - **Root Directory**: `backend/`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `sh -c "alembic upgrade head && python -m app.utils.seed && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:\$PORT"`
4. Add environment variables (from `backend/.env.example`), including the `DATABASE_URL` from your Render Postgres instance.
5. Deploy.

> **Note for Railway:** Use the `Procfile` included in `backend/` — Railway reads it automatically.

### GitHub

Before your first push, ensure:

```bash
# Verify no secrets are tracked
git status

# The .gitignore already excludes:
#   - .env files
#   - __pycache__/
#   - node_modules/
#   - .venv/

# Stage and commit
git add .
git commit -m "Initial commit: production-ready Inventory & Order Management System"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Production Checklist

- [x] `SECRET_KEY` changed from default
- [x] `BACKEND_CORS_ORIGINS` set to your frontend domain
- [x] `DATABASE_URL` uses strong credentials
- [x] Docker images optimized (multi-stage, slim base)
- [x] Alembic migrations manage schema
- [x] CORS configured with proper origins
- [x] `.env` files excluded via `.gitignore`
- [ ] Custom domain + HTTPS configured (Vercel/Render)
- [ ] Database backups scheduled (Render/Aiven)
- [ ] Rate limiting considered for production API

## License

MIT
