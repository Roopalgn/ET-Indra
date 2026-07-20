/**
 * INDRA — Main Application
 * Phase 2 layout: header (with interactive Scenario HUD) + map + DSI gauge sidebar
 */
import './styles/globals.css'
import { useDSI } from './hooks/useDSI'
import Header from './components/Layout/Header'
import MapView from './components/Map/index'
import DSIGauges from './components/DSIGauges/index'
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

  return (
    <div className={styles.shell}>
      {/* Fixed top navigation + Scenario HUD */}
      <Header
        systemMode={data?.system_mode ?? 'synthetic'}
        lastUpdated={lastUpdated}
        activeScenario={activeScenario}
        scenarioDescription={scenarioDescription}
        onSwitchScenario={switchScenario}
      />

      {/* Main content area (below header/banner) */}
      <main className={`${styles.main} ${activeScenario !== 'baseline' ? styles.mainWithBanner : ''}`}>
        {/* Map panel */}
        <section className={styles.mapPanel} aria-label="Shipping corridor map">
          <MapView corridorData={data} />
        </section>

        {/* DSI sidebar */}
        <aside className={styles.sidebar} aria-label="Disruption Signal Index">
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>
              Disruption Signal Index
            </h2>
            {error && (
              <div className={styles.errorBanner} role="alert">
                Backend unreachable — showing cached values
              </div>
            )}
          </div>
          <DSIGauges data={data} loading={loading && !data} />
        </aside>
      </main>
    </div>
  )
}
