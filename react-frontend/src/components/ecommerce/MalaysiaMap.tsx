import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MalaysiaMapProps {
  mapColor?: string;
  onRegionClick?: (regionCode: string, regionName: string) => void;
}

interface StateData {
  name: string;
  saman: number;
  percentage: number;
  color: string;
  coordinates: [number, number];
}

const stateData: Record<string, StateData> = {
  "Johor": { name: "Johor", saman: 1456, percentage: 52, color: "#EF4444", coordinates: [1.4854, 103.7618] },
  "Kedah": { name: "Kedah", saman: 876, percentage: 31, color: "#F97316", coordinates: [6.1184, 100.3681] },
  "Kelantan": { name: "Kelantan", saman: 654, percentage: 23, color: "#8B5CF6", coordinates: [6.1254, 102.2381] },
  "Melaka": { name: "Melaka", saman: 432, percentage: 15, color: "#EC4899", coordinates: [2.1896, 102.2501] },
  "Negeri Sembilan": { name: "Negeri Sembilan", saman: 543, percentage: 19, color: "#10B981", coordinates: [2.7258, 101.9424] },
  "Pahang": { name: "Pahang", saman: 765, percentage: 27, color: "#06B6D4", coordinates: [3.8126, 103.3256] },
  "Perak": { name: "Perak", saman: 987, percentage: 35, color: "#3B82F6", coordinates: [4.5921, 101.0901] },
  "Perlis": { name: "Perlis", saman: 234, percentage: 8, color: "#6366F1", coordinates: [6.4449, 100.2048] },
  "Pulau Pinang": { name: "Pulau Pinang", saman: 987, percentage: 35, color: "#8B5CF6", coordinates: [5.4164, 100.3327] },
  "Sabah": { name: "Sabah", saman: 1123, percentage: 40, color: "#EF4444", coordinates: [5.9788, 116.0753] },
  "Sarawak": { name: "Sarawak", saman: 1345, percentage: 48, color: "#F97316", coordinates: [1.5533, 110.3593] },
  "Selangor": { name: "Selangor", saman: 1892, percentage: 68, color: "#3B82F6", coordinates: [3.0738, 101.5183] },
  "Terengganu": { name: "Terengganu", saman: 567, percentage: 20, color: "#10B981", coordinates: [5.3117, 103.1324] },
  "Kuala Lumpur": { name: "Kuala Lumpur", saman: 2379, percentage: 85, color: "#DC2626", coordinates: [3.1390, 101.6869] },
  "Putrajaya": { name: "Putrajaya", saman: 156, percentage: 12, color: "#DC2626", coordinates: [2.9264, 101.6964] },
  "Labuan": { name: "Labuan", saman: 89, percentage: 7, color: "#DC2626", coordinates: [5.2831, 115.2308] },
};

const MalaysiaMap: React.FC<MalaysiaMapProps> = ({ onRegionClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Malaysia
    const map = L.map(mapRef.current, {
      center: [4.2105, 108.9758],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: false,
    });

    mapInstanceRef.current = map;

    // Add high-quality map tiles (CartoDB Positron for clean look)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
      detectRetina: true,
    }).addTo(map);

    // Add markers for each state
    Object.values(stateData).forEach((state) => {
      const marker = L.circleMarker(state.coordinates, {
        radius: Math.sqrt(state.saman) / 3,
        fillColor: state.color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      }).addTo(map);

      // Add popup
      marker.bindPopup(`
        <div style="font-family: Outfit, sans-serif;">
          <strong style="font-size: 14px; color: #1F2937;">${state.name}</strong><br/>
          <span style="color: #6B7280; font-size: 12px;">Saman: ${state.saman.toLocaleString()}</span><br/>
          <span style="color: #6B7280; font-size: 12px;">Rate: ${state.percentage}%</span>
        </div>
      `);

      // Add click handler
      marker.on("click", () => {
        if (onRegionClick) {
          onRegionClick(state.name, state.name);
        }
      });

      // Add tooltip on hover
      marker.bindTooltip(state.name, {
        permanent: false,
        direction: "top",
        className: "state-tooltip",
      });
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onRegionClick]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: "420px", height: "420px" }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex flex-col gap-2 text-xs">
          <div className="font-semibold text-gray-800 dark:text-white mb-1">Saman Volume</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High (&gt;1000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium (500-1000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Low (&lt;500)</span>
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #f3f4f6;
        }
        .dark .leaflet-container {
          background: #1f2937;
        }
        .state-tooltip {
          background: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          padding: 4px 8px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default MalaysiaMap;
