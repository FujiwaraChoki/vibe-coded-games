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
      particleColor: 0xffffff,
      starDensity: 100,
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
      particleColor: 0x88aaff,
      starDensity: 70,
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
      particleColor: 0xff88ff,
      starDensity: 150,
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
      particleColor: 0xaaffaa,
      starDensity: 100,
    },

    // NEW REALMS

    // Temporal Flux (time dilation effects)
    temporalFlux: {
      name: "Temporal Flux",
      acceleration: 3.5,
      drag: 0.5,
      maxSpeed: 8,
      rotationSpeed: 4,
      randomFactor: 0,
      backgroundColor: 0x002255,
      description: "Time fluctuates unpredictably, affecting movement speed",
      particleColor: 0x00ffff,
      starDensity: 120,
      timeDilation: true,
      pulseRate: 2.5,
    },

    // Quantum Entanglement (movement mirroring)
    quantumEntanglement: {
      name: "Quantum Entanglement",
      acceleration: 3,
      drag: 0.75,
      maxSpeed: 9,
      rotationSpeed: 2.8,
      randomFactor: 0.8,
      backgroundColor: 0x332244,
      description: "Movement can be mirrored in peculiar ways",
      particleColor: 0xff00ff,
      starDensity: 90,
      entanglementFactor: 0.3,
    },

    // Dark Matter (gravitational fluctuations)
    darkMatter: {
      name: "Dark Matter",
      acceleration: 4.5,
      drag: 0.9,
      maxSpeed: 11,
      rotationSpeed: 2.2,
      randomFactor: 0.5,
      backgroundColor: 0x111111,
      description: "Invisible gravity wells affect your trajectory",
      particleColor: 0x444455,
      starDensity: 50,
      gravitationalWells: true,
    },

    // Subatomic (micro scale physics)
    subatomic: {
      name: "Subatomic",
      acceleration: 6,
      drag: 0.4,
      maxSpeed: 18,
      rotationSpeed: 5,
      randomFactor: 1.2,
      backgroundColor: 0x113322,
      description: "Fast and chaotic like particles in an atom",
      particleColor: 0x44ff88,
      starDensity: 250,
      particleEffects: true,
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
        // Add special physics calculations for new realms
        getTimeMultiplier: function (time) {
          if (this.timeDilation) {
            return 0.5 + Math.sin(time * this.pulseRate) * 0.5;
          }
          return 1;
        },

        getEntanglementEffect: function (direction, time) {
          if (
            this.entanglementFactor &&
            Math.random() < this.entanglementFactor
          ) {
            return -direction; // Occasionally reverse direction
          }
          return direction;
        },

        applyGravitationalWells: function (position, velocity) {
          if (!this.gravitationalWells) return velocity;

          // Create 3 fixed gravity wells
          const wells = [
            { x: 50, z: 50, strength: 0.05 },
            { x: -30, z: 20, strength: 0.03 },
            { x: 10, z: -40, strength: 0.04 },
          ];

          let result = { x: velocity.x, z: velocity.z };

          wells.forEach((well) => {
            // Calculate distance to well
            const dx = well.x - position.x;
            const dz = well.z - position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Apply gravitational pull (inverse square law)
            if (distance > 5) {
              // Avoid extreme forces when too close
              const force = well.strength / (distance * distance);
              result.x += (dx / distance) * force * 2;
              result.z += (dz / distance) * force * 2;
            }
          });

          return result;
        },
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

    // Get all realm names
    getAllRealmNames() {
      return Object.keys(realms);
    },
  };
}
