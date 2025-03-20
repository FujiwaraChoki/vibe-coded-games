// Game physics configuration
export const SHIP_PHYSICS = {
  // Speed settings
  MAX_SPEED: 55, // Maximum ship speed
  BASE_ACCELERATION: 20, // Base acceleration force
  BOOST_MULTIPLIER: 2.0, // Multiplier for speed boost powerup

  // Movement settings
  DRAG: 0.92, // Lower values = more drag (0-1)
  TURN_RESPONSIVENESS: 6.5, // Higher values = faster turning
  ROTATION_DAMPING: 0.85, // Lower values = faster rotation response
  ACCELERATION_SMOOTHING: 0.2, // Lower values = more responsive acceleration

  // Weather impact settings
  CALM_DRAG: 0.95,
  WINDY_DRAG: 0.97,
  FOGGY_DRAG: 0.93,
  STORMY_DRAG: 0.89,

  // Braking settings
  BRAKE_FORCE: 12, // Higher values = stronger brakes
  REVERSE_FORCE: 4, // Backwards acceleration
};

// Ocean environment settings
export const OCEAN = {
  SIZE: 500,
  WAVE_HEIGHT_MULTIPLIER: 1.5,
};

// Weather settings
export const WEATHER = {
  DURATION: 30, // Seconds before weather changes
  CALM_WAVE_MULTIPLIER: 0.6,
  WINDY_WAVE_MULTIPLIER: 1.4,
  FOGGY_WAVE_MULTIPLIER: 0.9,
  STORMY_WAVE_MULTIPLIER: 2.6,
};

// Game object settings
export const GAME_OBJECTS = {
  NUM_ISLANDS: 12,
  NUM_HAZARDS: 25,
  NUM_TREASURES: 20,
  NUM_POWERUPS: 8,
  POWERUP_SPAWN_CHANCE: 0.01,
  POWERUP_DURATION: 15, // seconds before powerup expires

  // Fishing configuration
  FISHING: {
    CAST_DISTANCE: 10,
    CATCH_TIME_MIN: 2,
    CATCH_TIME_MAX: 8,
    FISH_TYPES: [
      { name: "Sardine", rarity: "common", points: 5, size: 0.5 },
      { name: "Tuna", rarity: "common", points: 10, size: 0.7 },
      { name: "Salmon", rarity: "uncommon", points: 15, size: 0.8 },
      { name: "Swordfish", rarity: "rare", points: 25, size: 1.0 },
      { name: "Shark", rarity: "rare", points: 40, size: 1.3 },
      { name: "Whale", rarity: "legendary", points: 100, size: 2.0 },
      { name: "Boot", rarity: "common", points: 1, size: 0.6 },
      { name: "Treasure Chest", rarity: "legendary", points: 200, size: 0.9 },
    ],
    RARITY_WEIGHTS: {
      common: 0.6,
      uncommon: 0.25,
      rare: 0.1,
      legendary: 0.05,
    },
  },
};
