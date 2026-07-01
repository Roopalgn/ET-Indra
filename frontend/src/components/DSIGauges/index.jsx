/**
 * INDRA DSI Gauge Panel
 * Three SVG arc gauges, one per corridor, with glassmorphism cards.
 * Each card shows: arc gauge, DSI value, threshold label, component scores.
 */
import styles from './DSIGauges.module.css'
import { thresholdColor } from '../../hooks/useDSI'
import WeightTooltip from './WeightTooltip'

const ARC_R = 70        // arc radius
const ARC_CX = 90       // arc centre x
const ARC_CY = 85       // arc centre y (flat side up)
const SWEEP = 180       // degrees of arc

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = a => (a * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

function SvgArcGauge({ dsi, threshold }) {
  // 180° arc from left (-180°) to right (0°) — flat side at top
  const startDeg = 180
  const endDeg = 180 + SWEEP * dsi
  const color = thresholdColor(threshold)
  const trackPath = describeArc(ARC_CX, ARC_CY, ARC_R, 180, 360)
  const fillPath = describeArc(ARC_CX, ARC_CY, ARC_R, 180, endDeg)

  return (
    <svg
      width={180}
      height={100}
      viewBox="0 0 180 100"
      aria-label={`DSI gauge: ${(dsi * 100).toFixed(1)}%`}
      role="img"
    >
      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d={fillPath}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'all 0.6s ease' }}
      />
      {/* DSI text */}
      <text
        x={ARC_CX}
        y={ARC_CY - 8}
        textAnchor="middle"
        fill={color}
        fontSize={22}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        style={{ transition: 'fill 0.6s ease' }}
      >
        {dsi.toFixed(2)}
      </text>
      <text
        x={ARC_CX}
        y={ARC_CY + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={9}
        fontFamily="'Inter', sans-serif"
        letterSpacing="0.08em"
      >
        DSI
      </text>
    </svg>
  )
}

function ComponentBar({ label, value, color }) {
  return (
    <div className={styles.compRow}>
      <span className={styles.compLabel}>{label}</span>
      <div className={styles.compTrack}>
        <div
          className={styles.compFill}
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
      <span className={styles.compValue}>{(value * 100).toFixed(0)}</span>
    </div>
  )
}

function DSICard({ corridor }) {
  const { corridor_id, name, dsi, threshold, components, vessel_count, data_source } = corridor
  const color = thresholdColor(threshold)

  const pulseClass = threshold === 'critical'
    ? 'pulse-critical'
    : threshold === 'high'
    ? 'pulse-high'
    : ''

  return (
    <div
      className={`glass-card hud-corners ${styles.card} ${pulseClass}`}
      style={{ '--status-color': color }}
      data-threshold={threshold}
    >
      {/* Card header */}
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.corridorName}>{name}</h3>
          <span
            className={styles.thresholdBadge}
            style={{ color, borderColor: `${color}40`, background: `${color}12` }}
          >
            {threshold.toUpperCase()}
          </span>
        </div>
        <WeightTooltip />
      </div>

      {/* Arc gauge */}
      <div className={styles.gaugeWrapper}>
        <SvgArcGauge dsi={dsi} threshold={threshold} />
      </div>

      {/* Component breakdown */}
      {components && (
        <div className={styles.components}>
          <ComponentBar label="TANKER"  value={components.tanker_density}  color={color} />
          <ComponentBar label="GEO"     value={components.geopolitical}     color={color} />
          <ComponentBar label="PRICE"   value={components.price_deviation}  color={color} />
          <ComponentBar label="SANCT"   value={components.sanctions}        color={color} />
        </div>
      )}

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.vesselCount}>
          {vessel_count} vessels
        </span>
        <span className={`data-badge ${data_source}`}>{data_source}</span>
      </div>
    </div>
  )
}

export default function DSIGauges({ data, loading }) {
  if (loading) {
    return (
      <div className={styles.panelWrapper}>
        {[0, 1, 2].map(i => (
          <div key={i} className={`glass-card ${styles.card} ${styles.skeleton}`} />
        ))}
      </div>
    )
  }

  if (!data?.corridors) return null

  return (
    <div className={styles.panelWrapper} role="region" aria-label="DSI gauge panel">
      {data.corridors.map(c => (
        <DSICard key={c.corridor_id} corridor={c} />
      ))}
    </div>
  )
}
