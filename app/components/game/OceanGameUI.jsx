import React, { useEffect, useRef, useState } from "react";
import { initializeOceanGame } from "./oceanGameCore";
import SpeedControl from "./SpeedControl";

const OceanGameUI = () => {
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [score, setScore] = useState(0);
  const [weather, setWeather] = useState("calm");
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
      },
      onGameOver: (finalScore) => {
        setGameOver(true);
        setScore(finalScore);
      },
    });

    // Update health periodically based on ship damage
    const healthInterval = setInterval(() => {
      if (gameInstanceRef.current) {
        const damage = gameInstanceRef.current.gameState.shipDamage;
        setHealth(Math.max(0, 100 - damage));
      }
    }, 100);

    // Cleanup function
    return () => {
      clearInterval(healthInterval);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.cleanup();
      }
    };
  }, [gameStarted]);

  // Handle pausing the game
  const togglePause = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.gameState.paused =
        !gameInstanceRef.current.gameState.paused;
      setIsPaused(!isPaused);
    }
  };

  // Handle game start
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setHealth(100);
    setScore(0);
  };

  // Handle game restart
  const restartGame = () => {
    // Clean up the current game
    if (gameInstanceRef.current) {
      gameInstanceRef.current.cleanup();
    }

    // Reset game state
    setGameStarted(false);
    setGameOver(false);

    // Small delay to ensure clean restart
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // Handle speed changes from the SpeedControl component
  const handleSpeedChange = (speedSettings) => {
    if (gameInstanceRef.current && gameInstanceRef.current.handleSpeedChange) {
      gameInstanceRef.current.handleSpeedChange(speedSettings);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={gameContainerRef} className="w-full h-full"></div>

      {/* Game HUD */}
      {gameStarted && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <div>
            <div className="text-white text-xl font-bold">Score: {score}</div>
            <div className="mt-2">
              <div className="bg-gray-800 bg-opacity-50 rounded-full h-4 w-32">
                <div
                  className="bg-red-500 h-4 rounded-full"
                  style={{ width: `${health}%` }}
                ></div>
              </div>
            </div>
            <div className="text-white mt-2">Weather: {weather}</div>
          </div>

          {/* Speed Control */}
          <div className="mr-4">
            <SpeedControl onSpeedChange={handleSpeedChange} />
          </div>

          {/* Pause Button */}
          <button
            onClick={togglePause}
            className="bg-gray-800 bg-opacity-50 text-white px-4 py-2 rounded"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      )}

      {/* Game Start Screen */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <h1 className="text-4xl text-white font-bold mb-4">
              Ocean Adventure
            </h1>
            <p className="text-xl text-white mb-6">
              Collect treasures and avoid hazards!
            </p>
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-xl"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <h1 className="text-4xl text-white font-bold mb-4">Game Over</h1>
            <p className="text-xl text-white mb-2">Final Score: {score}</p>
            <button
              onClick={restartGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-xl mt-4"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OceanGameUI;
