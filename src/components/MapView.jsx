import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ANALYSIS_RADIUS_M } from '../config/tags.js';

/** Flies the map to a new target whenever it changes (smooth, not a jump). */
function FlyTo({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lon == null) return;
    map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 0.9 });
  }, [lat, lon, map]);
  return null;
}

/** Turns map clicks into analysis requests. */
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Fixes Leaflet sizing when the container mounts inside a flex/grid layout. */
function SizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const analysisPin = (accent = '#a78bfa') =>
  L.divIcon({
    className: '',
    html: `<div class="pulse-pin" style="color:${accent}">
      <div style="width:16px;height:16px;border-radius:9999px;background:${accent};
      box-shadow:0 0 0 4px rgba(0,0,0,0.4),0 0 14px ${accent}aa;border:2px solid #fff"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const poiIcon = (color, big) =>
  L.divIcon({
    className: '',
    html: `<div class="poi-dot" style="width:${big ? 11 : 8}px;height:${big ? 11 : 8}px;background:${color}"></div>`,
    iconSize: [big ? 11 : 8, big ? 11 : 8],
    iconAnchor: [big ? 5.5 : 4, big ? 5.5 : 4],
  });

export default function MapView({ location, compare, elements = [], onPick, onPickCompare, compareMode }) {
  // Cap markers so a dense city centre stays smooth; keep the nearest.
  const markers = useMemo(() => {
    return [...elements].sort((a, b) => a.dist - b.dist).slice(0, 400);
  }, [elements]);

  return (
    <MapContainer
      center={[location.lat, location.lon]}
      zoom={15}
      zoomControl={true}
      className="h-full w-full"
      preferCanvas
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <SizeFix />
      <FlyTo lat={location.lat} lon={location.lon} />
      <ClickHandler onPick={compareMode ? onPickCompare : onPick} />

      {/* Analysis disc */}
      <Circle
        center={[location.lat, location.lon]}
        radius={ANALYSIS_RADIUS_M}
        pathOptions={{ color: '#a78bfa', weight: 1.5, opacity: 0.5, fillColor: '#a78bfa', fillOpacity: 0.05 }}
      />

      {/* POI markers */}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lon]} icon={poiIcon(m.color, m.group === 'green' && (m.category === 'park' || m.category === 'garden' || m.category === 'forest'))}>
          <Tooltip direction="top" offset={[0, -4]} opacity={1} className="urbana-tip">
            <span className="font-medium">{m.name}</span>
            <span className="opacity-60"> · {m.label}</span>
          </Tooltip>
        </Marker>
      ))}

      {/* Primary analysed location */}
      <Marker position={[location.lat, location.lon]} icon={analysisPin('#a78bfa')} zIndexOffset={1000} />

      {/* Compare location + its own disc */}
      {compare && (
        <>
          <Circle
            center={[compare.lat, compare.lon]}
            radius={ANALYSIS_RADIUS_M}
            pathOptions={{ color: '#f59e0b', weight: 1.5, opacity: 0.5, fillColor: '#f59e0b', fillOpacity: 0.05 }}
          />
          <Marker position={[compare.lat, compare.lon]} icon={analysisPin('#f59e0b')} zIndexOffset={1000} />
        </>
      )}
    </MapContainer>
  );
}
