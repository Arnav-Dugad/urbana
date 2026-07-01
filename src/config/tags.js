/**
 * Central configuration for what Urbana measures and how it scores.
 *
 * Everything tunable lives here so the scoring model is transparent and
 * auditable rather than scattered "magic numbers". Tag sets are split into a
 * BASE group (the specification's canonical tags) and an INDIA-EXTENDED group
 * that improves recall where Indian OSM tagging conventions differ.
 */

export const ANALYSIS_RADIUS_M = 1000;

// Area of the analysis disc (π r²) in m² — the denominator for green cover.
export const ANALYSIS_AREA_M2 = Math.PI * ANALYSIS_RADIUS_M * ANALYSIS_RADIUS_M;

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
 * Maps every tag to a normalized category used by the UI (markers + legend)
 * and by the scoring engine.
 */
export const CATEGORY = {
  // green
  'leisure=park': { group: 'green', category: 'park', label: 'Park', color: '#34d399' },
  'leisure=garden': { group: 'green', category: 'garden', label: 'Garden', color: '#34d399' },
  'leisure=nature_reserve': { group: 'green', category: 'reserve', label: 'Nature reserve', color: '#10b981' },
  'landuse=grass': { group: 'green', category: 'grass', label: 'Grass', color: '#4ade80' },
  'landuse=recreation_ground': { group: 'green', category: 'recreation', label: 'Recreation ground', color: '#4ade80' },
  'landuse=forest': { group: 'green', category: 'forest', label: 'Forest', color: '#059669' },
  'natural=wood': { group: 'green', category: 'wood', label: 'Woodland', color: '#059669' },
  'natural=scrub': { group: 'green', category: 'scrub', label: 'Scrub', color: '#65a30d' },
  'natural=tree': { group: 'green', category: 'tree', label: 'Tree', color: '#86efac' },
  // walkability
  'amenity=pharmacy': { group: 'walk', category: 'pharmacy', label: 'Pharmacy', color: '#22d3ee' },
  'shop=supermarket': { group: 'walk', category: 'supermarket', label: 'Supermarket', color: '#38bdf8' },
  'amenity=school': { group: 'walk', category: 'school', label: 'School', color: '#818cf8' },
  'shop=convenience': { group: 'walk', category: 'convenience', label: 'Convenience store', color: '#2dd4bf' },
  'amenity=marketplace': { group: 'walk', category: 'marketplace', label: 'Marketplace', color: '#0ea5e9' },
  'amenity=clinic': { group: 'walk', category: 'clinic', label: 'Clinic', color: '#a78bfa' },
  'amenity=hospital': { group: 'walk', category: 'hospital', label: 'Hospital', color: '#c084fc' },
};

/** Which walkability categories count toward the "diversity" bonus. */
export const ESSENTIAL_WALK_CATEGORIES = ['pharmacy', 'supermarket', 'school'];

// ----------------------------------------------------------------------------
// SCORING CONSTANTS
// ----------------------------------------------------------------------------

export const SCORING = {
  // Green cover fraction that earns a perfect greenery score. ~20% tree/park
  // cover is the upper band recommended in urban-greening literature.
  GREEN_COVER_TARGET: 0.2,
  // Trees add a capped bonus on top of area (helps well-treed streets with no
  // large park). Bonus (points) = min(cap, count / perTree).
  TREE_BONUS_CAP: 12,
  TREE_BONUS_PER: 4, // 1 pt per 4 mapped trees

  // Walkability distance-decay: an amenity's weight = exp(-dist / DECAY_M).
  // 400 m ≈ a comfortable 5-minute walk, so things beyond that fade fast.
  WALK_DECAY_M: 400,
  // Per-category saturation constant K in score = 1 - exp(-weightSum / K).
  // Tuned so a single essential within a ~5-min walk scores that category
  // well (~0.6) and a couple nearby saturate it (~0.8+), with diminishing
  // returns beyond that — presence matters more than sheer count.
  WALK_CATEGORY_K: 0.5,
  // Diversity multiplier range: 0 essentials → BASE, all essentials → 1.0.
  WALK_DIVERSITY_BASE: 0.55,

  // Air quality: PM2.5 (µg/m³) → score. 0 → 100, at/above MAX → 0.
  // Bands align with WHO 2021 guidance and India's CPCB reality.
  PM25_MAX: 90,

  // Livability blend weights (must sum to 1 when all three are present).
  WEIGHTS: { greenery: 0.35, walkability: 0.35, air: 0.3 },
};

/** Human-readable score bands shared across gauges. */
export function scoreBand(score) {
  if (score >= 80) return { label: 'Excellent', tone: 'emerald' };
  if (score >= 60) return { label: 'Good', tone: 'lime' };
  if (score >= 40) return { label: 'Moderate', tone: 'amber' };
  if (score >= 20) return { label: 'Poor', tone: 'orange' };
  return { label: 'Very poor', tone: 'rose' };
}

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
