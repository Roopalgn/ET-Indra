/**
 * INDRA — India Strategic Petroleum Reserve (SPR) Depletion Widget (Phase 4)
 * Models cavern inventory across Visakhapatnam, Mangalore, and Padur under active disruption scenarios.
 */
import { useSPR } from '../../hooks/useSPR'
import styles from './SPRWidget.module.css'

export default function SPRWidget({ activeScenario }) {
  const { sprData, loading, error, refetchSPR } = useSPR(activeScenario)

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonWidget} />
      </div>
    )
  }

  if (error || !sprData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <span>⚠️</span>
          <p>{error || 'SPR telemetry unavailable.'}</p>
          <button onClick={refetchSPR} className={styles.retryBtn}>Retry</button>
        </div>
      </div>
    )
  }

  const {
    total_capacity_mmt,
    total_inventory_mmt,
    total_days_buffer,
    daily_drawdown_rate_mmt,
    facilities,
    scenario,
    recommendation,
  } = sprData

  const fillPct = (total_inventory_mmt / total_capacity_mmt) * 100
  const isEmergency = daily_drawdown_rate_mmt > 0.1 || total_days_buffer < 40
  const isElevated = daily_drawdown_rate_mmt > 0 && !isEmergency

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.sprBadge}>INDIA SPR MONITOR</span>
            <span className={`${styles.statusBadge} ${isEmergency ? styles.statusAlert : isElevated ? styles.statusWarn : styles.statusStable}`}>
              {isEmergency ? '🚨 EMERGENCY DRAWDOWN' : isElevated ? '⚠️ ACTIVE DEFICIT' : '✅ CAVERNS STABLE'}
            </span>
          </div>
          <h3 className={styles.title}>National Strategic Petroleum Reserve</h3>
          <p className={styles.subtitle}>5.33 MMT (~39M barrels) underground rock caverns (ISPRL)</p>
        </div>
      </div>

      {/* Main Buffer Gauge & Summary */}
      <div className={styles.heroCard}>
        <div className={styles.bufferMetrics}>
          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>SURVIVAL BUFFER</span>
            <span className={styles.metricValue} style={{ color: isEmergency ? '#EF4444' : isElevated ? '#F97316' : '#10B981' }}>
              {total_days_buffer.toFixed(1)} <small>days</small>
            </span>
          </div>
          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>DAILY DRAWDOWN</span>
            <span className={styles.metricValue}>
              {daily_drawdown_rate_mmt.toFixed(2)} <small>MMT/d</small>
            </span>
          </div>
          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>TOTAL CAPACITY</span>
            <span className={styles.metricValue}>
              {total_inventory_mmt.toFixed(2)} / {total_capacity_mmt.toFixed(2)} <small>MMT</small>
            </span>
          </div>
        </div>

        {/* Total Tank Bar */}
        <div className={styles.barWrapper}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${fillPct}%`,
                background: isEmergency
                  ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                  : isElevated
                  ? 'linear-gradient(90deg, #F97316, #EA580C)'
                  : 'linear-gradient(90deg, #10B981, #059669)',
              }}
            />
          </div>
          <div className={styles.barLabels}>
            <span>0 MMT</span>
            <span>{fillPct.toFixed(1)}% full</span>
            <span>5.33 MMT</span>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`${styles.recBanner} ${isEmergency ? styles.recEmergency : isElevated ? styles.recWarn : styles.recStable}`} role="region" aria-label="AI SPR Recommendation">
        <div className={styles.recHeader}>
          <span>🤖 AI ACTION BRIEF (SCENARIO {scenario.toUpperCase()}):</span>
        </div>
        <p className={styles.recText}>{recommendation}</p>
      </div>

      {/* Cavern Breakdown Cards */}
      <div className={styles.cavernsGrid}>
        {facilities.map((f, idx) => {
          const cPct = (f.current_inventory_mmt / f.capacity_mmt) * 100
          return (
            <div key={idx} className={styles.cavernCard}>
              <div className={styles.cavernHeader}>
                <strong className={styles.cavernName}>{f.name.split(' (')[0]}</strong>
                <span className={styles.cavernPct}>{cPct.toFixed(1)}%</span>
              </div>
              <div className={styles.cavernBarTrack}>
                <div
                  className={styles.cavernBarFill}
                  style={{ width: `${cPct}%`, background: isEmergency ? '#EF4444' : '#6366F1' }}
                />
              </div>
              <div className={styles.cavernFooter}>
                <span>{f.current_inventory_mmt.toFixed(2)} / {f.capacity_mmt.toFixed(2)} MMT</span>
                <span>Buffer: {f.days_of_buffer.toFixed(0)}d</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Commercial Refinery Note */}
      <div className={styles.footerNote}>
        <span>💡 Combined with commercial inventory at MRPL, IOCL, and BPCL refineries, India holds ~74 days total net import coverage.</span>
      </div>
    </div>
  )
}
