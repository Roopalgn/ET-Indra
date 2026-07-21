/**
 * INDRA — Main Application
 * Phase 4 layout: header (Scenario HUD + Copilot trigger) + map + 5-tab dynamic DSI sidebar
 */
import { useState } from 'react'
import './styles/globals.css'
import { useDSI } from './hooks/useDSI'
import Header from './components/Layout/Header'
import MapView from './components/Map/index'
import DSIGauges from './components/DSIGauges/index'
import CopilotPanel from './components/Copilot/CopilotPanel'
import HistoryChart from './components/History/HistoryChart'
import SPRWidget from './components/SPR/SPRWidget'
import ScenarioSliders from './components/Sliders/ScenarioSliders'
import styles from './App.module.css'

export default function App() {
  const {
    data,
    loading,
    error,
    lastUpdated,
    activeScenario,
    scenarioDescription,
    switchScenario,
  } = useDSI()

  const [sidebarTab, setSidebarTab] = useState('telemetry') // 'telemetry' | 'trends' | 'spr' | 'sliders' | 'copilot'

  return (
    <div className={styles.shell}>
      {/* Fixed top navigation + Scenario HUD + Copilot Trigger */}
      <Header
        systemMode={data?.system_mode ?? 'synthetic'}
        lastUpdated={lastUpdated}
        activeScenario={activeScenario}
        scenarioDescription={scenarioDescription}
        onSwitchScenario={switchScenario}
        onOpenCopilot={() => setSidebarTab('copilot')}
      />

      {/* Main content area (below header/banner) */}
      <main className={`${styles.main} ${activeScenario !== 'baseline' ? styles.mainWithBanner : ''}`}>
        {/* Map panel */}
        <section className={styles.mapPanel} aria-label="Shipping corridor map">
          <MapView corridorData={data} />
        </section>

        {/* DSI multi-view sidebar */}
        <aside
          className={`${styles.sidebar} ${sidebarTab !== 'telemetry' ? styles.sidebarExpanded : ''}`}
          aria-label="Intelligence & Telemetry Sidebar"
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.tabGroup} role="tablist" aria-label="Sidebar Mode">
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'telemetry'}
                className={`${styles.tabBtn} ${sidebarTab === 'telemetry' ? styles.tabBtnActive : ''}`}
                onClick={() => setSidebarTab('telemetry')}
              >
                📊 GAUGES
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'trends'}
                className={`${styles.tabBtn} ${sidebarTab === 'trends' ? styles.tabBtnActive : ''}`}
                onClick={() => setSidebarTab('trends')}
              >
                📈 7D TRENDS
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'spr'}
                className={`${styles.tabBtn} ${sidebarTab === 'spr' ? styles.tabBtnActive : ''}`}
                onClick={() => setSidebarTab('spr')}
              >
                🛢️ SPR
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'sliders'}
                className={`${styles.tabBtn} ${sidebarTab === 'sliders' ? styles.tabBtnActive : ''}`}
                onClick={() => setSidebarTab('sliders')}
              >
                ⚙️ SANDBOX
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'copilot'}
                className={`${styles.tabBtn} ${sidebarTab === 'copilot' ? styles.tabBtnCopilotActive : ''}`}
                onClick={() => setSidebarTab('copilot')}
              >
                ⚡ COPILOT
              </button>
            </div>
            {error && (
              <div className={styles.errorBanner} role="alert">
                Backend unreachable — showing cached values
              </div>
            )}
          </div>

          {sidebarTab === 'telemetry' && <DSIGauges data={data} loading={loading && !data} />}
          {sidebarTab === 'trends' && <HistoryChart />}
          {sidebarTab === 'spr' && <SPRWidget activeScenario={activeScenario} />}
          {sidebarTab === 'sliders' && <ScenarioSliders corridorData={data} />}
          {sidebarTab === 'copilot' && <CopilotPanel activeScenario={activeScenario} corridorData={data} />}
        </aside>
      </main>
    </div>
  )
}


