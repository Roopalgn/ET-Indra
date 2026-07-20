"""
INDRA Backend — Signal Engine (Phase 2: Live AISstream Consumer & Interactive Scenario Engine)

DSI = Disruption Signal Index, a weighted composite per corridor:
  tanker_density:  40%  — vessel density vs. baseline
  geopolitical:    35%  — GDELT sentiment + event intensity
  price_deviation: 15%  — EIA Brent price deviation from 90-day MA
  sanctions:       10%  — flagged sovereign entities in corridor

WEIGHTS NOTE: These are demonstration weights, configurable.
              They encode current MoPNG/EIA relative signal strength.
              Presented with tooltip in UI: "Demonstration weighting — adjustable."

Phase 2 capabilities:
  - AISstream WebSocket consumer background loop tracking unique MMSIs.
  - Verified decision threshold: Cape of Good Hope runs LIVE (>= 5 vessels/hr), while Hormuz & Red Sea run SYNTHETIC.
  - Interactive Scenario Engine: A (Strait Closure), B (Red Sea Blockade & Cape Re-routing), C (Full Geopolitical Crisis).
"""
import asyncio
import json
import math
import random
import time
from datetime import datetime, timezone
from typing import Literal
import websockets

from config import settings
from models import CorridorDSI, ComponentScores, DSIResponse

# ---------------------------------------------------------------------------
# Corridor definitions & Base Random Walk State
# ---------------------------------------------------------------------------
CORRIDORS = {
    "hormuz": {
        "name": "Strait of Hormuz",
        "base": {
            # Seeded from real March 4-11 2026 crisis levels
            "tanker_density": 0.68,
            "geopolitical": 0.78,
            "price_deviation": 0.62,
            "sanctions": 0.71,
        },
    },
    "red_sea": {
        "name": "Red Sea / Bab-el-Mandeb",
        "base": {
            "tanker_density": 0.82,
            "geopolitical": 0.91,
            "price_deviation": 0.74,
            "sanctions": 0.60,
        },
    },
    "cape": {
        "name": "Cape of Good Hope",
        "base": {
            "tanker_density": 0.28,
            "geopolitical": 0.22,
            "price_deviation": 0.15,
            "sanctions": 0.05,
        },
    },
}

WEIGHTS = {
    "tanker_density": 0.40,
    "geopolitical": 0.35,
    "price_deviation": 0.15,
    "sanctions": 0.10,
}

SYNTHETIC_VESSEL_COUNTS = {
    "hormuz": 24,
    "red_sea": 18,
    "cape": 9,
}

# ---------------------------------------------------------------------------
# Scenario Engine Definitions
# ---------------------------------------------------------------------------
SCENARIO_DESCRIPTIONS = {
    "baseline": "Baseline Operating Mode — Live Cape tracking with synthetic base random walk.",
    "A": "Scenario A: Strait of Hormuz Closure — Critical tanker density drop near zero, extreme oil price surge, sovereignty alert.",
    "B": "Scenario B: Red Sea Blockade & Cape Re-routing — Critical Red Sea disruption driving massive vessel surge around South Africa.",
    "C": "Scenario C: Full Geopolitical Crisis — Simultaneous dual-chokepoint disruption, Brent crude +$24/bbl spike, Indian Strategic Petroleum Reserve (SPR) stress activation.",
}

_current_scenario: str = "baseline"


def get_active_scenario() -> str:
    return _current_scenario


def get_scenario_description() -> str:
    return SCENARIO_DESCRIPTIONS.get(_current_scenario, SCENARIO_DESCRIPTIONS["baseline"])


def set_active_scenario(scenario: Literal["baseline", "A", "B", "C"]):
    global _current_scenario
    _current_scenario = scenario


# ---------------------------------------------------------------------------
# AISstream Live WebSocket State & Bounding Boxes
# ---------------------------------------------------------------------------
BOUNDING_BOXES = {
    "hormuz": [[25.3, 56.2], [27.5, 59.5]],
    "red_sea": [[12.5, 32.5], [30.0, 43.5]],
    "cape": [[-35.5, 15.0], [-33.0, 22.0]],
}

# mmsi -> last_seen_time (seconds since epoch)
_live_vessels: dict[str, dict[int, float]] = {
    "hormuz": {},
    "red_sea": {},
    "cape": {},
}


def cleanup_stale_vessels(max_age_seconds: float = 3600.0):
    """Purge MMSIs that haven't sent a position report within the rolling window."""
    now = time.time()
    for corridor_id in _live_vessels:
        _live_vessels[corridor_id] = {
            mmsi: ts for mmsi, ts in _live_vessels[corridor_id].items()
            if (now - ts) <= max_age_seconds
        }


async def aisstream_loop():
    """
    Background WebSocket consumer loop connecting to AISstream.
    Runs continuously with automatic exponential backoff reconnection.
    """
    api_key = settings.AISSTREAM_API_KEY
    if not api_key:
        print("AISstream consumer: No AISSTREAM_API_KEY configured. Skipping live WebSocket.")
        return

    url = "wss://stream.aisstream.io/v0/stream"
    backoff = 2.0

    while True:
        try:
            print(f"AISstream consumer: Connecting to {url} ...")
            async with websockets.connect(url, open_timeout=15) as ws:
                print("AISstream consumer: Connected successfully.")
                backoff = 2.0  # Reset backoff on successful connect

                payload = {
                    "APIKey": api_key,
                    "BoundingBoxes": list(BOUNDING_BOXES.values()),
                    "FilterMessageTypes": ["PositionReport"]
                }
                await ws.send(json.dumps(payload))

                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                        if msg.get("MessageType") == "PositionReport":
                            meta = msg.get("MetaData", {})
                            mmsi = meta.get("MMSI")
                            lat = meta.get("latitude")
                            lon = meta.get("longitude")

                            if mmsi and lat is not None and lon is not None:
                                now = time.time()
                                for corridor_id, (sw, ne) in BOUNDING_BOXES.items():
                                    if sw[0] <= lat <= ne[0] and sw[1] <= lon <= ne[1]:
                                        _live_vessels[corridor_id][mmsi] = now
                    except Exception:
                        pass
        except Exception as e:
            print(f"AISstream consumer disconnected ({type(e).__name__}: {e}). Retrying in {backoff}s...")
            await asyncio.sleep(backoff)
            backoff = min(60.0, backoff * 1.5)


# ---------------------------------------------------------------------------
# Threshold & DSI Computation Helpers
# ---------------------------------------------------------------------------
def _threshold(dsi: float) -> str:
    if dsi >= 0.80:
        return "critical"
    if dsi >= 0.60:
        return "high"
    if dsi >= 0.35:
        return "elevated"
    return "normal"


_DRIFT_AMPLITUDE = 0.04
_DRIFT_PERIOD_S = 1800
_t0 = time.time()


def _synthetic_components(corridor_id: str) -> ComponentScores:
    """Returns time-varying component scores using a sinusoidal drift over baseline."""
    t = time.time() - _t0
    base = CORRIDORS[corridor_id]["base"]
    phase_offsets = {"tanker_density": 0.0, "geopolitical": 0.7, "price_deviation": 1.4, "sanctions": 2.1}

    scores = {}
    for component, base_val in base.items():
        drift = _DRIFT_AMPLITUDE * math.sin(
            2 * math.pi * t / _DRIFT_PERIOD_S + phase_offsets[component]
        )
        noise = random.uniform(-0.005, 0.005)
        scores[component] = max(0.0, min(1.0, base_val + drift + noise))

    return ComponentScores(**scores)


def _compute_dsi(components: ComponentScores) -> float:
    """Weighted sum of components clamped to [0.0, 1.0]."""
    raw = (
        components.tanker_density * WEIGHTS["tanker_density"]
        + components.geopolitical * WEIGHTS["geopolitical"]
        + components.price_deviation * WEIGHTS["price_deviation"]
        + components.sanctions * WEIGHTS["sanctions"]
    )
    return round(max(0.0, min(1.0, raw)), 4)


# ---------------------------------------------------------------------------
# Core Engine Getter (Scenario + Live / Synthetic Fusion)
# ---------------------------------------------------------------------------
def get_current_dsi() -> DSIResponse:
    """
    Computes and returns current DSI for all three corridors.
    Combines active scenario simulation with live AISstream vessel tracking where verified.
    """
    cleanup_stale_vessels(3600.0)
    corridors: list[CorridorDSI] = []
    has_live_data = False

    for corridor_id, corridor_def in CORRIDORS.items():
        # Check active scenario overrides first
        if _current_scenario == "A":
            # Scenario A: Strait of Hormuz Closure
            if corridor_id == "hormuz":
                comp = ComponentScores(tanker_density=0.95, geopolitical=0.98, price_deviation=0.95, sanctions=0.85)
                vcount = 3
            elif corridor_id == "red_sea":
                comp = ComponentScores(tanker_density=0.85, geopolitical=0.88, price_deviation=0.95, sanctions=0.60)
                vcount = 16
            else:  # cape
                comp = ComponentScores(tanker_density=0.45, geopolitical=0.35, price_deviation=0.95, sanctions=0.10)
                vcount = 14
            data_source = "synthetic"

        elif _current_scenario == "B":
            # Scenario B: Red Sea Blockade & Cape Re-routing
            if corridor_id == "red_sea":
                comp = ComponentScores(tanker_density=0.96, geopolitical=0.96, price_deviation=0.85, sanctions=0.70)
                vcount = 2
            elif corridor_id == "cape":
                # Massive surge around Africa
                comp = ComponentScores(tanker_density=0.88, geopolitical=0.55, price_deviation=0.85, sanctions=0.15)
                vcount = 42
            else:  # hormuz
                comp = ComponentScores(tanker_density=0.70, geopolitical=0.80, price_deviation=0.85, sanctions=0.71)
                vcount = 25
            data_source = "synthetic"

        elif _current_scenario == "C":
            # Scenario C: Full Geopolitical Crisis
            if corridor_id == "hormuz":
                comp = ComponentScores(tanker_density=0.96, geopolitical=0.99, price_deviation=0.95, sanctions=0.90)
                vcount = 4
            elif corridor_id == "red_sea":
                comp = ComponentScores(tanker_density=0.95, geopolitical=0.97, price_deviation=0.95, sanctions=0.80)
                vcount = 3
            else:  # cape
                comp = ComponentScores(tanker_density=0.92, geopolitical=0.65, price_deviation=0.95, sanctions=0.20)
                vcount = 48
            data_source = "synthetic"

        else:
            # Baseline Mode — Fuse live AISstream data where threshold verified
            comp = _synthetic_components(corridor_id)
            vcount = SYNTHETIC_VESSEL_COUNTS[corridor_id]
            data_source = "synthetic"

            # Check if we should use live AISstream data for this corridor
            if settings.DATA_MODE in ("live", "mixed") and corridor_id == "cape":
                live_count = len(_live_vessels.get("cape", {}))
                # Explicit threshold rule locked in: >= 5 unique vessels/hr activates live mode
                if live_count >= 5:
                    data_source = "live"
                    has_live_data = True
                    vcount = live_count
                    # Dynamic density scaling based on live vessel count vs baseline (9)
                    comp.tanker_density = round(max(0.05, min(1.0, 0.15 + (live_count / 35.0) * 0.7)), 4)

        dsi = _compute_dsi(comp)
        corridors.append(
            CorridorDSI(
                corridor_id=corridor_id,
                name=corridor_def["name"],
                dsi=dsi,
                threshold=_threshold(dsi),
                components=comp,
                vessel_count=vcount,
                data_source=data_source,
                computed_at=datetime.now(timezone.utc),
            )
        )

    # Determine overall system mode
    if _current_scenario != "baseline":
        sys_mode = "synthetic"
    else:
        sys_mode = "mixed" if has_live_data else settings.DATA_MODE

    return DSIResponse(
        corridors=corridors,
        next_update_seconds=30,
        system_mode=sys_mode,
    )
