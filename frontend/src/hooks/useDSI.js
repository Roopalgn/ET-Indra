/**
 * useDSI — React hook for polling /api/dsi every 30 seconds and managing interactive scenarios.
 * Returns: { data, loading, error, lastUpdated, activeScenario, scenarioDescription, switchScenario, refetch }
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const POLL_INTERVAL = 30_000   // 30 seconds

export function useDSI() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeScenario, setActiveScenario] = useState('baseline')
  const [scenarioDescription, setScenarioDescription] = useState('Baseline Operating Mode — Live Cape tracking with synthetic base random walk.')
  const timerRef = useRef(null)
  const abortRef = useRef(null)

  const fetchDSI = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`${BACKEND_URL}/api/scenarios`, {
        signal: ctrl.signal,
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.dsi_response)
      setActiveScenario(json.active_scenario || 'baseline')
      setScenarioDescription(json.description || '')
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err.name === 'AbortError') return
      // Fallback to direct /api/dsi if /api/scenarios fails
      try {
        const res2 = await fetch(`${BACKEND_URL}/api/dsi`, {
          signal: ctrl.signal,
          headers: { 'Accept': 'application/json' },
        })
        if (res2.ok) {
          const json2 = await res2.json()
          setData(json2)
          setError(null)
          setLastUpdated(new Date())
          return
        }
      } catch (e2) {
        /* ignore */
      }
      setError(err.message || 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const switchScenario = useCallback(async (scenario) => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ scenario }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.dsi_response)
      setActiveScenario(json.active_scenario)
      setScenarioDescription(json.description)
      setError(null)
      setLastUpdated(new Date())
      return json
    } catch (err) {
      setError(err.message || 'Failed to switch scenario')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDSI()
    timerRef.current = setInterval(fetchDSI, POLL_INTERVAL)
    return () => {
      clearInterval(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchDSI])

  return {
    data,
    loading,
    error,
    lastUpdated,
    activeScenario,
    scenarioDescription,
    switchScenario,
    refetch: fetchDSI,
  }
}

/** Maps threshold string to design token CSS class */
export function thresholdClass(threshold) {
  return {
    normal:   'text-normal',
    elevated: 'text-elevated',
    high:     'text-high',
    critical: 'text-critical',
  }[threshold] ?? 'text-normal'
}

/** Maps threshold to colour hex for SVG/canvas use */
export function thresholdColor(threshold) {
  return {
    normal:   '#22C55E',
    elevated: '#F59E0B',
    high:     '#EF4444',
    critical: '#DC2626',
  }[threshold] ?? '#22C55E'
}
