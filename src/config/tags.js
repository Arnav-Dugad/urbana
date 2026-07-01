/**
 * Central configuration for what Urbana measures and how it scores.
 *
 * Everything tunable lives here so the scoring model is transparent and
 * auditable rather than scattered "magic numbers". Tag sets are split into a
 * BASE group (the specification's canonical tags) and an INDIA-EXTENDED group
 * that improves recall where Indian OSM tagging conventions differ.
 *
 * v2 model — four measured pillars blended into Livability:
 *   Greenery (green + blue space) · Walkability · Transit · Air quality
 */

// Analysis radius is user-adjustable; 1 km is the default.
export const RADIUS_OPTIONS = [500, 1000, 2000];
export const ANALYSIS_RADIUS_M = 1000;

/** Area of the analysis disc (π r²) in m² — the denominator for cover ratios. */
export function analysisAreaM2(radius = ANALYSIS_RADIUS_M) {
  return Math.PI * radius * radius;
}

/**
 * GREEN SPACE
 * Base: exactly what the brief asks for.
 * Extended: individual `natural=tree` nodes are sparsely mapped across most of
 * India, so we lean on polygon AREA from parks/gardens/recreation grounds and
 * add woodland/forest to avoid under-counting genuinely green neighbourhoods.
 */
export const GREEN_TAGS = {
  base: [
    ['leisure', 'park'],
    ['landuse', 'grass'],
    ['natural', 'tree'],
  ],
  extended: [
    ['leisure', 'garden'],
    ['leisure', 'nature_reserve'],
    ['landuse', 'recreation_ground'],
    ['landuse', 'forest'],
    ['natural', 'wood'],
    ['natural', 'scrub'],
  ],
};

/** BLUE SPACE — rivers, lakes, reservoirs. Folded into the greenery pillar. */
export const WATER_TAGS = [
  ['natural', 'water'],
  ['landuse', 'reservoir'],
  ['waterway', 'riverbank'],
];

/**
 * WALKABILITY (everyday essentials reachable on foot)
 * Base: pharmacy, supermarket, school.
 * Extended: reflects real Indian neighbourhood retail — convenience/kirana
 * stores, local marketplaces and clinics/chemists — so dense-but-informal
 * areas aren't scored as "unwalkable" just because they lack a supermarket.
 */
export const WALK_TAGS = {
  base: [
    ['amenity', 'pharmacy'],
    ['shop', 'supermarket'],
    ['amenity', 'school'],
  ],
  extended: [
    ['shop', 'convenience'],
    ['amenity', 'marketplace'],
    ['amenity', 'clinic'],
    ['amenity', 'hospital'],
  ],
};

/**
 * TRANSIT & CONNECTIVITY — public transport access.
 * Stations (metro/rail/bus terminals) matter far more than a single bus stop,
 * so they carry more weight in scoring (see TRANSIT_WEIGHT below).
 */
export const TRANSIT_TAGS = [
  ['highway', 'bus_stop'],
  ['amenity', 'bus_station'],
  ['railway', 'station'],
  ['railway', 'halt'],
  ['railway', 'tram_stop'],
  ['railway', 'subway_entrance'],
  ['public_transport', 'station'],
  ['public_transport', 'platform'],
];

/**
 * Maps every tag to a normalized category used by the UI (markers + legend)
 * and by the scoring engine. `water: true` flags blue space; `group` drives
 * layer toggles and scoring.
 */
export const CATEGORY = {
  // ---- green ----
  'leisure=park': { group: 'green', category: 'park', label: 'Park', color: '#34d399' },
  'leisure=garden': { group: 'green', category: 'garden', label: 'Garden', color: '#34d399' },
  'leisure=nature_reserve': { group: 'green', category: 'reserve', label: 'Nature reserve', color: '#10b981' },
  'landuse=grass': { group: 'green', category: 'grass', label: 'Grass', color: '#4ade80' },
  'landuse=recreation_ground': { group: 'green', category: 'recreation', label: 'Recreation ground', color: '#4ade80' },
  'landuse=forest': { group: 'green', category: 'forest', label: 'Forest', color: '#059669' },
  'natural=wood': { group: 'green', category: 'wood', label: 'Woodland', color: '#059669' },
  'natural=scrub': { group: 'green', category: 'scrub', label: 'Scrub', color: '#65a30d' },
  'natural=tree': { group: 'green', category: 'tree', label: 'Tree', color: '#86efac' },
  // ---- blue (part of the green pillar) ----
  'natural=water': { group: 'green', category: 'water', label: 'Water', color: '#38bdf8', water: true },
  'landuse=reservoir': { group: 'green', category: 'reservoir', label: 'Reservoir', color: '#0ea5e9', water: true },
  'waterway=riverbank': { group: 'green', category: 'riverbank', label: 'River', color: '#38bdf8', water: true },
  // ---- walkability ----
  'amenity=pharmacy': { group: 'walk', category: 'pharmacy', label: 'Pharmacy', color: '#22d3ee' },
  'shop=supermarket': { group: 'walk', category: 'supermarket', label: 'Supermarket', color: '#38bdf8' },
  'amenity=school': { group: 'walk', category: 'school', label: 'School', color: '#818cf8' },
  'shop=convenience': { group: 'walk', category: 'convenience', label: 'Convenience store', color: '#2dd4bf' },
  'amenity=marketplace': { group: 'walk', category: 'marketplace', label: 'Marketplace', color: '#0ea5e9' },
  'amenity=clinic': { group: 'walk', category: 'clinic', label: 'Clinic', color: '#a78bfa' },
  'amenity=hospital': { group: 'walk', category: 'hospital', label: 'Hospital', color: '#c084fc' },
  // ---- transit ----
  'highway=bus_stop': { group: 'transit', category: 'bus_stop', label: 'Bus stop', color: '#f472b6' },
  'amenity=bus_station': { group: 'transit', category: 'bus_station', label: 'Bus station', color: '#ec4899' },
  'railway=station': { group: 'transit', category: 'station', label: 'Rail / metro station', color: '#e879f9' },
  'railway=halt': { group: 'transit', category: 'halt', label: 'Rail halt', color: '#f0abfc' },
  'railway=tram_stop': { group: 'transit', category: 'tram', label: 'Tram stop', color: '#f472b6' },
  'railway=subway_entrance': { group: 'transit', category: 'subway', label: 'Metro entrance', color: '#d946ef' },
  'public_transport=station': { group: 'transit', category: 'pt_station', label: 'Transit station', color: '#e879f9' },
  'public_transport=platform': { group: 'transit', category: 'platform', label: 'Transit platform', color: '#f9a8d4' },
};

/** Which walkability categories count toward the "diversity" bonus. */
export const ESSENTIAL_WALK_CATEGORIES = ['pharmacy', 'supermarket', 'school'];

/** Per-category transit weight — a metro station >> a lone bus stop. */
export const TRANSIT_WEIGHT = {
  station: 1.0,
  pt_station: 1.0,
  bus_station: 1.0,
  subway: 0.9,
  halt: 0.7,
  tram: 0.6,
  bus_stop: 0.45,
  platform: 0.4,
};

/** The four measured pillars (drives gauges, radar, compare, methodology). */
export const PILLARS = [
  { key: 'greenery', label: 'Greenery', short: 'Green', color: '#34d399' },
  { key: 'walkability', label: 'Walkability', short: 'Walk', color: '#22d3ee' },
  { key: 'transit', label: 'Transit', short: 'Transit', color: '#f472b6' },
  { key: 'air', label: 'Air quality', short: 'Air', color: '#f59e0b' },
];

// ----------------------------------------------------------------------------
// SCORING CONSTANTS
// ----------------------------------------------------------------------------

export const SCORING = {
  // Green/blue cover fraction that earns a perfect greenery score. ~20% cover
  // is the upper band recommended in urban-greening literature.
  GREEN_COVER_TARGET: 0.2,
  // Blue space counts toward cover but is weighted a little below green (less
  // directly usable than a park, still valuable microclimate/amenity).
  BLUE_WEIGHT: 0.7,
  // Trees add a capped bonus on top of area (helps well-treed streets with no
  // large park). Bonus (points) = min(cap, count / perTree).
  TREE_BONUS_CAP: 12,
  TREE_BONUS_PER: 4, // 1 pt per 4 mapped trees

  // Walkability distance-decay: an amenity's weight = exp(-dist / DECAY_M).
  // 400 m ≈ a comfortable 5-minute walk, so things beyond that fade fast.
  WALK_DECAY_M: 400,
  // Per-category saturation constant K in score = 1 - exp(-weightSum / K).
  WALK_CATEGORY_K: 0.5,
  // Diversity multiplier range: 0 essentials → BASE, all essentials → 1.0.
  WALK_DIVERSITY_BASE: 0.55,

  // Transit: people walk a bit further to a stop/station than to a shop.
  TRANSIT_DECAY_M: 500,
  // Saturation for score = 100 * (1 - exp(-weightedSum / K)).
  TRANSIT_K: 0.6,

  // Air quality: PM2.5 (µg/m³) → score. 0 → 100, at/above MAX → 0.
  // Bands align with WHO 2021 guidance and India's CPCB reality.
  PM25_MAX: 90,

  // Livability blend weights (sum to 1; renormalized over available pillars).
  WEIGHTS: { greenery: 0.25, walkability: 0.3, transit: 0.2, air: 0.25 },
};

/** Human-readable score bands shared across gauges. */
export function scoreBand(score) {
  if (score >= 80) return { label: 'Excellent', tone: 'emerald' };
  if (score >= 60) return { label: 'Good', tone: 'lime' };
  if (score >= 40) return { label: 'Moderate', tone: 'amber' };
  if (score >= 20) return { label: 'Poor', tone: 'orange' };
  return { label: 'Very poor', tone: 'rose' };
}

/** Plain-language methodology shown in the "How scores work" modal. */
export const METHODOLOGY = [
  {
    pillar: 'Greenery',
    weight: '25%',
    how: 'Share of land within the radius that is green or blue space — parks, gardens, grass, woodland, plus rivers/lakes at a slightly lower weight — with a small bonus for mapped street trees. Saturates at ~20% cover.',
  },
  {
    pillar: 'Walkability',
    weight: '30%',
    how: 'Distance-weighted access to daily essentials (pharmacy, supermarket, school, and Indian convenience stores / markets / clinics). Closer counts more (≈5-min-walk decay), and a diversity bonus rewards having all essentials nearby rather than one type in bulk.',
  },
  {
    pillar: 'Transit',
    weight: '20%',
    how: 'Distance-weighted access to public transport. Metro/rail and bus stations count far more than a single bus stop. Saturates once good multi-modal access is present.',
  },
  {
    pillar: 'Air quality',
    weight: '25%',
    how: 'Derived from live ground-level PM2.5 (Open-Meteo), mapped to 0–100 on WHO/CPCB-aligned bands. Shown alongside PM10, NO₂, O₃, the US AQI and a 24-hour trend.',
  },
];

/** A few well-known Indian starting points for the first-run experience. */
export const PRESETS = [
  { name: 'Cubbon Park, Bengaluru', lat: 12.9763, lon: 77.5929 },
  { name: 'Lodhi Garden, New Delhi', lat: 28.5933, lon: 77.2197 },
  { name: 'Marine Drive, Mumbai', lat: 18.9436, lon: 72.8232 },
  { name: 'Banjara Hills, Hyderabad', lat: 17.4126, lon: 78.4392 },
  { name: 'Salt Lake, Kolkata', lat: 22.5726, lon: 88.4128 },
];

// Default view on first load — central Bengaluru (well-mapped in OSM).
export const DEFAULT_LOCATION = { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, India' };
