"""
INDRA Backend — Procurement Copilot Engine
Generates actionable, budget-capped Strategic Procurement Briefs for Indian oil refiners & policymakers.
Uses Anthropic Claude (Haiku) when API key is provided, with an instant zero-cost high-fidelity fallback cache for demo reliability.
"""
from datetime import datetime, timezone
from typing import Optional
import httpx
from config import settings
from models import CopilotResponse
from signal_engine import get_current_dsi, get_active_scenario

# High-fidelity cached briefs per scenario to guarantee zero-cost, instant demo reliability
CACHE_FALLBACK_BRIEFS = {
    "baseline": """### 🛡️ Strategic Procurement Brief — Normal & Cape Baseline Operations

**Executive Summary:**
Disruption Signal Index (DSI) across major maritime arteries is operating in baseline state (`Cape DSI: 0.23` Normal). While geopolitical risks in Strait of Hormuz (`0.73` High) and Red Sea (`0.83` Critical) require ongoing surveillance, national crude intake schedules for public sector refiners (IOCL, BPCL, HPCL) remain on schedule without immediate supply deficits.

---

#### Immediate Procurement & Hedging Actions (0–72 Hours):
1. **Spot vs. Term Contract Optimization:**
   - Maintain current 70:30 term-to-spot ratio across Middle Eastern (Arab Light/Medium) and West African baseload arrivals.
   - *Recommendation:* Do not trigger spot-market surcharge buying; utilize existing long-term Basrah and Murban allocations.

2. **War Risk Insurance Review:**
   - Re-verify Hull & Machinery (H&M) and Protection & Indemnity (P&I) war risk cover for vessels scheduled to transit Bab-el-Mandeb over the next 14 days.
   - *Recommendation:* Instruct chartered tankers to maintain Southern Red Sea transit speeds above 18 knots and coordinate with Indian Navy MARSEC dispatch.

3. **Strategic Petroleum Reserve (SPR) Status:**
   - Padur (`2.5 MMT`), Mangalore (`1.5 MMT`), and Visakhapatnam (`1.33 MMT`) caverns remain at **98.2% capacity**.
   - *Recommendation:* No SPR drawdowns authorized or required at this operational tier.

---

#### 30-Day Outlook & Policy Directives:
- **Freight Rate Surveillance:** Monitor VLCC/Suezmax spot charter rates from Arabian Gulf to West Coast India (currently ~$14.20/MT).
- **Refinery Feedstock Flexibility:** Ensure high-TAN crude processing units at MRPL and Kochi remain preconditioned for rapid switchover if Middle East loading schedules encounter geopolitical delays.""",

    "A": """### 🚨 CRITICAL ALERT: Strait of Hormuz Contingency Brief

**Executive Summary:**
Strait of Hormuz DSI has spiked to **`0.95` (CRITICAL)** following total chokepoint closure simulation. Tanker density in the Gulf has dropped by **88%** (`vessel_count: 3`). Brent crude spot price deviation has surged by **+$18.50/bbl**, triggering immediate national energy security protocols across all public and private refining networks.

---

#### Immediate Procurement Actions (0–72 Hours):
1. **Emergency SPR Drawdown Authorization:**
   - **Trigger:** Immediate release of **1.2 MMT** from Phase-1 caverns (`Visakhapatnam 0.5 MMT`, `Padur 0.7 MMT`) allocated to coastal refineries (BPCL Mumbai, HPCL Mumbai, IOCL Koyali).
   - *Impact:* Sustains baseline refinery throughput for 18 days while maritime re-routing stabilizes.

2. **Spot Cargo Re-routing & Atlantic Basin Swaps:**
   - Divert 4 pending VLCC fixtures currently idling outside Fujairah towards Atlantic Basin alternatives.
   - *Recommendation:* Execute immediate spot tenders for West African (`Nigerian Bonny Light`, `Angolan Girassol`) and US Gulf Coast (`WTI Midland`) cargoes arriving via Cape of Good Hope.

3. **Crude Slate Rebalance & Strategic Stockpiles:**
   - Instruct MRPL and Reliance Jamnagar to increase heavy/sour domestic and non-Hormuz blends.
   - Activate government-to-government (G2G) emergency supply mechanisms with Brazil (`Tupi crude`) and Guyana (`Liza`).

---

#### Freight & Financial Risk Mitigation:
- **Price Hedging:** Lock in Asian refining margins using crack spread derivatives to shield retail consumer prices from the +$18.50/bbl crude shock.
- **Port Congestion Allocation:** Prioritize berths at Mundra, Paradip, and Cochin for non-Gulf energy carriers arriving via Southern ocean routes.""",

    "B": """### ⚠️ STRATEGIC BRIEF: Red Sea Blockade & Cape Re-routing Surge

**Executive Summary:**
Bab-el-Mandeb DSI stands at **`0.92` (CRITICAL)** with Red Sea tanker volume collapsing to just `2 vessels`. Concurrently, the **Cape of Good Hope** is experiencing an unprecedented traffic surge (`vessel_count: 42`, `Cape DSI: 0.69` High) as over 40 India-bound crude, product, and LNG carriers bypass the Suez Canal. Voyage durations are extended by **12 to 16 days**, increasing freight and bunker costs.

---

#### Immediate Procurement Actions (0–72 Hours):
1. **Working Capital & Inventory Cushion:**
   - Extend refining inventory buffers by **14 days of supply** across all PSU refineries to absorb the 2-week transit delay around South Africa.
   - *Recommendation:* Authorize temporary working capital credit expansion for IOCL and BPCL to finance extended voyage carrying costs.

2. **Bunker Fuel Hedging Along African Coast:**
   - Lock in marine bunker fuel (VLSFO) contracts at waypoints off Durban, Port Louis (Mauritius), and Las Palmas to avoid localized price spikes caused by the diversion congestion.

3. **Russian / Mediterranean Arrival Adjustments:**
   - Re-schedule refinery processing runs at Paradip and Vadinar for delayed Urals and Mediterranean crude grades transiting via Gibraltar and the Cape.
   - *Recommendation:* Prioritize unloading windows for vessels carrying time-sensitive LNG cargoes from Atlantic suppliers.

---

#### Supply Chain Resilience & Freight Management:
- **Charter Rate Lock-in:** Secure long-term Suezmax time-charters immediately before Cape diversion bottlenecks further drive up global ton-mile demand rates.
- **Coastal Cabotage Optimization:** Maximize domestic coastal shipping of refined products between East and West Coast Indian ports to relieve rail/pipeline transit pressures.""",

    "C": """### 🔴 NATIONAL ENERGY EMERGENCY: Dual Chokepoint & Price Shock Brief

**Executive Summary:**
India's supply chain is undergoing simultaneous dual-corridor disruption: Strait of Hormuz (`0.96` CRITICAL) and Red Sea (`0.94` CRITICAL), accompanied by a **+$24.00/bbl Brent crude price shock**. Cape of Good Hope (`0.76` HIGH) is absorbing maximum diverted traffic (`48 vessels`). Sovereignty flags and Strategic Petroleum Reserve (`SPR`) emergency activation protocols are fully triggered.

---

#### Immediate Procurement Actions (0–72 Hours):
1. **Full-Scale MoPNG Taskforce Activation:**
   - Convene daily joint supply chain command with Ministry of Petroleum & Natural Gas, Navy MARSEC, and PSU refining heads.
   - **Action:** Impose mandatory yield optimization: instruct all refineries to maximize diesel and aviation turbine fuel (ATF) output over discretionary petrochemical feedstocks.

2. **Strategic Reserve Phase-1 & Phase-2 Mobilization:**
   - Authorize immediate release from all three Phase-1 caverns (`5.33 MMT` total) and initiate emergency access to commercial cavern reserves (`2.5 MMT`).
   - *Impact:* Guarantees **45 days of uninterrupted national energy supply** independent of Arabian Gulf maritime transit.

3. **Emergency Bilateral G2G Procurement:**
   - Invoke strategic bilateral energy protocols with non-chokepoint producers:
     - **West Africa:** Nigeria, Angola (`3.0 MMT spot allocations`)
     - **Latin America:** Brazil, Colombia (`1.5 MMT heavy/medium blends`)
     - **Domestic & Offshore:** Maximize immediate ramp-up at KG-D6 and Mumbai High offshore platforms.

---

#### National Defense & Economic Defense Protocols:
- **Naval Escort Request:** Request Indian Navy Western Fleet armed escort for national flag carriers operating in the Arabian Sea / Arabian Gulf approaches.
- **Consumer Shielding:** Activate Price Stabilization Fund mechanisms to absorb crude procurement premiums without triggering domestic retail inflation shocks."""
}


async def generate_procurement_brief(
    scenario: Optional[str] = None,
    corridor_id: Optional[str] = None,
    custom_query: Optional[str] = None,
) -> CopilotResponse:
    active_sc = scenario if scenario in ["baseline", "A", "B", "C"] else get_active_scenario()
    dsi_data = get_current_dsi()

    # If no Anthropic API key is provided, or for fast reliable demoing, use our high-fidelity fallback cache
    api_key = settings.ANTHROPIC_API_KEY.strip()
    if not api_key:
        brief_text = CACHE_FALLBACK_BRIEFS.get(active_sc, CACHE_FALLBACK_BRIEFS["baseline"])
        if custom_query:
            brief_text += f"\n\n---\n*Note: Custom query (`{custom_query}`) acknowledged. Anthropic live generation disabled (using cached strategic brief).* "
        return CopilotResponse(
            brief_markdown=brief_text,
            generated_at=datetime.now(timezone.utc),
            source="cache_fallback",
            scenario=active_sc,
            model_used="demo-cache-v1",
        )

    # Prepare system & prompt context for live Claude generation
    system_prompt = (
        "You are INDRA Copilot, India's National Disruption Response Architecture AI advisor. "
        "Your role is to produce rigorous, actionable, executive-ready Strategic Procurement Briefs for Indian "
        "oil refinery operators (IOCL, BPCL, HPCL, MRPL, Reliance) and Ministry of Petroleum officials. "
        "Structure your brief clearly in Markdown with: Executive Summary, Immediate Procurement Actions (0-72 Hours), "
        "and Risk/Freight Outlook. Use precise metrics, Indian strategic petroleum reserve (SPR) context, and shipping logistics."
    )

    corridor_summaries = "\n".join([
        f"- **{c.name} (`{c.corridor_id}`)**: DSI = `{c.dsi}` ({c.threshold.upper()}), Vessel Count = `{c.vessel_count}`, "
        f"Components = [Tanker Density: {c.components.tanker_density}, Geopolitical: {c.components.geopolitical}, "
        f"Price Deviation: {c.components.price_deviation}, Sanctions: {c.components.sanctions}]"
        for c in dsi_data.corridors
    ])

    user_prompt = (
        f"Generate a Strategic Procurement Brief based on the following real-time INDRA telemetry:\n"
        f"**Active Scenario:** `{active_sc}` ({dsi_data.system_mode.upper()} MODE)\n"
        f"**Corridor Metrics:**\n{corridor_summaries}\n"
    )
    if corridor_id:
        user_prompt += f"\n**Focus Corridor:** Please emphasize mitigation strategies specifically for `{corridor_id}`.\n"
    if custom_query:
        user_prompt += f"\n**Specific Policy Query from Operator:** {custom_query}\n"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1500,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                content_list = data.get("content", [])
                brief_text = content_list[0].get("text", "") if content_list else ""
                if brief_text:
                    return CopilotResponse(
                        brief_markdown=brief_text,
                        generated_at=datetime.now(timezone.utc),
                        source="anthropic",
                        scenario=active_sc,
                        model_used="claude-3-haiku-20240307",
                    )
    except Exception as e:
        print(f"Anthropic API fallback triggered: {e}")

    # Fallback if Anthropic call fails
    return CopilotResponse(
        brief_markdown=CACHE_FALLBACK_BRIEFS.get(active_sc, CACHE_FALLBACK_BRIEFS["baseline"]),
        generated_at=datetime.now(timezone.utc),
        source="cache_fallback",
        scenario=active_sc,
        model_used="demo-cache-v1",
    )
