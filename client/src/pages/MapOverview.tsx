import { useEffect, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Plant } from "@shared/schema";

export default function MapOverview() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const {
    data: plants,
    isLoading,
  } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  // Filter plants that have location data
  const plantsWithLocation = plants?.filter(plant => plant.latitude && plant.longitude) || [];

  useEffect(() => {
    if (!mapRef.current || !plantsWithLocation.length) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create map instance
    const map = L.map(mapRef.current);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create custom marker icon (plant-themed)
    const plantIcon = L.divIcon({
      html: `
        <div style="
          background-color: #16a34a;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 14px;
            height: 14px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-plant-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Add markers for each plant
    const markers: L.Marker[] = [];
    plantsWithLocation.forEach((plant) => {
      const lat = parseFloat(plant.latitude!);
      const lng = parseFloat(plant.longitude!);
      
      const marker = L.marker([lat, lng], { icon: plantIcon }).addTo(map);
      
      // Add popup with plant info
      marker.bindPopup(`
        <div style="text-align: center; font-family: system-ui; min-width: 150px;">
          <img src="${plant.imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-weight: bold; margin-bottom: 4px;">${plant.commonName}</div>
          <div style="font-style: italic; color: #666; font-size: 12px; margin-bottom: 8px;">${plant.scientificName}</div>
          <button style="
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          " onclick="window.location.href = '/plant/${plant.id}?from=map'">
            View Details
          </button>
        </div>
      `);
      
      // Make marker clickable to navigate to plant details
      marker.on('click', () => {
        setLocation(`/plant/${plant.id}?from=map`);
      });
      
      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
      
      // Set minimum zoom level if all plants are very close together
      if (map.getZoom() > 16) {
        map.setZoom(16);
      }
    }

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [plantsWithLocation, setLocation]);

  if (isLoading) {
    return (
      <div className="bg-forest-green min-h-screen min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white-pastel" />
      </div>
    );
  }

  return (
    <div className="bg-forest-green flex flex-col h-screen max-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center p-4 pt-12 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/library")}
          className="text-white-pastel hover:bg-dark-green mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-white-pastel text-2xl font-light">Plant Locations</h1>
      </div>

      {/* Map Container */}
      <div className="flex-1 mx-4 mb-4">
        {plantsWithLocation.length === 0 ? (
          <div className="bg-white rounded-xl h-full flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-lg font-medium mb-2">No location data available</div>
              <div className="text-sm">Plants need location permissions to appear on the map</div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl h-full overflow-hidden">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}