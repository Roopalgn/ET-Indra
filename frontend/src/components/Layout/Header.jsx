/**
 * INDRA — Application Header
 * Fixed top bar with glassmorphism + data source badge + live indicator
 */
import styles from './Header.module.css'

export default function Header({ systemMode, lastUpdated }) {
  const isLive = systemMode === 'live'
  const isMixed = systemMode === 'mixed'

  const badgeText = isLive ? 'LIVE DATA' : isMixed ? 'MIXED' : 'SYNTHETIC — DEMONSTRATION'
  const badgeClass = isLive ? 'live' : 'synthetic'

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.brandAcronym}>INDRA</span>
          <span className={styles.brandFull}>
            India&rsquo;s National Disruption Response Architecture
          </span>
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
  )
}
