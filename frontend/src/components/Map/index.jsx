/**
 * INDRA Map Component — Deck.gl with Carto Dark Matter tiles
 *
 * CARTO TILES CONFIRMATION:
 *   Using free raster CDN tiles: https://{a,b,c,d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
 *   This does NOT use the Carto Maps API (which requires auth/API key).
 *   No API key needed. Works in any browser and with Deck.gl TileLayer + BitmapLayer.
 *   If any future dependency tries to use the Maps API (api.carto.com/v3/*), we stop and flag it.
 *
 * Layers:
 *   1. TileLayer  — Carto Dark Matter basemap (free, no auth)
 *   2. PathLayer  — Three shipping corridors coloured by DSI threshold
 *   3. ScatterplotLayer — VLCC tanker positions (synthetic glowing dots)
 *   4. IconLayer  — 8 major Indian ports (triangle markers)
 *
 * Map interaction:
 *   - Hover corridor → tooltip with DSI value + name
 *   - Hover port → tooltip with port name
 */
import { useState, useCallback, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer, PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { thresholdColor } from '../../hooks/useDSI'
import styles from './Map.module.css'

/* --- Carto free raster tile URLs (4 CDN subdomains for parallelism) --- */
const CARTO_TILES = [
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
]

/* --- Shipping corridor path data ---
   Simplified route lines showing key bottleneck → Indian Ocean → India
   Coordinates: [longitude, latitude] */
const CORRIDOR_PATHS = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    path: [
      [56.4, 26.3], [57.0, 26.5], [57.8, 26.4], [58.5, 26.0],
      [59.5, 25.0], [60.5, 23.0], [62.0, 19.5], [64.0, 16.0],
      [66.0, 12.5], [67.5, 10.5], [69.0, 9.5], [71.0, 10.0],
      [72.9, 18.9], // → JNPT
    ],
  },
  {
    id: 'red_sea',
    name: 'Red Sea / Bab-el-Mandeb',
    path: [
      [32.3, 29.8], [33.5, 27.0], [35.0, 23.5], [37.0, 19.0],
      [39.5, 14.5], [41.5, 12.0], [43.5, 11.5], [45.5, 11.0],
      [48.0, 11.5], [51.0, 11.5], [54.5, 12.0], [57.5, 13.5],
      [60.5, 13.0], [63.0, 10.5], [65.5, 9.0], [67.5, 9.5],
      [69.5, 9.8], [70.5, 10.2], [72.9, 18.9], // → JNPT
    ],
  },
  {
    id: 'cape',
    name: 'Cape of Good Hope',
    path: [
      [18.5, -34.2], [21.0, -35.0], [25.0, -34.0], [30.0, -31.0],
      [35.5, -26.0], [40.0, -21.0], [44.5, -16.0], [48.5, -13.0],
      [52.0, -11.5], [55.5, -11.0], [58.5, -9.0], [61.0, -7.5],
      [63.5, -6.5], [65.5, -6.5], [67.5, -7.0], [69.5, -8.0],
      [70.5, -9.0], [71.0, -10.5], [72.9, 18.9], // → JNPT (long haul)
    ],
  },
]

/* --- Major Indian refinery-linked ports ---
   Coordinates: [longitude, latitude] */
const PORTS = [
  { id: 'mundra',   name: 'Mundra',      lon: 69.72,  lat: 22.84, type: 'major' },
  { id: 'jnpt',     name: 'JNPT',        lon: 72.94,  lat: 18.95, type: 'major' },
  { id: 'vizag',    name: 'Vizag',        lon: 83.28,  lat: 17.69, type: 'major' },
  { id: 'paradip',  name: 'Paradip',      lon: 86.61,  lat: 20.32, type: 'major' },
  { id: 'mangalore',name: 'Mangalore',    lon: 74.89,  lat: 12.91, type: 'major' },
  { id: 'kochi',    name: 'Kochi',        lon: 76.27,  lat: 9.93,  type: 'major' },
  { id: 'hazira',   name: 'Hazira',       lon: 72.64,  lat: 21.11, type: 'major' },
  { id: 'ennore',   name: 'Ennore',       lon: 80.33,  lat: 13.21, type: 'major' },
]

/* --- Synthetic tanker positions (Phase 1) ---
   Positioned along corridor paths, will be replaced by live AISstream data */
const SYNTHETIC_TANKERS = [
  // Hormuz cluster
  { mmsi: '311000001', lon: 57.2,  lat: 26.4, speed: 14.2 },
  { mmsi: '311000002', lon: 58.8,  lat: 25.6, speed: 12.8 },
  { mmsi: '311000003', lon: 60.1,  lat: 23.5, speed: 13.5 },
  { mmsi: '311000004', lon: 62.3,  lat: 20.0, speed: 14.8 },
  // Red Sea cluster
  { mmsi: '311000005', lon: 33.8,  lat: 27.5, speed: 11.2 },
  { mmsi: '311000006', lon: 38.5,  lat: 15.8, speed: 12.0 },
  { mmsi: '311000007', lon: 43.0,  lat: 11.8, speed: 10.5 },
  { mmsi: '311000008', lon: 52.0,  lat: 11.5, speed: 13.2 },
  { mmsi: '311000009', lon: 58.5,  lat: 13.0, speed: 12.5 },
  // Cape cluster
  { mmsi: '311000010', lon: 19.5,  lat: -34.5, speed: 14.0 },
  { mmsi: '311000011', lon: 27.0,  lat: -32.0, speed: 13.8 },
  { mmsi: '311000012', lon: 36.0,  lat: -24.0, speed: 14.5 },
]

/* --- Initial viewport: centres on Indian Ocean --- */
const INITIAL_VIEW = {
  longitude: 60.0,
  latitude: 12.0,
  zoom: 3.2,
  pitch: 20,
  bearing: 0,
}

export default function MapView({ corridorData }) {
  const [tooltip, setTooltip] = useState(null)
  const [viewState, setViewState] = useState(INITIAL_VIEW)

  /* Build corridor DSI lookup from API data */
  const dsiByCorridorId = useMemo(() => {
    if (!corridorData?.corridors) return {}
    return Object.fromEntries(corridorData.corridors.map(c => [c.corridor_id, c]))
  }, [corridorData])

  /* Enrich path data with current DSI */
  const enrichedPaths = useMemo(() =>
    CORRIDOR_PATHS.map(cp => ({
      ...cp,
      dsi: dsiByCorridorId[cp.id]?.dsi ?? 0.5,
      threshold: dsiByCorridorId[cp.id]?.threshold ?? 'elevated',
    })),
    [dsiByCorridorId]
  )

  /* --- Carto Dark Matter basemap via TileLayer + BitmapLayer (FREE, NO AUTH) --- */
  const basemapLayer = new TileLayer({
    id: 'carto-dark-matter',
    data: CARTO_TILES,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile
      const [[west, south], [east, north]] = boundingBox
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      })
    },
  })

  /* --- Corridor path layer --- */
  const corridorLayer = new PathLayer({
    id: 'shipping-corridors',
    data: enrichedPaths,
    getPath: d => d.path,
    getColor: d => {
      const hex = thresholdColor(d.threshold)
      // Parse hex to [r, g, b, a]
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b, 200]
    },
    getWidth: 3,
    widthMinPixels: 2,
    widthMaxPixels: 6,
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (object) {
        const info = dsiByCorridorId[object.id]
        setTooltip({
          x, y,
          title: object.name,
          dsi: info?.dsi?.toFixed(3) ?? '--',
          threshold: info?.threshold ?? '--',
          vessels: info?.vessel_count ?? '--',
          source: info?.data_source ?? 'synthetic',
        })
      } else {
        setTooltip(null)
      }
    },
    transitions: { getColor: { duration: 600 } },
  })

  /* --- Tanker dots layer --- */
  const tankerLayer = new ScatterplotLayer({
    id: 'tanker-positions',
    data: SYNTHETIC_TANKERS,
    getPosition: d => [d.lon, d.lat],
    getRadius: 18000,
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    getFillColor: [0, 191, 255, 200],
    getLineColor: [0, 191, 255, 60],
    lineWidthMinPixels: 1,
    stroked: true,
    pickable: false,
  })

  /* --- Port markers layer --- */
  const portLayer = new ScatterplotLayer({
    id: 'indian-ports',
    data: PORTS,
    getPosition: d => [d.lon, d.lat],
    getRadius: 25000,
    radiusMinPixels: 7,
    radiusMaxPixels: 16,
    getFillColor: [255, 200, 50, 230],
    getLineColor: [255, 200, 50, 100],
    lineWidthMinPixels: 2,
    stroked: true,
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (object) {
        setTooltip({ x, y, title: object.name, isPort: true })
      } else {
        setTooltip(null)
      }
    },
  })

  /* --- Port name labels --- */
  const portLabelLayer = new TextLayer({
    id: 'port-labels',
    data: PORTS,
    getPosition: d => [d.lon, d.lat + 0.8],
    getText: d => d.name,
    getSize: 11,
    getColor: [255, 200, 50, 200],
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'bottom',
    sizeUnits: 'pixels',
    pickable: false,
  })

  const layers = [basemapLayer, corridorLayer, tankerLayer, portLayer, portLabelLayer]

  return (
    <div className={styles.mapWrapper} aria-label="Shipping corridor map">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs)}
        controller={true}
        layers={layers}
        style={{ position: 'absolute', inset: 0 }}
        getCursor={({ isDragging }) => isDragging ? 'grabbing' : 'crosshair'}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          role="tooltip"
        >
          <div className={styles.tooltipTitle}>{tooltip.title}</div>
          {!tooltip.isPort && (
            <>
              <div className={styles.tooltipRow}>
                <span>DSI</span>
                <span
                  className={styles.tooltipValue}
                  style={{ color: thresholdColor(tooltip.threshold) }}
                >
                  {tooltip.dsi}
                </span>
              </div>
              <div className={styles.tooltipRow}>
                <span>Status</span>
                <span style={{ color: thresholdColor(tooltip.threshold), textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em' }}>
                  {tooltip.threshold}
                </span>
              </div>
              <div className={styles.tooltipRow}>
                <span>Vessels</span>
                <span className={styles.tooltipValue}>{tooltip.vessels}</span>
              </div>
              <div className={`data-badge ${tooltip.source}`} style={{ marginTop: 6 }}>
                {tooltip.source}
              </div>
            </>
          )}
        </div>
      )}

      {/* Corridor legend overlay */}
      <div className={styles.legend} aria-label="Corridor DSI legend">
        {enrichedPaths.map(c => (
          <div key={c.id} className={styles.legendRow}>
            <span
              className={styles.legendDot}
              style={{ background: thresholdColor(c.threshold) }}
              aria-hidden="true"
            />
            <span className={styles.legendName}>{c.name}</span>
            <span
              className={styles.legendDsi}
              style={{
                fontFamily: 'var(--font-mono)',
                color: thresholdColor(c.threshold),
              }}
            >
              {dsiByCorridorId[c.id]?.dsi?.toFixed(2) ?? '--'}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <span className="data-badge synthetic">SYNTHETIC</span>
        </div>
      </div>

      {/* HUD corner decoration (decorative only) */}
      <div className="hud-corners" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
    </div>
  )
}
