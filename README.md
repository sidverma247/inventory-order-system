# Inventory & Order Management System

A simplified, full-stack Inventory & Order Management System for managing
**products, customers, orders and inventory**.

- **Backend:** Python + FastAPI + SQLAlchemy
- **Frontend:** React (Vite) + axios, responsive UI
- **Database:** PostgreSQL
- **Containerized:** Docker + Docker Compose
- **Config:** environment variables only — no hard-coded credentials

## 🔗 Live Demo & Links

| | URL |
|---|---|
| **Live App (Frontend)** | https://inventory-order-system-fawn.vercel.app |
| **Live API (Swagger docs)** | https://inventory-backend-epj4.onrender.com/docs |
| **GitHub Repository** | https://github.com/sidverma247/inventory-order-system |
| **Docker Hub (backend image)** | https://hub.docker.com/r/sidv24/inventory-backend |

> The backend runs on Render's free tier and sleeps when idle — the first
> request after inactivity may take ~30–50s to wake up, then it's fast.

---

## Features & Business Rules

| Rule | Where enforced | Behaviour |
|------|----------------|-----------|
| Unique product SKU | `crud.create_product` + DB unique index | Duplicate SKU → `409 Conflict` |
| Unique customer email | `crud.create_customer` + DB unique index | Duplicate email → `409 Conflict` |
| Inventory validation | `crud.create_order` | Order with qty > stock → `400 Bad Request`, nothing committed |
| Automatic stock reduction | `crud.create_order` | On success, product stock is decremented atomically |
| Order total calculation | `crud.create_order` | Total computed by the backend from each product's price × quantity |
| Stock restored on cancel | `crud.delete_order` | Cancelling an order returns its quantities to inventory |
| Non-negative quantity | Pydantic `ge=0` validation | Stock can never be set or driven below zero |
| Concurrency safety | `SELECT ... FOR UPDATE` | Product rows are locked during order placement |

The UI has four tabs:
- **Dashboard** — totals for products / customers / orders and a low-stock list
- **Products** — add, list, **edit** (name/price/stock) and delete
- **Customers** — add, list and delete
- **Orders** — place multi-line orders against live stock, view details, cancel

---

## Architecture

```
┌────────────┐   /products,…     ┌────────────┐      SQL      ┌────────────┐
│  Frontend  │  ───────────────▶ │  Backend   │ ───────────▶  │ PostgreSQL │
│ React +    │   (nginx proxy)   │  FastAPI   │   psycopg3    │            │
│ nginx      │ ◀───────────────  │            │ ◀───────────  │            │
└────────────┘                   └────────────┘               └────────────┘
```

```
inventory-order-system/
├── backend/            FastAPI app, SQLAlchemy models, business logic, tests
│   └── app/
│       ├── main.py     app + CORS + routers + health
│       ├── models.py   Product, Customer, Order, OrderItem
│       ├── schemas.py  Pydantic request/response models
│       ├── crud.py     business rules (unique keys, stock validation/reduction)
│       └── routers/    products, customers, orders
├── frontend/           React (Vite) SPA served by nginx, reverse-proxies the API
├── docker-compose.yml  db + backend + frontend
├── render.yaml         one-click backend + Postgres deploy blueprint
└── .env.example        configuration template
```

---

## Run locally with Docker Compose

Prerequisites: Docker Desktop.

```bash
cp .env.example .env          # adjust credentials/ports if you like
docker compose up -d --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

> The default `.env` in this repo uses host ports **8001** (backend) and
> **5433** (Postgres) to avoid clashing with anything already running on the
> standard ports. Change `BACKEND_PORT` / `POSTGRES_PORT` as needed.

Optional sample data:

```bash
docker compose exec backend python seed.py
```

Stop / reset:

```bash
docker compose down            # stop
docker compose down -v         # stop and wipe the database volume
```

---

## Run the backend tests

The business-rule tests run against in-memory SQLite — no database needed.

```bash
cd backend
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

```
test_unique_sku ............................. PASSED
test_unique_email ........................... PASSED
test_order_reduces_stock .................... PASSED
test_order_rejected_when_insufficient_stock . PASSED
test_cancel_order_restores_stock ............ PASSED
test_stats .................................. PASSED
```

---

## API reference

Resources are exposed at the root path (no prefix), matching the spec.

### Products
| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/products` | — | list |
| POST | `/products` | `{sku, name, description?, price, stock_quantity}` | 409 on duplicate SKU |
| GET | `/products/{id}` | — | |
| PUT | `/products/{id}` | partial product | |
| DELETE | `/products/{id}` | — | |

### Customers
| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/customers` | — | list |
| POST | `/customers` | `{name, email, phone?, address?}` | 409 on duplicate email |
| GET | `/customers/{id}` | — | |
| DELETE | `/customers/{id}` | — | |

### Orders
| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/orders` | — | list with line items |
| POST | `/orders` | `{customer_id, items:[{product_id, quantity}]}` | 400 if any item exceeds stock |
| GET | `/orders/{id}` | — | |
| DELETE | `/orders/{id}` | — | cancel order, restores stock |

### Dashboard
| Method | Path | Notes |
|--------|------|-------|
| GET | `/stats` | totals + low-stock product list |

Example — place an order:

```bash
curl -X POST http://localhost:8001/orders \
  -H 'Content-Type: application/json' \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":3}]}'
```

---

## Configuration (environment variables)

| Variable | Used by | Default | Purpose |
|----------|---------|---------|---------|
| `DATABASE_URL` | backend | `postgresql+psycopg://postgres:postgres@db:5432/inventory` | DB connection. Also accepts `postgres://` / `postgresql://` URLs from Render/Railway. |
| `CORS_ORIGINS` | backend | `*` | comma-separated allowed origins |
| `PORT` | backend | `8000` | port to bind (PaaS sets this) |
| `POSTGRES_USER/PASSWORD/DB` | db | see `.env.example` | database bootstrap |
| `BACKEND_URL` | frontend (nginx) | `http://backend:8000` | upstream the SPA proxies API paths to |
| `LOW_STOCK_THRESHOLD` | backend | `10` | dashboard low-stock cutoff |
| `VITE_API_BASE_URL` | frontend build | empty | absolute API URL when frontend & backend are on different hosts |

No secret is committed; `.env` is git-ignored.

---

## Deployment (free hosting)

The app is designed to deploy to free tiers. Two clean options:

### Option A — Render (backend + Postgres) + Vercel (frontend)

**Backend + database (Render):**
1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → select the repo. `render.yaml`
   provisions a free Postgres database and the Dockerized backend, wiring
   `DATABASE_URL` automatically.
3. After deploy, note the backend URL, e.g. `https://inventory-backend.onrender.com`.
4. Set the backend's `CORS_ORIGINS` env var to your frontend origin (below).

**Frontend (Vercel or Netlify):**
1. New project → import the repo → set **Root Directory** to `frontend`.
2. Build command `npm run build`, output dir `dist`.
3. Add env var `VITE_API_BASE_URL=https://inventory-backend.onrender.com`.
4. Deploy → you get a public URL, e.g. `https://inventory-ui.vercel.app`.

### Option B — Railway (everything)
Create a project, add a **PostgreSQL** plugin, then two services from this repo
(`backend/` and `frontend/`). Railway injects `DATABASE_URL`; set the
frontend's `BACKEND_URL` to the backend's internal URL (or build with
`VITE_API_BASE_URL`).

---

## Publishing the Docker images

```bash
# Backend
docker build -t <your-dockerhub-user>/inventory-backend:latest ./backend
docker push <your-dockerhub-user>/inventory-backend:latest

# Frontend
docker build -t <your-dockerhub-user>/inventory-frontend:latest ./frontend
docker push <your-dockerhub-user>/inventory-frontend:latest
```

---

## Submission checklist

- [ ] GitHub repository link
- [ ] Docker image link(s) (Docker Hub / GHCR)
- [ ] Live frontend URL
- [ ] Live backend URL (`/docs`)

See **DEPLOYMENT.md** for the exact commands to fill these in.
