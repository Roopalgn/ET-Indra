"""
INDRA Backend — Pydantic Models (API contracts)
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class ComponentScores(BaseModel):
    tanker_density: float      # 0.0–1.0
    geopolitical: float        # 0.0–1.0
    price_deviation: float     # 0.0–1.0
    sanctions: float           # 0.0–1.0


class CorridorDSI(BaseModel):
    corridor_id: str
    name: str
    dsi: float                                                    # 0.0–1.0 weighted composite
    threshold: Literal["normal", "elevated", "high", "critical"]  # DSI level label
    components: ComponentScores
    vessel_count: int                                             # vessels seen in window
    data_source: Literal["live", "synthetic"]                     # transparency badge
    computed_at: datetime


class DSIResponse(BaseModel):
    corridors: list[CorridorDSI]
    next_update_seconds: int       # seconds until next scheduled computation
    system_mode: Literal["live", "synthetic", "mixed"]
    api_version: str = "1.0"


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    environment: str
    data_mode: str
    db_connected: bool
    uptime_seconds: float
