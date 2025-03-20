import * as THREE from "three";
import { createShip } from "./oceanShip";
import { createOceanEnvironment } from "./oceanEnvironment";
import { WEATHER } from "./gameConfig";
import SpeedControl from "./SpeedControl";

export function initializeOceanGame({
  container,
  onWeatherChange,
  onScoreUpdate,
  onGameOver,
}) {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  // Set renderer size and add to container
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Game state
  const gameState = {
    score: 0,
    shipDamage: 0,
    currentWeather: "calm",
    timeElapsed: 0,
    paused: false,
    weatherChangeTimer: 0,
    weatherDuration: WEATHER.DURATION, // seconds before weather changes
    treasuresCollected: 0,
    powerupsActive: {
      speedBoost: false,
      shield: false,
      extraPoints: false,
    },
    powerupTimers: {
      speedBoost: 0,
      shield: 0,
      extraPoints: 0,
    },
  };

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x6666aa, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffee, 1.2);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);

  // Camera positioning
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  // Create the ocean environment (water, islands, hazards, treasures)
  const environment = createOceanEnvironment(scene, gameState.currentWeather);

  // Initialize ship
  const ship = createShip(scene);
  ship.mesh.position.set(0, 0.5, 0);
  scene.add(ship.mesh);

  // Sound effects
  let audioContext;
  const soundEffects = {};

  // Initialize audio if browser supports it
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Load sound effects
    loadSoundEffect("wave", "/sounds/wave.mp3");
    loadSoundEffect("collect", "/sounds/collect.mp3");
    loadSoundEffect("damage", "/sounds/damage.mp3");
    loadSoundEffect("repair", "/sounds/repair.mp3");
    loadSoundEffect("powerup", "/sounds/powerup.mp3");
    loadSoundEffect("storm", "/sounds/storm.mp3");
  } catch (error) {
    console.log("Web Audio API not supported");
  }

  async function loadSoundEffect(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      audioContext.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          soundEffects[name] = buffer;
        },
        (error) => console.error("Error decoding audio data", error)
      );
    } catch (error) {
      console.error("Error loading sound effect", error);
    }
  }

  function playSound(name, volume = 0.5) {
    if (!audioContext || !soundEffects[name]) return;

    const source = audioContext.createBufferSource();
    source.buffer = soundEffects[name];

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
  }

  // Setup controls
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
  };

  // Control handlers
  const handleKeyDown = (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = true;
    if (e.key === "s" || e.key === "ArrowDown") keys.backward = true;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
    if (e.key === " ") keys.space = true;

    // Pause with Escape key
    if (e.key === "Escape") {
      gameState.paused = !gameState.paused;
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = false;
    if (e.key === "s" || e.key === "ArrowDown") keys.backward = false;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
    if (e.key === " ") keys.space = false;
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // Handle window resize
  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener("resize", handleResize);

  // Function to change weather
  function changeWeather() {
    const weathers = ["calm", "windy", "foggy", "stormy"];
    let newWeather;

    // Don't pick the same weather twice in a row
    do {
      newWeather = weathers[Math.floor(Math.random() * weathers.length)];
    } while (newWeather === gameState.currentWeather);

    gameState.currentWeather = newWeather;
    environment.updateWeather(newWeather);

    // If the weather is stormy, play storm sound
    if (newWeather === "stormy") {
      playSound("storm", 0.7);
    }

    // Notify UI of weather change
    onWeatherChange(newWeather);
  }

  // Function to check collisions
  function checkCollisions() {
    // Ship position
    const shipPosition = ship.mesh.position.clone();
    shipPosition.y = 0; // Only consider x-z plane for collision detection

    // Check treasure collisions
    environment.treasures.forEach((treasure, index) => {
      if (treasure.collected) return;

      const distance = shipPosition.distanceTo(treasure.position);
      if (distance < 2) {
        // Treasure collection radius
        // Collect treasure
        treasure.collected = true;

        // Create collection animation effect
        createCollectionEffect(treasure.mesh.position.clone(), treasure.type);

        // Add score based on treasure type
        const points = treasure.value;
        gameState.score += gameState.powerupsActive.extraPoints
          ? points * 2
          : points;
        gameState.treasuresCollected++;

        // Play collect sound
        playSound("collect", 0.6);

        // Update UI
        onScoreUpdate(gameState.score);

        // Spawn a new treasure
        environment.respawnTreasure(index);
      }
    });

    // Check hazard collisions
    environment.hazards.forEach((hazard) => {
      if (hazard.triggered) return;

      const distance = shipPosition.distanceTo(hazard.position);
      if (distance < hazard.radius) {
        // Trigger hazard effect
        hazard.triggered = true;

        // Skip damage if shield is active
        if (!gameState.powerupsActive.shield) {
          // Apply damage based on hazard type
          gameState.shipDamage += hazard.damage;

          // Visual feedback for damage
          ship.showDamageEffect();

          // Play damage sound
          playSound("damage", 0.6);

          // Check if game over
          if (gameState.shipDamage >= 100) {
            endGame();
          }
        }

        // Reset hazard after some time
        setTimeout(() => {
          hazard.triggered = false;
        }, 3000);
      }
    });

    // Check powerup collisions
    environment.powerups.forEach((powerup, index) => {
      if (powerup.collected) return;

      const distance = shipPosition.distanceTo(powerup.position);
      if (distance < 2) {
        // Powerup collection radius
        // Collect powerup
        powerup.collected = true;

        // Create collection animation effect for powerup
        createCollectionEffect(powerup.mesh.position.clone(), powerup.type);

        // Apply powerup effect
        applyPowerup(powerup.type);

        // Play powerup sound
        playSound("powerup", 0.6);

        // Spawn a new powerup
        environment.respawnPowerup(index);
      }
    });
  }

  // Function to apply powerup effects
  function applyPowerup(type) {
    switch (type) {
      case "repair":
        // Repair ship damage
        gameState.shipDamage = Math.max(0, gameState.shipDamage - 30);
        playSound("repair", 0.6);
        break;

      case "speedBoost":
        // Activate speed boost
        gameState.powerupsActive.speedBoost = true;
        gameState.powerupTimers.speedBoost = 10; // 10 seconds
        break;

      case "shield":
        // Activate shield
        gameState.powerupsActive.shield = true;
        gameState.powerupTimers.shield = 8; // 8 seconds
        ship.activateShield();
        break;

      case "extraPoints":
        // Activate extra points
        gameState.powerupsActive.extraPoints = true;
        gameState.powerupTimers.extraPoints = 15; // 15 seconds
        break;
    }
  }

  // Function to update powerup timers
  function updatePowerups(deltaTime) {
    // Update speed boost timer
    if (gameState.powerupsActive.speedBoost) {
      gameState.powerupTimers.speedBoost -= deltaTime;
      if (gameState.powerupTimers.speedBoost <= 0) {
        gameState.powerupsActive.speedBoost = false;
      }
    }

    // Update shield timer
    if (gameState.powerupsActive.shield) {
      gameState.powerupTimers.shield -= deltaTime;
      if (gameState.powerupTimers.shield <= 0) {
        gameState.powerupsActive.shield = false;
        ship.deactivateShield();
      }
    }

    // Update extra points timer
    if (gameState.powerupsActive.extraPoints) {
      gameState.powerupTimers.extraPoints -= deltaTime;
      if (gameState.powerupTimers.extraPoints <= 0) {
        gameState.powerupsActive.extraPoints = false;
      }
    }
  }

  // Function to end the game
  function endGame() {
    gameState.paused = true;
    onGameOver(gameState.score);
  }

  // Animation loop
  let lastTime = 0;
  function animate(time) {
    const deltaTime = (time - lastTime) / 1000; // Convert to seconds
    lastTime = time;

    if (!gameState.paused) {
      // Update game time
      gameState.timeElapsed += deltaTime;

      // Update weather change timer
      gameState.weatherChangeTimer += deltaTime;
      if (gameState.weatherChangeTimer >= gameState.weatherDuration) {
        changeWeather();
        gameState.weatherChangeTimer = 0;
      }

      // Update powerups
      updatePowerups(deltaTime);

      // Update ship position based on input
      ship.update({
        keys,
        deltaTime,
        weather: gameState.currentWeather,
        speedBoost: gameState.powerupsActive.speedBoost,
      });

      // Make camera follow the ship
      const idealOffset = new THREE.Vector3(0, 10, 15);
      idealOffset.applyQuaternion(ship.mesh.quaternion);
      idealOffset.add(ship.mesh.position);

      const idealLookAt = ship.mesh.position.clone();

      // Smoothly move camera
      camera.position.lerp(idealOffset, 0.05);
      camera.lookAt(idealLookAt);

      // Update ocean environment
      environment.update(deltaTime, {
        ...ship.mesh.position,
        quaternion: ship.mesh.quaternion,
        userData: {
          speed: ship.getSpeed(),
        },
      });

      // Check for collisions
      checkCollisions();

      // Occasional wave sound based on weather
      if (
        Math.random() <
        0.005 * (gameState.currentWeather === "stormy" ? 3 : 1)
      ) {
        playSound("wave", gameState.currentWeather === "stormy" ? 0.5 : 0.2);
      }
    }

    // Render scene
    renderer.render(scene, camera);

    // Request next frame
    requestAnimationFrame(animate);
  }

  // Start animation loop
  animate(0);

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("resize", handleResize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };

  // Create a collection effect (poof animation)
  function createCollectionEffect(position, type) {
    // Create particle group
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    // Set particle color based on type
    let particleColor;
    switch (type) {
      // Treasure types
      case "gold":
        particleColor = 0xffd700;
        break;
      case "gem":
        particleColor = 0x00ffff;
        break;
      case "chest":
        particleColor = 0x8b4513;
        break;

      // Powerup types
      case "repair":
        particleColor = 0x00ff00;
        break;
      case "speedBoost":
        particleColor = 0x0000ff;
        break;
      case "shield":
        particleColor = 0x00ffff;
        break;
      case "extraPoints":
        particleColor = 0xff00ff;
        break;

      default:
        particleColor = 0xffd700;
    }

    // Create particles
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Create particle geometry and material
      const size = Math.random() * 0.3 + 0.1;
      const geometry = new THREE.SphereGeometry(size, 6, 6);

      const material = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        opacity: 1,
      });

      // Create particle mesh
      const particle = new THREE.Mesh(geometry, material);

      // Set initial position
      particle.position.copy(position);

      // Add random velocity for explosion effect
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      // Store particle data
      particles.push({
        mesh: particle,
        velocity: velocity,
        lifetime: 1.0, // Lifetime in seconds
      });

      // Add to group
      particleGroup.add(particle);
    }

    // Create animation function
    const startTime = Date.now();

    function animateParticles() {
      const elapsedTime = (Date.now() - startTime) / 1000;
      let allDead = true;

      particles.forEach((particle) => {
        // Update lifetime
        const remainingLife = particle.lifetime - elapsedTime;

        if (remainingLife > 0) {
          allDead = false;

          // Update opacity based on remaining life
          particle.mesh.material.opacity = remainingLife / particle.lifetime;

          // Update position based on velocity and time
          particle.mesh.position.x += particle.velocity.x * 0.03;
          particle.mesh.position.y += particle.velocity.y * 0.03;
          particle.mesh.position.z += particle.velocity.z * 0.03;

          // Add gravity effect
          particle.velocity.y -= 0.1;
        } else {
          // Hide the particle
          particle.mesh.visible = false;
        }
      });

      // Continue animation or remove group when done
      if (!allDead && !gameState.paused) {
        requestAnimationFrame(animateParticles);
      } else {
        // Cleanup particles
        particles.forEach((particle) => {
          particleGroup.remove(particle.mesh);
          particle.mesh.geometry.dispose();
          particle.mesh.material.dispose();
        });
        scene.remove(particleGroup);
      }
    }

    // Start animation
    requestAnimationFrame(animateParticles);
  }

  const handleSpeedChange = ({ maxSpeed, acceleration }) => {
    if (ship) {
      ship.updatePhysicsParams({ maxSpeed, acceleration });
    }
  };

  return { cleanup, gameState, handleSpeedChange };
}
