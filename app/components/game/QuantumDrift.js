"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { initializeGame } from "./gameCore";

export default function QuantumDrift() {
  const containerRef = useRef(null);
  const [currentRealm, setCurrentRealm] = useState("regular");
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [easterEggMessage, setEasterEggMessage] = useState(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !gameStarted) return;

    // Initialize game
    const { cleanup } = initializeGame({
      container: containerRef.current,
      onRealmChange: (realm) => setCurrentRealm(realm),
    });

    // Store game instance for future reference
    gameInstanceRef.current = { cleanup };

    // Setup easter egg message listener
    const handleEasterEggFound = (event) => {
      const { message } = event.detail;
      setEasterEggMessage(message);

      // Auto-hide message after 4 seconds
      setTimeout(() => {
        setEasterEggMessage(null);
      }, 4000);
    };

    window.addEventListener("easterEggFound", handleEasterEggFound);

    // Cleanup on unmount
    return () => {
      if (gameInstanceRef.current && gameInstanceRef.current.cleanup) {
        gameInstanceRef.current.cleanup();
      }
      window.removeEventListener("easterEggFound", handleEasterEggFound);
    };
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true);
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  // Map realm names to their descriptions (to be displayed in the UI)
  const realmDescriptions = {
    regular: "Standard physics in regular space",
    lowGravity: "Lower inertia, less drag, higher top speed",
    highDensity: "Heavy resistance, higher drag, slower movement",
    probability: "Unpredictable movements with quantum randomness",
    temporalFlux: "Time fluctuates unpredictably, affecting movement speed",
    quantumEntanglement: "Movement can be mirrored in peculiar ways",
    darkMatter: "Invisible gravity wells affect your trajectory",
    subatomic: "Fast and chaotic like particles in an atom",
  };

  // Function to get more specific information about the current realm
  const getRealmInfo = () => {
    switch (currentRealm) {
      case "regular":
        return "Balanced and predictable physics - a good baseline.";
      case "lowGravity":
        return "You can reach higher speeds, but have less control when changing direction.";
      case "highDensity":
        return "Slower but more precise movement. Great for navigating tight spaces.";
      case "probability":
        return "Random fluctuations make movement unpredictable. Expect the unexpected!";
      case "temporalFlux":
        return "Time itself flows irregularly here, causing your ship to accelerate and decelerate in waves.";
      case "quantumEntanglement":
        return "Controls occasionally reverse as quantum entanglement affects your movement.";
      case "darkMatter":
        return "Invisible gravitational pulls will affect your trajectory. Can you feel them?";
      case "subatomic":
        return "Incredibly fast but chaotic. Maximum speed but minimum predictability.";
      default:
        return "";
    }
  };

  return (
    <div className="relative w-full h-full">
      {!gameStarted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white z-10">
          <h1 className="text-4xl font-bold mb-8">Quantum Drift</h1>
          <p className="text-xl mb-12 max-w-md text-center">
            Navigate your spacecraft through multiple quantum dimensions, each
            with unique physics properties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
            >
              Start Game
            </button>
            <button
              onClick={toggleInstructions}
              className="bg-transparent hover:bg-purple-700 text-purple-400 hover:text-white font-bold py-3 px-8 rounded-full text-lg border border-purple-400 hover:border-transparent transition-colors"
            >
              Instructions
            </button>
          </div>

          {showInstructions && (
            <div className="mt-10 bg-gray-900 bg-opacity-80 p-6 rounded-lg max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Game Controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-300">
                    Spacecraft Controls
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        W
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        ↑
                      </span>
                      Move Forward
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        S
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        ↓
                      </span>
                      Move Backward
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        A
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        ←
                      </span>
                      Move Left
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        D
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        →
                      </span>
                      Move Right
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        SPACE
                      </span>
                      Fire Laser Beams
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-300">
                    Quantum Realm Shifting
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        1
                      </span>
                      Regular Space
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        2
                      </span>
                      Low Gravity
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        3
                      </span>
                      High Density
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        4
                      </span>
                      Probability Field
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        5
                      </span>
                      Temporal Flux
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        6
                      </span>
                      Quantum Entanglement
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        7
                      </span>
                      Dark Matter
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        8
                      </span>
                      Subatomic
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        R
                      </span>
                      Random Realm
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="absolute inset-0 bg-black z-0"
          ></div>

          {/* HUD */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <div className="font-bold">
                Current Realm:{" "}
                <span className="text-purple-300">{currentRealm}</span>
              </div>
              <div className="text-sm mt-1 opacity-80">
                {realmDescriptions[currentRealm]}
              </div>
              <div className="text-xs mt-1 text-purple-200">
                {getRealmInfo()}
              </div>
            </div>
          </div>

          {/* Easter egg messages */}
          {easterEggMessage && (
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="bg-purple-900 bg-opacity-80 text-white py-2 px-6 rounded-lg text-lg animate-bounce">
                {easterEggMessage}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
