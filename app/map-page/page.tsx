import React from "react";
import MapboxExample from "../../components/map-components";

const MapPage = () => {
  return (
    <div className="min-h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Our Location</h1>
      </div>
      <div className="h-[600px]">
        <MapboxExample />
      </div>
    </div>
  );
};

export default MapPage;
