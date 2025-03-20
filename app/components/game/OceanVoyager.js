"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { initializeOceanGame } from "./oceanGameCore";
import gameClient from "../../lib/gameClient";

export default function OceanVoyager() {
  const containerRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState("calm");
  const [currentScore, setCurrentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    // Load player name from local storage
    const savedName = localStorage.getItem("ocean_player_name");
    if (savedName) {
      setPlayerName(savedName);
    } else {
      setPlayerName(`Sailor${Math.floor(Math.random() * 1000)}`);
    }

    // Load best score from local storage
    const savedBestScore = localStorage.getItem("oceanVoyagerBestScore");
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore, 10));
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !gameStarted) return;

    let cleanupMultiplayer = () => {};

    // Connect to multiplayer server if multiplayer mode is enabled
    if (isMultiplayer) {
      gameClient
        .connect(playerName)
        .then(() => {
          console.log("Connected to multiplayer server");
        })
        .catch((error) => {
          console.error("Failed to connect to multiplayer server:", error);
        });

      cleanupMultiplayer = () => {
        gameClient.disconnect();
      };
    }

    // Initialize ocean game
    const { cleanup, gameState } = initializeOceanGame({
      container: containerRef.current,
      onWeatherChange: (weather) => setWeatherCondition(weather),
      onScoreUpdate: (score) => {
        setCurrentScore(score);
        if (isMultiplayer) {
          gameClient.updateStatus(score, gameState.shipDamage);
        }
      },
      onGameOver: (finalScore) => {
        setGameOver(true);
        setCurrentScore(finalScore);
        if (finalScore > bestScore) {
          setBestScore(finalScore);
          localStorage.setItem("oceanVoyagerBestScore", finalScore);
        }
      },
      // Add multiplayer options
      isMultiplayer: isMultiplayer,
      onPositionUpdate: (position, rotation, velocity) => {
        if (isMultiplayer) {
          gameClient.updatePosition(position, rotation, velocity);
        }
      },
      onTreasureCollected: (treasureId, position) => {
        if (isMultiplayer) {
          gameClient.collectTreasure(treasureId, position);
        }
      },
      getOtherPlayers: () => {
        if (isMultiplayer) {
          const state = gameClient.getGameState();
          return Object.values(state.players);
        }
        return [];
      },
      getCurrentPlayerId: () => {
        if (isMultiplayer) {
          return gameClient.getPlayerId();
        }
        return null;
      },
    });

    // Store game instance for future reference
    gameInstanceRef.current = { cleanup, gameState };

    // Cleanup on unmount
    return () => {
      if (gameInstanceRef.current && gameInstanceRef.current.cleanup) {
        gameInstanceRef.current.cleanup();
      }
      cleanupMultiplayer();
    };
  }, [gameStarted, bestScore, isMultiplayer, playerName]);

  const startGame = (multiplayer = false) => {
    setIsMultiplayer(multiplayer);
    setGameStarted(true);
    setGameOver(false);
    setCurrentScore(0);
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  const handleNameChange = (e) => {
    setPlayerName(e.target.value);
    localStorage.setItem("ocean_player_name", e.target.value);
  };

  return (
    <div className="relative w-full h-full">
      {!gameStarted || gameOver ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900 bg-opacity-80 text-white z-10">
          <h1 className="text-4xl font-bold mb-8">Ocean Voyager</h1>

          {gameOver && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Game Over</h2>
              <p className="text-xl">Your Score: {currentScore}</p>
              <p className="text-md">Best Score: {bestScore}</p>
            </div>
          )}

          {!gameOver && (
            <div className="text-center mb-12 max-w-md">
              <p className="text-xl mb-4">
                Navigate your ship through treacherous waters, collect
                treasures, and survive the changing weather conditions.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="playerName"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Your Sailor Name:
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 bg-blue-800 text-white rounded border border-blue-600 focus:outline-none focus:ring focus:border-blue-400"
                  maxLength={20}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => startGame(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
            >
              {gameOver ? "Play Again (Solo)" : "Play Solo"}
            </button>
            <button
              onClick={() => startGame(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
            >
              {gameOver ? "Play Again (Multiplayer)" : "Play Multiplayer"}
            </button>
            <button
              onClick={toggleInstructions}
              className="bg-transparent hover:bg-blue-700 text-blue-300 hover:text-white font-bold py-3 px-8 rounded-full text-lg border border-blue-300 hover:border-transparent transition-colors"
            >
              Instructions
            </button>
          </div>

          {showInstructions && (
            <div className="mt-10 bg-blue-950 bg-opacity-80 p-6 rounded-lg max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Game Controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-300">
                    Ship Controls
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
                      Accelerate Forward
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        S
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        ↓
                      </span>
                      Brake/Reverse
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        A
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        ←
                      </span>
                      Turn Left
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        D
                      </span>{" "}
                      or
                      <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                        →
                      </span>
                      Turn Right
                    </li>
                    <li className="flex items-center">
                      <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                        SPACE
                      </span>
                      Drop Anchor (Emergency Stop)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-300">
                    Weather Conditions
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center bg-blue-900 bg-opacity-30 p-2 rounded">
                      <span className="font-bold mr-2">Calm</span>
                      <span className="text-sm">
                        Smooth sailing with gentle waves
                      </span>
                    </li>
                    <li className="flex items-center bg-blue-800 bg-opacity-30 p-2 rounded">
                      <span className="font-bold mr-2">Windy</span>
                      <span className="text-sm">
                        Strong winds affect your steering
                      </span>
                    </li>
                    <li className="flex items-center bg-gray-700 bg-opacity-50 p-2 rounded">
                      <span className="font-bold mr-2">Foggy</span>
                      <span className="text-sm">
                        Limited visibility, watch for obstacles
                      </span>
                    </li>
                    <li className="flex items-center bg-blue-700 bg-opacity-50 p-2 rounded">
                      <span className="font-bold mr-2">Stormy</span>
                      <span className="text-sm">
                        Rough seas and unpredictable waves
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2 text-blue-300">
                Game Objectives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Collect Treasures</h4>
                  <p className="text-sm">
                    Golden chests give you points. The harder-to-reach ones are
                    worth more!
                  </p>
                </div>
                <div className="bg-red-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Avoid Hazards</h4>
                  <p className="text-sm">
                    Rocks, whirlpools, and sea monsters can damage your ship.
                  </p>
                </div>
                <div className="bg-green-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Discover Power-ups</h4>
                  <p className="text-sm">
                    Find special items that can repair your ship or provide
                    temporary boosts.
                  </p>
                </div>
                <div className="bg-purple-900 bg-opacity-30 p-3 rounded">
                  <h4 className="font-bold">Survive Storms</h4>
                  <p className="text-sm">
                    Weather changes periodically. Adapt your sailing strategy
                    accordingly.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-300">
                <span className="font-bold">Special Tip:</span> Your ship has a
                damage meter. If it fills completely, your voyage ends. Repair
                power-ups appear as glowing blue crates.
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

      {gameStarted && !gameOver && (
        <div className="absolute top-4 left-4 flex gap-4 z-20">
          <div className="bg-blue-900 bg-opacity-70 text-white p-3 rounded">
            <p>
              Weather:{" "}
              <span className="font-bold capitalize">{weatherCondition}</span>
            </p>
          </div>
          <div className="bg-amber-900 bg-opacity-70 text-white p-3 rounded">
            <p>
              Score: <span className="font-bold">{currentScore}</span>
            </p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
