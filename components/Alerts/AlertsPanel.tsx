"use client";

import React from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Alert } from "@/types/alerts";

type AlertsPanelProps = {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
};

export default function AlertsPanel({
  alerts,
  onMarkAsRead,
}: AlertsPanelProps) {
  // Sort alerts by predicted time (most urgent first)
  const sortedAlerts = [...alerts].sort(
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
