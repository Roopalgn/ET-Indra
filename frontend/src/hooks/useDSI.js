/**
 * useDSI — React hook for polling /api/dsi every 30 seconds.
 * Returns: { data, loading, error, lastUpdated }
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const POLL_INTERVAL = 30_000   // 30 seconds

export function useDSI() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)
  const abortRef = useRef(null)

  const fetchDSI = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`${BACKEND_URL}/api/dsi`, {
        signal: ctrl.signal,
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Fetch failed')
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

  return { data, loading, error, lastUpdated, refetch: fetchDSI }
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
