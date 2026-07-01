/**
 * The scoring engine (v2). Turns raw Overpass elements into normalized 0–100
 * scores with a transparent, defensible model (see config/tags.js for every
 * constant). Nothing here is random — each score maps to a real quantity:
 *   greenery      → fraction of land that is green + blue space (+ tree bonus)
 *   walkability   → distance-weighted, diversity-adjusted access to essentials
 *   transit       → distance-weighted access to public transport (stations > stops)
 *   air quality   → inverse of ground-level PM2.5
 *   livability    → weighted blend of the above, renormalized if any are absent
 */
import {
  analysisAreaM2,
  CATEGORY,
  ESSENTIAL_WALK_CATEGORIES,
  TRANSIT_WEIGHT,
  SCORING,
} from '../config/tags.js';
import { haversineMeters, polygonAreaM2, clamp } from './geo.js';

/** Identify an element's category record from its tags. */
function classify(tags) {
  if (!tags) return null;
  for (const key of Object.keys(CATEGORY)) {
    const [k, v] = key.split('=');
    if (tags[k] === v) return { key, ...CATEGORY[key] };
  }
  return null;
}

/** Best-effort representative coordinate for any Overpass element. */
function elementCoord(el) {
  if (el.type === 'node') return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  // `out geom;` returns a `bounds` box — its midpoint is a good marker anchor
  // (far better than pinning a polygon at its first vertex).
  if (el.bounds) {
    return {
      lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
      lon: (el.bounds.minlon + el.bounds.maxlon) / 2,
    };
  }
  if (el.geometry?.length) return { lat: el.geometry[0].lat, lon: el.geometry[0].lon };
  return null;
}

/**
 * Parse the Overpass payload into structured, de-duplicated elements plus the
 * raw aggregates the scorers need.
 */
export function parseOverpass(json, originLat, originLon, radius) {
  const elements = [];
  let greenAreaM2 = 0;
  let blueAreaM2 = 0;
  let treeCount = 0;
  let parkCount = 0;

  // A single feature can be returned as a relation AND its member ways; track
  // seen ids so we don't double-count.
  const seen = new Set();

  for (const el of json.elements || []) {
    const info = classify(el.tags);
    if (!info) continue;
    const uid = `${el.type}/${el.id}`;
    if (seen.has(uid)) continue;
    seen.add(uid);

    const coord = elementCoord(el);
    if (!coord) continue;

    if (info.group === 'green') {
      if (info.category === 'tree') {
        treeCount += 1;
      } else if (info.water) {
        blueAreaM2 += polygonAreaM2(el.geometry);
      } else {
        const area = polygonAreaM2(el.geometry);
        greenAreaM2 += area;
        if (info.category === 'park' || info.category === 'garden') parkCount += 1;
      }
    }

    elements.push({
      id: uid,
      type: el.type,
      lat: coord.lat,
      lon: coord.lon,
      group: info.group,
      category: info.category,
      label: info.label,
      color: info.color,
      water: !!info.water,
      name: el.tags.name || el.tags['name:en'] || info.label,
      dist: Math.round(haversineMeters(originLat, originLon, coord.lat, coord.lon)),
    });
  }

  const areaCap = analysisAreaM2(radius);
  greenAreaM2 = Math.min(greenAreaM2, areaCap);
  blueAreaM2 = Math.min(blueAreaM2, areaCap);

  return { elements, greenAreaM2, blueAreaM2, treeCount, parkCount };
}

/** Greenery: green + blue land-cover fraction (sqrt curve) + capped tree bonus. */
export function greeneryScore({ greenAreaM2, blueAreaM2, treeCount }, radius) {
  const area = analysisAreaM2(radius);
  const effective = greenAreaM2 + SCORING.BLUE_WEIGHT * blueAreaM2;
  const cover = effective / area; // 0..1
  const coverPts = 100 * Math.sqrt(clamp(cover / SCORING.GREEN_COVER_TARGET, 0, 1));
  const treePts = Math.min(SCORING.TREE_BONUS_CAP, treeCount / SCORING.TREE_BONUS_PER);
  return {
    score: Math.round(clamp(coverPts + treePts, 0, 100)),
    greenCoverPct: (greenAreaM2 / area) * 100,
    blueCoverPct: (blueAreaM2 / area) * 100,
  };
}

/**
 * Walkability: for each essential category, sum distance-decayed weights and
 * saturate, then apply a diversity multiplier so a balanced mix beats a single
 * over-represented category.
 */
export function walkabilityScore(elements) {
  const walk = elements.filter((e) => e.group === 'walk');
  const perCat = {}; // category -> weighted sum

  for (const e of walk) {
    const w = Math.exp(-e.dist / SCORING.WALK_DECAY_M);
    perCat[e.category] = (perCat[e.category] || 0) + w;
  }

  // Each essential category saturates via 1 - exp(-weightSum / K).
  let essentialScore = 0;
  let present = 0;
  for (const cat of ESSENTIAL_WALK_CATEGORIES) {
    const sat = 1 - Math.exp(-(perCat[cat] || 0) / SCORING.WALK_CATEGORY_K);
    essentialScore += sat;
    if (perCat[cat] > 0) present += 1;
  }
  essentialScore = essentialScore / ESSENTIAL_WALK_CATEGORIES.length; // 0..1

  const diversity =
    SCORING.WALK_DIVERSITY_BASE +
    (1 - SCORING.WALK_DIVERSITY_BASE) * (present / ESSENTIAL_WALK_CATEGORIES.length);

  const extendedWeight = Object.entries(perCat)
    .filter(([c]) => !ESSENTIAL_WALK_CATEGORIES.includes(c))
    .reduce((s, [, w]) => s + w, 0);
  const extendedPts = Math.min(12, extendedWeight * 3);

  const score = Math.round(clamp(essentialScore * diversity * 100 + extendedPts, 0, 100));

  const counts = {};
  for (const e of walk) counts[e.category] = (counts[e.category] || 0) + 1;

  return { score, present, diversity, counts, total: walk.length };
}

/**
 * Transit: distance-decayed access to public transport, with stations weighted
 * well above lone bus stops. Saturates once solid multi-modal access exists.
 */
export function transitScore(elements) {
  const transit = elements.filter((e) => e.group === 'transit');
  let weighted = 0;
  const counts = {};
  let stations = 0;

  for (const e of transit) {
    const w = TRANSIT_WEIGHT[e.category] ?? 0.4;
    weighted += w * Math.exp(-e.dist / SCORING.TRANSIT_DECAY_M);
    counts[e.category] = (counts[e.category] || 0) + 1;
    if (w >= 0.7) stations += 1; // stations / halts
  }

  const score = Math.round(clamp(100 * (1 - Math.exp(-weighted / SCORING.TRANSIT_K)), 0, 100));
  return { score, counts, total: transit.length, stations };
}

/** PM2.5 (µg/m³) → 0–100 (higher is cleaner), with a human category. */
export function airQualityScore(pm25) {
  if (pm25 == null || Number.isNaN(pm25)) return null;
  const score = Math.round(clamp(100 * (1 - pm25 / SCORING.PM25_MAX), 0, 100));
  let category;
  if (pm25 <= 5) category = 'Good (WHO target)';
  else if (pm25 <= 15) category = 'Fair';
  else if (pm25 <= 35) category = 'Moderate';
  else if (pm25 <= 55) category = 'Poor';
  else if (pm25 <= 90) category = 'Very poor';
  else category = 'Severe';
  return { score, pm25: Math.round(pm25 * 10) / 10, category };
}

/**
 * Livability: weighted blend of the available pillars. Any pillar that is null
 * (e.g. air quality unavailable) is dropped and the remaining weights are
 * renormalized so the result stays on a true 0–100 scale.
 */
export function livabilityScore(scores) {
  const w = SCORING.WEIGHTS;
  let sum = 0;
  let wsum = 0;
  for (const key of Object.keys(w)) {
    if (scores[key] == null) continue;
    sum += scores[key] * w[key];
    wsum += w[key];
  }
  if (wsum === 0) return 0;
  return Math.round(sum / wsum);
}
