# INDRA — Phase 1 Deployment Guide

## What's running locally right now

| Service  | URL                       | Status |
|----------|---------------------------|--------|
| Backend  | http://localhost:8001     | Live   |
| Frontend | http://localhost:5173     | Live   |

Open **http://localhost:5173** — you should see the Carto Dark Matter map, three corridor paths coloured by DSI, port markers, and the DSI gauge sidebar.

---

## Deploying to Render (Backend)

### 1. Push to GitHub
```bash
git init  # if not already
git add .
git commit -m "Phase 1: INDRA backend + frontend scaffold"
git remote add origin https://github.com/YOUR_USERNAME/ET-Indra.git
git push -u origin main
```

### 2. Create Render Web Service
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to: `pip install -r requirements.txt`
5. Set **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Select **Free** tier

### 3. Add Environment Variables in Render Dashboard
```
DATA_MODE=synthetic
ENVIRONMENT=production
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```
> Leave DATABASE_URL blank for Phase 1. Add it in Phase 2 when you have your Neon connection string.

### 4. Set up UptimeRobot
1. Create free account at [uptimerobot.com](https://uptimerobot.com)
2. New Monitor → HTTP(s)
3. URL: `https://your-render-url.onrender.com/health`
4. Interval: **5 minutes** (free tier default)
5. This prevents the 15-minute Render spin-down

---

## Deploying to Vercel (Frontend)

### 1. Create Vercel project
```bash
npx vercel --cwd frontend
```
Or via GitHub import at [vercel.com](https://vercel.com).

### 2. Add Environment Variables in Vercel Dashboard
```
VITE_BACKEND_URL=https://your-render-url.onrender.com
```

### 3. Redeploy after adding the env var

---

## Phase 1 Demo Checklist

Run through this before presenting:

- [ ] Open the URL — map loads with Carto Dark Matter tiles
- [ ] Three corridor paths visible, coloured by DSI (Hormuz=orange/red, Red Sea=red, Cape=green)
- [ ] Eight yellow port markers visible on India's coast
- [ ] Hover over a corridor path → tooltip shows DSI value + vessel count
- [ ] Sidebar shows three DSI gauges with arc, value, component bars
- [ ] Red Sea gauge pulsing (critical)
- [ ] "SYNTHETIC — DEMONSTRATION" badge visible in header
- [ ] `GET /api/dsi` returns valid JSON with three corridor objects
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Values change slightly between 30s polls (sinusoidal drift)

---

## Phase 2 Start Condition

Phase 2 begins when ALL of the above are confirmed on the deployed URL.
Phase 2 adds: AISstream WebSocket consumer, scenario panel A/B/C, EIA price feed.
