import React, { useState, useEffect } from "react";
import { SHIP_PHYSICS } from "./gameConfig";

// Component for adjusting the ship speed at runtime
export default function SpeedControl({ onSpeedChange }) {
  const [maxSpeed, setMaxSpeed] = useState(SHIP_PHYSICS.MAX_SPEED);
  const [acceleration, setAcceleration] = useState(
    SHIP_PHYSICS.BASE_ACCELERATION
  );
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // Update the ship physics when values change
    if (onSpeedChange) {
      onSpeedChange({
        maxSpeed,
        acceleration,
      });
    }
  }, [maxSpeed, acceleration, onSpeedChange]);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 bg-opacity-75 rounded-lg p-2 text-white z-50">
      <button
        onClick={toggleControls}
        className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full mb-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      {showControls && (
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-sm">Max Speed: {maxSpeed}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm">
              Acceleration: {acceleration}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={acceleration}
              onChange={(e) => setAcceleration(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
