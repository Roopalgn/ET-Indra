# INDRA — Jury Evaluation Guide & 3-Minute Demo Flow
**India's National Disruption Response Architecture**  
*Evaluation Mapping & Live Demonstration Guide for the Evaluation Panel*

---

## Part 1: Mapping Against Official Hackathon Evaluation Criteria

### 1. Innovation & Originality (Weight: 25%)
* **The Disruption Signal Index (DSI) Compound Formula:** Prior art in Indian energy logistics is limited to static visualization dashboards (such as *India Energy Nervous System*) or manual monitoring control rooms. INDRA introduces a first-of-its-kind mathematical index that fuses live **AIS vessel density**, **GDELT geopolitical conflict events**, **EIA crude price deviations**, and **OpenSanctions entity exposure** into a real-time risk score updated every 30 minutes.
* **Refinery-Grade-Compatible Generative AI Decision Engine:** Unlike general-purpose chatbots, INDRA's Strategic Procurement Copilot incorporates India's **23-Refinery Technical Compatibility Matrix** directly into its inference context. It understands that RIL Jamnagar requires heavy sour crude (`Arabian Heavy / Kuwait`) and cannot simply substitute light sweet grades (`WTI Midland`) without causing severe yield reductions or coker damage.

### 2. Business Impact & Practicality (Weight: 25%)
* **Solving the 47-Day Decision Intelligence Gap:** As documented in the official problem statement (`McKinsey Supply Chain Baseline`), import-dependent economies lacking automated response synthesis take an average of **47 days longer** to stabilize supply during a maritime shock. INDRA compresses this analysis and brief generation into **under 60 seconds**.
* **Quantified Economic Protection:** Under Scenario A (Strait of Hormuz 30% closure), India faces an immediate **+$422 million/month** import cost increase and a **+0.12% Current Account Deficit / GDP** widening. INDRA directly mitigates this economic bleed by immediately identifying viable Cape-routed replacement cargoes (`Bonny Light`, `WTI Midland`, `Norwegian Johan Sverdrup`) before spot market premiums escalate.

### 3. Technical Implementation & AI Architecture (Weight: 20%)
* **Multi-Layer Asynchronous Architecture:** Built with **FastAPI (Python 3.11+)** and **asyncio** for non-blocking multi-source polling (`AISstream.io WebSockets`, `GDELT 2.0 REST`, `EIA Open Data API`, `OpenSanctions`).
* **Deck.gl & React Digital Twin:** High-performance geospatial visualization rendering animated shipping corridors (`PathLayer`), real-time tanker positions (`TripsLayer`), and major Indian port hubs (`ScatterplotLayer` for `Mundra`, `JNPT`, `Paradip`, `Kochi`, etc.) over a sleek dark basemap.
* **Cold-Start Resilient Persistence:** Uses **Neon Serverless PostgreSQL** with connection recycling (`pool_pre_ping=True`, `pool_recycle=300`) to prevent idle timeouts, combined with instant high-fidelity fallback caches (`demo-cache-v1`) to guarantee zero demo downtime.

### 4. Scalability & Extensibility (Weight: 15%)
* **Corridor & Commodity Agnostic:** The DSI mathematical engine is fully parameter-driven. Adding new corridors (`Strait of Malacca`, `Suez Canal`, `Panama Canal`) or expanding into other energy commodities (`LNG via Qatar–Hormuz`, `Thermal Coal from Australia`, `Fertilizer logistics`) requires only adding new bounding box coordinates and weight definitions.
* **Refinery Fleet Agnostic:** The Copilot's system prompt architecture can scale instantly to any import-dependent nation (`Japan`, `South Korea`, `Germany`) by simply swapping the refinery grade compatibility matrix.

### 5. User Experience & Design Excellence (Weight: 15%)
* **Designed for Senior Government & Refinery Executive Action:** Built in strict alignment with `UI/UX Pro Max` glassmorphism aesthetics (`backdrop-filter: blur(20px)`, `#6366F1` indigo accents).
* **5-Tab Adaptive Sidebar Drawer:** Seamlessly expands from `315px` (`[ 📊 GAUGES ]`) to `440px` (`[ 📈 7D TRENDS ]`, `[ 🛢️ SPR ]`, `[ ⚙️ SANDBOX ]`, `[ ⚡ COPILOT ]`), providing deep strategic analytics without obscuring the interactive geospatial map.
* **One-Click Executive Action:** Features instant **Export as PDF (`📄 PDF`)** via clean print stylesheet isolation and **Copy Brief to Clipboard (`📋 Copy`)**, empowering procurement heads to share official policy briefs immediately.

---

## Part 2: Step-by-Step 3-Minute Live Evaluation Script
When testing the live prototype, we invite the jury to follow this exact 3-minute sequence to experience INDRA's end-to-end capabilities:

### ⏱️ Minute 1: The Signal Engine & Digital Twin (Real-Time Threat Detection)
1. **Open the Dashboard URL:** Observe the Deck.gl dark basemap displaying India's primary maritime supply lines (`Strait of Hormuz`, `Red Sea`, `Cape of Good Hope`) and coastal port locations (`Mundra`, `JNPT`, `Visakhapatnam`, `Paradip`).
2. **Inspect the Right-Hand Sidebar (`[ 📊 GAUGES ]` Tab):** Notice the three live gauges displaying current DSI percentages (`~0.35` Hormuz, `~0.74` Red Sea, `~0.30` Cape) and their underlying component breakdowns (`Tanker Density`, `Geopolitical Threat`, `Price Deviation`, `Sanctions Exposure`).
3. **Switch to `[ 📈 7D TRENDS ]` Tab:** Explore the 28-point historical trend charts over the past 168 hours. Click the `[ HORMUZ ]` or `[ RED SEA ]` filter chips and hover over the SVG curves to see exact timestamps and vessel counts.

### ⏱️ Minute 2: The Scenario & SPR Cavern Depletion Modeller (What-If Simulation)
1. **Click the `[ HORMUZ ]` or `[ CRISIS ]` Button in the Top HUD Bar:** Watch the system immediately transition into **Critical Disruption Mode (`DSI > 0.87`)**. The map corridors turn glowing amber/red, and the Web Audio API chime pulses an alert.
2. **Switch to `[ 🛢️ SPR ]` Tab:** Examine India's 3 underground rock caverns (`Visakhapatnam 1.33 MMT`, `Mangalore 1.50 MMT`, `Padur 2.50 MMT`). Observe that under Scenario A (`650,000 bpd deficit`), the cavern survival window recomputes dynamically to **57.8 days**, and under Crisis Mode (`1.1M bpd deficit`), survival drops to **34.6 days**.
3. **Switch to `[ ⚙️ SANDBOX ]` Tab:** Drag the **Geopolitical Threat Index** or **EIA Price Deviation ($/bbl surge)** sliders. Watch the composite DSI formula dynamically recompute in real time above the sliders.

### ⏱️ Minute 3: The Strategic Procurement Copilot (Executive Action in <60 Seconds)
1. **Click `[ ⚡ COPILOT ]` in the Drawer (or `⚡ AI COPILOT` in the Top Bar):** Observe the AI synthesizing active telemetry, refinery compatibility matrices, and ISPRL cavern capacities.
2. **Review the Generated 5-Section Executive Brief:**
   * Notice how Section 2 explicitly separates recommendations by refinery configuration (e.g., specifying `WTI Midland` for `Panipat / Kochi` sweet intakes, and `W.A. Bonny Light` for `MRPL Mangalore`).
   * Notice Section 4 detailing exact daily cavern drawdowns from `Mangalore and Padur` to bridge the 14-day Cape transit delay.
3. **Test Custom Interactive Queries & Export:**
   * In the bottom input box, type: *"Can MRPL process heavy Venezuelan crude under current OFAC guidelines?"* and hit **Ask AI**.
   * Finally, click the **`📄 PDF`** button at the top right of the brief card to launch the browser print engine, revealing a clean, pristine executive document ready for immediate ministerial review!
