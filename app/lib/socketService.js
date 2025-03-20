import io from "socket.io-client";

class SocketService {
  socket = null;

  connect(playerId, playerName, sessionId) {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin,
      {
        query: {
          playerId,
          playerName,
          sessionId,
        },
      }
    );

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to game server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from game server");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send player position updates
  updatePosition(position, rotation, velocity) {
    if (this.socket) {
      this.socket.emit("playerUpdate", {
        position,
        rotation,
        velocity,
      });
    }
  }

  // Send player status updates
  updatePlayerStatus(score, shipDamage, treasuresCollected) {
    if (this.socket) {
      this.socket.emit("statusUpdate", {
        score,
        shipDamage,
        treasuresCollected,
      });
    }
  }

  // Register event handler for other players' updates
  onPlayerUpdates(callback) {
    if (this.socket) {
      this.socket.on("playersUpdate", callback);
    }
  }

  // Register event handler for game state updates (weather, etc.)
  onGameStateUpdate(callback) {
    if (this.socket) {
      this.socket.on("gameStateUpdate", callback);
    }
  }

  // Register event handler for new treasure spawns
  onTreasureUpdate(callback) {
    if (this.socket) {
      this.socket.on("treasureUpdate", callback);
    }
  }

  // Inform server when a treasure is collected
  collectTreasure(treasureId, position) {
    if (this.socket) {
      this.socket.emit("treasureCollected", {
        treasureId,
        position,
      });
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
