# INDRA — Full System Deployment Guide
**India's National Disruption Response Architecture**  
*Production Deployment & Environment Configuration Guide across Render, Vercel, and Neon PostgreSQL*

---

## 1. System Topology & Zero-Cost Architecture
INDRA is engineered to run seamlessly on modern cloud-native serverless platforms with zero required infrastructure spending for demonstration and evaluation:

| Component | Service Provider | Runtime / Tier | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Backend API** | **Render / Railway** | Python `3.11+` (Web Service) | Ingests WebSockets, runs DSI math engine, and serves Claude Copilot |
| **Frontend Twin** | **Vercel** | Node.js / Vite Static CDN | Serves React + Deck.gl geospatial map and interactive 5-tab drawer |
| **Database** | **Neon PostgreSQL**| Serverless PostgreSQL | Stores historical DSI snapshots, tanker coordinates, and SPR logs |

---

## 2. Database Setup: Neon Serverless PostgreSQL
1. Create a free serverless project at [neon.tech](https://neon.tech).
2. Copy the PostgreSQL connection string (`postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require`).
3. The backend automatically initializes tables via SQLAlchemy on startup (`database.py` and `db_models.py`):
   * `corridor_dsi` — Historical DSI snapshots across Hormuz, Red Sea, and Cape.
   * `tanker_positions` — Rolling spatial logs of VLCC tankers inside bounding boxes.
   * `spr_snapshots` — ISPRL cavern fill telemetry across Visakhapatnam, Mangalore, and Padur.

---

## 3. Backend Deployment (Render / Railway)

### 3.1 Render Configuration
1. Create a new **Web Service** on [render.com](https://render.com) connected to your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to:
   ```bash
   pip install -r requirements.txt
   ```
4. Set **Start Command** to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Configure Environment Variables in the Render Dashboard:
   ```env
   DATA_MODE=hybrid
   ENVIRONMENT=production
   DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ANTHROPIC_API_KEY=sk-ant-api03-xxxx (Optional: system falls back to instant cache if missing)
   AISSTREAM_API_KEY=xxxxxxxx (Optional: system blends empirical baselines if missing)
   CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:5173
   ```

### 3.2 Uptime / Keep-Alive Configuration
To prevent free-tier container sleep during judging evaluations:
* Configure an uptime monitor (e.g., [UptimeRobot](https://uptimerobot.com)) to ping `https://your-backend-url.onrender.com/health` every **5 minutes**.

---

## 4. Frontend Deployment (Vercel)

### 4.1 Vercel Configuration
1. Import the repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Select **Vite** as the Framework Preset (`npm run build` as Build Command, `dist` as Output Directory).
4. Configure Environment Variables in the Vercel Dashboard:
   ```env
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   ```
5. Deploy. Every subsequent push to `main` will trigger automatic atomic rebuilds for both backend and frontend.

---

## 5. Pre-Demo Verification Checklist (Final Quality Audit)
Before stepping into the judging hall, verify these core indicators on your live Vercel URL:

- [x] **Geospatial Basemap:** Map loads cleanly with Carto Dark Matter tiles; 3 shipping lanes (`Hormuz`, `Red Sea`, `Cape`) and Indian coastal ports (`Mundra`, `JNPT`, `Paradip`, `Kochi`) are clearly visible.
- [x] **Interactive HUD Switchers:** Clicking `[ HORMUZ ]` or `[ CRISIS ]` in the top bar instantly shifts corridor health to red/critical and pulses the DSI gauge.
- [x] **7-Day Trend Visualization:** Opening `[ 📈 7D TRENDS ]` displays 28-point historical curves across all three corridors with interactive SVG tooltips.
- [x] **SPR Cavern Depletion Engine:** Opening `[ 🛢️ SPR ]` reflects exact tonnage across `Visakhapatnam (1.33 MMT)`, `Mangalore (1.50 MMT)`, and `Padur (2.50 MMT)` with live survival day calculations (`57.8d` under Scenario A).
- [x] **Strategic Copilot & Print Export:** Opening `[ ⚡ COPILOT ]` synthesizes a 5-section executive brief tailored to Indian refinery compatibility (`Jamnagar` vs. `WTI`). Clicking **`📄 PDF`** opens a pristine browser print dialog with no navigation clutter.
