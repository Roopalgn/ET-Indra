"""
INDRA Backend — FastAPI Application
India's National Disruption Response Architecture

Phase 1 & 2 endpoints:
  GET /health          → system keep-alive status (no cold-start DB hit)
  GET /api/dsi         → current Disruption Signal Index (live/synthetic/scenario)
  GET /api/scenarios   → get active scenario status & description
  POST /api/scenarios  → switch active scenario (baseline, A, B, C)
"""
import asyncio
import time
from contextlib import asynccontextmanager
from typing import Optional


from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import settings
from models import (
    DSIResponse,
    HealthResponse,
    ScenarioRequest,
    ScenarioResponse,
    CopilotRequest,
    CopilotResponse,
    HistoryResponse,
    SPRResponse,
)
from copilot import generate_procurement_brief
from history_spr import get_dsi_history, get_spr_status
from signal_engine import (
    get_current_dsi,
    get_active_scenario,
    get_scenario_description,
    set_active_scenario,
    aisstream_loop,
)
from database import engine, AsyncSessionLocal, Base, get_db

from db_models import DSISnapshotRow

_start_time = time.time()
scheduler = AsyncIOScheduler()
_ais_task: asyncio.Task | None = None


async def snapshot_dsi_job():
    """
    APScheduler cron job triggered every 30 minutes.
    Writes current corridor DSI scores to Neon PostgreSQL (`dsi_snapshots` table).
    """
    if AsyncSessionLocal is None:
        return
    try:
        dsi_resp = get_current_dsi()
        async with AsyncSessionLocal() as session:
            for c in dsi_resp.corridors:
                row = DSISnapshotRow(
                    corridor_id=c.corridor_id,
                    dsi=c.dsi,
                    threshold=c.threshold,
                    tanker_density=c.components.tanker_density,
                    geopolitical=c.components.geopolitical,
                    price_deviation=c.components.price_deviation,
                    sanctions=c.components.sanctions,
                    vessel_count=c.vessel_count,
                    data_source=c.data_source,
                    computed_at=c.computed_at,
                )
                session.add(row)
            await session.commit()
    except Exception as e:
        print(f"APScheduler snapshot job failed ({type(e).__name__}): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _ais_task
    # 1. Create DB tables on boot if configured
    if engine is not None:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            print(f"DB init warning: {e}")

    # 2. Start AISstream WebSocket background loop if API key exists
    if settings.AISSTREAM_API_KEY and settings.DATA_MODE in ("live", "mixed"):
        _ais_task = asyncio.create_task(aisstream_loop())
        print("Started AISstream background consumer task.")

    # 3. Start APScheduler for 30-min DSI snapshots
    scheduler.add_job(snapshot_dsi_job, "interval", minutes=30, id="dsi_snapshot_30m")
    scheduler.start()
    print("Started APScheduler 30-minute DSI snapshot cycle.")

    yield

    # Graceful shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)
    if _ais_task and not _ais_task.done():
        _ais_task.cancel()
        try:
            await _ais_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="INDRA API",
    description="India's National Disruption Response Architecture — Energy Supply Chain Intelligence",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse, tags=["System"])
async def health():
    """
    Keep-alive endpoint pinged by UptimeRobot every 5 minutes.
    Returns status without cold-starting the Neon database pool.
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
    """Returns current Disruption Signal Index across all corridors."""
    return get_current_dsi()


@app.get("/api/scenarios", response_model=ScenarioResponse, tags=["Scenarios"])
async def get_scenarios():
    """Returns active scenario mode, description, and resulting DSI values."""
    return ScenarioResponse(
        active_scenario=get_active_scenario(),
        description=get_scenario_description(),
        dsi_response=get_current_dsi(),
    )


@app.post("/api/scenarios", response_model=ScenarioResponse, tags=["Scenarios"])
async def switch_scenario(request: ScenarioRequest):
    """
    Interactive Scenario Engine trigger.
    Allows judges and operators to simulate chokepoint crises in real time:
      - baseline: Normal operation with live Cape tracking
      - A: Strait of Hormuz Closure (Critical DSI 0.95, near-zero vessels)
      - B: Red Sea Blockade & Cape Re-routing (Massive Cape traffic surge)
      - C: Full Geopolitical Crisis (Dual closure + Brent crude $24 spike)
    """
    set_active_scenario(request.scenario)
    return ScenarioResponse(
        active_scenario=get_active_scenario(),
        description=get_scenario_description(),
        dsi_response=get_current_dsi(),
    )


@app.get("/api/history", response_model=HistoryResponse, tags=["History"])
async def get_history_route(db = Depends(get_db)):
    """7-day DSI history per corridor with database snapshots and coherent trend modeling."""
    return await get_dsi_history(db)


@app.get("/api/spr", response_model=SPRResponse, tags=["History"])
async def get_spr_route(scenario: Optional[str] = None):
    """Real-time depletion modeling for India's 3 Strategic Petroleum Reserve (SPR) facilities."""
    return get_spr_status(scenario)



@app.post("/api/copilot", response_model=CopilotResponse, tags=["Copilot"])
async def generate_brief_post(request: Optional[CopilotRequest] = None):
    """
    Generates actionable Strategic Procurement Briefs using Claude Haiku (if configured)
    or high-fidelity zero-cost cached fallback briefs per scenario.
    """
    req = request or CopilotRequest()
    return await generate_procurement_brief(
        scenario=req.scenario,
        corridor_id=req.corridor_id,
        custom_query=req.custom_query,
    )



@app.get("/api/copilot", response_model=CopilotResponse, tags=["Copilot"])
async def generate_brief_get(
    scenario: Optional[str] = None,
    corridor_id: Optional[str] = None,
    custom_query: Optional[str] = None,
):
    """GET endpoint for Procurement Copilot brief generation."""
    return await generate_procurement_brief(
        scenario=scenario,
        corridor_id=corridor_id,
        custom_query=custom_query,
    )

