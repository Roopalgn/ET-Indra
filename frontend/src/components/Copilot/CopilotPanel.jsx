/**
 * INDRA — Strategic Procurement Copilot (Phase 3)
 * AI-Native UI with glassmorphism, typing indicator, context cards, and custom query input.
 * Built strictly according to @.agents/skills/ui-ux-pro-max and ui-styling design system rules.
 */
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './CopilotPanel.module.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

export default function CopilotPanel({ activeScenario, corridorData }) {
  const [briefData, setBriefData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [customQuery, setCustomQuery] = useState('')
  const [lastScenario, setLastScenario] = useState(activeScenario)

  const fetchBrief = async (query = null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          scenario: activeScenario,
          custom_query: query || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setBriefData(json)
    } catch (err) {
      setError(err.message || 'Failed to generate AI brief')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on initial mount or when scenario changes significantly
  useEffect(() => {
    if (!briefData || activeScenario !== lastScenario) {
      setLastScenario(activeScenario)
      fetchBrief()
    }
  }, [activeScenario])

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customQuery.trim() || loading) return
    fetchBrief(customQuery.trim())
    setCustomQuery('')
  }

  const timeStr = briefData?.generated_at
    ? new Date(briefData.generated_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--'

  return (
    <div className={styles.container}>
      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.aiBadge}>
            <span className={styles.aiPulse} />
            <span className={styles.aiText}>AI COPILOT</span>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchBrief()}
            disabled={loading}
            title="Regenerate strategic brief"
          >
            {loading ? 'Synthesizing...' : '⚡ Regenerate Brief'}
          </button>
        </div>

        {briefData && !loading && (
          <div className={styles.metaRow}>
            <span className={styles.metaBadge}>
              MODEL: <strong>{briefData.model_used}</strong>
            </span>
            <span className={styles.metaBadge}>
              SOURCE: <strong className={briefData.source === 'anthropic' ? styles.sourceLive : styles.sourceCache}>{briefData.source === 'anthropic' ? 'LIVE CLAUDE' : 'DEMO CACHE'}</strong>
            </span>
            <span className={styles.metaTime}>UPDATED {timeStr}</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.loadingCard}>
            <div className={styles.typingIndicator}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
            <p className={styles.loadingTitle}>
              Synthesizing Telemetry & Strategic Reserves...
            </p>
            <p className={styles.loadingSub}>
              Evaluating active corridor DSI ({activeScenario.toUpperCase()}) + Indian refinery intake margins + EIA price deviation ($18–24/bbl surge).
            </p>
          </div>
        ) : error ? (
          <div className={styles.errorCard} role="alert">
            <span className={styles.errorIcon}>⚠️</span>
            <div>
              <strong>Copilot Connection Notice</strong>
              <p>{error} — Attempting fallback cache recovery...</p>
            </div>
          </div>
        ) : briefData ? (
          <div className={styles.briefCard}>
            <div className={styles.markdownContent}>
              <ReactMarkdown>{briefData.brief_markdown}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Click &ldquo;Regenerate Brief&rdquo; to analyze maritime chokepoints.</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Custom Query Input */}
      <form className={styles.inputArea} onSubmit={handleCustomSubmit}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.inputField}
            placeholder="Ask Copilot (e.g., 'Can MRPL process heavy Venezuelan crude?')"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !customQuery.trim()}
          >
            <span>Ask AI</span>
          </button>
        </div>
      </form>
    </div>
  )
}
