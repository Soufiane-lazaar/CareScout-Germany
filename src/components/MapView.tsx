import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Institution } from '../types';
import { Search, Map as MapIcon, Navigation, Target } from 'lucide-react';

interface MapViewProps {
  institutions: Institution[];
  onSelect: (inst: Institution) => void;
  hoveredId?: string | null;
  center?: [number, number];
  onSearchInArea?: (lat: number, lon: number, zoom: number) => void;
}

export default function MapView({ institutions, onSelect, hoveredId, center, onSearchInArea }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'Dark OSINT',
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
      center: center || [10.4515, 51.1657],
      zoom: center ? 11 : 5,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const handleMove = () => {
      if (!mapMoving) setMapMoving(true);
      setShowSearchArea(true);
    };

    map.current.on('moveend', () => setMapMoving(false));
    map.current.on('dragend', handleMove);
    map.current.on('zoomend', handleMove);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync Center
  useEffect(() => {
    if (!map.current || !center) return;
    map.current.flyTo({
      center: center,
      zoom: Math.max(map.current.getZoom(), 12),
      duration: 1500,
      essential: true
    });
    setShowSearchArea(false);
  }, [center]);

  // Sync Hover state
  useEffect(() => {
    Object.keys(markers.current).forEach(id => {
      const marker = markers.current[id];
      const el = marker.getElement();
      if (id === hoveredId) {
        el.style.zIndex = '100';
        el.querySelector('.marker-icon')?.classList.add('scale-150', 'ring-4', 'ring-white');
      } else {
        el.style.zIndex = '1';
        el.querySelector('.marker-icon')?.classList.remove('scale-150', 'ring-4', 'ring-white');
      }
    });
  }, [hoveredId]);

  // Sync Markers
  useEffect(() => {
    if (!map.current) return;

    // Clear removed
    const incomingIds = new Set(institutions.map(i => i.id));
    Object.keys(markers.current).forEach(id => {
      if (!incomingIds.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    institutions.forEach((inst) => {
      if (markers.current[inst.id]) return; // Already exists

      const isPartner = inst.intel?.analysis?.toLowerCase().includes('vertrag') || inst.intel?.analysis?.toLowerCase().includes('partner');
      
      const el = document.createElement('div');
      el.className = 'group relative pointer-events-auto transition-transform duration-300';
      
      const inner = `
        <div class="flex items-center justify-center transition-all duration-300">
          <div class="absolute ${isPartner ? 'w-10 h-10 bg-amber-500/30' : 'w-8 h-8 bg-cyan-500/20'} rounded-full animate-pulse"></div>
          <div class="marker-icon w-5 h-5 ${isPartner ? 'bg-amber-500' : 'bg-cyan-500'} border-2 border-white rounded-full shadow-[0_0_15px_${isPartner ? 'rgba(245,158,11,0.8)' : 'rgba(6,182,212,0.8)'}] flex items-center justify-center transition-all duration-300">
             ${isPartner ? '<div class="w-1.5 h-1.5 bg-white rounded-full"></div>' : ''}
          </div>
          
          <div class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div class="bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
              <p class="text-[10px] font-bold text-white">${inst.name}</p>
              ${isPartner ? '<p class="text-[8px] text-amber-400 font-black uppercase tracking-tighter">Premium Partner</p>' : ''}
            </div>
          </div>
        </div>
      `;
      
      el.innerHTML = inner;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(inst);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inst.lon, inst.lat])
        .addTo(map.current!);
      
      markers.current[inst.id] = marker;
    });
  }, [institutions]);

  const handleSearchArea = () => {
    if (!map.current || !onSearchInArea) return;
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    onSearchInArea(center.lat, center.lng, zoom);
    setShowSearchArea(false);
  };

  return (
    <div className="relative w-full h-full group/map">
      <div ref={mapContainer} className="w-full h-full grayscale-[0.7] invert-[0.9] hue-rotate-[180deg] brightness-[0.8] contrast-[1.2]" />
      
      {/* Search in this area button */}
      {showSearchArea && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={handleSearchArea}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-2xl shadow-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            Scan this Sector
          </button>
        </div>
      )}

      {/* Map Coordination Overlay */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <div className="flex flex-col gap-2">
           <div className="px-3 py-1.5 bg-slate-950/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
             <Target className="w-3 h-3 text-cyan-500" />
             <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Map Sync Active</span>
           </div>
        </div>
      </div>

      {/* Decorative Gradients */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40"></div>
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-2xl ring-1 ring-inset ring-white/10" />
    </div>
  );
}
