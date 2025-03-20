import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

class GameClient {
  constructor() {
    this.socket = null;
    this.playerId = localStorage.getItem("ocean_player_id") || uuidv4();
    this.playerName = localStorage.getItem("ocean_player_name") || "Player";
    this.sessionId = "default";
    this.connected = false;
    this.gameState = {
      players: {},
      treasures: [],
      hazards: [],
      weather: "calm",
    };
    this.eventHandlers = {
      playerJoined: [],
      playerLeft: [],
      playerMoved: [],
      weatherChanged: [],
      treasureUpdate: [],
      highScores: [],
      gameState: [],
    };

    // Save player ID for future sessions
    localStorage.setItem("ocean_player_id", this.playerId);
  }

  // Connect to the game server
  connect(playerName, sessionId = "default") {
    if (this.connected) return Promise.resolve();

    // Update player information
    this.playerName = playerName || this.playerName;
    this.sessionId = sessionId;
    localStorage.setItem("ocean_player_name", this.playerName);

    // Get the server URL from environment or default to localhost
    const serverUrl =
      process.env.NEXT_PUBLIC_GAME_SERVER ||
      (window.location.hostname === "localhost"
        ? "http://localhost:6767"
        : window.location.origin);

    // Create socket connection
    this.socket = io(serverUrl);

    // Set up event listeners
    return new Promise((resolve, reject) => {
      this.socket.on("connect", () => {
        console.log("Connected to game server");
        this.connected = true;

        // Join the game session
        this.socket.emit("join_game", {
          player_id: this.playerId,
          player_name: this.playerName,
          session_id: this.sessionId,
        });

        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        reject(error);
      });

      this.socket.on("game_state", (data) => {
        console.log("Received game state:", data);

        // Store initial game state
        this.gameState.weather = data.weather;
        this.gameState.treasures = data.treasures;
        this.gameState.hazards = data.hazards;

        // Format players into a map
        this.gameState.players = {};
        data.players.forEach((player) => {
          this.gameState.players[player.playerId] = player;
        });

        // Trigger event handlers
        this._triggerEvent("gameState", this.gameState);
      });

      this.socket.on("player_joined", (data) => {
        console.log("Player joined:", data);
        this.gameState.players[data.player_id] = {
          playerId: data.player_id,
          name: data.name,
          position: data.position,
          rotation: data.rotation,
        };
        this._triggerEvent("playerJoined", data);
      });

      this.socket.on("player_left", (data) => {
        console.log("Player left:", data.player_id);
        delete this.gameState.players[data.player_id];
        this._triggerEvent("playerLeft", data);
      });

      this.socket.on("player_moved", (data) => {
        if (this.gameState.players[data.player_id]) {
          this.gameState.players[data.player_id].position = data.position;
          this.gameState.players[data.player_id].rotation = data.rotation;
          this._triggerEvent("playerMoved", data);
        }
      });

      this.socket.on("weather_changed", (data) => {
        console.log("Weather changed:", data.weather);
        this.gameState.weather = data.weather;
        this._triggerEvent("weatherChanged", data);
      });

      this.socket.on("treasure_update", (data) => {
        console.log("Treasure update:", data);

        // Remove treasures
        if (data.removed && data.removed.length) {
          this.gameState.treasures = this.gameState.treasures.filter(
            (t) => !data.removed.includes(t.id)
          );
        }

        // Add new treasures
        if (data.added && data.added.length) {
          this.gameState.treasures = [
            ...this.gameState.treasures,
            ...data.added,
          ];
        }

        this._triggerEvent("treasureUpdate", data);
      });

      this.socket.on("high_scores", (data) => {
        console.log("High scores:", data.scores);
        this._triggerEvent("highScores", data.scores);
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from game server");
        this.connected = false;
      });
    });
  }

  // Disconnect from the game server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Update player position and rotation
  updatePosition(position, rotation, velocity) {
    if (!this.connected) return;

    this.socket.emit("player_update", {
      player_id: this.playerId,
      session_id: this.sessionId,
      position,
      rotation,
      velocity,
    });
  }

  // Update player status (score, health, etc.)
  updateStatus(score, shipDamage) {
    if (!this.connected) return;

    this.socket.emit("status_update", {
      player_id: this.playerId,
      session_id: this.sessionId,
      score,
      ship_damage: shipDamage,
    });
  }

  // Notify server when a treasure is collected
  collectTreasure(treasureId, position) {
    if (!this.connected) return;

    this.socket.emit("treasure_collected", {
      player_id: this.playerId,
      session_id: this.sessionId,
      treasure_id: treasureId,
      position,
    });
  }

  // Register event handlers
  on(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(callback);
    }
    return this; // For chaining
  }

  // Trigger event handlers
  _triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((callback) => callback(data));
    }
  }

  // Get current game state
  getGameState() {
    return this.gameState;
  }

  // Get player ID
  getPlayerId() {
    return this.playerId;
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }
}

// Create a singleton instance
const gameClient = new GameClient();
export default gameClient;
