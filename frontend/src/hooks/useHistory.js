/**
 * useHistory — React hook for fetching 7-day historical DSI trend curves per corridor.
 */
import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

export function useHistory() {
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setHistoryData(json)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load DSI history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return { historyData, loading, error, refetchHistory: fetchHistory }
}
