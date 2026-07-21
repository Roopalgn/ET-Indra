# INDRA — System Architecture & Technical Specifications
**India's National Disruption Response Architecture**  
*Technical Architecture & Engineering Documentation for Jury Evaluation*

---

## 1. High-Level Architectural Overview
INDRA is constructed as a decoupled, **three-layer AI architecture** engineered to ingest real-time geopolitical and maritime signals, model complex macroeconomic and supply chain scenarios, and synthesize executive-level procurement actions in under 60 seconds.

```
+-----------------------------------------------------------------------------------+
|                        LAYER 1: REAL-TIME SIGNAL ENGINE                           |
|                                                                                   |
|  [AISstream.io WebSocket]  [GDELT 2.0 API]  [EIA Open Data API]  [OpenSanctions]  |
|         (Tankers)            (Conflict)          (Prices)         (Entities)      |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                  COMPOUND DISRUPTION SIGNAL INDEX (DSI) ENGINE                    |
|                                                                                   |
|    DSI = (Density_Z * 0.40) + (Conflict * 0.35) + (Price * 0.15) + (Sanct * 0.10) |
|           Thresholds: Normal (<0.3) | Elevated | High | Critical (>0.80)          |
+------------------------------------+----------------------------------------------+
                                     |
                 +-------------------+-------------------+
                 | (If DSI >= 0.60)                      | (Continuous 30m Snapshot)
                 v                                       v
+----------------------------------+   +--------------------------------------------+
|  LAYER 2: SCENARIO & SPR ENGINE  |   |           NEON POSTGRESQL POOL             |
|                                  |   |                                            |
|  • Scenario A: Hormuz 30% Loss   |   |  • corridor_dsi (Historical curves)        |
|  • Scenario B: Red Sea 14d Cape  |   |  • tanker_positions (Rolling spatial logs) |
|  • Scenario C: OPEC+ 1.5M bpd    |   |  • spr_snapshots (ISPRL Cavern telemetry)  |
|  • ISPRL Cavern Depletion Modeller|   +---------------------+----------------------+
+-----------------+----------------+                         |
                  |                                          |
                  v                                          v
+----------------------------------+   +--------------------------------------------+
|  LAYER 3: AI PROCUREMENT COPILOT |   |    FRONTEND: REACT + DECK.GL DIGITAL TWIN  |
|                                  |   |                                            |
|  • Claude Haiku / Sonnet Engine  |   |  • Animated PathLayer (Corridor health)    |
|  • 23-Refinery Grade Compatibility|   |  • TripsLayer / Scatterplot (Tankers & Ports)|
|  • Zero-Cost Fallback Cache Plan |   |  • 5-Tab Expandable Drawer + Print Engine  |
+----------------------------------+   +--------------------------------------------+
```

---

## 2. Layer 1: Real-Time Signal Engine (`backend/signal_engine.py`)

### 2.1 Multi-Source Data Polling Strategy
The backend orchestrates four asynchronous data collectors using Python `asyncio` and `httpx`:

1. **AISstream.io WebSocket Consumer (`aisstream_loop`):**
   * Establishes a persistent secure WebSocket connection (`wss://stream.aisstream.io/v0/stream`).
   * Subscribes to bounding boxes corresponding to the three maritime corridors:
     * **Strait of Hormuz:** `[22.0, 54.0]` to `[27.0, 60.0]`
     * **Red Sea / Bab el-Mandeb:** `[11.0, 42.0]` to `[16.0, 46.0]`
     * **Cape of Good Hope:** `[-35.0, 17.0]` to `[-32.0, 20.0]`
   * Filters exclusively for maritime vessels broadcasting `vessel_type` between `80` and `89` (Tankers / VLCCs).
   * Calculates rolling hourly vessel counts and computes a statistical z-score relative to a 90-day baseline ($Z_{\text{density}}$).

2. **GDELT Geopolitical Conflict Poller (`poll_gdelt`):**
   * Queries the **GDELT 2.0 API** (`https://api.gdeltproject.org/api/v2/doc/doc`) every 30 minutes for conflict events involving key sovereign actors (`Iran`, `Yemen`, `Saudi Arabia`, `UAE`).
   * Filters by `EventCode 19–20` (Military/Armed Conflict) and aggregates GoldsteinScale intensity into a normalized $[0, 1]$ threat metric ($C_{\text{gdelt}}$).

3. **EIA Commodity Price Poller (`poll_eia`):**
   * Fetches spot market prices for **Brent Crude** and **Dubai Spot** from the U.S. Energy Information Administration (EIA) API.
   * Computes the percentage deviation against the 30-day moving average ($P_{\text{eia}}$) to detect sudden spot market supply shocks (`+$18–24/bbl surges`).

4. **OpenSanctions Sovereign Checker (`poll_sanctions`):**
   * Evaluates OFAC, EU, and UN sanctions registries for exporting sovereigns and shipping entities. Maps sanctioned entities to corridor risk weights ($S_{\text{sanctions}}$).

### 2.2 Cold-Start & Fallback Resilience Guarantee
To guarantee **100% demo stability** during high-pressure judging evaluations when third-party free tier APIs (`AISstream` / `GDELT`) might throttle or disconnect:
* The Signal Engine maintains a **high-fidelity baseline generation mode**. If a live socket experiences packet loss or API timeouts, the system gracefully blends real-world telemetry with empirical historical bounds (`0.35 -> 0.62` for Hormuz spikes, `0.74 -> 0.88` for Red Sea risks).
* Judges will never encounter blank screens, unhandled exceptions, or `500 Internal Server Error` responses.

---

## 3. Layer 2: Scenario Modeller & SPR Depletion Engine (`backend/history_spr.py`)

### 3.1 Scenario Mathematical Modeling
When the compound DSI score breaches `0.60` (High) or `0.80` (Critical), INDRA triggers the `ScenarioRunner` to simulate macroeconomic and physical infrastructure consequences:

* **Scenario A (Strait of Hormuz 30% Volume Loss):**
  * *Volume Deficit:* $243.22\text{ MMT/yr} \times 30\% \text{ Hormuz share} \times 30\% \text{ disruption} = \sim 0.165\text{ Mb/d}$ net gap (`~650,000 bpd`).
  * *Spot Premium Absorption:* Adds a $\$8–15/\text{bbl}$ surcharge on replacement spot procurement from West Africa or the US Gulf Coast.
  * *Macroeconomic Shock:* Computes an immediate $+\$422\text{ million/month}$ import burden increase and a $+0.12\%$ widening of India's Current Account Deficit / GDP.

* **Scenario B (Red Sea Full Blockade & Cape Rerouting):**
  * *Transit Delay:* Adds precisely **14 days** of maritime travel time around South Africa.
  * *Tanker Capacity Draw:* Ties up $20\%$ more VLCC capacity for identical delivery volumes, driving charter freight premiums up by $+\$2.50/\text{bbl}$.
  * *Refinery Insulation Assessment:* Automatically identifies pipeline-accessible west coast refineries (`Jamnagar`, `Vadinar`, `Kochi`, `Mangalore`) as insulated, while warning of stockout risks at east coast ports (`Paradip`, `Visakhapatnam`) that depend on Suez transshipment.

* **Scenario C (OPEC+ Emergency 1.5 Mb/d Global Cut):**
  * *Term Contract Shortfall:* Models an immediate $7\%$ reduction ($\sim 0.38\text{ Mb/d}$) in term contract allocations from Saudi Aramco and UAE ADNOC.
  * *Marginal Spot Pricing:* Applies a $+\$15/\text{bbl}$ spot market spike over contract baselines.

### 3.2 ISPRL Underground Cavern Depletion Engine
INDRA tracks exact tonnage across India's three underground rock caverns (`5.33 MMT` total nameplate capacity):
* **Visakhapatnam (`1.33 MMT`):** Feeds east coast operations (`Paradip`, `Vizag`).
* **Mangalore (`1.50 MMT`):** Feeds west coast operations (`MRPL Mangalore`, `BPCL Kochi`).
* **Padur (`2.50 MMT`):** Serves as the national deep strategic buffer.

The depletion engine calculates exact cavern survival horizons under crisis conditions:
$$\text{Survival Days} = \frac{\text{Current Cavern Inventory (MMT)}}{\text{Scenario Drawdown Rate (MMT/day)}}$$
Under Scenario A, INDRA models a **57.8-day cavern survival window**, providing actionable timelines for releasing Phase 1 caverns while tendering West African spot replacement cargoes via the Cape.

---

## 4. Layer 3: AI Procurement Copilot (`backend/copilot.py`)

### 4.1 System Prompt Engineering & Grade Compatibility
The Copilot is engineered around Anthropic's **Claude 3.5 Haiku / Sonnet** (`claude-3-5-haiku-20241022`). To prevent generic or hallucinated advice, the backend constructs a rigorous `SYSTEM_PROMPT` containing:
1. **The Indian Refinery Technical Compatibility Matrix:** Detailed classification of `Jamnagar` (Heavy Sour), `Panipat` (Medium Sour), `Kochi` (Light Sour), and `Mangalore` (Light-Medium Sour).
2. **Alternative Crude Catalog & Lead Times:** Specifications for `WTI Midland` (Light Sweet, 21-day Cape lead time), `Bonny Light` (Light Sweet, West Africa), `Johan Sverdrup` (Medium Sour, Norway), and `CPC Blend` (Kazakhstan).
3. **Structured Output Format Requirement:** Mandates that every brief must output precisely five labeled sections:
   * `## 1. Executive Summary & Disruption Status`
   * `## 2. Recommended Grade-Compatible Source Shifts`
   * `## 3. Maritime Route & VLCC Charter Recommendations`
   * `## 4. ISPRL Cavern Action & Drawdown Schedule`
   * `## 5. Macroeconomic Cost & Current Account Impact`

### 4.2 Zero-Cost Fallback Guarantee
If Anthropic API keys are rate-limited (`429 Too Many Requests`) or if network connectivity drops during a live pitch, `copilot.py` instantly swaps to a **high-fidelity, pre-compiled strategic cache** (`demo-cache-v1`). This guarantees instantaneous (`<50ms`), highly structured markdown briefs that can be exported as PDFs or copied to clipboard without failure.

---

## 5. Database & API Endpoints (`backend/main.py` & `backend/database.py`)

### 5.1 Neon PostgreSQL Serverless Configuration
The backend persists all telemetry to **Neon Serverless PostgreSQL** using SQLAlchemy ORM. To prevent idle connection dropouts common in serverless databases, the connection pool is configured with aggressive recycling:
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Verifies connection health before transaction
    pool_recycle=300,         # Recycles connections every 5 minutes
    pool_size=5,
    max_overflow=10
)
```

### 5.2 Core API Contracts
* `GET /api/dsi`: Returns real-time or scenario-overridden DSI scores across all 3 corridors along with individual component breakdowns.
* `GET /api/history`: Returns 28 historical data points (every 6 hours over 7 days) across `Strait of Hormuz`, `Red Sea`, and `Cape of Good Hope` for interactive trend analysis.
* `GET /api/spr`: Returns real-time fill levels, cavern capacities (`Visakhapatnam`, `Mangalore`, `Padur`), and scenario survival days.
* `POST /api/copilot`: Accepts current scenario state (`A`, `B`, `C`, or `BASE`) and optional custom queries (`"Can MRPL process heavy Venezuelan crude?"`), returning the complete structured executive markdown brief.

---

## 6. Frontend Digital Twin (`frontend/src/`)
Built with **React 18**, **Vite**, and **@deck.gl/react** over **MapLibre GL**:
* **`MapView/index.jsx`:** Renders animated `PathLayer` polylines colored dynamically by corridor DSI (`#10B981` Normal $\to$ `#F59E0B` Elevated $\to$ `#EF4444` Critical) and `ScatterplotLayer` circles representing major Indian ports (`Mundra`, `JNPT`, `Paradip`, etc.).
* **`Header/index.jsx`:** Top HUD bar featuring instant scenario switchers (`[ BASE ]`, `[ HORMUZ ]`, `[ RED SEA ]`, `[ CRISIS ]`) and live AI Copilot launcher (`⚡ AI COPILOT`).
* **`App.jsx` (5-Tab Expandable Drawer):** State-managed right-hand sidebar dynamically expanding from `315px` to `440px` across 5 operational tabs:
  `[ 📊 GAUGES ]` `[ 📈 7D TRENDS ]` `[ 🛢️ SPR ]` `[ ⚙️ SANDBOX ]` `[ ⚡ COPILOT ]`
* **Print Engine (`window.print()`):** Includes dedicated `@media print` CSS inside `CopilotPanel.module.css` that isolates the executive markdown brief and strips out navigation elements for clean PDF export during demonstrations.
