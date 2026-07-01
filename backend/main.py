"""
INDRA Backend — FastAPI Application
India's National Disruption Response Architecture

Phase 1 endpoints:
  GET /health      → system status
  GET /api/dsi     → corridor DSI values (synthetic)

Phase 2+ endpoints (stubs added, implemented later):
  GET /api/history     → 7-day DSI history
  POST /api/scenarios  → scenario A/B/C simulation
  POST /api/copilot    → procurement brief (Claude Haiku)
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import HealthResponse, DSIResponse
from signal_engine import get_current_dsi
from database import engine

# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------
_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Phase 2: start APScheduler, AISstream consumer here
    yield
    # Phase 2: graceful shutdown here


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="INDRA API",
    description="India's National Disruption Response Architecture — Energy Supply Chain Intelligence",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse, tags=["System"])
async def health():
    """
    Keep-alive endpoint.
    Pinged every 5 minutes by UptimeRobot to prevent Render spin-down.
    Returns system status without any DB query (avoids Neon cold-start on health check).
    """
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        data_mode=settings.DATA_MODE,
        db_connected=engine is not None,
        uptime_seconds=round(time.time() - _start_time, 1),
    )


@app.get("/api/dsi", response_model=DSIResponse, tags=["DSI"])
async def get_dsi():
    """
    Returns current Disruption Signal Index for all three corridors.

    Phase 1: Synthetic time-varying values based on March 2026 crisis baseline.
    Phase 2: Live AISstream + GDELT + EIA + OpenSanctions feeds.

    DSI weights (demonstration configuration, adjustable):
      tanker_density: 40%  |  geopolitical: 35%  |  price: 15%  |  sanctions: 10%

    Poll interval: every 30 seconds from the frontend.
    Data freshness: recomputed on every request in Phase 1.
    """
    return get_current_dsi()


# ---------------------------------------------------------------------------
# Phase 2+ stubs (return 501 until implemented)
# ---------------------------------------------------------------------------

@app.get("/api/history", tags=["History"], include_in_schema=True)
async def get_history():
    """7-day DSI history per corridor. Implemented in Phase 4."""
    from fastapi import HTTPException
    raise HTTPException(status_code=501, detail="Not implemented — Phase 4")


@app.post("/api/scenarios", tags=["Scenarios"], include_in_schema=True)
async def run_scenario():
    """Scenario A/B/C simulation. Implemented in Phase 2."""
    from fastapi import HTTPException
    raise HTTPException(status_code=501, detail="Not implemented — Phase 2")


@app.post("/api/copilot", tags=["Copilot"], include_in_schema=True)
async def generate_brief():
    """Procurement Copilot brief. Implemented in Phase 3."""
    from fastapi import HTTPException
    raise HTTPException(status_code=501, detail="Not implemented — Phase 3")
