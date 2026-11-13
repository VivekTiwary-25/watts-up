import type { RoomId } from './appliances'

export const TARIFF = {
  slabs: [
    { upTo: 100, rate: 4 },
    { upTo: 200, rate: 6 },
    { upTo: Infinity, rate: 8 },
  ],
  fixedCharge: 100,
  daysPerMonth: 30,
  currency: '₹',
}
export const INVERTER = { name: 'VoltVault 1800', capacityWh: 1800, usableFraction: 0.8 }
export const POWER_CUT = {
  picks: 3,
  minBackupHours: 2,
  costRatePerUnit: 8,
  flickerMs: 1400,
  messageMs: 3500,
}
export const DEFAULT_TARGET_BILL = 1500
export const TARGET_RANGE = { min: 200, max: 5000, step: 50 }
export const HOURS = { min: 0, max: 24, step: 0.5 }
export const TIP_HOURS_CUT = 2
export const SOUND = {
  masterVolume: 0.22,
  click: { enabled: true, volume: 0.18 },
  fan: { enabled: true, volume: 0.035 },
  thunder: { enabled: true, volume: 0.3 },
  powerUp: { enabled: true, volume: 0.1 },
}

/** 3D effect tunables (T08). Colours are hex, intensities are three.js light units. */
export const VISUALS = {
  /** 0..1 easing speed per second for lights/effects (exponential lerp rate). */
  easeRate: 4,
  lights: {
    warm: '#ffc98a',
    warmIntensity: 6,
    warmDistance: 6,
    panel: '#ffe2b0',
    panelIntensity: 2.2,
  },
  ambient: {
    // [lights on, lights off (moonlight), power cut (dark)]
    hemiSky: ['#b8c4d8', '#7d93c4', '#3a4866'],
    hemiIntensity: [0.55, 0.32, 0.06],
    ambientIntensity: [0.25, 0.12, 0.02],
    sun: ['#ffffff', '#a9bce8', '#6d7fae'],
    sunIntensity: [1.6, 0.7, 0.18],
  },
  fan: { maxSpin: 14 },
  tv: { screen: '#cceeff', intensity: 2.5, flicker: 0.12 },
  ac: { haze: '#99ccff', hazeOpacity: 0.14, light: '#8fc8ff', lightIntensity: 3 },
  geyser: { tint: '#ff8a4a', opacity: 0.45, scroll: 0.12 },
  led: { on: '#4dff9a', off: '#3a1d1d', glow: 2.5 },
  microwave: { glow: '#ffb45a', intensity: 1.8 },
  washer: { maxSpin: 9 },
  /** Power-cut pick feedback: red flash on a blocked pick, green halo under picked appliances. */
  pick: {
    blockedColor: '#ff3b3b',
    blockedMs: 600,
    blockedOpacity: 0.55,
    haloColor: '#4dff9a',
    haloOpacity: 0.55,
    haloPulse: 0.2,
  },
  wire: {
    baseWidth: 0.012,
    widthPerWatt: 1 / 25000, // AC (1500 W) ≈ 0.072, light (40 W) ≈ 0.014
    low: '#b6ffe0',
    high: '#ffb36b',
    highWatts: 1500,
    onOpacity: 0.95,
    offOpacity: 0.07,
    flow: 0.6,
    dashScale: 6,
    dashSize: 0.5,
    gapSize: 0.35,
    lift: 2.2,
    liftPerUnit: 0.1,
  },
} as const

/** Render quality tiers + post-processing / atmosphere tunables (T14). */
export const QUALITY = {
  /** Device-pixel-ratio cap per tier. */
  dpr: { high: 1.75, low: 1 },
  /** Floor for performance.regress() while the camera moves (fraction of the tier DPR). */
  regressMin: 0.6,
  /** PerformanceMonitor flip-flops before it locks into the low tier for good. */
  flipflops: 3,
  multisampling: { high: 2, low: 0 },
  ao: { radius: 0.5, distanceFalloff: 0.6, intensity: 1.6, quality: 'medium' },
  bloom: {
    intensity: { high: 0.55, low: 0.35 },
    threshold: 0.7,
    smoothing: 0.2,
    /** Mip levels: fewer = cheaper and tighter. */
    levels: { high: 7, low: 4 },
  },
  vignette: { offset: 0.28, darkness: 0.55 },
  /** Shadow-map refresh: re-render shadows this often (ms) instead of every frame. */
  shadowRefreshMs: 1000,
  groundShadow: { frames: 40, opacity: 0.6, scale: 15 },
  sky: { top: '#03060f', mid: '#0a1530', horizon: '#16264a' },
  /** Overview camera is ~21 units from the back wall: the far side fades just a touch. */
  fog: { color: '#0e1a33', near: 20, far: 52 },
  stars: { count: 700, radius: 80, depth: 40, factor: 3 },
  rim: { color: '#9fd8ff', intensity: 0.9, blackoutKeep: 0.35 },
} as const

export const ROOMS: { id: Exclude<RoomId, 'all'>; name: string }[] = [
  { id: 'living', name: 'Living room' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'bathroom', name: 'Bathroom' },
]
