# INDRA — Backend Signal Engine & AI Copilot
**India's National Disruption Response Architecture**  
*FastAPI, Asyncio WebSocket Consumers, Compound DSI Math Engine, and Claude 3.5 Copilot*

---

## Overview
The INDRA backend orchestrates asynchronous data collection across four external sources, computes the weighted **Disruption Signal Index (DSI)** across three maritime corridors, models ISPRL cavern depletion curves, and synthesizes refinery-grade-compatible procurement briefs using Anthropic's **Claude 3.5 Haiku / Sonnet**.

---

## Core Modules
* **`main.py`:** FastAPI application entry point, CORS middleware, and REST API route definitions (`/api/dsi`, `/api/history`, `/api/spr`, `/api/copilot`, `/health`).
* **`signal_engine.py`:** Asynchronous background poller running `aisstream_loop` (WebSockets), `poll_gdelt` (GDELT 2.0 API), `poll_eia` (EIA Open Data API), and `poll_sanctions` (OpenSanctions API). Computes rolling z-scores and fuses scores every 30 minutes.
* **`history_spr.py`:** 7-day historical curve generator and **ISPRL Cavern Depletion Engine** modeling real-time survival days across `Visakhapatnam (1.33 MMT)`, `Mangalore (1.50 MMT)`, and `Padur (2.50 MMT)`.
* **`copilot.py`:** Strategic AI Copilot engine. Injects India's **23-Refinery Technical Compatibility Matrix** into the Claude system prompt. Includes zero-cost instantaneous fallback caches (`demo-cache-v1`) to guarantee 100% demo stability under high-concurrency evaluation.
* **`database.py` & `db_models.py`:** SQLAlchemy engine configured with `pool_pre_ping=True` and `pool_recycle=300` for Neon Serverless PostgreSQL persistence.

---

## API Endpoints
* `GET /api/dsi?scenario={BASE|A|B|C}` — Returns corridor DSI percentages, threshold classifications (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`), and component score breakdowns.
* `GET /api/history` — Returns 28-point historical trend time series over the past 168 hours across all three chokepoints.
* `GET /api/spr?scenario={BASE|A|B|C}` — Returns cavern fill levels, national storage capacity (`5.33 MMT`), and drawdown survival days (`34.6d to 130.0d`).
* `POST /api/copilot` — Synthesizes and returns structured executive markdown briefs based on active scenario conditions and custom user queries.

---

## Local Setup & Run
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs available at `http://localhost:8000/docs`.*
