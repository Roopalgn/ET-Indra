# INDRA — Frontend Digital Twin & Strategic UI
**India's National Disruption Response Architecture**  
*Built with React 18, Vite, Deck.gl, MapLibre GL, and UI/UX Pro Max Glassmorphism*

---

## Overview
The INDRA frontend serves as a real-time **Geospatial Digital Twin and Strategic Executive Dashboard** for India's Ministry of Petroleum and refinery procurement leaders. It visualizes maritime supply lines, tanker density, SPR rock cavern fill levels, and AI-synthesized policy briefs over an interactive dark basemap.

---

## Core Components
* **`MapView/` (`@deck.gl/react` + `maplibre-gl`):** Renders animated `PathLayer` polylines colored dynamically by corridor DSI (`#10B981` Normal $\to$ `#F59E0B` Elevated $\to$ `#EF4444` Critical) and `ScatterplotLayer` markers for Indian ports (`Mundra`, `JNPT`, `Paradip`, `Kochi`, etc.).
* **`Header/` (Strategic HUD):** Top control bar with instant scenario switchers (`[ BASE ]`, `[ HORMUZ ]`, `[ RED SEA ]`, `[ CRISIS ]`) and live AI Copilot launcher (`⚡ AI COPILOT`).
* **`DSIGauges/` (Corridor Telemetry):** Semi-circular SVG gauges displaying exact DSI percentages across Hormuz, Red Sea, and Cape with Web Audio API chime alerts.
* **`History/` (`HistoryChart.jsx`):** 7-day (168-hour) historical trend curves across all three chokepoints with interactive hover tooltips and filter chips.
* **`SPR/` (`SPRWidget.jsx`):** Real-time monitoring of India's 3 underground rock caverns (`Visakhapatnam 1.33 MMT`, `Mangalore 1.50 MMT`, `Padur 2.50 MMT`) with survival day calculations.
* **`Sliders/` (`ScenarioSliders.jsx`):** Interactive sensitivity sandbox allowing live parameter overrides (`Tanker Density`, `Geopolitical Threat`, `Price Surges`).
* **`Copilot/` (`CopilotPanel.jsx`):** AI policy brief display with one-click **Copy to Clipboard (`📋 Copy`)** and **Export as PDF (`📄 PDF`)** via clean `@media print` isolation.

---

## Local Development
```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:5173)
npm run dev

# Build production bundle for Vercel
npm run build
```
