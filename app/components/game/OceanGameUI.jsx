import React, { useEffect, useRef, useState } from "react";
import { initializeOceanGame } from "./oceanGameCore";
import SpeedControl from "./SpeedControl";
import gameClient from "@/app/lib/gameClient";

const OceanGameUI = () => {
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [score, setScore] = useState(0);
  const [weather, setWeather] = useState("calm");
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFishingLog, setShowFishingLog] = useState(false);
  const [caughtFish, setCaughtFish] = useState([]);
  const [fishingStatus, setFishingStatus] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [sessionId, setSessionId] = useState("default");
  const [isMultiplayer, setIsMultiplayer] = useState(true);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [highScores, setHighScores] = useState([]);
  const [showMultiplayerMenu, setShowMultiplayerMenu] = useState(false);

  // Initialize the game
  useEffect(() => {
    if (!gameContainerRef.current || !gameStarted) return;

    // Initialize the game
    gameInstanceRef.current = initializeOceanGame({
      container: gameContainerRef.current,
      onWeatherChange: (newWeather) => {
        setWeather(newWeather);
      },
      onScoreUpdate: (newScore) => {
        setScore(newScore);
        // Update score in multiplayer
        if (isMultiplayer && gameClient.isConnected()) {
          gameClient.updateStatus(newScore, 100 - health);
        }
      },
      onGameOver: (finalScore) => {
        setGameOver(true);
        setScore(finalScore);
        // Disconnect from multiplayer when game over
        if (isMultiplayer && gameClient.isConnected()) {
          gameClient.disconnect();
        }
      },
      onFishCaught: (fish) => {
        setCaughtFish((prev) => [...prev, fish]);
        setFishingStatus(`Caught: ${fish.name} (+${fish.points} pts)`);

        // Clear fishing status after 3 seconds
        setTimeout(() => {
          setFishingStatus(null);
        }, 3000);
      },
      // Add multiplayer callbacks
      isMultiplayer,
      onPositionUpdate: (position, rotation, velocity) => {
        if (isMultiplayer && gameClient.isConnected()) {
          gameClient.updatePosition(position, rotation, velocity);
        }
      },
      onTreasureCollected: (treasureId, position) => {
        if (isMultiplayer && gameClient.isConnected()) {
          gameClient.collectTreasure(treasureId, position);
        }
      },
      getOtherPlayers: () => {
        if (isMultiplayer && gameClient.isConnected()) {
          const gameState = gameClient.getGameState();
          const currentPlayerId = gameClient.getPlayerId();
          // Filter out current player
          const otherPlayers = Object.values(gameState.players).filter(
            (player) => player.playerId !== currentPlayerId
          );
          return otherPlayers;
        }
        return [];
      },
      getCurrentPlayerId: () => {
        return gameClient.getPlayerId();
      },
    });

    // Set up event listeners for the game client
    if (isMultiplayer) {
      gameClient.on("gameState", (gameState) => {
        // Update weather from server
        setWeather(gameState.weather);

        // Update connected players list
        setConnectedPlayers(Object.values(gameState.players));
      });

      gameClient.on("playerJoined", (data) => {
        // Update connected players when someone joins
        setConnectedPlayers((prev) => [
          ...prev,
          {
            playerId: data.player_id,
            name: data.name,
            position: data.position,
            rotation: data.rotation,
          },
        ]);
      });

      gameClient.on("playerLeft", (data) => {
        // Remove player when they leave
        setConnectedPlayers((prev) =>
          prev.filter((player) => player.playerId !== data.player_id)
        );
      });

      gameClient.on("highScores", (scores) => {
        setHighScores(scores);
      });

      gameClient.on("weatherChanged", (data) => {
        setWeather(data.weather);
      });
    }

    // Update health and fishing status periodically
    const healthInterval = setInterval(() => {
      if (gameInstanceRef.current) {
        const damage = gameInstanceRef.current.gameState.shipDamage;
        setHealth(Math.max(0, 100 - damage));

        // Update fishing status
        if (gameInstanceRef.current.gameState.fishing.isFishing) {
          if (gameInstanceRef.current.gameState.fishing.fishHooked) {
            setFishingStatus("Fish hooked! Press F to reel in!");
          } else {
            setFishingStatus("Fishing... Waiting for a bite...");
          }
        } else if (!fishingStatus || fishingStatus.includes("Caught:")) {
          // Don't clear "Caught" messages here, they have their own timeout
        } else {
          setFishingStatus(null);
        }
      }
    }, 100);

    return () => {
      // Clean up the game instance when component unmounts
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose();
      }

      // Disconnect from multiplayer
      if (isMultiplayer && gameClient.isConnected()) {
        gameClient.disconnect();
      }

      clearInterval(healthInterval);
    };
  }, [gameStarted, isMultiplayer, health]);

  // Handle pausing the game
  const togglePause = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.gameState.paused =
        !gameInstanceRef.current.gameState.paused;
      setIsPaused(!isPaused);
    }
  };

  // Toggle fishing log display
  const toggleFishingLog = () => {
    setShowFishingLog(!showFishingLog);
  };

  // Handle game start
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setHealth(100);
    setCaughtFish([]);

    // Connect to multiplayer server if multiplayer is enabled
    if (isMultiplayer) {
      const name =
        playerName.trim() || `Sailor-${Math.floor(Math.random() * 1000)}`;
      setPlayerName(name);

      gameClient
        .connect(name, sessionId)
        .then(() => {
          console.log(`Connected to game server as ${name}`);
        })
        .catch((error) => {
          console.error("Failed to connect to game server:", error);
          // Fallback to single player if connection fails
          setIsMultiplayer(false);
        });
    }
  };

  // Handle game restart
  const restartGame = () => {
    setGameOver(false);
    setGameStarted(false);
    setScore(0);
    setHealth(100);
    setCaughtFish([]);

    // Disconnect from current session
    if (isMultiplayer && gameClient.isConnected()) {
      gameClient.disconnect();
    }
  };

  // Handle speed changes from the SpeedControl component
  const handleSpeedChange = (speedSettings) => {
    if (gameInstanceRef.current && gameInstanceRef.current.handleSpeedChange) {
      gameInstanceRef.current.handleSpeedChange(speedSettings);
    }
  };

  // Count fish by type for the fishing log
  const fishCounts = caughtFish.reduce((counts, fish) => {
    counts[fish.name] = (counts[fish.name] || 0) + 1;
    return counts;
  }, {});

  // Render game UI
  return (
    <div className="w-full h-full relative overflow-hidden">
      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-800 bg-opacity-80 z-10 p-4 text-white">
          <h1 className="text-4xl mb-6 font-bold">Ocean Voyager</h1>
          <p className="mb-6 text-xl">
            Explore the seas, collect treasures, and catch fish!
          </p>

          {showMultiplayerMenu ? (
            <div className="bg-blue-700 p-6 rounded-lg max-w-md w-full">
              <h2 className="text-2xl mb-4">Multiplayer Options</h2>

              <div className="mb-4">
                <label className="block mb-2">Your Name:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-2 rounded text-black"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2">Session ID:</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID or create new"
                  className="w-full p-2 rounded text-black"
                />
                <p className="text-xs mt-1">
                  Leave empty for default session, or enter a custom ID to play
                  with friends
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowMultiplayerMenu(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={startGame}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Start Game
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setIsMultiplayer(false);
                  startGame();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-xl hover:bg-blue-700"
              >
                Single Player
              </button>
              <button
                onClick={() => {
                  setIsMultiplayer(true);
                  setShowMultiplayerMenu(true);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg text-xl hover:bg-green-700"
              >
                Multiplayer
              </button>
            </div>
          )}
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10 p-4">
          <h2 className="text-3xl mb-4 text-white">Game Over</h2>
          <p className="text-2xl mb-6 text-white">Final Score: {score}</p>
          <button
            onClick={restartGame}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Play Again
          </button>
        </div>
      )}

      <div ref={gameContainerRef} className="w-full h-full" />

      {gameStarted && !gameOver && (
        <>
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between text-white">
            <div>
              <div className="text-xl font-bold">Score: {score}</div>
              <div className="flex items-center">
                <div className="mr-2">Health:</div>
                <div className="w-32 h-4 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xl font-bold">Weather: {weather}</div>
              {fishingStatus && (
                <div className="text-green-400">{fishingStatus}</div>
              )}
            </div>
            <div className="flex">
              <button
                onClick={togglePause}
                className="bg-blue-600 px-3 py-1 rounded mr-2 hover:bg-blue-700"
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={toggleFishingLog}
                className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
              >
                Fishing Log
              </button>
            </div>
          </div>

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="bg-blue-800 p-6 rounded-lg max-w-md text-white">
                <h2 className="text-2xl mb-4">Game Paused</h2>
                <p className="mb-4">
                  W/S or Arrow Up/Down: Move forward/backward
                  <br />
                  A/D or Arrow Left/Right: Turn left/right
                  <br />
                  Space: Speed boost
                  <br />
                  F: Fish (when near fishing spots)
                  <br />
                  Escape: Pause/Unpause
                </p>
                <button
                  onClick={togglePause}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Resume
                </button>
              </div>
            </div>
          )}

          {showFishingLog && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="bg-blue-800 p-6 rounded-lg max-w-md w-full text-white">
                <h2 className="text-2xl mb-4">Fishing Log</h2>
                {caughtFish.length === 0 ? (
                  <p>You haven't caught any fish yet!</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {caughtFish.map((fish, index) => (
                      <div
                        key={index}
                        className="mb-2 flex justify-between border-b border-blue-700 pb-1"
                      >
                        <span>{fish.name}</span>
                        <span>{fish.points} pts</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={toggleFishingLog}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <SpeedControl onSpeedChange={handleSpeedChange} />

          {/* Multiplayer Players List */}
          {isMultiplayer && connectedPlayers.length > 0 && (
            <div className="absolute top-24 right-4 bg-blue-900 bg-opacity-80 p-3 rounded text-white max-w-xs">
              <h3 className="text-lg font-bold mb-2">
                Players Online: {connectedPlayers.length}
              </h3>
              <div className="max-h-40 overflow-y-auto">
                {connectedPlayers.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex justify-between mb-1"
                  >
                    <span>{player.name}</span>
                    {player.playerId === gameClient.getPlayerId() && (
                      <span className="text-green-400">(You)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Scores */}
          {isMultiplayer && highScores.length > 0 && (
            <div className="absolute top-24 left-4 bg-blue-900 bg-opacity-80 p-3 rounded text-white max-w-xs">
              <h3 className="text-lg font-bold mb-2">High Scores</h3>
              <div className="max-h-40 overflow-y-auto">
                {highScores.map((score, index) => (
                  <div key={index} className="flex justify-between mb-1">
                    <span>{score.name}</span>
                    <span>{score.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OceanGameUI;
