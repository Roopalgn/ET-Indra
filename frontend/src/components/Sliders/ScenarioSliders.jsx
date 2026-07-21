/**
 * INDRA — Interactive Sensitivity Sliders (Phase 4 Demo Adjustment)
 * Enables live adjustments of DSI component weights & telemetry overrides during executive pitch.
 */
import { useState } from 'react'
import { thresholdColor } from '../../hooks/useDSI'
import styles from './ScenarioSliders.module.css'

export default function ScenarioSliders({ corridorData }) {
  // Component Weights (standard composite formula: 0.35 + 0.30 + 0.20 + 0.15 = 1.0)
  const [wTanker, setWTanker] = useState(0.35)
  const [wGeo, setWGeo] = useState(0.30)
  const [wPrice, setWPrice] = useState(0.20)
  const [wSanctions, setWSanctions] = useState(0.15)

  // Demo Override Sliders (0.0 – 1.0)
  const [valTanker, setValTanker] = useState(0.20)
  const [valGeo, setValGeo] = useState(0.85)
  const [valPrice, setValPrice] = useState(0.70)
  const [valSanctions, setValSanctions] = useState(0.40)

  // Compute live weighted composite DSI
  const totalWeight = wTanker + wGeo + wPrice + wSanctions || 1
  const rawDSI = (
    valTanker * (1 - wTanker / totalWeight) + // Note: low tanker density increases disruption risk
    valGeo * (wGeo / totalWeight) +
    valPrice * (wPrice / totalWeight) +
    valSanctions * (wSanctions / totalWeight)
  )
  const compositeDSI = Math.min(1.0, Math.max(0.0, rawDSI))

  const threshold =
    compositeDSI >= 0.8
      ? 'critical'
      : compositeDSI >= 0.65
      ? 'high'
      : compositeDSI >= 0.45
      ? 'elevated'
      : 'normal'

  const color = thresholdColor(threshold)

  const handleReset = () => {
    setWTanker(0.35)
    setWGeo(0.30)
    setWPrice(0.20)
    setWSanctions(0.15)
    setValTanker(0.20)
    setValGeo(0.85)
    setValPrice(0.70)
    setValSanctions(0.40)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>⚙️ Interactive Sensitivity Sandbox</h3>
          <p className={styles.subtitle}>Adjust telemetry parameters & weights to simulate policy tipping points</p>
        </div>
        <button type="button" onClick={handleReset} className={styles.resetBtn}>
          Reset Defaults
        </button>
      </div>

      {/* Live Preview Gauge */}
      <div className={styles.previewCard} style={{ '--status-color': color }}>
        <div className={styles.previewInfo}>
          <span className={styles.previewLabel}>SIMULATED COMPOSITE DSI</span>
          <div className={styles.previewScore}>
            <span className={styles.scoreText} style={{ color }}>
              {(compositeDSI * 100).toFixed(1)}%
            </span>
            <span
              className={styles.thresholdBadge}
              style={{ color, borderColor: `${color}50`, background: `${color}18` }}
            >
              {threshold.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={styles.formulaDesc}>
          <span>Formula: Weighted sum of real-time multi-sensor inputs (`AIS` + `EIA` + `Geopolitical Intelligence`).</span>
        </div>
      </div>

      {/* Slider Controls Grid */}
      <div className={styles.sliderSection}>
        <h4 className={styles.sectionTitle}>Telemetry Input Overrides</h4>
        <div className={styles.slidersList}>
          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Tanker Traffic Density (AIS)</span>
              <strong>{(valTanker * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={valTanker}
              onChange={(e) => setValTanker(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Geopolitical Threat Index</span>
              <strong>{(valGeo * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={valGeo}
              onChange={(e) => setValGeo(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>EIA Oil Price Deviation ($/bbl surge)</span>
              <strong>{(valPrice * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={valPrice}
              onChange={(e) => setValPrice(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Sanctions Enforcement Intensity</span>
              <strong>{(valSanctions * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={valSanctions}
              onChange={(e) => setValSanctions(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
