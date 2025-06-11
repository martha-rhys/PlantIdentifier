import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  latitude: string;
  longitude: string;
  locationName?: string | null;
}

export default function LocationMap({ latitude, longitude, locationName }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Create map instance
    const map = L.map(mapRef.current).setView([lat, lng], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create custom marker icon (plant-themed)
    const plantIcon = L.divIcon({
      html: `
        <div style="
          background-color: #16a34a;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-plant-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add marker
    const marker = L.marker([lat, lng], { icon: plantIcon }).addTo(map);

    // Add popup with location info
    if (locationName) {
      marker.bindPopup(`
        <div style="text-align: center; font-family: system-ui;">
          <strong>Plant Location</strong><br/>
          <small>${locationName}</small>
        </div>
      `);
    }

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, locationName]);

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}