/**
 * useSPR — React hook for fetching real-time India Strategic Petroleum Reserve depletion metrics.
 */
import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

export function useSPR(activeScenario) {
  const [sprData, setSprData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSPR = async () => {
    setLoading(true)
    try {
      const url = activeScenario && activeScenario !== 'baseline'
        ? `${BACKEND_URL}/api/spr?scenario=${activeScenario}`
        : `${BACKEND_URL}/api/spr`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSprData(json)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load SPR telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSPR()
  }, [activeScenario])

  return { sprData, loading, error, refetchSPR: fetchSPR }
}
