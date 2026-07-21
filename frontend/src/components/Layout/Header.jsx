/**
 * INDRA — Application Header
 * Fixed top bar with glassmorphism + interactive Scenario HUD + data source badge
 */
import styles from './Header.module.css'

const SCENARIOS = [
  { id: 'baseline', label: 'Baseline (Live/Mixed)', short: 'BASE' },
  { id: 'A', label: 'A: Hormuz Closure', short: 'HORMUZ' },
  { id: 'B', label: 'B: Red Sea Blockade', short: 'RED SEA' },
  { id: 'C', label: 'C: Full Crisis', short: 'CRISIS' },
]

export default function Header({
  systemMode,
  lastUpdated,
  activeScenario = 'baseline',
  scenarioDescription,
  onSwitchScenario,
  onOpenCopilot,
}) {
  const isLive = systemMode === 'live'
  const isMixed = systemMode === 'mixed'

  const badgeText = isLive ? 'LIVE DATA' : isMixed ? 'MIXED' : 'SYNTHETIC — DEMO'
  const badgeClass = isLive ? 'live' : 'synthetic'

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  return (
    <>
      <header className={styles.header} role="banner">
        <div className={styles.inner}>
          {/* Brand */}
          <div className={styles.brand}>
            <span className={styles.brandAcronym}>INDRA</span>
            <span className={styles.brandFull}>
              India&rsquo;s National Disruption Response Architecture
            </span>
          </div>

          {/* Interactive Scenario HUD Controls + Copilot Quick Trigger */}
          <div className={styles.scenarioGroup} role="group" aria-label="Interactive Scenario Simulation">
            <span className={styles.scenarioTitle}>SCENARIO ENGINE:</span>
            <div className={styles.scenarioButtons}>
              {SCENARIOS.map((sc) => {
                const isActive = activeScenario === sc.id
                return (
                  <button
                    key={sc.id}
                    type="button"
                    className={`${styles.scBtn} ${isActive ? styles.scBtnActive : ''} ${sc.id !== 'baseline' && isActive ? styles.scBtnAlert : ''}`}
                    onClick={() => onSwitchScenario && onSwitchScenario(sc.id)}
                    title={sc.label}
                  >
                    {sc.id === 'baseline' ? sc.label : `${sc.id}: ${sc.short}`}
                  </button>
                )
              })}
              {onOpenCopilot && (
                <button
                  type="button"
                  className={styles.copilotTrigger}
                  onClick={onOpenCopilot}
                  title="Open Strategic Procurement Copilot"
                >
                  ⚡ AI COPILOT
                </button>
              )}
            </div>
          </div>


          {/* Right cluster */}
          <div className={styles.right}>
            <span className={`data-badge ${badgeClass}`} aria-label={`Data source: ${badgeText}`}>
              {(isLive || isMixed) && (
                <span className="live-dot-pulse" aria-hidden="true">
                  <span className="live-dot" />
                </span>
              )}
              {badgeText}
            </span>

            <div className={styles.timestamp}>
              <span className={styles.tsLabel}>UPDATED</span>
              <span className={styles.tsValue} style={{ fontFamily: 'var(--font-mono)' }}>
                {timeStr}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Active Scenario Alert Banner when not in baseline */}
      {activeScenario !== 'baseline' && (
        <div className={styles.scenarioBanner} role="alert">
          <div className={styles.bannerInner}>
            <span className={styles.bannerIcon}>⚠️</span>
            <span className={styles.bannerText}>
              <strong>SCENARIO {activeScenario} ACTIVE:</strong> {scenarioDescription}
            </span>
            <button
              type="button"
              className={styles.bannerReset}
              onClick={() => onSwitchScenario && onSwitchScenario('baseline')}
            >
              Reset to Baseline
            </button>
          </div>
        </div>
      )}
    </>
  )
}
