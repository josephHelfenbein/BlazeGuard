"use client";

import React, { useState, useEffect, useMemo } from "react";
import WildfireMap from "@/components/Map/WildfireMap";
import AlertsPanel from "@/components/Alerts/AlertsPanel";
import { Layers, Info, MapPin, Thermometer, Navigation } from "lucide-react";
import { Alert } from "@/types/alerts";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

// Import only the points of interest from mock data
import { mockAlerts } from "@/data/mockData";

export default function WildfireTrackerPage() {
  // State for time control
  const [startTime] = useState(new Date("2023-07-15T00:00:00"));
  const [currentTime, setCurrentTime] = useState(
    new Date("2023-07-15T12:00:00")
  );
  const [wildfireTime, setWildfireTime] = useState<number | null>(null);

  // State for map
  const [mapCenter] = useState<[number, number]>([-119.5383, 37.8651]); // Yosemite
  const [mapZoom] = useState(11);

  // State for UI
  const [showLayers, setShowLayers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    lat: 37.8651,
    lng: -119.5383,
    elevation: 1200,
    temperature: 85,
    territory: "Yosemite National Park",
  });

  // State for alerts
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  // Generate dynamic fire data based on current time
  const fireData = useMemo(() => {
    // Default center point
    const centerLat = 37.8651;
    const centerLng = -119.5383;

    // Calculate fire spread based on time
    // If wildfireTime is null, use a small initial fire
    const timeSeconds = wildfireTime || 0;

    // Calculate spread factor (increases with time)
    // Start small and grow larger as time progresses
    const spreadFactor = Math.min(0.05 + (timeSeconds / 120) * 0.2, 0.25);

    // Create a polygon that grows with time
    const createFirePolygon = () => {
      // Create 5 points for the polygon
      const points = [];
      const numPoints = 5;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;

        // Add some randomness to make the fire look more natural
        const randomFactor = 0.7 + Math.random() * 0.6;

        // Calculate spread distance based on time
        let distance = spreadFactor * randomFactor;

        // Bias growth eastward and southward
        // East = 0, South = PI/2
        const eastBias = Math.cos(angle) > 0 ? 1.5 : 0.7; // Grow more to the east
        const southBias = Math.sin(angle) > 0 ? 0.7 : 1.5; // Grow more to the south
        distance *= eastBias * southBias;

        // Calculate coordinates
        const lat = centerLat + Math.sin(angle) * distance;
        const lng = centerLng + Math.cos(angle) * distance;

        points.push([lng, lat]);
      }

      // Close the polygon by adding the first point again
      points.push(points[0]);

      return points;
    };

    // Create a GeoJSON feature for the fire
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "fire-live",
            name: "Yosemite Valley Fire",
            timestamp: currentTime.toISOString(),
            intensity:
              timeSeconds > 60
                ? "extreme"
                : timeSeconds > 30
                  ? "high"
                  : "medium",
          },
          geometry: {
            type: "Polygon",
            coordinates: [createFirePolygon()],
          },
        },
      ],
      pointsOfInterest: [
        {
          id: "poi-1",
          name: "Yosemite Village",
          description: "Population: 2,500",
          latitude: 37.8651,
          longitude: -119.5383,
        },
        {
          id: "poi-2",
          name: "El Capitan",
          description: "Landmark",
          latitude: 37.7341,
          longitude: -119.6379,
        },
        {
          id: "poi-3",
          name: "Evacuation Center",
          description: "Capacity: 500",
          latitude: 37.8851,
          longitude: -119.5783,
        },
      ],
    };
  }, [wildfireTime, currentTime]);

  // Subscribe to the Supabase wildfire channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("wildfire");

    // Listen for time updates
    channel
      .on("broadcast", { event: "timeUpdate" }, (payload) => {
        console.log("Received wildfire time update:", payload);
        setWildfireTime(payload.payload.time);

        // Update the current time based on the wildfire time (seconds)
        const newTime = new Date(startTime);
        newTime.setSeconds(newTime.getSeconds() + payload.payload.time);
        setCurrentTime(newTime);

        // Show toast for first update
        if (payload.payload.time === 0) {
          toast.success("🔥 Connected to live wildfire data!");
          // Add a new alert
          const newAlert: Alert = {
            id: `wildfire-${Date.now()}`,
            title: "Live Wildfire Data",
            message: "Connected to live wildfire data stream",
            timestamp: new Date(),
            severity: "warning",
            isRead: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }

        // Add new alerts based on fire progression
        if (payload.payload.time === 30) {
          const newAlert: Alert = {
            id: `wildfire-spread-${Date.now()}`,
            title: "Fire Spreading",
            message: "Fire is spreading rapidly to the northeast",
            timestamp: new Date(),
            severity: "warning",
            isRead: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }

        if (payload.payload.time === 60) {
          const newAlert: Alert = {
            id: `wildfire-danger-${Date.now()}`,
            title: "Danger Zone",
            message:
              "Fire has reached critical intensity. Evacuation recommended.",
            timestamp: new Date(),
            severity: "danger",
            isRead: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }

        if (payload.payload.time === 90) {
          const newAlert: Alert = {
            id: `wildfire-evac-${Date.now()}`,
            title: "Evacuation Order",
            message:
              "Mandatory evacuation for Yosemite Village. Proceed to evacuation centers.",
            timestamp: new Date(),
            severity: "danger",
            isRead: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }
      })
      .subscribe((status) => {
        console.log(`Wildfire subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          toast.success("📡 Subscribed to wildfire channel");
        }
      });

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
  }, [startTime]);

  // Mark alert as read
  const handleMarkAlertAsRead = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, isRead: true } : alert
      )
    );
  };

  // Update position info when map moves
  const handleMapMove = (position: any) => {
    setCurrentPosition(position);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-red-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Wildfire Tracker</h1>
          <div className="flex items-center space-x-4">
            {wildfireTime !== null && (
              <div className="px-3 py-1 bg-red-600 rounded-full text-sm">
                Live Datas
              </div>
            )}
            <button className="p-2 hover:bg-red-600 rounded">
              <Info size={20} />
            </button>
            <button className="p-2 hover:bg-red-600 rounded">
              <Layers size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Map container */}
        <div className="relative flex-grow">
          <WildfireMap
            initialCenter={mapCenter}
            initialZoom={mapZoom}
            fireData={fireData}
            currentTime={currentTime}
            onMapMove={handleMapMove}
          />

          {/* Live data indicator overlay */}
          {wildfireTime !== null && (
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-black bg-opacity-70 text-white p-3 rounded-md flex justify-between items-center">
              <div>
                <span className="text-red-400 font-bold">LIVE</span> Wildfire
                Data
              </div>
              <div className="text-amber-400 font-mono">T+{wildfireTime}s</div>
            </div>
          )}

          {/* Navigation info */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-lg text-sm">
            <div className="flex items-center mb-2">
              <MapPin size={16} className="mr-2 text-gray-700" />
              <span>
                {currentPosition.lat.toFixed(4)},{" "}
                {currentPosition.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center mb-2">
              <Navigation size={16} className="mr-2 text-gray-700" />
              <span>Elevation: {currentPosition.elevation}m</span>
            </div>
            <div className="flex items-center mb-2">
              <Thermometer size={16} className="mr-2 text-gray-700" />
              <span>{currentPosition.temperature}°F</span>
            </div>
            <div className="text-xs text-gray-600">
              {currentPosition.territory}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 bg-gray-100 p-4 overflow-y-auto">
          <AlertsPanel alerts={alerts} onMarkAsRead={handleMarkAlertAsRead} />

          {/* Live data indicator */}
          {wildfireTime !== null && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <h3 className="font-semibold text-red-800">Live Wildfire Data</h3>
              <p className="text-red-700">
                Time elapsed: {wildfireTime} seconds
              </p>
              <div className="mt-2 text-sm text-gray-700">
                Data is being streamed in real-time from the wildfire monitoring
                system.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
