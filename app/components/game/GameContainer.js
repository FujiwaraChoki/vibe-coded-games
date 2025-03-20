"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Use dynamic import with no SSR for the game components
// This is necessary because Three.js uses browser APIs
const QuantumDrift = dynamic(() => import("./QuantumDrift"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Loading Quantum Drift...</h2>
        <p>Initializing quantum physics engine</p>
      </div>
    </div>
  ),
});

const OceanVoyager = dynamic(() => import("./OceanVoyager"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-blue-900 text-white">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Loading Ocean Voyager...</h2>
        <p>Preparing ocean simulation</p>
      </div>
    </div>
  ),
});

export default function GameContainer() {
  const [selectedGame, setSelectedGame] = useState(null);

  // If no game is selected, show the game selection menu
  if (!selectedGame) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <h1 className="text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          Choose Your Adventure
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          <button
            onClick={() => setSelectedGame("quantum")}
            className="group relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-purple-900 opacity-70 group-hover:opacity-50 transition-opacity"></div>
            <div className="p-6 h-80 flex flex-col justify-between relative z-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Quantum Drift</h2>
                <p className="text-gray-200 mb-4">
                  Navigate your spacecraft through multiple quantum dimensions,
                  each with unique physics properties.
                </p>
              </div>
              <div>
                <span className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors">
                  Launch Spacecraft
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedGame("ocean")}
            className="group relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-blue-900 opacity-70 group-hover:opacity-50 transition-opacity"></div>
            <div className="p-6 h-80 flex flex-col justify-between relative z-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Ocean Voyager</h2>
                <p className="text-gray-200 mb-4">
                  Navigate your ship through treacherous waters, collect
                  treasures, and survive the changing weather conditions.
                </p>
              </div>
              <div>
                <span className="inline-block px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors">
                  Set Sail
                </span>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => {
            // Pick a random game
            const games = ["quantum", "ocean"];
            const randomGame = games[Math.floor(Math.random() * games.length)];
            setSelectedGame(randomGame);
          }}
          className="mt-8 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white font-semibold transition-colors"
        >
          Random Adventure
        </button>
      </div>
    );
  }

  // Render the selected game
  return (
    <div className="relative w-full h-full">
      {selectedGame === "quantum" ? <QuantumDrift /> : <OceanVoyager />}

      <button
        onClick={() => setSelectedGame(null)}
        className="absolute top-4 right-4 z-30 px-4 py-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded transition-colors"
      >
        Change Game
      </button>
    </div>
  );
}
