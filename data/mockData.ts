// Mock fire data in GeoJSON format
export const mockFireData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "fire-1",
        name: "Yosemite Valley Fire",
        timestamp: "2023-07-15T06:00:00",
        intensity: "high",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.5383, 37.8651],
            [-119.5283, 37.8751],
            [-119.5183, 37.8651],
            [-119.5283, 37.8551],
            [-119.5383, 37.8651],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "fire-2",
        name: "Yosemite Valley Fire",
        timestamp: "2023-07-15T12:00:00",
        intensity: "high",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.5383, 37.8651],
            [-119.5183, 37.8851],
            [-119.4983, 37.8651],
            [-119.5183, 37.8451],
            [-119.5383, 37.8651],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "fire-3",
        name: "Yosemite Valley Fire",
        timestamp: "2023-07-16T00:00:00",
        intensity: "high",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.5383, 37.8651],
            [-119.5083, 37.8951],
            [-119.4783, 37.8651],
            [-119.5083, 37.8351],
            [-119.5383, 37.8651],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "fire-4",
        name: "Yosemite Valley Fire",
        timestamp: "2023-07-17T00:00:00",
        intensity: "high",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.5383, 37.8651],
            [-119.4883, 37.9151],
            [-119.4383, 37.8651],
            [-119.4883, 37.8151],
            [-119.5383, 37.8651],
          ],
        ],
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

// Mock alerts
export const mockAlerts = [
  {
    id: "alert-1",
    title: "Village Evacuation Warning",
    location: "Yosemite Village",
    predictedTime: new Date("2023-07-15T18:30:00"),
    timestamp: new Date("2023-07-15T18:00:00"),
    severity: "high" as const,
    message:
      "Fire expected to reach village perimeter. Evacuation recommended.",
    isRead: false,
  },
  {
    id: "alert-2",
    title: "Highway Closure Alert",
    location: "Highway 120",
    predictedTime: new Date("2023-07-16T08:15:00"),
    timestamp: new Date("2023-07-16T07:45:00"),
    severity: "medium" as const,
    message: "Road closure expected due to fire spread.",
    isRead: true,
  },
  {
    id: "alert-3",
    title: "Immediate Evacuation Order",
    location: "El Capitan Meadow",
    predictedTime: new Date("2023-07-16T14:45:00"),
    timestamp: new Date("2023-07-16T14:15:00"),
    severity: "high" as const,
    message:
      "Rapid fire spread predicted. All personnel must evacuate immediately.",
    isRead: false,
  },
  {
    id: "alert-4",
    title: "Air Quality Advisory",
    location: "Glacier Point",
    predictedTime: new Date("2023-07-17T10:30:00"),
    timestamp: new Date("2023-07-17T10:00:00"),
    severity: "low" as const,
    message:
      "Smoke conditions expected to worsen. Air quality advisory in effect.",
    isRead: false,
  },
];
