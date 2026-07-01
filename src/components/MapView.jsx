import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { ANALYSIS_RADIUS_M } from '../config/tags.js';

/** Flies the map to a new target whenever it changes. */
function FlyTo({ lat, lon, radius }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lon == null) return;
    // Zoom out a touch for larger radii so the whole disc stays in view.
    const zoom = radius >= 2000 ? 14 : radius <= 500 ? 16 : 15;
    map.flyTo([lat, lon], zoom, { duration: 0.9 });
  }, [lat, lon, radius, map]);
  return null;
}

/** Pans/pulses to a drill-down focused element. */
function FocusOn({ element }) {
  const map = useMap();
  useEffect(() => {
    if (!element) return;
    map.flyTo([element.lat, element.lon], Math.max(map.getZoom(), 16), { duration: 0.7 });
  }, [element, map]);
  return null;
}

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function SizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/** Canvas heatmap of POI density, toggled via the layer control. */
function HeatLayer({ points, show }) {
  const map = useMap();
  useEffect(() => {
    if (!show || points.length === 0) return;
    const layer = L.heatLayer(
      points.map((p) => [p.lat, p.lon, 0.6]),
      { radius: 22, blur: 18, maxZoom: 17, minOpacity: 0.25,
        gradient: { 0.2: '#22d3ee', 0.5: '#34d399', 0.8: '#f59e0b', 1: '#f43f5e' } }
    );
    layer.addTo(map);
    return () => layer.remove();
  }, [points, show, map]);
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

const poiIcon = (color, size = 8, focused = false) =>
  L.divIcon({
    className: '',
    html: `<div class="poi-dot${focused ? ' poi-focused' : ''}" style="width:${size}px;height:${size}px;background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const isBigGreen = (m) =>
  m.group === 'green' && ['park', 'garden', 'forest', 'reserve', 'water', 'reservoir'].includes(m.category);

export default function MapView({
  location,
  compare,
  elements = [],
  onPick,
  onPickCompare,
  compareMode,
  visible = { green: true, walk: true, transit: true, heatmap: false },
  focusedElement,
}) {
  // Filter by layer visibility, then cap per-group for performance.
  const markers = useMemo(() => {
    const byGroup = { green: [], walk: [], transit: [] };
    for (const e of elements) {
      if (!visible[e.group]) continue;
      if (byGroup[e.group]) byGroup[e.group].push(e);
    }
    const sortCap = (arr, n) => arr.sort((a, b) => a.dist - b.dist).slice(0, n);
    return [
      ...sortCap(byGroup.green, 220),
      ...sortCap(byGroup.walk, 160),
      ...sortCap(byGroup.transit, 120),
    ];
  }, [elements, visible]);

  const heatPoints = useMemo(
    () => elements.filter((e) => visible[e.group]),
    [elements, visible]
  );

  const radius = location.radius || ANALYSIS_RADIUS_M;

  return (
    <MapContainer
      center={[location.lat, location.lon]}
      zoom={15}
      zoomControl
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
      <FlyTo lat={location.lat} lon={location.lon} radius={radius} />
      <FocusOn element={focusedElement} />
      <ClickHandler onPick={compareMode ? onPickCompare : onPick} />

      <Circle
        center={[location.lat, location.lon]}
        radius={radius}
        pathOptions={{ color: '#a78bfa', weight: 1.5, opacity: 0.5, fillColor: '#a78bfa', fillOpacity: 0.05 }}
      />

      <HeatLayer points={heatPoints} show={visible.heatmap} />

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lon]}
          icon={poiIcon(m.color, isBigGreen(m) ? 11 : 8, focusedElement?.id === m.id)}
        >
          <Popup>
            <span className="block text-[13px] font-semibold text-white">{m.name}</span>
            <span className="text-[11.5px] text-slate-400">
              {m.label} · {m.dist} m away
            </span>
          </Popup>
        </Marker>
      ))}

      <Marker position={[location.lat, location.lon]} icon={analysisPin('#a78bfa')} zIndexOffset={1000} />

      {compare && (
        <>
          <Circle
            center={[compare.lat, compare.lon]}
            radius={radius}
            pathOptions={{ color: '#f59e0b', weight: 1.5, opacity: 0.5, fillColor: '#f59e0b', fillOpacity: 0.05 }}
          />
          <Marker position={[compare.lat, compare.lon]} icon={analysisPin('#f59e0b')} zIndexOffset={1000} />
        </>
      )}
    </MapContainer>
  );
}
