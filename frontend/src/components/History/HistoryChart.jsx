/**
 * INDRA — 7-Day DSI Historical Trend Chart (Phase 4)
 * Multi-corridor SVG visualization with interactive hover tooltips, threshold bands, and corridor filter chips.
 */
import { useState } from 'react'
import { useHistory } from '../../hooks/useHistory'
import { thresholdColor } from '../../hooks/useDSI'
import styles from './HistoryChart.module.css'

const CORRIDOR_META = {
  hormuz: { name: 'Strait of Hormuz', color: '#EF4444' },
  red_sea: { name: 'Red Sea / Bab el-Mandeb', color: '#F97316' },
  cape: { name: 'Cape of Good Hope', color: '#06B6D4' },
}

export default function HistoryChart() {
  const { historyData, loading, error, refetchHistory } = useHistory()
  const [selectedCorridor, setSelectedCorridor] = useState('all') // 'all' | 'hormuz' | 'red_sea' | 'cape'
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonChart} />
      </div>
    )
  }

  if (error || !historyData?.corridors) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <span>⚠️</span>
          <p>{error || 'Historical telemetry currently unavailable.'}</p>
          <button onClick={refetchHistory} className={styles.retryBtn}>Retry</button>
        </div>
      </div>
    )
  }

  // Use up to 28 data points per corridor for rendering
  const corridors = historyData.corridors
  const sampleCorridor = corridors.hormuz || corridors.red_sea || corridors.cape || []
  const numPoints = sampleCorridor.length

  if (numPoints === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyText}>No historical data recorded yet.</p>
      </div>
    )
  }

  // Chart dimensions
  const width = 360
  const height = 200
  const padX = 35
  const padY = 25
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const getX = (index) => padX + (index / (numPoints - 1 || 1)) * chartW
  const getY = (dsi) => padY + chartH - dsi * chartH

  // Build SVG path strings
  const paths = {}
  Object.keys(corridors).forEach((key) => {
    const pts = corridors[key]
    if (!pts || pts.length === 0) return
    const pathStr = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.dsi).toFixed(1)}`)
      .join(' ')
    paths[key] = pathStr
  })

  return (
    <div className={styles.container}>
      {/* Header Controls */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>7-Day DSI Telemetry Trends</h3>
          <p className={styles.subtitle}>28-point historical escalation curves across major maritime chokepoints</p>
        </div>
        <button onClick={refetchHistory} className={styles.refreshBtn} title="Refresh telemetry">
          🔄
        </button>
      </div>

      {/* Corridor Filter Chips */}
      <div className={styles.chips}>
        <button
          type="button"
          className={`${styles.chip} ${selectedCorridor === 'all' ? styles.chipActive : ''}`}
          onClick={() => setSelectedCorridor('all')}
        >
          ALL CORRIDORS
        </button>
        {Object.keys(CORRIDOR_META).map((key) => {
          const meta = CORRIDOR_META[key]
          return (
            <button
              key={key}
              type="button"
              className={`${styles.chip} ${selectedCorridor === key ? styles.chipActive : ''}`}
              style={{ '--chip-color': meta.color }}
              onClick={() => setSelectedCorridor(key)}
            >
              <span className={styles.chipDot} style={{ background: meta.color }} />
              {meta.name.split(' /')[0]}
            </button>
          )
        })}
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className={styles.chartWrapper}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svgChart}
          onMouseLeave={() => setHoveredPoint(null)}
          role="img"
          aria-label="7-day DSI trend visualization"
        >
          {/* Grid lines and labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
            const y = getY(val)
            return (
              <g key={val}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="3,3"
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {(val * 100).toFixed(0)}%
                </text>
              </g>
            )
          })}

          {/* Threshold Zone Backgrounds */}
          <rect x={padX} y={getY(1.0)} width={chartW} height={chartH * 0.2} fill="rgba(239, 68, 68, 0.05)" />
          <rect x={padX} y={getY(0.8)} width={chartW} height={chartH * 0.3} fill="rgba(249, 115, 22, 0.04)" />

          {/* Corridor Lines */}
          {Object.keys(paths).map((key) => {
            if (selectedCorridor !== 'all' && selectedCorridor !== key) return null
            const meta = CORRIDOR_META[key]
            const pathStr = paths[key]
            return (
              <g key={key}>
                <path
                  d={pathStr}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={selectedCorridor === key ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 6px ${meta.color}80)` }}
                />
                {/* Interactive hover targets */}
                {corridors[key].map((p, idx) => {
                  const cx = getX(idx)
                  const cy = getY(p.dsi)
                  const isHovered = hoveredPoint?.corridor === key && hoveredPoint?.index === idx
                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5 : 3}
                      fill={isHovered ? '#FFFFFF' : meta.color}
                      stroke={isHovered ? meta.color : 'none'}
                      strokeWidth={isHovered ? 2 : 0}
                      className={styles.pointHitbox}
                      onMouseEnter={() => setHoveredPoint({ corridor: key, index: idx, point: p, x: cx, y: cy })}
                    />
                  )
                })}
              </g>
            )}
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className={styles.tooltipCard}
            style={{
              left: Math.min(width - 160, Math.max(10, hoveredPoint.x - 70)),
              top: Math.max(10, hoveredPoint.y - 65),
            }}
          >
            <div className={styles.ttHeader}>
              <span className={styles.ttColor} style={{ background: CORRIDOR_META[hoveredPoint.corridor].color }} />
              <strong>{CORRIDOR_META[hoveredPoint.corridor].name.split(' /')[0]}</strong>
            </div>
            <div className={styles.ttRow}>
              <span>DSI Score:</span>
              <strong style={{ color: thresholdColor(hoveredPoint.point.threshold) }}>
                {(hoveredPoint.point.dsi * 100).toFixed(1)}% ({hoveredPoint.point.threshold.toUpperCase()})
              </strong>
            </div>
            <div className={styles.ttRow}>
              <span>Vessel Traffic:</span>
              <span>{hoveredPoint.point.vessel_count} tankers</span>
            </div>
            <div className={styles.ttTime}>
              {new Date(hoveredPoint.point.timestamp).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary */}
      <div className={styles.legend}>
        <span>⚠️ <strong>Critical (&gt;80%):</strong> Red Sea sustained high risk due to Bab el-Mandeb threats.</span>
      </div>
    </div>
  )
}
