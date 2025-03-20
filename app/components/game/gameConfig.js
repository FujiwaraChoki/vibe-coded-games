// Game physics configuration
export const SHIP_PHYSICS = {
  // Speed settings
  MAX_SPEED: 35, // Maximum ship speed
  BASE_ACCELERATION: 12, // Base acceleration force
  BOOST_MULTIPLIER: 1.8, // Multiplier for speed boost powerup

  // Movement settings
  DRAG: 0.9, // Lower values = more drag (0-1)
  TURN_RESPONSIVENESS: 5.5, // Higher values = faster turning
  ROTATION_DAMPING: 0.82, // Lower values = faster rotation response
  ACCELERATION_SMOOTHING: 0.25, // Lower values = more responsive acceleration

  // Weather impact settings
  CALM_DRAG: 0.94,
  WINDY_DRAG: 0.96,
  FOGGY_DRAG: 0.92,
  STORMY_DRAG: 0.88,

  // Braking settings
  BRAKE_FORCE: 10, // Higher values = stronger brakes
  REVERSE_FORCE: 3, // Backwards acceleration
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
  NUM_ISLANDS: 5,
  NUM_HAZARDS: 15,
  NUM_TREASURES: 10,
  NUM_POWERUPS: 5,
};
