"""FastAPI application entrypoint."""
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from .config import get_settings
from .database import Base, engine
from .routers import customers, orders, products, stats

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


def init_db(retries: int = 10, delay: float = 3.0) -> None:
    """Create tables on startup, waiting for the database to accept connections.

    On managed hosts (Render/Railway) the web service can boot a moment before
    the database is reachable, so we retry instead of crash-looping.
    For production this would be handled by Alembic migrations; create_all keeps
    the assessment self-contained.
    """
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError as exc:
            if attempt == retries:
                raise
            logger.warning("DB not ready (attempt %s/%s): %s", attempt, retries, exc)
            time.sleep(delay)


init_db()

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(stats.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root():
    return {"service": settings.app_name, "docs": "/docs", "health": "/health"}
