/**
 * INDRA — Main Application
 * Phase 1 layout: header + map (75%) + DSI gauge sidebar (25%)
 */
import './styles/globals.css'
import { useDSI } from './hooks/useDSI'
import Header from './components/Layout/Header'
import MapView from './components/Map/index'
import DSIGauges from './components/DSIGauges/index'
import styles from './App.module.css'

export default function App() {
  const { data, loading, error, lastUpdated } = useDSI()

  return (
    <div className={styles.shell}>
      {/* Fixed top navigation */}
      <Header
        systemMode={data?.system_mode ?? 'synthetic'}
        lastUpdated={lastUpdated}
      />

      {/* Main content area (below 52px header) */}
      <main className={styles.main}>
        {/* Map panel — takes most of the viewport */}
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
