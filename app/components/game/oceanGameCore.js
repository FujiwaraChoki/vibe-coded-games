import * as THREE from "three";
import { createShip } from "./oceanShip";
import { createOceanEnvironment } from "./oceanEnvironment";
import { WEATHER, GAME_OBJECTS } from "./gameConfig";
import SpeedControl from "./SpeedControl";

export function initializeOceanGame({
  container,
  onWeatherChange,
  onScoreUpdate,
  onGameOver,
  onFishCaught,
  isMultiplayer = false,
  onPositionUpdate = null,
  onTreasureCollected = null,
  getOtherPlayers = null,
  getCurrentPlayerId = null,
}) {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
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
    // Fishing state
    fishing: {
      isFishing: false,
      fishingTimer: 0,
      fishingLocation: null,
      catchTime: 0,
      fishingLineVisible: false,
      fishHooked: false,
      currentCatch: null,
    },
    fishCaught: [],
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

  // Camera control variables
  const cameraControls = {
    mouseLook: true,
    lookSensitivity: 0.002,
    targetRotation: new THREE.Quaternion(),
    currentRotation: new THREE.Quaternion(),
    rotationSpeed: 0.1,
    mouseX: 0,
    mouseY: 0,
    pitch: 0,
    yaw: 0,
    pitchLimit: Math.PI / 3, // Limit looking up/down to 60 degrees
  };

  // Ship and camera offsets
  const cameraOffset = new THREE.Vector3(0, 10, 15);
  const lookOffset = new THREE.Vector3(0, 5, -20); // Where to look when in first person

  // Create the ocean environment (water, islands, hazards, treasures)
  const environment = createOceanEnvironment(scene, gameState.currentWeather);

  // Initialize ship
  const ship = createShip(scene);
  ship.mesh.position.set(0, 0.5, 0);
  scene.add(ship.mesh);

  // Initialize ship velocity and physics properties
  ship.velocity = new THREE.Vector3(0, 0, 0);
  ship.acceleration = 10;
  ship.rotationSpeed = 2;
  ship.drag = 0.05;

  // Multiplayer ships management
  const otherPlayersShips = new Map();

  // Helper function to get a hash code from a string
  function getHashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Function to create or update other players' ships
  function updateOtherPlayers() {
    if (!isMultiplayer || !getOtherPlayers) return;

    const otherPlayers = getOtherPlayers();
    const currentPlayerId = getCurrentPlayerId ? getCurrentPlayerId() : null;

    // Keep track of current players to remove those who disconnected
    const currentPlayerIds = new Set();

    // Update or create ships for other players
    otherPlayers.forEach((player) => {
      if (player.playerId === currentPlayerId) return; // Skip current player

      currentPlayerIds.add(player.playerId);

      if (otherPlayersShips.has(player.playerId)) {
        // Update existing ship position
        const otherShip = otherPlayersShips.get(player.playerId);

        // Store previous position for velocity calculation
        const prevPosition = otherShip.mesh.position.clone();

        // Apply position with smooth lerping
        if (player.position) {
          const targetPosition = new THREE.Vector3(
            player.position.x,
            player.position.y || 0.5,
            player.position.z
          );

          // Smooth transition to target position
          otherShip.mesh.position.lerp(targetPosition, 0.1);
        }

        // Apply rotation
        if (player.rotation) {
          otherShip.mesh.rotation.y = player.rotation.y || 0;
        }

        // Calculate velocity based on position change
        if (player.velocity) {
          // Use server-provided velocity if available
          otherShip.velocity = new THREE.Vector3(
            player.velocity.x || 0,
            0,
            player.velocity.z || 0
          );
        } else {
          // Calculate velocity from position change
          otherShip.velocity = otherShip.mesh.position
            .clone()
            .sub(prevPosition);
        }

        // Calculate the ship's speed
        otherShip.speed = otherShip.velocity.length() * 60; // Scale to make it comparable to physics.speed

        // Call the animate functions on the ship
        if (otherShip.animateWake) {
          otherShip.animateWake(otherShip.speed);
        }

        // Update player name text
        if (otherShip.nameLabel) {
          otherShip.nameLabel.position.copy(otherShip.mesh.position);
          otherShip.nameLabel.position.y += 4; // Position higher above the ship
        }
      } else {
        // Create new ship for this player
        const otherShip = createShip(scene, 0x3498db); // Different color for other players
        otherShip.mesh.position.set(
          player.position?.x || 0,
          player.position?.y || 0.5,
          player.position?.z || 0
        );
        otherShip.mesh.rotation.y = player.rotation?.y || 0;
        otherShip.velocity = new THREE.Vector3();
        otherShip.speed = 0;
        scene.add(otherShip.mesh);

        // Set flag colors for other players to recognize them more easily
        if (otherShip.setFlagColor) {
          const playerColors = [
            0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6,
          ];
          const colorIndex =
            getHashCode(player.playerId || player.name || "") %
            playerColors.length;
          otherShip.setFlagColor(playerColors[colorIndex]);
        }

        // Create floating name label
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = 256;
        canvas.height = 64;
        context.font = "30px Arial"; // Larger font size
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(
          player.name || "Player",
          canvas.width / 2,
          canvas.height / 2
        );

        // Add a glow/outline effect for better visibility
        context.lineWidth = 3;
        context.strokeStyle = "rgba(0, 100, 255, 0.8)";
        context.strokeText(
          player.name || "Player",
          canvas.width / 2,
          canvas.height / 2
        );

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        });
        const nameLabel = new THREE.Sprite(material);
        nameLabel.scale.set(6, 1.8, 1); // Slightly larger scale
        nameLabel.position.copy(otherShip.mesh.position);
        nameLabel.position.y += 4; // Position higher above the ship
        scene.add(nameLabel);

        otherShip.nameLabel = nameLabel;
        otherPlayersShips.set(player.playerId, otherShip);
      }
    });

    // Remove ships of disconnected players
    for (const [playerId, otherShip] of otherPlayersShips.entries()) {
      if (!currentPlayerIds.has(playerId)) {
        // Remove ship and name label from scene
        scene.remove(otherShip.mesh);
        if (otherShip.nameLabel) {
          scene.remove(otherShip.nameLabel);
        }
        otherPlayersShips.delete(playerId);
      }
    }
  }

  // Speed control for UI interaction
  const speedControls = {
    multiplier: 1,
  };

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
    loadSoundEffect("fishcast", "/sounds/splash.mp3");
    loadSoundEffect("fishcatch", "/sounds/bubbles.mp3");
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
    f: false, // Fishing key
  };

  // Control handlers
  const handleKeyDown = (e) => {
    if (e.key === "s" || e.key === "ArrowUp") keys.forward = true;
    if (e.key === "w" || e.key === "ArrowDown") keys.backward = true;
    if (e.key === "d" || e.key === "ArrowLeft") keys.left = true;
    if (e.key === "a" || e.key === "ArrowRight") keys.right = true;
    if (e.key === " ") keys.space = true;
    if (e.key === "f" || e.key === "F") keys.f = true;
    if (e.key === "c" || e.key === "C") {
      // Toggle mouse look
      cameraControls.mouseLook = !cameraControls.mouseLook;

      // Reset camera position when toggling
      if (!cameraControls.mouseLook) {
        cameraControls.pitch = 0;
        cameraControls.yaw = 0;
      }
    }

    // Pause with Escape key
    if (e.key === "Escape") {
      gameState.paused = !gameState.paused;

      // Exit pointer lock when paused
      if (gameState.paused && document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "s" || e.key === "ArrowUp") keys.forward = false;
    if (e.key === "w" || e.key === "ArrowDown") keys.backward = false;
    if (e.key === "d" || e.key === "ArrowLeft") keys.left = false;
    if (e.key === "a" || e.key === "ArrowRight") keys.right = false;
    if (e.key === " ") keys.space = false;
    if (e.key === "f" || e.key === "F") keys.f = false;
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

  // Fishing system
  const fishingLine = new THREE.Group();
  const fishingLineGeometry = new THREE.CylinderGeometry(0.02, 0.02, 10);
  const fishingLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const fishingLineBody = new THREE.Mesh(
    fishingLineGeometry,
    fishingLineMaterial
  );

  fishingLineBody.rotation.x = Math.PI / 2;
  fishingLineBody.position.y = -5;
  fishingLine.add(fishingLineBody);
  fishingLine.visible = false;
  scene.add(fishingLine);

  // Fishing float
  const floatGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const floatMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const fishingFloat = new THREE.Mesh(floatGeometry, floatMaterial);
  fishingFloat.position.y = -9.8;
  fishingLine.add(fishingFloat);

  function startFishing() {
    if (gameState.fishing.isFishing || !ship) return;

    // Get position in front of the ship
    const shipDirection = new THREE.Vector3(0, 0, -1);
    shipDirection.applyQuaternion(ship.mesh.quaternion);

    const fishingPosition = ship.mesh.position
      .clone()
      .add(shipDirection.multiplyScalar(GAME_OBJECTS.FISHING.CAST_DISTANCE));
    fishingPosition.y = 0;

    gameState.fishing.isFishing = true;
    gameState.fishing.fishingLocation = fishingPosition;
    gameState.fishing.fishingTimer = 0;
    gameState.fishing.fishHooked = false;
    gameState.fishing.currentCatch = null;

    // Random catch time between min and max
    gameState.fishing.catchTime =
      GAME_OBJECTS.FISHING.CATCH_TIME_MIN +
      Math.random() *
        (GAME_OBJECTS.FISHING.CATCH_TIME_MAX -
          GAME_OBJECTS.FISHING.CATCH_TIME_MIN);

    // Position and show fishing line
    fishingLine.position.copy(fishingPosition);
    fishingLine.visible = true;

    // Play casting sound
    playSound("fishcast", 0.4);

    // Create visual effect for casting
    createWaterSplash(fishingPosition);
  }

  function stopFishing() {
    if (!gameState.fishing.isFishing) return;

    gameState.fishing.isFishing = false;
    fishingLine.visible = false;

    // If there was a fish hooked, add it to caught fish
    if (gameState.fishing.fishHooked && gameState.fishing.currentCatch) {
      const catch_ = gameState.fishing.currentCatch;
      gameState.fishCaught.push(catch_);

      // Add points for the catch
      gameState.score += catch_.points;
      onScoreUpdate(gameState.score);

      // Play catch sound
      playSound("fishcatch", 0.5);

      // Create visual effect
      createCatchEffect(gameState.fishing.fishingLocation, catch_);

      // Notify UI
      if (onFishCaught) {
        onFishCaught(catch_);
      }
    }
  }

  function updateFishing(deltaTime) {
    if (!gameState.fishing.isFishing) return;

    gameState.fishing.fishingTimer += deltaTime;

    // Check if it's time to hook a fish
    if (
      gameState.fishing.fishingTimer >= gameState.fishing.catchTime &&
      !gameState.fishing.fishHooked
    ) {
      gameState.fishing.fishHooked = true;

      // Determine what was caught based on rarity
      gameState.fishing.currentCatch = determineCatch();

      // Make float bob up and down to indicate a catch
      animateFloat();
    }
  }

  function determineCatch() {
    // Determine rarity first
    const rarityRoll = Math.random();
    let rarity;
    let cumulativeWeight = 0;

    for (const [rarityType, weight] of Object.entries(
      GAME_OBJECTS.FISHING.RARITY_WEIGHTS
    )) {
      cumulativeWeight += weight;
      if (rarityRoll < cumulativeWeight) {
        rarity = rarityType;
        break;
      }
    }

    // Get all fish of the selected rarity
    const possibleCatches = GAME_OBJECTS.FISHING.FISH_TYPES.filter(
      (fish) => fish.rarity === rarity
    );

    // Select a random fish from the possible catches
    return possibleCatches[Math.floor(Math.random() * possibleCatches.length)];
  }

  function animateFloat() {
    // Create a bobbing animation for the float
    const startY = fishingFloat.position.y;
    const animationDuration = 1.5; // seconds
    let elapsed = 0;

    function updateFloatPosition() {
      if (!gameState.fishing.fishHooked || !gameState.fishing.isFishing) return;

      elapsed += 0.016; // ~60fps

      // Bobbing motion
      const progress = elapsed / animationDuration;
      if (progress < 1) {
        fishingFloat.position.y =
          startY + Math.sin(progress * Math.PI * 8) * 0.3;
        requestAnimationFrame(updateFloatPosition);
      } else {
        // Loop the animation
        elapsed = 0;
        requestAnimationFrame(updateFloatPosition);
      }
    }

    updateFloatPosition();
  }

  function createWaterSplash(position) {
    // Create particle effect for water splash
    const particles = new THREE.Group();
    scene.add(particles);

    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.8,
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      particle.position.y += 0.2;

      // Random velocity
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );

      particles.add(particle);
    }

    function animateSplash() {
      let allParticlesGone = true;

      particles.children.forEach((particle) => {
        // Apply gravity
        particle.userData.velocity.y -= 0.1;

        // Move particle
        particle.position.add(
          particle.userData.velocity.clone().multiplyScalar(0.1)
        );

        // Fade out
        particle.material.opacity -= 0.02;

        if (particle.material.opacity > 0 && particle.position.y > 0) {
          allParticlesGone = false;
        }
      });

      if (allParticlesGone) {
        scene.remove(particles);
        return;
      }

      requestAnimationFrame(animateSplash);
    }

    animateSplash();
  }

  function createCatchEffect(position, catch_) {
    // Create a visual effect when catching a fish
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    // Create a text sprite showing the fish name and points
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = "bold 24px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.fillText(catch_.name, canvas.width / 2, 40);

    context.font = "20px Arial";
    context.fillStyle = "#FFCC00";
    context.fillText(`+${catch_.points} points`, canvas.width / 2, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(4, 2, 1);
    particleGroup.add(sprite);

    // Animation
    let elapsed = 0;
    function animateText() {
      elapsed += 0.016; // ~60fps

      if (elapsed < 2) {
        sprite.position.y += 0.02;
        requestAnimationFrame(animateText);
      } else {
        scene.remove(particleGroup);
      }
    }

    animateText();
  }

  // Mouse control handlers
  const handleMouseMove = (e) => {
    if (!cameraControls.mouseLook || gameState.paused) return;

    // Calculate mouse movement
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    // Update yaw (left/right) based on horizontal mouse movement
    cameraControls.yaw -= movementX * cameraControls.lookSensitivity;

    // Update pitch (up/down) based on vertical mouse movement
    cameraControls.pitch -= movementY * cameraControls.lookSensitivity;

    // Clamp pitch to prevent over-rotation
    cameraControls.pitch = Math.max(
      -cameraControls.pitchLimit,
      Math.min(cameraControls.pitchLimit, cameraControls.pitch)
    );
  };

  // Handle pointer lock for mouse controls
  const handlePointerLockChange = () => {
    if (document.pointerLockElement === renderer.domElement) {
      document.addEventListener("mousemove", handleMouseMove, false);
    } else {
      document.removeEventListener("mousemove", handleMouseMove, false);
    }
  };

  // Request pointer lock on canvas click
  const handleCanvasClick = () => {
    if (!document.pointerLockElement) {
      renderer.domElement.requestPointerLock();
    }
  };

  // Listen for pointer lock events
  document.addEventListener(
    "pointerlockchange",
    handlePointerLockChange,
    false
  );
  renderer.domElement.addEventListener("click", handleCanvasClick, false);

  // Animation loop with clock for accurate timing
  const clock = new THREE.Clock();
  let lastTime = 0;
  let lastPositionUpdate = 0;

  function animate(time) {
    // Request next frame
    if (!gameState.disposed) {
      requestAnimationFrame(animate);
    }

    // Skip rendering if game is paused
    if (gameState.paused) {
      return;
    }

    // Calculate delta time
    const delta = clock.getDelta();

    // Cap delta time to prevent huge jumps after tab was inactive
    const cappedDelta = Math.min(delta, 0.1);

    // Update game time
    gameState.elapsedTime += cappedDelta;

    // Update controls (for desktop and mobile)
    if (gameState.controlsNeedUpdate) {
      updateControls();
      gameState.controlsNeedUpdate = false;
    }

    // Update environment animations (water, weather effects)
    environment.update(cappedDelta, gameState.currentWeather);

    // Update treasures animations
    // updateTreasures(cappedDelta); // This is handled by environment.update

    // Update fishing spots
    // updateFishingSpots(cappedDelta); // This is handled by environment.update

    // Update powerups
    updatePowerups(cappedDelta);

    // Update other players in multiplayer mode
    if (isMultiplayer) {
      updateOtherPlayers();
    }

    // Ensure ship and velocity are defined
    if (ship && ship.velocity) {
      // Update ship and handle controls
      let shipRotation = 0;
      let shipSpeed = 0;

      // Fix the forward/backward controls
      if (keys.forward) {
        // W key or Up arrow = Forward
        shipSpeed +=
          ship.acceleration * (speedControls ? speedControls.multiplier : 1);
      }
      if (keys.backward) {
        // S key or Down arrow = Backward
        shipSpeed -= ship.acceleration * 0.5; // Slower in reverse
      }
      if (keys.left) shipRotation = -ship.rotationSpeed; // Fix: Negative to turn left
      if (keys.right) shipRotation = ship.rotationSpeed; // Fix: Positive to turn right

      // Apply rotation
      ship.mesh.rotation.y += shipRotation * cappedDelta;

      // Update velocity
      if (shipSpeed !== 0) {
        // Calculate new velocity based on ship direction and speed
        ship.velocity.x =
          Math.sin(ship.mesh.rotation.y) * shipSpeed * cappedDelta;
        ship.velocity.z =
          Math.cos(ship.mesh.rotation.y) * shipSpeed * cappedDelta;
      } else {
        // Apply drag to slow down
        ship.velocity.x *= 0.95;
        ship.velocity.z *= 0.95;
      }

      // Apply weather effects to movement
      let weatherSpeedMultiplier = 1;
      let weatherDragMultiplier = 1;
      switch (gameState.currentWeather) {
        case "calm":
          // No adjustments in calm weather
          break;
        case "windy":
          // Wind adds a constant force in one direction
          ship.velocity.x += WEATHER.WIND_FORCE_X * cappedDelta;
          ship.velocity.z += WEATHER.WIND_FORCE_Z * cappedDelta;
          break;
        case "foggy":
          // Foggy conditions increase drag
          weatherDragMultiplier = 1.5;
          break;
        case "stormy":
          // Stormy conditions reduce speed and add random movement
          weatherSpeedMultiplier = 0.7;
          ship.velocity.x +=
            (Math.random() - 0.5) * WEATHER.STORM_RANDOMNESS * cappedDelta;
          ship.velocity.z +=
            (Math.random() - 0.5) * WEATHER.STORM_RANDOMNESS * cappedDelta;
          break;
      }

      // Apply weather multipliers
      ship.velocity.multiplyScalar(weatherSpeedMultiplier);
      if (weatherDragMultiplier > 1) {
        ship.velocity.x *= Math.pow(0.95, weatherDragMultiplier - 1);
        ship.velocity.z *= Math.pow(0.95, weatherDragMultiplier - 1);
      }

      // Update ship position
      ship.mesh.position.x += ship.velocity.x;
      ship.mesh.position.z += ship.velocity.z;

      // Send position update to server in multiplayer mode
      if (isMultiplayer && onPositionUpdate) {
        // Don't send updates too frequently - every 100ms is enough
        const currentTime = time || 0; // Ensure time is defined
        if (!lastPositionUpdate || currentTime - lastPositionUpdate > 100) {
          onPositionUpdate(
            {
              x: ship.mesh.position.x,
              y: ship.mesh.position.y,
              z: ship.mesh.position.z,
            },
            {
              y: ship.mesh.rotation.y,
            },
            {
              x: ship.velocity.x,
              z: ship.velocity.z,
            }
          );
          lastPositionUpdate = currentTime;
        }
      }
    }

    // Update fishing state
    if (gameState.fishing.isFishing) {
      updateFishing(cappedDelta);
    } else if (keys.f && ship) {
      // Start fishing when 'F' is pressed and not already fishing
      startFishing();
    }

    // Update environment
    environment.update(cappedDelta, ship ? ship.mesh : null);

    // Update camera based on ship position
    if (ship && cameraControls.mouseLook) {
      // Create a quaternion for the desired camera orientation
      const euler = new THREE.Euler(
        cameraControls.pitch,
        cameraControls.yaw + ship.mesh.rotation.y,
        0,
        "YXZ"
      );
      const targetRotation = new THREE.Quaternion().setFromEuler(euler);

      // Smoothly interpolate current rotation toward target rotation
      camera.quaternion.slerp(targetRotation, cameraControls.rotationSpeed);

      // Position camera relative to ship
      const relativeOffset = cameraOffset
        .clone()
        .applyQuaternion(ship.mesh.quaternion);
      camera.position.copy(ship.mesh.position).add(relativeOffset);

      // Optional: Make camera look ahead of ship based on current look direction
      const lookDir = lookOffset.clone().applyQuaternion(camera.quaternion);
      const lookTarget = ship.mesh.position.clone().add(lookDir);

      // Don't use lookAt as it would override our quaternion rotation
      // Instead, we calculate the desired look position for debugging
      ship.debugLookTarget = lookTarget;
    } else if (ship) {
      // Original third-person camera behavior
      const cameraTargetPosition = ship.mesh.position.clone();
      cameraTargetPosition.y += 10;
      cameraTargetPosition.z += 15;

      // Smoothly move camera to target position
      camera.position.lerp(cameraTargetPosition, 0.1);

      // Make camera look at ship
      camera.lookAt(
        ship.mesh.position.x,
        ship.mesh.position.y + 2,
        ship.mesh.position.z
      );
    }

    // Check for collisions
    checkCollisions();

    // Update wave animations
    animateFloat();

    // Render the scene
    renderer.render(scene, camera);

    // Update last time for next frame
    lastTime = time;
  }

  // Start animation loop
  animate(0);

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("resize", handleResize);

    // Clean up trail particles
    if (otherPlayersShips) {
      otherPlayersShips.forEach((otherShip) => {
        if (otherShip.trailParticlesList) {
          otherShip.trailParticlesList.forEach((particle) => {
            scene.remove(particle);
            if (particle.material) particle.material.dispose();
            if (particle.geometry) particle.geometry.dispose();
          });
        }
      });
    }

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
    if (speedControls) {
      speedControls.multiplier = acceleration || 1;
    }
  };

  // Initialize tracking variables
  let gameScore = 0;

  // Set initial ship position
  ship.mesh.position.set(0, 0.5, 0);

  // Function to check for treasure collection
  function checkTreasureCollection() {
    // Define a collection radius for the ship
    const collectionRadius = 2;

    // Get ship position (only x and z matter for 2D distance)
    const shipPosition = new THREE.Vector2(
      ship.mesh.position.x,
      ship.mesh.position.z
    );

    // Check each treasure
    environment.treasures.forEach((treasure, index) => {
      if (!treasure.collected) {
        // Get treasure position
        const treasurePosition = new THREE.Vector2(
          treasure.mesh.position.x,
          treasure.mesh.position.z
        );

        // Calculate distance
        const distance = shipPosition.distanceTo(treasurePosition);

        // If close enough, collect the treasure
        if (distance < collectionRadius) {
          // Mark as collected
          treasure.collected = true;

          // Hide the treasure
          treasure.mesh.visible = false;

          // Add points based on treasure type
          let points = 10;
          if (treasure.type === "gem") points = 25;
          else if (treasure.type === "chest") points = 50;

          // Update score
          gameScore += points;
          onScoreUpdate(gameScore);

          // Show collection effect
          createCollectionEffect(treasure.mesh.position.clone());

          // Play sound effect if available
          if (soundEffects.treasure) {
            playSound(soundEffects.treasure);
          }

          // Notify server in multiplayer mode
          if (isMultiplayer && onTreasureCollected) {
            onTreasureCollected(treasure.id, {
              x: treasure.mesh.position.x,
              y: treasure.mesh.position.y,
              z: treasure.mesh.position.z,
            });
          }

          // Schedule treasure respawn in random location
          setTimeout(() => {
            // Only respawn if game is still active
            if (!gameState.disposed) {
              respawnTreasure(index);
            }
          }, 10000 + Math.random() * 10000); // Respawn after 10-20 seconds
        }
      }
    });
  }

  return {
    gameState,
    handleSpeedChange,
    cleanup,
    // Method to update game settings
    updateSettings(settings) {
      // Update speed multiplier
      if (settings.speedMultiplier !== undefined) {
        speedControls.multiplier = settings.speedMultiplier;
      }
    },
    // Method for proper cleanup when component unmounts
    dispose() {
      gameState.disposed = true;

      // Remove event listeners
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);

      // Remove multiplayer resources
      if (isMultiplayer) {
        // Clean up other player ships
        for (const [playerId, otherShip] of otherPlayersShips.entries()) {
          scene.remove(otherShip.mesh);
          if (otherShip.nameLabel) {
            scene.remove(otherShip.nameLabel);
          }
        }
        otherPlayersShips.clear();
      }

      // Clean up THREE.js resources
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

      // Remove DOM elements
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      // Dispose renderer
      renderer.dispose();
    },
  };
}
