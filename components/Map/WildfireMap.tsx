"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Use environment variable for Mapbox token
// Make sure this is properly set in your .env.local file
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface WildfireMapProps {
  initialCenter: [number, number]; // [longitude, latitude]
  initialZoom: number;
  fireData: any; // Replace with proper type for your fire data
  currentTime: Date;
}

export default function WildfireMap({
  initialCenter,
  initialZoom,
  fireData,
  currentTime,
}: WildfireMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    if (!mapboxgl.accessToken) {
      console.error("Mapbox token is missing!");
      setMapError(
        "Mapbox token is missing. Please check your environment variables."
      );
      return;
    }

    try {
      // Create the map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard", // Satellite imagery for terrain
        center: initialCenter,
        zoom: initialZoom,
        pitch: 60, // 3D view
        bearing: 0,
        antialias: true,
      });

      // Add event listeners
      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);

        if (!map.current) return;

        // Add terrain 3D layer
        map.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setMapError(`Map error: ${e.error?.message || "Unknown error"}`);
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(
        `Failed to initialize map: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter, initialZoom]);

  // Update fire overlay when data or time changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !fireData) return;

    try {
      // Remove existing fire layer if it exists
      if (map.current.getLayer("fire-area")) {
        map.current.removeLayer("fire-area");
      }
      if (map.current.getSource("fire-source")) {
        map.current.removeSource("fire-source");
      }

      // Filter fire data based on current time
      const visibleFireData = filterFireDataByTime(fireData, currentTime);

      // Add fire data as a source
      map.current.addSource("fire-source", {
        type: "geojson",
        data: visibleFireData,
      });

      // Add fire area layer
      map.current.addLayer({
        id: "fire-area",
        type: "fill",
        source: "fire-source",
        paint: {
          "fill-color": "#ff4d4d",
          "fill-opacity": 0.7,
        },
      });

      // Add points of interest
      addPointsOfInterest(map.current, fireData.pointsOfInterest);
    } catch (error) {
      console.error("Error updating fire data:", error);
    }
  }, [mapLoaded, fireData, currentTime]);

  // Helper functions
  const filterFireDataByTime = (data: any, time: Date) => {
    // Implement logic to filter fire data based on the current time
    // Return GeoJSON with fire perimeters visible at the given time
    return {
      type: "FeatureCollection",
      features: data.features.filter(
        (feature: any) => new Date(feature.properties.timestamp) <= time
      ),
    };
  };

  const addPointsOfInterest = (map: mapboxgl.Map, points: any[]) => {
    // Add markers for important locations
    points?.forEach((point) => {
      const marker = new mapboxgl.Marker({ color: "#000000" })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<h3>${point.name}</h3><p>${point.description}</p>`
          )
        )
        .addTo(map);
    });
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
