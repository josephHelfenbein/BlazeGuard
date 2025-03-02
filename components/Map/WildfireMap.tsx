"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Use environment variable for Mapbox token
// Make sure this is properly set in your .env.local file
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface FireFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    timestamp: string;
    intensity: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface FireData {
  type: "FeatureCollection";
  features: FireFeature[];
  pointsOfInterest: {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  }[];
}

interface WildfireMapProps {
  initialCenter: [number, number]; // [longitude, latitude]
  initialZoom: number;
  fireData: FireData;
  currentTime: Date;
  onMapMove?: (position: {
    lat: number;
    lng: number;
    elevation: number;
    temperature: number;
    territory: string;
  }) => void;
}

// Simple debounce function to limit update frequency
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function WildfireMap({
  initialCenter,
  initialZoom,
  fireData,
  currentTime,
  onMapMove,
}: WildfireMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const sourceAddedRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize map - simplified approach
  useEffect(() => {
    // Skip if container is not available
    if (!mapContainer.current) return;

    // Skip if token is missing
    if (!mapboxgl.accessToken) {
      setMapError(
        "Mapbox token is missing. Please check your environment variables."
      );
      return;
    }

    // Skip if map is already initialized
    if (map.current) return;

    // Create map with minimal options
    try {
      const mapOptions = {
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      };

      // Create map
      const newMap = new mapboxgl.Map(mapOptions);
      map.current = newMap;

      // Set up basic event handlers
      newMap.on("load", () => {
        console.log("Map loaded");
        setMapLoaded(true);
      });

      // Set up move handler if needed
      if (onMapMove) {
        newMap.on("move", () => {
          if (!newMap) return;
          const center = newMap.getCenter();
          onMapMove({
            lat: center.lat,
            lng: center.lng,
            elevation: 1200,
            temperature: 85,
            territory: "Yosemite National Park",
          });
        });
      }

      // Handle errors
      newMap.on("error", (e) => {
        console.error("Map error:", e);
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
      setMapError("Failed to initialize map. Please try refreshing the page.");
    }

    // Cleanup
    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {}
      });
      markersRef.current = [];

      // Clean up map
      if (map.current) {
        try {
          map.current.remove();
        } catch (e) {
          console.error("Error removing map:", e);
        }
        map.current = null;
      }
    };
  }, [initialCenter, initialZoom, onMapMove]);

  // Create a memoized update function that uses debouncing
  const debouncedUpdateData = useCallback(
    debounce(() => {
      if (!map.current || !mapLoaded || !fireData) return;

      // Throttle updates to prevent excessive rendering
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 200) return;
      lastUpdateTimeRef.current = now;

      try {
        // Check if map is ready
        if (!map.current.loaded() || !map.current.isStyleLoaded()) {
          console.log("Map not ready, will try again later");
          return;
        }

        // Update fire data
        updateFireData();

        // Update markers (less frequently)
        if (now - lastUpdateTimeRef.current > 1000) {
          updateMarkers();
        }
      } catch (error) {
        console.error("Error updating map:", error);
      }
    }, 100),
    [mapLoaded, fireData, currentTime]
  );

  // Update fire data when needed
  useEffect(() => {
    if (!mapLoaded || !map.current || !fireData) return;
    debouncedUpdateData();
  }, [mapLoaded, fireData, currentTime, debouncedUpdateData]);

  // Update fire data source without recreating layers
  const updateFireData = () => {
    if (!map.current) return;

    try {
      // Create filtered data
      const filteredData = {
        type: "FeatureCollection",
        features: fireData.features.filter(
          (feature) => new Date(feature.properties.timestamp) <= currentTime
        ),
      };

      // If source doesn't exist yet, create it along with the layer
      if (!sourceAddedRef.current) {
        try {
          // Add new source and layer
          map.current.addSource("fire-source", {
            type: "geojson",
            data: filteredData as any,
          });

          map.current.addLayer({
            id: "fire-area",
            type: "fill",
            source: "fire-source",
            paint: {
              "fill-color": "#ff4d4d",
              "fill-opacity": 0.7,
            },
          });

          sourceAddedRef.current = true;
        } catch (e) {
          console.error("Error adding initial source/layer:", e);
        }
      } else {
        // Just update the existing source data without recreating the layer
        try {
          const source = map.current.getSource(
            "fire-source"
          ) as mapboxgl.GeoJSONSource;
          if (source && source.setData) {
            source.setData(filteredData as any);
          }
        } catch (e) {
          console.error("Error updating source data:", e);
          // If updating fails, try to recreate the source
          sourceAddedRef.current = false;
        }
      }
    } catch (error) {
      console.error("Error updating fire layer:", error);
    }
  };

  // Update markers with optimization
  const updateMarkers = () => {
    if (!map.current) return;

    try {
      // Skip if no valid data
      if (
        !fireData.pointsOfInterest ||
        !Array.isArray(fireData.pointsOfInterest)
      ) {
        return;
      }

      // Create a map of existing markers by ID for quick lookup
      const existingMarkers = new Map();
      markersRef.current.forEach((marker, index) => {
        // Use the marker's element dataset to store the ID
        const id = marker.getElement().dataset.id;
        if (id) {
          existingMarkers.set(id, { marker, index });
        }
      });

      // Track which markers to keep
      const markersToKeep: mapboxgl.Marker[] = [];

      // Add or update markers
      fireData.pointsOfInterest.forEach((point) => {
        if (!point.longitude || !point.latitude || !point.id) return;

        // Check if marker already exists
        const existing = existingMarkers.get(point.id);

        if (existing) {
          // Update existing marker position if needed
          const marker = existing.marker;
          const currentPos = marker.getLngLat();

          // Only update if position changed significantly
          if (
            Math.abs(currentPos.lng - point.longitude) > 0.0001 ||
            Math.abs(currentPos.lat - point.latitude) > 0.0001
          ) {
            marker.setLngLat([point.longitude, point.latitude]);
          }

          // Keep this marker
          markersToKeep.push(marker);
          existingMarkers.delete(point.id);
        } else {
          // Create new marker
          try {
            const el = document.createElement("div");
            el.dataset.id = point.id;

            const marker = new mapboxgl.Marker(el)
              .setLngLat([point.longitude, point.latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<h3>${point.name || "Unknown"}</h3><p>${point.description || ""}</p>`
                )
              )
              .addTo(map.current!);

            markersToKeep.push(marker);
          } catch (e) {
            console.error("Error adding marker:", e);
          }
        }
      });

      // Remove markers that are no longer needed
      existingMarkers.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch (e) {}
      });

      // Update the markers reference
      markersRef.current = markersToKeep;
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  };

  return (
    <div className="relative w-full h-full text-black">
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 z-20">
          <div className="bg-white p-4 rounded shadow-lg max-w-md">
            <h3 className="font-bold mb-2">Map Error</h3>
            <p>{mapError}</p>
            <p className="text-sm mt-2">
              Please check your Mapbox token and network connection.
            </p>
          </div>
        </div>
      )}

      {!mapboxgl.supported() && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 z-20">
          <div className="bg-white p-4 rounded shadow-lg max-w-md">
            <h3 className="font-bold mb-2">Browser Not Supported</h3>
            <p>Your browser does not support Mapbox GL</p>
            <p className="text-sm mt-2">
              Please try using a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
