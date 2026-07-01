/**
 * WeightTooltip — (?) icon that shows DSI weight configuration on click.
 * Required per spec: "Demonstration weighting — adjustable"
 */
import { useState, useRef, useEffect } from 'react'
import styles from './WeightTooltip.module.css'

const WEIGHTS = [
  { label: 'Tanker Density', weight: '40%', note: 'Vessel traffic vs. baseline' },
  { label: 'Geopolitical',   weight: '35%', note: 'GDELT sentiment & events' },
  { label: 'Price Deviation', weight: '15%', note: 'Brent vs. 90-day MA' },
  { label: 'Sanctions',       weight: '10%', note: 'Sovereign entity flags' },
]

export default function WeightTooltip() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-label="DSI weight configuration"
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div className={styles.panel} role="tooltip">
          <p className={styles.header}>DSI Weight Configuration</p>
          <p className={styles.note}>Demonstration weighting — adjustable</p>
          {WEIGHTS.map(w => (
            <div key={w.label} className={styles.row}>
              <span className={styles.label}>{w.label}</span>
              <span className={styles.weight}>{w.weight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
