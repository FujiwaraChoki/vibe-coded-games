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
                      Probability
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2 text-purple-300">
                Quantum Realms Properties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Regular Space</h4>
                  <p className="text-sm">
                    Standard physics with balanced movement and inertia.
                  </p>
                </div>
                <div className="bg-cyan-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Low Gravity</h4>
                  <p className="text-sm">
                    Floaty movement with less drag and higher top speed.
                  </p>
                </div>
                <div className="bg-purple-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">High Density</h4>
                  <p className="text-sm">
                    Heavy resistance with higher drag and slower movement.
                  </p>
                </div>
                <div className="bg-green-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Probability</h4>
                  <p className="text-sm">
                    Unpredictable movement with quantum randomness affecting
                    controls.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-300">
                <span className="font-bold">Game Goal:</span> Explore the
                different quantum realms and experience how physics changes in
                each dimension. The game preserves momentum when shifting
                between realms, so use this to your advantage!
              </p>

              <button
                onClick={toggleInstructions}
                className="mt-6 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
              >
                Close Instructions
              </button>
            </div>
          )}
        </div>
      ) : null}

      {gameStarted && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded z-20">
          <p>
            Current Realm: <span className="font-bold">{currentRealm}</span>
          </p>
          <p className="text-xs mt-1 text-gray-300">
            Press 1-4 to switch realms
          </p>
        </div>
      )}

      {/* Easter Egg Notification */}
      {easterEggMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-purple-900 bg-opacity-80 text-white px-6 py-3 rounded-full z-30 animation-fade-in-out shadow-lg border border-purple-400">
          <p className="font-bold text-yellow-300">⭐ {easterEggMessage} ⭐</p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
