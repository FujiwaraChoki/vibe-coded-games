export function createQuantumRealms() {
  // Define physics properties for different realms
  const realms = {
    // Regular space (normal physics)
    regular: {
      name: "Regular Space",
      acceleration: 4,
      drag: 0.8,
      maxSpeed: 10,
      rotationSpeed: 3,
      randomFactor: 0,
      backgroundColor: 0x000022,
      description: "Standard physics in regular space",
    },

    // Low gravity dimension (floaty movement)
    lowGravity: {
      name: "Low Gravity",
      acceleration: 2,
      drag: 0.3,
      maxSpeed: 15,
      rotationSpeed: 1.5,
      randomFactor: 0,
      backgroundColor: 0x002244,
      description: "Lower inertia, less drag, higher top speed",
    },

    // High density dimension (heavy, sluggish movement)
    highDensity: {
      name: "High Density",
      acceleration: 1.5,
      drag: 1.2,
      maxSpeed: 6,
      rotationSpeed: 1,
      randomFactor: 0,
      backgroundColor: 0x220022,
      description: "Heavy resistance, higher drag, slower movement",
    },

    // Probability dimension (slight randomness in controls)
    probability: {
      name: "Probability",
      acceleration: 3,
      drag: 0.7,
      maxSpeed: 12,
      rotationSpeed: 2.5,
      randomFactor: 1.5,
      backgroundColor: 0x224422,
      description: "Unpredictable movements with quantum randomness",
    },
  };

  // Active realm (default: regular)
  let activeRealm = "regular";

  return {
    realms,

    // Get the active realm object
    getActiveRealm() {
      return realms[activeRealm];
    },

    // Get active physics properties
    getActivePhysics() {
      return {
        ...realms[activeRealm],
        // Can add any additional physics calculations here if needed
      };
    },

    // Set the active realm
    setActiveRealm(realmName) {
      if (realms[realmName]) {
        activeRealm = realmName;
        return true;
      }
      return false;
    },
  };
}
