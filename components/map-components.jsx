"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { v4 as uuidv4 } from "uuid";

// Mock data for demonstration purposes
const MOCK_SOS_DATA = [
  {
    id: "1",
    type: "medical",
    urgency: "critical",
    location: [-74.5, 40.05],
    message: "Heart attack, need immediate assistance",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "unassigned",
  },
  {
    id: "2",
    type: "rescue",
    urgency: "high",
    location: [-74.48, 40.02],
    message: "Trapped in building after earthquake",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "assigned",
  },
  {
    id: "3",
    type: "supplies",
    urgency: "medium",
    location: [-74.52, 40.03],
    message: "Need water and food for family of 5",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: "unassigned",
  },
  {
    id: "4",
    type: "medical",
    urgency: "critical",
    location: [-74.51, 40.04],
    message: "Severe bleeding, need medical help",
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "unassigned",
  },
  {
    id: "5",
    type: "rescue",
    urgency: "high",
    location: [-74.49, 40.01],
    message: "Child trapped under debris",
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "assigned",
  },
];

const MOCK_AMBULANCES = [
  {
    id: "amb1",
    location: [-74.53, 40.06],
    destination: [-74.5, 40.05], // Heading to SOS #1
    status: "en-route",
    eta: "5 min",
  },
  {
    id: "amb2",
    location: [-74.47, 40.03],
    destination: [-74.49, 40.01], // Heading to SOS #5
    status: "en-route",
    eta: "8 min",
  },
];

// AI urgency analysis function (mock implementation)
const analyzeUrgency = (message, type) => {
  // In a real implementation, this would call an AI service
  const keywords = {
    critical: [
      "heart attack",
      "bleeding",
      "not breathing",
      "unconscious",
      "stroke",
      "choking",
    ],
    high: ["trapped", "injured", "broken", "child", "elderly", "pregnant"],
    medium: ["supplies", "water", "food", "medication", "shelter"],
    low: ["information", "update", "question"],
  };

  const messageLower = message.toLowerCase();

  // Check for critical keywords first
  for (const keyword of keywords.critical) {
    if (messageLower.includes(keyword)) return "critical";
  }

  // Then high priority
  for (const keyword of keywords.high) {
    if (messageLower.includes(keyword)) return "high";
  }

  // Then medium
  for (const keyword of keywords.medium) {
    if (messageLower.includes(keyword)) return "medium";
  }

  // Default to low if no keywords match
  for (const keyword of keywords.low) {
    if (messageLower.includes(keyword)) return "low";
  }

  // If type is medical, default to high, otherwise medium
  return type === "medical" ? "high" : "medium";
};

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clustersRef = useRef(null);
  const routesRef = useRef({});
  const animationFrameRef = useRef(null);

  const [sosRequests, setSosRequests] = useState(MOCK_SOS_DATA);
  const [ambulances, setAmbulances] = useState(MOCK_AMBULANCES);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // Initialize only once

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 11, // starting zoom
    });

    const map = mapRef.current;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Wait for map to load before adding data
    map.on("load", () => {
      // Add custom images for markers
      loadMarkerImages(map);

      // Initialize source for clustering
      map.addSource("sos-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add cluster layer
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "sos-points",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6", // Color for clusters with < 10 points
            10,
            "#f1f075", // Color for clusters with < 50 points
            50,
            "#f28cb1", // Color for clusters with >= 50 points
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20, // Radius for clusters with < 10 points
            10,
            30, // Radius for clusters with < 50 points
            50,
            40, // Radius for clusters with >= 50 points
          ],
        },
      });

      // Add cluster count layer
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "sos-points",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      // Add unclustered point layer
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "sos-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#11b4da",
          "circle-radius": 8,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      // Handle cluster click
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map
          .getSource("sos-points")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // Change cursor on hover
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Update the GeoJSON data
      updateSOSData();

      // Start animation loop for moving elements
      startAnimationLoop();
    });

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Load custom marker images
  const loadMarkerImages = (map) => {
    const images = [
      {
        id: "ambulance-icon",
        url: "https://cdn-icons-png.flaticon.com/512/1823/1823326.png",
      },
      {
        id: "medical-icon",
        url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
      },
      {
        id: "rescue-icon",
        url: "https://cdn-icons-png.flaticon.com/512/1022/1022900.png",
      },
      {
        id: "supplies-icon",
        url: "https://cdn-icons-png.flaticon.com/512/1261/1261163.png",
      },
      {
        id: "critical-ping",
        url: "https://cdn-icons-png.flaticon.com/512/6324/6324021.png",
      },
      {
        id: "high-ping",
        url: "https://cdn-icons-png.flaticon.com/512/6324/6324021.png",
      },
      {
        id: "medium-ping",
        url: "https://cdn-icons-png.flaticon.com/512/6324/6324021.png",
      },
      {
        id: "low-ping",
        url: "https://cdn-icons-png.flaticon.com/512/6324/6324021.png",
      },
    ];

    images.forEach((img) => {
      map.loadImage(img.url, (error, image) => {
        if (error) throw error;
        if (!map.hasImage(img.id)) {
          map.addImage(img.id, image);
        }
      });
    });
  };

  // Update SOS data on the map
  const updateSOSData = () => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Update GeoJSON for clustering
    const geojsonData = {
      type: "FeatureCollection",
      features: sosRequests.map((sos) => ({
        type: "Feature",
        properties: {
          id: sos.id,
          type: sos.type,
          urgency: sos.urgency,
          message: sos.message,
          timestamp: sos.timestamp,
          status: sos.status,
        },
        geometry: {
          type: "Point",
          coordinates: sos.location,
        },
      })),
    };

    if (map.getSource("sos-points")) {
      map.getSource("sos-points").setData(geojsonData);
    }

    // Add individual markers with popups
    sosRequests.forEach((sos) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.backgroundSize = "cover";

      // Set marker style based on urgency
      switch (sos.urgency) {
        case "critical":
          el.style.backgroundImage =
            "url('https://cdn-icons-png.flaticon.com/512/2966/2966327.png')";
          el.style.border = "3px solid red";
          el.style.borderRadius = "50%";
          el.style.animation = "pulse 1s infinite";
          break;
        case "high":
          el.style.backgroundImage =
            "url('https://cdn-icons-png.flaticon.com/512/1022/1022900.png')";
          el.style.border = "2px solid orange";
          el.style.borderRadius = "50%";
          break;
        case "medium":
          el.style.backgroundImage =
            "url('https://cdn-icons-png.flaticon.com/512/1261/1261163.png')";
          el.style.border = "2px solid yellow";
          el.style.borderRadius = "50%";
          break;
        default:
          el.style.backgroundImage =
            "url('https://cdn-icons-png.flaticon.com/512/1261/1261163.png')";
          el.style.border = "1px solid blue";
          el.style.borderRadius = "50%";
      }

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3 style="margin: 0 0 10px; color: ${sos.urgency === "critical" ? "red" : sos.urgency === "high" ? "orange" : "black"}">
            ${sos.type.toUpperCase()} - ${sos.urgency.toUpperCase()}
          </h3>
          <p style="margin: 0 0 5px;"><strong>Message:</strong> ${sos.message}</p>
          <p style="margin: 0 0 5px;"><strong>Time:</strong> ${new Date(sos.timestamp).toLocaleTimeString()}</p>
          <p style="margin: 0;"><strong>Status:</strong> ${sos.status}</p>
          ${sos.status === "assigned" ? '<p style="margin: 5px 0 0;"><strong>ETA:</strong> 8 min</p>' : ""}
          <button style="margin-top: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ${sos.status === "unassigned" ? "Respond" : "View Details"}
          </button>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(sos.location)
        .setPopup(popup)
        .addTo(map);

      // Store marker reference
      markersRef.current[sos.id] = marker;

      // Add click handler
      el.addEventListener("click", () => {
        setSelectedMarker(sos);

        // If this is a critical SOS, play alert sound
        if (sos.urgency === "critical") {
          playAlertSound();
        }

        // If this SOS has a responder, show the route
        if (sos.status === "assigned") {
          const ambulance = ambulances.find(
            (amb) =>
              amb.destination[0] === sos.location[0] &&
              amb.destination[1] === sos.location[1]
          );

          if (ambulance) {
            showRoute(ambulance.location, sos.location, sos.id);
          }
        }
      });
    });

    // Add ambulance markers
    ambulances.forEach((ambulance) => {
      const el = document.createElement("div");
      el.className = "ambulance-marker";
      el.style.width = "35px";
      el.style.height = "35px";
      el.style.backgroundImage =
        "url('https://cdn-icons-png.flaticon.com/512/1823/1823326.png')";
      el.style.backgroundSize = "cover";
      el.style.border = "2px solid blue";
      el.style.borderRadius = "50%";

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3 style="margin: 0 0 10px;">Ambulance ${ambulance.id}</h3>
          <p style="margin: 0 0 5px;"><strong>Status:</strong> ${ambulance.status}</p>
          <p style="margin: 0;"><strong>ETA:</strong> ${ambulance.eta}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(ambulance.location)
        .setPopup(popup)
        .addTo(map);

      // Store marker reference
      markersRef.current[ambulance.id] = marker;

      // Show route to destination
      showRoute(ambulance.location, ambulance.destination, ambulance.id);

      // Add click handler
      el.addEventListener("click", () => {
        // Find the SOS this ambulance is responding to
        const targetSOS = sosRequests.find(
          (sos) =>
            sos.location[0] === ambulance.destination[0] &&
            sos.location[1] === ambulance.destination[1]
        );

        if (targetSOS) {
          setSelectedMarker(targetSOS);
        }
      });
    });
  };

  // Show route between two points
  const showRoute = async (start, end, id) => {
    if (!mapRef.current) return;

    try {
      // In a real implementation, this would use the Mapbox Directions API
      // For demo purposes, we'll create a simple line

      const map = mapRef.current;
      const routeId = `route-${id}`;

      // Remove existing route if any
      if (map.getSource(routeId)) {
        map.removeLayer(routeId);
        map.removeSource(routeId);
      }

      // Create a simple route (straight line)
      // In a real implementation, use the Directions API for actual routing
      map.addSource(routeId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [start, end],
          },
        },
      });

      map.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75,
          "line-dasharray": [1, 2],
        },
      });

      // Store route reference
      routesRef.current[id] = { start, end };
    } catch (error) {
      console.error("Error showing route:", error);
    }
  };

  // Animation loop for moving elements
  const startAnimationLoop = () => {
    const animate = () => {
      // Update ambulance positions
      setAmbulances((prevAmbulances) => {
        const updatedAmbulances = prevAmbulances.map((ambulance) => {
          // Move ambulance toward destination
          const [startLng, startLat] = ambulance.location;
          const [endLng, endLat] = ambulance.destination;

          // Calculate new position (simple linear interpolation)
          // In a real implementation, this would follow the actual route
          const speed = 0.0001; // Adjust speed as needed
          const dx = endLng - startLng;
          const dy = endLat - startLat;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 0.0005) {
            // Close enough to destination, don't move
            return ambulance;
          }

          const newLng = startLng + (dx / distance) * speed;
          const newLat = startLat + (dy / distance) * speed;

          // Update marker position
          const marker = markersRef.current[ambulance.id];
          if (marker) {
            marker.setLngLat([newLng, newLat]);
          }

          // Update route
          if (routesRef.current[ambulance.id]) {
            showRoute([newLng, newLat], ambulance.destination, ambulance.id);
          }

          return {
            ...ambulance,
            location: [newLng, newLat],
          };
        });

        return updatedAmbulances;
      });

      // Simulate SOS ping fading
      // In a real implementation, this would be based on actual timestamps

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Play alert sound for critical SOS
  const playAlertSound = () => {
    // In a real implementation, this would play an actual sound
    console.log("Playing critical alert sound");
    // const audio = new Audio('/alert-sound.mp3');
    // audio.play();
  };

  // Add a new SOS request (for demo purposes)
  const addRandomSOS = () => {
    // Generate random location near the center
    const lng = -74.5 + (Math.random() - 0.5) * 0.1;
    const lat = 40 + (Math.random() - 0.5) * 0.1;

    const types = ["medical", "rescue", "supplies"];
    const messages = [
      "Need medical assistance",
      "Trapped in building",
      "Need water and food",
      "Injured person needs help",
      "Family with children needs evacuation",
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Analyze urgency using AI
    const urgency = analyzeUrgency(message, type);

    const newSOS = {
      id: uuidv4(),
      type,
      urgency,
      location: [lng, lat],
      message,
      timestamp: new Date().toISOString(),
      status: "unassigned",
    };

    setSosRequests((prev) => [...prev, newSOS]);

    // Update map with new data
    setTimeout(() => updateSOSData(), 100);
  };

  // Update SOS data when it changes
  useEffect(() => {
    updateSOSData();
  }, [sosRequests, ambulances]);

  return (
    <div className="relative h-full">
      <div ref={mapContainerRef} className="map-container h-full" />

      {/* Optional UI controls for demo */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-10">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={addRandomSOS}
        >
          Simulate New SOS
        </button>
      </div>

      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .marker {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .marker:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default MapboxExample;
