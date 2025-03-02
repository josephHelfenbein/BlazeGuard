"use client";

import React from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Alert } from "@/types/alerts";

type AlertsPanelProps = {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
};

// Define a local interface that matches your hardcoded data structure
interface FireAlert {
  id: string;
  location: string;
  predictedTime: Date;
  severity: string;
  message: string;
  isRead: boolean;
}

export default function AlertsPanel({
  alerts,
  onMarkAsRead,
}: AlertsPanelProps) {
  // Hardcoded alerts for wildfire scenario
  const hardcodedAlerts: FireAlert[] = [
    {
      id: "alert-1",
      location: "Yosemite Village",
      predictedTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      severity: "high",
      message:
        "Fire expected to reach village perimeter. Evacuation recommended.",
      isRead: false,
    },
    {
      id: "alert-2",
      location: "Highway 120",
      predictedTime: new Date(Date.now() + 60 * 60000), // 1 hour from now
      severity: "high",
      message: "Fire expected to reach highway. Road closure expected.",
      isRead: false,
    },
    {
      id: "alert-3",
      location: "El Capitan Meadow",
      predictedTime: new Date(Date.now() + 45 * 60000), // 45 minutes from now
      severity: "high",
      message:
        "Rapid fire spread predicted. All personnel must evacuate immediately.",
      isRead: false,
    },
    {
      id: "alert-4",
      location: "Glacier Point",
      predictedTime: new Date(Date.now() + 120 * 60000), // 2 hours from now
      severity: "low",
      message:
        "Smoke conditions expected to worsen. Air quality advisory in effect.",
      isRead: false,
    },
    {
      id: "alert-5",
      location: "Mariposa Grove",
      predictedTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
      severity: "high",
      message:
        "Fire approaching historic sequoias. Emergency response teams dispatched.",
      isRead: false,
    },
  ];

  // Sort alerts by predicted time (most urgent first)
  const sortedAlerts = [...hardcodedAlerts].sort(
    (a, b) => a.predictedTime.getTime() - b.predictedTime.getTime()
  );

  // Format time until impact
  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) return "Now";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  // Get severity color
  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-red-100 border-red-500 text-red-700";
      case "medium":
        return "bg-orange-100 border-orange-500 text-orange-700";
      case "low":
        return "bg-yellow-100 border-yellow-500 text-yellow-700";
      default:
        return "bg-gray-100 border-gray-500 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[500px] flex flex-col">
      <div className="bg-red-600 text-white p-3 flex items-center">
        <Bell className="mr-2" size={18} />
        <h3 className="font-semibold">Fire Alerts</h3>
      </div>

      <div className="overflow-y-auto flex-grow p-2">
        {sortedAlerts.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No active alerts</div>
        ) : (
          <ul className="space-y-2">
            {sortedAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`p-3 border-l-4 rounded ${getSeverityColor(alert.severity)} ${!alert.isRead ? "font-semibold" : ""}`}
                onClick={() => onMarkAsRead(alert.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      {!alert.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      )}
                      <span className="font-medium">{alert.location}</span>
                    </div>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      Impact in: {formatTimeUntil(alert.predictedTime)}
                    </div>
                    <div className="text-xs mt-1">
                      {alert.predictedTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
