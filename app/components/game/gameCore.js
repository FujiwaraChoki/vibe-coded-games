import * as THREE from "three";
import { createSpacecraft } from "./spacecraft";
import { createQuantumRealms } from "./quantumRealms";

export function initializeGame({ container, onRealmChange }) {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  // Set renderer size and add to container
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Camera positioning
  camera.position.z = 5;

  // Initialize spacecraft
  const spacecraft = createSpacecraft(scene);

  // Initialize quantum realms
  const quantumRealms = createQuantumRealms();
  let currentRealm = "regular";
  quantumRealms.setActiveRealm(currentRealm);

  // Set initial background color based on realm
  scene.background = new THREE.Color(
    quantumRealms.realms[currentRealm].backgroundColor
  );

  // Track score for destroyed objects
  let score = 0;

  // Track easter eggs found
  const easterEggs = {
    konami: false,
    doubleLaser: false,
    matrixMode: false,
  };

  onRealmChange(currentRealm);

  // Setup controls
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
    space: false,
  };

  // Track Konami code sequence
  let konamiSequence = [];
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  // Control handlers
  const handleKeyDown = (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = true;
    if (e.key === "s" || e.key === "ArrowDown") keys.backward = true;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
    if (e.key === "Shift") keys.shift = true;
    if (e.key === " ") keys.space = true;

    // Realm switching (expanded for new realms)
    if (e.key === "1") shiftRealm("regular");
    if (e.key === "2") shiftRealm("lowGravity");
    if (e.key === "3") shiftRealm("highDensity");
    if (e.key === "4") shiftRealm("probability");
    if (e.key === "5") shiftRealm("temporalFlux");
    if (e.key === "6") shiftRealm("quantumEntanglement");
    if (e.key === "7") shiftRealm("darkMatter");
    if (e.key === "8") shiftRealm("subatomic");

    // Easter egg: Matrix mode
    if (e.key === "m") {
      if (!easterEggs.matrixMode) {
        toggleMatrixMode();
        easterEggs.matrixMode = true;
        showEasterEggMessage("Matrix Mode Activated!");
      } else {
        disableMatrixMode();
        easterEggs.matrixMode = false;
      }
    }

    // Track Konami code
    konamiSequence.push(e.key);
    if (konamiSequence.length > konamiCode.length) {
      konamiSequence.shift();
    }

    // Check if Konami code is entered
    if (konamiSequence.length === konamiCode.length) {
      let isKonamiCode = true;
      for (let i = 0; i < konamiCode.length; i++) {
        if (konamiSequence[i] !== konamiCode[i]) {
          isKonamiCode = false;
          break;
        }
      }

      if (isKonamiCode && !easterEggs.konami) {
        activateKonamiCode();
        easterEggs.konami = true;
        showEasterEggMessage("Konami Code Activated: Unlimited Laser Power!");
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = false;
    if (e.key === "s" || e.key === "ArrowDown") keys.backward = false;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
    if (e.key === "Shift") keys.shift = false;
    if (e.key === " ") keys.space = false;
  };

  // Function to create explosion effect
  function createExplosion(position, size = 1, color = 0xff5500) {
    const particleCount = 30; // Increased particle count for better effect
    const explosionGroup = new THREE.Group();

    // Create particle geometry
    const particleGeometry = new THREE.SphereGeometry(0.1 * size, 8, 8);

    // Create particle material with glow
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });

    // Create particles and add them to the group
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        particleGeometry,
        particleMaterial.clone()
      );

      // Set random directions for particles to fly outward
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 3 + Math.random() * 5; // Increased speed for more dynamic explosion

      // Store particle data
      particle.userData = {
        velocity: direction.multiplyScalar(speed),
        lifetime: 0.8 + Math.random() * 0.7, // Random lifetime
        createTime: clock.getElapsedTime(),
      };

      particle.position.copy(position);
      explosionGroup.add(particle);
    }

    scene.add(explosionGroup);

    // Return the explosion group
    return {
      group: explosionGroup,
      update: function (deltaTime, time) {
        let allExpired = true;

        explosionGroup.children.forEach((particle) => {
          // Update position
          particle.position.addScaledVector(
            particle.userData.velocity,
            deltaTime
          );

          // Shrink and fade over time
          const age = time - particle.userData.createTime;
          const lifeRatio = age / particle.userData.lifetime;

          if (lifeRatio < 1) {
            allExpired = false;
            // Scale down over time
            const scale = 1 - lifeRatio;
            particle.scale.set(scale, scale, scale);

            // Fade out
            particle.material.opacity = 0.9 * (1 - lifeRatio);

            // Make it glow brighter initially then fade
            particle.material.emissiveIntensity = 1.5 * (1 - lifeRatio);
          }
        });

        // If all particles have expired, remove the group
        if (allExpired) {
          scene.remove(explosionGroup);
          return true; // Indicate this explosion is complete
        }

        return false;
      },
    };
  }

  // Matrix mode effect
  function toggleMatrixMode() {
    // Change background and lighting for matrix effect
    scene.background = new THREE.Color(0x001100);
    directionalLight.color.set(0x00ff44);
    ambientLight.color.set(0x003311);

    // Apply green matrix-like material to all objects
    applyMatrixMaterial();
  }

  function disableMatrixMode() {
    // Restore original lighting and background
    scene.background = new THREE.Color(
      quantumRealms.realms[currentRealm].backgroundColor
    );
    directionalLight.color.set(0xffffff);
    ambientLight.color.set(0x404040);

    // Restore original materials
    restoreOriginalMaterials();
  }

  // Apply matrix material to all objects in the scene
  function applyMatrixMaterial() {
    const matrixMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff44,
      emissive: 0x00aa33,
      wireframe: true,
      transparent: true,
    });

    // Store original materials and apply matrix material
    scene.traverse((obj) => {
      if (obj.isMesh && obj !== spacecraft.mesh) {
        obj.userData.originalMaterial = obj.material;
        obj.material = matrixMaterial.clone();
      }
    });
  }

  // Restore original materials
  function restoreOriginalMaterials() {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.userData.originalMaterial) {
        obj.material = obj.userData.originalMaterial;
        delete obj.userData.originalMaterial;
      }
    });
  }

  // Activate Konami code power-up
  function activateKonamiCode() {
    // Set unlimited laser power for spacecraft
    spacecraft.setSpecialPower("unlimitedLaser");
  }

  // Show temporary message for easter egg discoveries
  function showEasterEggMessage(message) {
    const messageEvent = new CustomEvent("easterEggFound", {
      detail: { message },
    });
    window.dispatchEvent(messageEvent);
  }

  // Add event listeners
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // Resize handler
  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener("resize", handleResize);

  // Store environment objects for each realm
  const environmentObjects = {
    regular: [],
    lowGravity: [],
    highDensity: [],
    probability: [],
  };

  // Track active explosions
  const activeExplosions = [];

  // Create environment objects
  createEnvironment(scene, currentRealm);

  // Function to create environment for a realm
  function createEnvironment(scene, realmName) {
    // Clear existing environment objects from the scene
    environmentObjects[realmName].forEach((obj) => scene.remove(obj));
    environmentObjects[realmName] = [];

    // Create stars (background particles)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Create stars in a large cube around the scene
      starPositions[i] = (Math.random() - 0.5) * 200;
      starPositions[i + 1] = (Math.random() - 0.5) * 200;
      starPositions[i + 2] = (Math.random() - 0.5) * 200;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    environmentObjects[realmName].push(stars);

    // Add different objects based on realm
    switch (realmName) {
      case "regular":
        // Add asteroids
        for (let i = 0; i < 50; i++) {
          const asteroidSize = Math.random() * 0.5 + 0.2;
          const asteroidGeometry = new THREE.IcosahedronGeometry(
            asteroidSize,
            0
          );
          const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1,
          });

          const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

          // Position asteroids in a large area
          asteroid.position.x = (Math.random() - 0.5) * 100;
          asteroid.position.y = (Math.random() - 0.5) * 100;
          asteroid.position.z = (Math.random() - 0.5) * 100;

          // Add some rotation
          asteroid.rotation.x = Math.random() * Math.PI;
          asteroid.rotation.y = Math.random() * Math.PI;

          scene.add(asteroid);
          environmentObjects[realmName].push(asteroid);

          // Store original position and rotation for animation
          asteroid.userData = {
            rotationSpeed: {
              x: (Math.random() - 0.5) * 0.01,
              y: (Math.random() - 0.5) * 0.01,
              z: (Math.random() - 0.5) * 0.01,
            },
          };
        }
        break;

      case "lowGravity":
        // Add floating crystals
        for (let i = 0; i < 30; i++) {
          const crystalGeometry = new THREE.ConeGeometry(0.3, 1, 5);
          const crystalMaterial = new THREE.MeshStandardMaterial({
            color: 0x44aaff,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x0033aa,
            emissiveIntensity: 0.5,
          });

          const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);

          // Position crystals
          crystal.position.x = (Math.random() - 0.5) * 80;
          crystal.position.y = (Math.random() - 0.5) * 80;
          crystal.position.z = (Math.random() - 0.5) * 80;

          // Random rotation
          crystal.rotation.x = Math.random() * Math.PI;
          crystal.rotation.y = Math.random() * Math.PI;
          crystal.rotation.z = Math.random() * Math.PI;

          scene.add(crystal);
          environmentObjects[realmName].push(crystal);

          // Store data for animation
          crystal.userData = {
            floatSpeed: Math.random() * 0.01 + 0.005,
            floatOffset: Math.random() * Math.PI * 2,
            rotationSpeed: {
              x: (Math.random() - 0.5) * 0.02,
              y: (Math.random() - 0.5) * 0.02,
              z: (Math.random() - 0.5) * 0.02,
            },
          };
        }
        break;

      case "highDensity":
        // Add heavy planets/stones
        for (let i = 0; i < 15; i++) {
          const planetSize = Math.random() * 2 + 1;
          const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
          const planetMaterial = new THREE.MeshStandardMaterial({
            color: 0x661144,
            roughness: 0.7,
            metalness: 0.2,
          });

          const planet = new THREE.Mesh(planetGeometry, planetMaterial);

          // Position farther apart due to their size
          planet.position.x = (Math.random() - 0.5) * 120;
          planet.position.y = (Math.random() - 0.5) * 120;
          planet.position.z = (Math.random() - 0.5) * 120;

          scene.add(planet);
          environmentObjects[realmName].push(planet);

          // Slow rotation for heavy objects
          planet.userData = {
            rotationSpeed: {
              x: (Math.random() - 0.5) * 0.003,
              y: (Math.random() - 0.5) * 0.003,
              z: (Math.random() - 0.5) * 0.003,
            },
          };
        }
        break;

      case "probability":
        // Add quantum particles that flicker and move erratically
        for (let i = 0; i < 40; i++) {
          const particleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
          const particleMaterial = new THREE.MeshStandardMaterial({
            color: 0x33ff66,
            emissive: 0x00ff33,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
          });

          const particle = new THREE.Mesh(particleGeometry, particleMaterial);

          // Position particles
          particle.position.x = (Math.random() - 0.5) * 100;
          particle.position.y = (Math.random() - 0.5) * 100;
          particle.position.z = (Math.random() - 0.5) * 100;

          scene.add(particle);
          environmentObjects[realmName].push(particle);

          // Store data for quantum behavior
          particle.userData = {
            originalPosition: particle.position.clone(),
            flickerSpeed: Math.random() * 0.1 + 0.05,
            moveSpeed: Math.random() * 0.02 + 0.01,
            moveOffset: Math.random() * Math.PI * 2,
          };
        }
        break;
    }
  }

  // Realm shifting logic
  function shiftRealm(realmName) {
    if (quantumRealms.setActiveRealm(realmName)) {
      const realm = quantumRealms.getActiveRealm();

      // Update background color
      scene.background.set(new THREE.Color(realm.backgroundColor));

      // Trigger visual transition effect
      createRealmTransitionEffect();

      // Store current realm name
      currentRealm = realmName;
      gameState.realmChangeTimer = 0;

      // Notify UI of realm change
      if (onRealmChange) {
        onRealmChange(realmName);
      }

      return true;
    }
    return false;
  }

  function createRealmTransitionEffect() {
    // Create a ripple effect emanating from the spacecraft
    const rippleGeometry = new THREE.RingGeometry(0.5, 1, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.copy(spacecraft.mesh.position);
    ripple.rotation.x = Math.PI / 2;
    scene.add(ripple);

    // Animate the ripple
    let scale = 1;
    const maxScale = 50;
    const expandRate = 80;

    function animateRipple() {
      scale += expandRate * 0.016; // 60fps
      ripple.scale.set(scale, scale, scale);
      ripple.material.opacity = 1 - scale / maxScale;

      if (scale < maxScale) {
        requestAnimationFrame(animateRipple);
      } else {
        scene.remove(ripple);
      }
    }

    animateRipple();
  }

  // Rock destruction handler
  function handleRockDestroyed(position, size) {
    // Create explosion at the rock's position
    const explosion = createExplosion(position, size, 0xff8800);
    activeExplosions.push(explosion);

    // Add a flash of light at the explosion point
    const flashLight = new THREE.PointLight(0xff7700, 2, 10);
    flashLight.position.copy(position);
    scene.add(flashLight);

    // Remove the flash light after a short time
    setTimeout(() => {
      scene.remove(flashLight);
    }, 200);

    // Increment score
    score += 100;

    // Easter egg: if score reaches 1000, activate double laser
    if (score >= 1000 && !easterEggs.doubleLaser) {
      spacecraft.setSpecialPower("doubleLaser");
      easterEggs.doubleLaser = true;
      showEasterEggMessage("Double Laser Activated!");
    }
  }

  // Animation loop
  let lastTime = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const currentTime = clock.getElapsedTime();
    const deltaTime = Math.min(currentTime - lastTime, 0.1); // Cap delta time to prevent large jumps
    lastTime = currentTime;

    // Update spacecraft
    spacecraft.update({
      keys,
      deltaTime,
      physics: quantumRealms.getActivePhysics(),
      elapsedTime: currentTime,
      environmentObjects,
      onRockDestroyed: handleRockDestroyed,
    });

    // Follow the spacecraft with the camera
    const targetCameraPosition = spacecraft.mesh.position.clone();
    targetCameraPosition.z += 5; // Position camera behind the spacecraft
    camera.position.lerp(targetCameraPosition, deltaTime * 2);
    camera.lookAt(spacecraft.mesh.position);

    // Clean up hit objects for all realms
    for (const realmName in environmentObjects) {
      for (let i = environmentObjects[realmName].length - 1; i >= 0; i--) {
        const obj = environmentObjects[realmName][i];

        // Skip stars (Points) and objects without isHit flag
        if (
          obj instanceof THREE.Points ||
          !obj.userData ||
          !obj.userData.isHit
        ) {
          continue;
        }

        // If object is marked as hit but not yet removed
        if (obj.userData.isHit === true && !obj.userData.isRemoving) {
          obj.userData.isRemoving = true;

          // Start fading and shrinking the object
          if (!obj.userData.hitTime) {
            obj.userData.hitTime = currentTime;
            obj.userData.originalScale = obj.scale.clone();
          }

          // Calculate fade progress
          const fadeDuration = 0.5; // 0.5 seconds fade
          const fadeProgress =
            (currentTime - obj.userData.hitTime) / fadeDuration;

          if (fadeProgress >= 1) {
            // Fully faded, remove from scene
            scene.remove(obj);
            environmentObjects[realmName].splice(i, 1);
          } else {
            // Still fading
            const fadeScale = 1 - fadeProgress;
            obj.scale.set(
              obj.userData.originalScale.x * fadeScale,
              obj.userData.originalScale.y * fadeScale,
              obj.userData.originalScale.z * fadeScale
            );

            if (obj.material) {
              if (!obj.material.transparent) {
                obj.material.transparent = true;
              }
              obj.material.opacity = 1 - fadeProgress;
            }
          }
        }
      }
    }

    // Animate environment objects based on realm
    switch (currentRealm) {
      case "regular":
        // Rotate asteroids
        environmentObjects.regular.forEach((obj) => {
          if (obj.userData.rotationSpeed && !obj.userData.isHit) {
            obj.rotation.x += obj.userData.rotationSpeed.x;
            obj.rotation.y += obj.userData.rotationSpeed.y;
            obj.rotation.z += obj.userData.rotationSpeed.z;
          }
        });
        break;

      case "lowGravity":
        // Float crystals
        environmentObjects.lowGravity.forEach((obj) => {
          if (obj.userData.floatSpeed && !obj.userData.isHit) {
            obj.position.y +=
              Math.sin(
                currentTime * obj.userData.floatSpeed + obj.userData.floatOffset
              ) * 0.03;
            obj.rotation.x += obj.userData.rotationSpeed.x;
            obj.rotation.y += obj.userData.rotationSpeed.y;
            obj.rotation.z += obj.userData.rotationSpeed.z;
          }
        });
        break;

      case "highDensity":
        // Slow rotation for heavy objects
        environmentObjects.highDensity.forEach((obj) => {
          if (obj.userData.rotationSpeed && !obj.userData.isHit) {
            obj.rotation.x += obj.userData.rotationSpeed.x;
            obj.rotation.y += obj.userData.rotationSpeed.y;
            obj.rotation.z += obj.userData.rotationSpeed.z;
          }
        });
        break;

      case "probability":
        // Quantum particles that flicker and move unpredictably
        environmentObjects.probability.forEach((obj) => {
          if (!obj.userData.isHit) {
            if (Math.random() > 0.98) {
              // Randomly teleport particles occasionally
              const distance = 5 + Math.random() * 10;
              const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
              ).normalize();

              obj.position.copy(obj.userData.originalPosition);
              obj.position.addScaledVector(direction, distance);
            }

            // Flickering effect
            if (obj.material) {
              obj.material.opacity = 0.5 + Math.random() * 0.5;
              obj.material.emissiveIntensity = 0.3 + Math.random() * 0.7;
            }
          }
        });
        break;
    }

    // Update active explosions
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
      const isComplete = activeExplosions[i].update(deltaTime, currentTime);
      if (isComplete) {
        activeExplosions.splice(i, 1);
      }
    }

    // Update stars based on current realm
    updateStarfield();

    // Render the scene
    renderer.render(scene, camera);
  }

  // Start animation
  animate();

  // Return cleanup function
  return {
    cleanup: () => {
      // Remove event listeners
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);

      // Remove renderer from container
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose of scene
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    },
  };
}

function applyPhysics(obj, deltaTime, keys) {
  const physics = quantumRealms.getActivePhysics();

  // Get time multiplier for temporal flux realm
  const timeMultiplier = physics.getTimeMultiplier
    ? physics.getTimeMultiplier(gameState.elapsedTime)
    : 1;
  const adjustedDeltaTime = deltaTime * timeMultiplier;

  // Process input
  let accelerationX = 0;
  let accelerationZ = 0;

  if (keys.forward) accelerationZ -= physics.acceleration;
  if (keys.backward) accelerationZ += physics.acceleration;

  // Apply quantum entanglement effects if applicable
  if (keys.left) {
    let direction = -1;
    if (physics.getEntanglementEffect) {
      direction = physics.getEntanglementEffect(
        direction,
        gameState.elapsedTime
      );
    }
    accelerationX += physics.acceleration * direction;
  }

  if (keys.right) {
    let direction = 1;
    if (physics.getEntanglementEffect) {
      direction = physics.getEntanglementEffect(
        direction,
        gameState.elapsedTime
      );
    }
    accelerationX += physics.acceleration * direction;
  }

  // Apply probability field randomness
  if (physics.randomFactor > 0) {
    accelerationX += (Math.random() * 2 - 1) * physics.randomFactor;
    accelerationZ += (Math.random() * 2 - 1) * physics.randomFactor;
  }

  // Apply acceleration
  obj.velocity.x += accelerationX * adjustedDeltaTime;
  obj.velocity.z += accelerationZ * adjustedDeltaTime;

  // Apply drag (air resistance)
  obj.velocity.x *= Math.pow(physics.drag, adjustedDeltaTime * 60);
  obj.velocity.z *= Math.pow(physics.drag, adjustedDeltaTime * 60);

  // Apply gravitational wells if applicable
  if (physics.applyGravitationalWells) {
    const modifiedVelocity = physics.applyGravitationalWells(
      obj.mesh.position,
      { x: obj.velocity.x, z: obj.velocity.z }
    );

    obj.velocity.x = modifiedVelocity.x;
    obj.velocity.z = modifiedVelocity.z;
  }

  // Apply speed limit
  const currentSpeed = Math.sqrt(
    obj.velocity.x * obj.velocity.x + obj.velocity.z * obj.velocity.z
  );

  if (currentSpeed > physics.maxSpeed) {
    const scale = physics.maxSpeed / currentSpeed;
    obj.velocity.x *= scale;
    obj.velocity.z *= scale;
  }

  // Apply velocity to position
  obj.mesh.position.x += obj.velocity.x * adjustedDeltaTime;
  obj.mesh.position.z += obj.velocity.z * adjustedDeltaTime;
}

// Update starfield to reflect current realm
function updateStarfield() {
  if (!starfield) return;

  // Get the active realm for star customization
  const physics = quantumRealms.getActivePhysics();

  // Update star colors based on the current realm
  starfield.children.forEach((star) => {
    if (star.material) {
      // Set color based on realm
      if (physics.particleColor) {
        star.material.color.setHex(physics.particleColor);
      }

      // Special effect for subatomic realm: pulsating stars
      if (physics.particleEffects) {
        const pulseScale =
          0.7 + Math.sin(gameState.elapsedTime * 3 + star.position.x) * 0.3;
        star.scale.set(pulseScale, pulseScale, pulseScale);
      } else {
        star.scale.set(1, 1, 1);
      }
    }
  });

  // Adjust star density if needed
  if (
    physics.starDensity &&
    starfield.userData.density !== physics.starDensity &&
    gameState.realmChangeTimer > 2
  ) {
    // Only adjust stars after realm has stabilized
    adjustStarDensity(physics.starDensity);
    starfield.userData.density = physics.starDensity;
  }
}

function adjustStarDensity(targetDensity) {
  if (!starfield) return;

  const currentCount = starfield.children.length;

  if (targetDensity > currentCount) {
    // Add more stars
    const starsToAdd = targetDensity - currentCount;
    for (let i = 0; i < starsToAdd; i++) {
      addStar();
    }
  } else if (targetDensity < currentCount) {
    // Remove stars
    const starsToRemove = currentCount - targetDensity;
    for (let i = 0; i < starsToRemove; i++) {
      if (starfield.children.length > 0) {
        starfield.remove(starfield.children[0]);
      }
    }
  }
}

function addStar() {
  if (!starfield) return;

  const geometry = new THREE.SphereGeometry(0.25, 4, 4);
  const material = new THREE.MeshBasicMaterial({
    color: quantumRealms.getActivePhysics().particleColor || 0xffffff,
  });

  const star = new THREE.Mesh(geometry, material);

  // Random position in a large cube around the origin
  const spread = 100;
  star.position.set(
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread
  );

  starfield.add(star);
}
