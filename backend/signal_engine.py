"""
INDRA Backend — Signal Engine (Phase 1: Synthetic data path)

DSI = Disruption Signal Index, a weighted composite per corridor:
  tanker_density:  40%  — vessel density vs. baseline
  geopolitical:    35%  — GDELT sentiment + event intensity
  price_deviation: 15%  — EIA Brent price deviation from 90-day MA
  sanctions:       10%  — flagged sovereign entities in corridor

WEIGHTS NOTE: These are demonstration weights, configurable.
              They encode current MoPNG/EIA relative signal strength.
              Presented with tooltip in UI: "Demonstration weighting — adjustable."

Phase 1 behaviour:
  - All four components use synthetic time-varying values.
  - Values follow a slow random walk seeded from real March 2026 crisis levels.
  - Every call to get_current_dsi() returns updated values (30s frontend poll → live feel).
  - No external API calls, no DB writes.

Phase 2+ behaviour:
  - AISstream WebSocket → tanker_density
  - GDELT REST → geopolitical
  - EIA API → price_deviation
  - OpenSanctions → sanctions
"""
import math
import random
import time
from datetime import datetime, timezone
from models import CorridorDSI, ComponentScores, DSIResponse

# ---------------------------------------------------------------------------
# Corridor definitions
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

# DSI component weights — demonstration configuration
WEIGHTS = {
    "tanker_density": 0.40,
    "geopolitical": 0.35,
    "price_deviation": 0.15,
    "sanctions": 0.10,
}

# Synthetic vessel counts (credible baseline for demo)
SYNTHETIC_VESSEL_COUNTS = {
    "hormuz": 24,
    "red_sea": 18,
    "cape": 9,
}

# DSI thresholds
def _threshold(dsi: float) -> str:
    if dsi >= 0.80:
        return "critical"
    if dsi >= 0.60:
        return "high"
    if dsi >= 0.35:
        return "elevated"
    return "normal"


# Random walk state — persists in memory between calls
_rw_state: dict[str, dict[str, float]] = {
    cid: {k: v for k, v in cd["base"].items()}
    for cid, cd in CORRIDORS.items()
}

# Slow drift parameters
_DRIFT_AMPLITUDE = 0.04   # max ±4% variation
_DRIFT_PERIOD_S = 1800    # one full cycle per 30 minutes
_t0 = time.time()


def _synthetic_components(corridor_id: str) -> ComponentScores:
    """
    Returns time-varying component scores using a sinusoidal drift
    overlaid on the base crisis-period values.
    Each component has a slightly different phase to avoid lock-step movement.
    """
    t = time.time() - _t0
    base = CORRIDORS[corridor_id]["base"]
    phase_offsets = {"tanker_density": 0.0, "geopolitical": 0.7, "price_deviation": 1.4, "sanctions": 2.1}

    scores = {}
    for component, base_val in base.items():
        drift = _DRIFT_AMPLITUDE * math.sin(
            2 * math.pi * t / _DRIFT_PERIOD_S + phase_offsets[component]
        )
        # Add tiny noise (±0.005) so values are never perfectly smooth
        noise = random.uniform(-0.005, 0.005)
        scores[component] = max(0.0, min(1.0, base_val + drift + noise))

    return ComponentScores(**scores)


def _compute_dsi(components: ComponentScores) -> float:
    """Weighted sum, clamped to [0.0, 1.0]."""
    raw = (
        components.tanker_density * WEIGHTS["tanker_density"]
        + components.geopolitical * WEIGHTS["geopolitical"]
        + components.price_deviation * WEIGHTS["price_deviation"]
        + components.sanctions * WEIGHTS["sanctions"]
    )
    return round(max(0.0, min(1.0, raw)), 4)


def get_current_dsi() -> DSIResponse:
    """
    Returns current DSI for all three corridors.
    Phase 1: fully synthetic. Phase 2: live feeds replace component functions.
    """
    corridors = []
    for corridor_id, corridor_def in CORRIDORS.items():
        components = _synthetic_components(corridor_id)
        dsi = _compute_dsi(components)
        corridors.append(
            CorridorDSI(
                corridor_id=corridor_id,
                name=corridor_def["name"],
                dsi=dsi,
                threshold=_threshold(dsi),
                components=components,
                vessel_count=SYNTHETIC_VESSEL_COUNTS[corridor_id],
                data_source="synthetic",
                computed_at=datetime.now(timezone.utc),
            )
        )

    return DSIResponse(
        corridors=corridors,
        next_update_seconds=30,
        system_mode="synthetic",
    )
