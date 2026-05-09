import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Institution } from '../types';

interface MapViewProps {
  institutions: Institution[];
  onSelect: (inst: Institution) => void;
  center?: [number, number];
}

export default function MapView({ institutions, onSelect, center = [10.4515, 51.1657] }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: center,
      zoom: 5,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers if we wanted, but for simplicity we add new ones
    // In a production app, we'd manage these in a cleanup or update loop
    institutions.forEach((inst) => {
      const el = document.createElement('div');
      el.className = 'marker-pulse';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-cyan-500/20 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-cyan-400 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,242,255,0.8)]"></div>
        </div>
      `;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => onSelect(inst));

      new maplibregl.Marker(el)
        .setLngLat([inst.lon, inst.lat])
        .addTo(map.current!);
    });
  }, [institutions]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden grayscale-[0.8] invert-[1] hue-rotate-[190deg] brightness-[0.7] contrast-[1.1]" />
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-2xl ring-1 ring-inset ring-white/10" />
    </div>
  );
}
