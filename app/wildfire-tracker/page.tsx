"use client";

import React, { useState, useEffect } from "react";
import WildfireMap from "@/components/Map/WildfireMap";
import TimelineControl from "@/components/Controls/TimelineControl";
import AlertsPanel from "@/components/Alerts/AlertsPanel";
import { Layers, Info, MapPin, Thermometer, Navigation } from "lucide-react";

// Mock data - replace with actual API calls
import { mockFireData, mockAlerts } from "@/data/mockData";

export default function WildfireTrackerPage() {
  // State for time control
  const [startTime] = useState(new Date("2023-07-15T00:00:00"));
  const [endTime] = useState(new Date("2023-07-18T00:00:00"));
  const [currentTime, setCurrentTime] = useState(
    new Date("2023-07-15T12:00:00")
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
  const [alerts, setAlerts] = useState(mockAlerts);

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
            fireData={mockFireData}
            currentTime={currentTime}
          />

          {/* Map overlay controls */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <TimelineControl
              startTime={startTime}
              endTime={endTime}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
              playbackSpeed={playbackSpeed}
              onPlaybackSpeedChange={setPlaybackSpeed}
            />
          </div>

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

          {/* Additional sidebar content can go here */}
        </div>
      </main>
    </div>
  );
}
