import * as THREE from "three";
import { OCEAN, WEATHER, GAME_OBJECTS } from "./gameConfig";

export function createOceanEnvironment(scene, initialWeather) {
  // Ocean properties
  const oceanSize = OCEAN.SIZE;
  let currentWeather = initialWeather || "calm";

  // Collections for game objects
  const treasures = [];
  const hazards = [];
  const powerups = [];
  const islands = [];

  // Create ocean surface with more vibrant colors
  const oceanGeometry = new THREE.PlaneGeometry(oceanSize, oceanSize, 100, 100);

  // Create a custom shader material for more realistic water
  const waterVertexShader = `
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normal;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const waterFragmentShader = `
    uniform vec3 waterColor;
    uniform vec3 waterHighlight;
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Calculate dot product for lighting
      float light = dot(normalize(vNormal), normalize(vec3(0.5, 1.0, 0.5)));

      // Mix colors based on normal and position
      float waveFactor = abs(vNormal.y * 0.5 + sin(vPosition.x * 0.05 + time * 0.5) * 0.1 + sin(vPosition.z * 0.05 + time * 0.3) * 0.1);
      vec3 finalColor = mix(waterColor, waterHighlight, waveFactor * light);

      // Add specular highlight
      if (light > 0.97) {
        finalColor += vec3(0.5, 0.5, 0.5) * (light - 0.97) * 20.0;
      }

      gl_FragColor = vec4(finalColor, 0.85);
    }
  `;

  // Use custom shader material for advanced water effects
  const oceanShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      waterColor: { value: new THREE.Color(0x0059aa) },
      waterHighlight: { value: new THREE.Color(0x00aaff) },
      time: { value: 0.0 },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Fallback material for systems that don't support shaders well
  const fallbackMaterial = new THREE.MeshPhongMaterial({
    color: 0x0099ff,
    specular: 0xffffff,
    shininess: 100,
    transparent: true,
    opacity: 0.85,
    flatShading: false,
  });

  // Try to use shader material, fall back to phong if needed
  let oceanMaterial;
  try {
    oceanMaterial = oceanShaderMaterial;
  } catch (e) {
    console.log("Shader material not supported, using fallback", e);
    oceanMaterial = fallbackMaterial;
  }

  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.receiveShadow = true;
  scene.add(ocean);

  // Add subtle animation to ocean surface
  ocean.userData.originalVertices = Array.from(
    oceanGeometry.attributes.position.array
  );
  ocean.userData.waveSpeeds = [];
  ocean.userData.waveHeights = [];
  ocean.userData.wavePhases = [];

  // Initialize random wave parameters for each vertex
  for (let i = 0; i < oceanGeometry.attributes.position.count; i++) {
    ocean.userData.waveSpeeds.push(Math.random() * 3 + 1.5);
    ocean.userData.waveHeights.push(
      (Math.random() * 0.8 + 0.4) * OCEAN.WAVE_HEIGHT_MULTIPLIER
    );
    ocean.userData.wavePhases.push(Math.random() * Math.PI * 2);
  }

  // Create a more realistic sky with clouds
  const skyboxSize = oceanSize * 0.9;

  // Create sky dome instead of a box for more realistic sky
  const skyDomeGeometry = new THREE.SphereGeometry(skyboxSize / 2, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // Sky blue
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyDomeGeometry, skyMaterial);
  scene.add(skyDome);

  // Add clouds
  const clouds = new THREE.Group();
  scene.add(clouds);

  function createCloud(x, y, z, scale) {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    // Create several spheres to make a fluffy cloud
    const numPuffs = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numPuffs; i++) {
      const puffSize = (Math.random() * 10 + 15) * scale;
      const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
      const puff = new THREE.Mesh(puffGeometry, cloudMaterial);

      // Position the puff randomly within the cloud
      puff.position.set(
        (Math.random() * 20 - 10) * scale,
        Math.random() * 5 * scale,
        (Math.random() * 20 - 10) * scale
      );

      cloudGroup.add(puff);
    }

    cloudGroup.position.set(x, y, z);
    cloudGroup.userData = {
      speed: Math.random() * 0.5 + 0.1,
      rotationSpeed: Math.random() * 0.002 - 0.001,
    };

    clouds.add(cloudGroup);
    return cloudGroup;
  }

  // Create several clouds
  const numClouds = 15;
  for (let i = 0; i < numClouds; i++) {
    const x = (Math.random() * 2 - 1) * (skyboxSize * 0.4);
    const y = Math.random() * 100 + 100;
    const z = (Math.random() * 2 - 1) * (skyboxSize * 0.4);
    const scale = Math.random() * 0.5 + 0.5;
    createCloud(x, y, z, scale);
  }

  // Create sun
  const sunGeometry = new THREE.SphereGeometry(20, 16, 16);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffcc,
    transparent: true,
    opacity: 0.8,
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(skyboxSize * 0.3, skyboxSize * 0.3, -skyboxSize * 0.3);
  scene.add(sun);

  // Create sun rays (glow effect)
  const sunLightGeometry = new THREE.SphereGeometry(35, 16, 16);
  const sunLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffee,
    transparent: true,
    opacity: 0.3,
  });
  const sunLight = new THREE.Mesh(sunLightGeometry, sunLightMaterial);
  sun.add(sunLight);

  // Create the ocean floor for better depth feel
  const oceanFloorGeometry = new THREE.PlaneGeometry(
    oceanSize,
    oceanSize,
    50,
    50
  );
  const oceanFloorMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a6f7a,
    specular: 0x111111,
    shininess: 5,
    transparent: true,
    opacity: 0.8,
  });

  const oceanFloor = new THREE.Mesh(oceanFloorGeometry, oceanFloorMaterial);
  oceanFloor.rotation.x = -Math.PI / 2;
  oceanFloor.position.y = -8; // Below the water surface
  oceanFloor.receiveShadow = true;
  scene.add(oceanFloor);

  // Create boundary for ocean (invisible wall)
  const boundarySize = oceanSize / 2 - 10;

  // Function to create treasures
  function createTreasure(position) {
    // Create treasure chest
    const chestGroup = new THREE.Group();

    // Base of chest
    const baseGeometry = new THREE.BoxGeometry(1, 0.7, 0.7);
    const chestMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513,
      specular: 0x555555,
      shininess: 30,
    });
    const base = new THREE.Mesh(baseGeometry, chestMaterial);
    base.position.y = 0.35;
    base.castShadow = true;
    base.receiveShadow = true;
    chestGroup.add(base);

    // Lid of chest
    const lidGeometry = new THREE.BoxGeometry(1, 0.3, 0.7);
    const lid = new THREE.Mesh(lidGeometry, chestMaterial);
    lid.position.y = 0.85;
    lid.castShadow = true;
    lid.receiveShadow = true;
    chestGroup.add(lid);

    // Golden rim
    const rimGeometry = new THREE.BoxGeometry(1.05, 0.1, 0.75);
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0xd4af37,
      specular: 0xffd700,
      shininess: 100,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 0.7;
    rim.castShadow = true;
    rim.receiveShadow = true;
    chestGroup.add(rim);

    // Lock on chest
    const lockGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const lock = new THREE.Mesh(lockGeometry, rimMaterial);
    lock.position.set(0, 0.75, 0.4);
    lock.castShadow = true;
    lock.receiveShadow = true;
    chestGroup.add(lock);

    // Position the treasure chest
    chestGroup.position.copy(position);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.5;
    chestGroup.add(glow);

    // Add treasure to scene
    scene.add(chestGroup);

    // Create treasure object
    const treasure = {
      mesh: chestGroup,
      position: chestGroup.position,
      collected: false,
      value: Math.floor(Math.random() * 30) + 10, // 10-40 points
      type: "treasure",
    };

    // Add to treasures array
    treasures.push(treasure);

    return treasure;
  }

  // Function to create hazards (rocks, whirlpools)
  function createHazard(position, type) {
    const hazardGroup = new THREE.Group();
    hazardGroup.position.copy(position);
    let radius = 0;
    let damage = 0;

    switch (type) {
      case "rock":
        // Create rock
        const rockGeometry = new THREE.DodecahedronGeometry(1.5, 1);
        const rockMaterial = new THREE.MeshPhongMaterial({
          color: 0x555555,
          specular: 0x222222,
          shininess: 10,
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = 0.5;
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        hazardGroup.add(rock);

        radius = 2.5;
        damage = 20;
        break;

      case "whirlpool":
        // Create whirlpool
        const whirlpoolGeometry = new THREE.CircleGeometry(3, 32);
        const whirlpoolMaterial = new THREE.MeshBasicMaterial({
          color: 0x006994,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        const whirlpool = new THREE.Mesh(whirlpoolGeometry, whirlpoolMaterial);
        whirlpool.rotation.x = -Math.PI / 2;
        whirlpool.position.y = 0.1;
        hazardGroup.add(whirlpool);

        // Add animation data
        hazardGroup.userData.animateWhirlpool = true;
        hazardGroup.userData.rotationSpeed = Math.random() * 2 + 1;

        radius = 4;
        damage = 15;
        break;

      case "seamonster":
        // Create sea monster
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.2, 3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
          color: 0x006400,
          specular: 0x004200,
          shininess: 20,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.5;
        body.castShadow = true;
        hazardGroup.add(body);

        // Add head
        const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.5, 1.5);
        head.castShadow = true;
        hazardGroup.add(head);

        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          specular: 0xffffff,
          shininess: 100,
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.3, 0.7, 2);
        hazardGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.3, 0.7, 2);
        hazardGroup.add(rightEye);

        // Add animation data
        hazardGroup.userData.animateMonster = true;
        hazardGroup.userData.originalY = position.y;

        radius = 3;
        damage = 30;
        break;
    }

    // Add hazard to scene
    scene.add(hazardGroup);

    // Create hazard object
    const hazard = {
      mesh: hazardGroup,
      position: hazardGroup.position,
      type,
      radius,
      damage,
      triggered: false,
    };

    // Add to hazards array
    hazards.push(hazard);

    return hazard;
  }

  // Function to create powerups
  function createPowerup(position, type) {
    const powerupGroup = new THREE.Group();
    powerupGroup.position.copy(position);

    // Base crate
    const crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    let crateMaterial;

    switch (type) {
      case "repair":
        crateMaterial = new THREE.MeshPhongMaterial({
          color: 0x2196f3, // Blue
          specular: 0xbbdefb,
          shininess: 40,
        });
        break;

      case "speedBoost":
        crateMaterial = new THREE.MeshPhongMaterial({
          color: 0xffc107, // Amber
          specular: 0xffecb3,
          shininess: 40,
        });
        break;

      case "shield":
        crateMaterial = new THREE.MeshPhongMaterial({
          color: 0x4caf50, // Green
          specular: 0xc8e6c9,
          shininess: 40,
        });
        break;

      case "extraPoints":
        crateMaterial = new THREE.MeshPhongMaterial({
          color: 0x9c27b0, // Purple
          specular: 0xe1bee7,
          shininess: 40,
        });
        break;
    }

    const crate = new THREE.Mesh(crateGeometry, crateMaterial);
    crate.position.y = 0.5;
    crate.castShadow = true;
    crate.receiveShadow = true;
    powerupGroup.add(crate);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: crateMaterial.color,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.5;
    powerupGroup.add(glow);

    // Add floating animation data
    powerupGroup.userData.floatAnimation = true;
    powerupGroup.userData.originalY = position.y;

    // Add powerup to scene
    scene.add(powerupGroup);

    // Create powerup object
    const powerup = {
      mesh: powerupGroup,
      position: powerupGroup.position,
      type,
      collected: false,
    };

    // Add to powerups array
    powerups.push(powerup);

    return powerup;
  }

  // Function to create islands
  function createIsland(position, size) {
    const islandGroup = new THREE.Group();
    islandGroup.position.copy(position);

    // Create island base
    const islandGeometry = new THREE.CylinderGeometry(
      size,
      size * 1.2,
      size * 0.5,
      16
    );
    const islandMaterial = new THREE.MeshPhongMaterial({
      color: 0xd2b48c, // Sand color
      specular: 0x555555,
      shininess: 10,
    });
    const islandBase = new THREE.Mesh(islandGeometry, islandMaterial);
    islandBase.position.y = -size * 0.2;
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    islandGroup.add(islandBase);

    // Add some palm trees if it's a larger island
    if (size > 5) {
      const numTrees = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numTrees; i++) {
        // Random position on island
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (size * 0.7);
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        // Create palm tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({
          color: 0x8b4513,
          specular: 0x222222,
          shininess: 10,
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        islandGroup.add(trunk);

        // Create palm tree leaves
        const leavesGeometry = new THREE.ConeGeometry(1, 1, 8);
        const leavesMaterial = new THREE.MeshPhongMaterial({
          color: 0x2e8b57,
          specular: 0x155844,
          shininess: 20,
        });

        // Add multiple leaf sections
        for (let j = 0; j < 5; j++) {
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.set(
            x + Math.cos(j * Math.PI * 0.4) * 0.7,
            2.2,
            z + Math.sin(j * Math.PI * 0.4) * 0.7
          );

          // Random rotation for leaves
          leaves.rotation.set(
            Math.random() * 0.2 - 0.1,
            Math.random() * Math.PI * 2,
            Math.random() * 0.2 - 0.1
          );

          leaves.castShadow = true;
          islandGroup.add(leaves);
        }
      }
    }

    // Add island to scene
    scene.add(islandGroup);

    // Create island object
    const island = {
      mesh: islandGroup,
      position: islandGroup.position,
      size,
      radius: size,
    };

    // Add to islands array
    islands.push(island);

    return island;
  }

  // Function to update weather appearance
  function updateWeather(weather) {
    currentWeather = weather;

    // Update ocean colors based on weather
    let waterColor, waterHighlight, waterOpacity;

    switch (weather) {
      case "calm":
        // Bright blue water
        waterColor = new THREE.Color(0x0059aa);
        waterHighlight = new THREE.Color(0x00aaff);
        waterOpacity = 0.85;
        skyMaterial.color.set(0x87ceeb);
        sunMaterial.opacity = 0.8;
        clouds.visible = true;
        clouds.children.forEach((cloud) => {
          cloud.children.forEach((puff) => {
            puff.material.opacity = 0.9;
            puff.material.color.set(0xffffff);
          });
        });
        break;

      case "windy":
        // Darker blue water, slightly grayer sky
        waterColor = new THREE.Color(0x004488);
        waterHighlight = new THREE.Color(0x0088dd);
        waterOpacity = 0.8;
        skyMaterial.color.set(0x6b9dc7);
        sunMaterial.opacity = 0.7;
        clouds.visible = true;
        clouds.children.forEach((cloud) => {
          cloud.userData.speed *= 1.5; // Faster moving clouds
          cloud.children.forEach((puff) => {
            puff.material.opacity = 0.8;
            puff.material.color.set(0xe8e8e8);
          });
        });
        break;

      case "foggy":
        // Gray-blue water with low visibility
        waterColor = new THREE.Color(0x556677);
        waterHighlight = new THREE.Color(0x8899aa);
        waterOpacity = 0.9;
        skyMaterial.color.set(0x9eadb6);
        sunMaterial.opacity = 0.3;
        clouds.visible = true;
        clouds.children.forEach((cloud) => {
          cloud.children.forEach((puff) => {
            puff.material.opacity = 0.95;
            puff.material.color.set(0xeeeeee);
            puff.scale.multiplyScalar(1.2); // Bigger clouds for fog effect
          });
        });
        break;

      case "stormy":
        // Dark, angry water, dark sky
        waterColor = new THREE.Color(0x1a2433);
        waterHighlight = new THREE.Color(0x3a5273);
        waterOpacity = 0.95;
        skyMaterial.color.set(0x37474f);
        sunMaterial.opacity = 0.1;
        clouds.visible = true;
        clouds.children.forEach((cloud) => {
          cloud.userData.speed *= 2;
          cloud.children.forEach((puff) => {
            puff.material.color.set(0x555555); // Dark clouds
            puff.material.opacity = 0.9;
          });
        });
        break;
    }

    // Update materials based on type
    if (oceanMaterial.uniforms) {
      // Shader material
      oceanMaterial.uniforms.waterColor.value = waterColor;
      oceanMaterial.uniforms.waterHighlight.value = waterHighlight;
      oceanMaterial.opacity = waterOpacity;
    } else {
      // Standard material
      oceanMaterial.color.set(waterColor);
      oceanMaterial.opacity = waterOpacity;
    }
  }

  // Function to get random position in ocean
  function getRandomPosition(minDistance = 0, avoidPositions = []) {
    const margin = 20;
    let position;
    let validPosition = false;

    // Try up to 50 times to find a valid position
    let attempts = 0;

    while (!validPosition && attempts < 50) {
      position = new THREE.Vector3(
        Math.random() * (boundarySize * 2) - boundarySize,
        0,
        Math.random() * (boundarySize * 2) - boundarySize
      );

      // Check if position is far enough from other objects
      validPosition = true;

      for (const pos of avoidPositions) {
        if (position.distanceTo(pos) < minDistance) {
          validPosition = false;
          break;
        }
      }

      attempts++;
    }

    // If no valid position found, just return a random one
    if (!validPosition) {
      position = new THREE.Vector3(
        Math.random() * (boundarySize * 2 - margin * 2) - boundarySize + margin,
        0,
        Math.random() * (boundarySize * 2 - margin * 2) - boundarySize + margin
      );
    }

    return position;
  }

  // Initial weather setup
  updateWeather(currentWeather);

  // Initialize game objects

  // Create islands (larger obstacles)
  const numIslands = GAME_OBJECTS.NUM_ISLANDS;
  const islandPositions = [];

  for (let i = 0; i < numIslands; i++) {
    const size = Math.random() * 8 + 5; // Island size between 5-13
    const position = getRandomPosition(30, islandPositions);
    position.y = 0;
    islandPositions.push(position);
    createIsland(position, size);
  }

  // Create hazards
  const numHazards = GAME_OBJECTS.NUM_HAZARDS;
  const hazardTypes = ["rock", "whirlpool", "seamonster"];
  const allPositions = [...islandPositions];

  for (let i = 0; i < numHazards; i++) {
    const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
    const position = getRandomPosition(20, allPositions);
    position.y = type === "seamonster" ? 0.5 : 0;
    allPositions.push(position);
    createHazard(position, type);
  }

  // Create initial treasures
  const numTreasures = GAME_OBJECTS.NUM_TREASURES;

  for (let i = 0; i < numTreasures; i++) {
    const position = getRandomPosition(15, allPositions);
    position.y = 0;
    allPositions.push(position);
    createTreasure(position);
  }

  // Create initial powerups
  const numPowerups = GAME_OBJECTS.NUM_POWERUPS;
  const powerupTypes = ["repair", "speedBoost", "shield", "extraPoints"];

  for (let i = 0; i < numPowerups; i++) {
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    const position = getRandomPosition(20, allPositions);
    position.y = 0.5; // Floating slightly above water
    allPositions.push(position);
    createPowerup(position, type);
  }

  // Update function for the ocean environment
  function update(deltaTime, playerPosition) {
    // Animate ocean waves
    animateOcean(deltaTime, playerPosition);

    // Update treasures, powerups and hazards based on player's position
    updateGameObjects(playerPosition);

    // Update clouds
    animateClouds(deltaTime);
  }

  // Animate the ocean surface
  function animateOcean(deltaTime, playerPosition) {
    // Calculate time for wave animation
    const time = Date.now() * 0.001;

    // Update shader time uniform
    if (oceanMaterial.uniforms && oceanMaterial.uniforms.time) {
      oceanMaterial.uniforms.time.value = time;
    }

    const positions = oceanGeometry.attributes.position.array;

    // Get player velocity for wake effect
    const playerSpeed = playerPosition
      ? playerPosition.userData?.speed || 0
      : 0;

    // Only animate vertices that are close to the player (for performance)
    for (let i = 0; i < positions.length; i += 3) {
      // Get original position
      const originalY = ocean.userData.originalVertices[i + 1];
      const x = positions[i];
      const z = positions[i + 2];

      // Calculate wave offset based on position and time
      const vertexIndex = i / 3;
      const speed = ocean.userData.waveSpeeds[vertexIndex];
      const height = ocean.userData.waveHeights[vertexIndex];
      const phase = ocean.userData.wavePhases[vertexIndex];

      // Calculate distance from origin for circular wave pattern
      const distance = Math.sqrt(x * x + z * z) * 0.03;

      // Calculate wave height using multiple sine waves for more natural look
      const waveOffset =
        Math.sin(time * speed + phase + distance) * height * 0.5 +
        Math.sin(time * speed * 0.5 + phase * 1.3 + distance * 0.7) *
          height *
          0.3 +
        Math.sin(time * speed * 0.3 + phase * 0.7 + distance * 1.3) *
          height *
          0.2 +
        Math.cos(distance * 2 - time * 0.5) * height * 0.1;

      // Apply weather effects to wave height
      let weatherMultiplier = 1;
      switch (currentWeather) {
        case "calm":
          weatherMultiplier = WEATHER.CALM_WAVE_MULTIPLIER;
          break;
        case "windy":
          weatherMultiplier = WEATHER.WINDY_WAVE_MULTIPLIER;
          break;
        case "foggy":
          weatherMultiplier = WEATHER.FOGGY_WAVE_MULTIPLIER;
          break;
        case "stormy":
          weatherMultiplier = WEATHER.STORMY_WAVE_MULTIPLIER;
          break;
      }

      // Apply wave height to vertex
      let finalWaveHeight = waveOffset * weatherMultiplier;

      // Add wake effect behind the ship if player position is available
      if (playerPosition) {
        const distToPlayer = Math.sqrt(
          Math.pow(x - playerPosition.x, 2) + Math.pow(z - playerPosition.z, 2)
        );

        // Create wake waves behind the ship
        if (distToPlayer < 20) {
          // Get vector from player to this vertex
          const toVertex = new THREE.Vector3(
            x - playerPosition.x,
            0,
            z - playerPosition.z
          ).normalize();

          // Get player's forward direction (assuming negative Z is forward)
          const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
            playerPosition.quaternion
          );

          // Calculate dot product to see if point is behind the ship
          const dot = toVertex.dot(playerForward);

          // Points behind the ship will have negative dot product with forward vector
          if (dot < 0 && distToPlayer > 3) {
            // Scale wake effect based on player speed and distance
            const wakeIntensity =
              Math.min(1, playerSpeed / 15) *
              Math.max(0, 1 - distToPlayer / 20);
            const wakeHeight =
              wakeIntensity * Math.sin(distToPlayer * 1.5 - time * 8) * 1.2;

            // Apply wake wave height
            finalWaveHeight += wakeHeight;
          }
        }
      }

      // Apply final wave height
      positions[i + 1] = originalY + finalWaveHeight;
    }

    // Update the geometry
    oceanGeometry.attributes.position.needsUpdate = true;

    // Update normals for better lighting
    oceanGeometry.computeVertexNormals();
  }

  // Animate clouds
  function animateClouds(deltaTime) {
    // Move clouds based on weather
    let cloudSpeed = 0.5; // Base speed

    switch (currentWeather) {
      case "calm":
        cloudSpeed = 0.5;
        break;
      case "windy":
        cloudSpeed = 2.0;
        break;
      case "foggy":
        cloudSpeed = 0.3;
        break;
      case "stormy":
        cloudSpeed = 3.0;
        break;
    }

    clouds.children.forEach((cloud) => {
      // Move cloud
      cloud.position.x += cloudSpeed * deltaTime * (0.5 + Math.random() * 0.5);

      // Wrap cloud around if it goes beyond the boundary
      if (cloud.position.x > oceanSize / 2) {
        cloud.position.x = -oceanSize / 2;
        cloud.position.z = Math.random() * oceanSize - oceanSize / 2;
        cloud.position.y = 50 + Math.random() * 30;
      }
    });
  }

  // Update game objects (treasures, powerups, hazards)
  function updateGameObjects(playerPosition) {
    // Update only objects that are close to the player
    const updateRadius = 100; // Only update objects within this distance

    treasures.forEach((treasure) => {
      if (!treasure.collected && !treasure.animating) {
        // Add subtle floating animation to treasures
        treasure.mesh.position.y =
          treasure.position.y + Math.sin(Date.now() * 0.002) * 0.2;
        treasure.mesh.rotation.y += 0.01;
      }
    });

    powerups.forEach((powerup) => {
      if (!powerup.collected && !powerup.animating) {
        // Add floating animation to powerups
        powerup.mesh.position.y =
          powerup.position.y + Math.sin(Date.now() * 0.003) * 0.3;
        powerup.mesh.rotation.y += 0.02;
      }
    });

    hazards.forEach((hazard) => {
      if (hazard.type === "whirlpool" && !hazard.triggered) {
        // Animate whirlpools
        hazard.mesh.rotation.y += 0.03;
      } else if (hazard.type === "seamonster" && !hazard.triggered) {
        // Animate sea monsters
        hazard.mesh.position.y =
          hazard.position.y + Math.sin(Date.now() * 0.001) * 0.5;
      }
    });
  }

  // Return the ocean environment interface with an extended update function
  return {
    updateWeather,
    update,
    treasures,
    hazards,
    powerups,
    islands,
    createTreasure,
    createHazard,
    createPowerup,
    respawnTreasure: function (index) {
      // Remove old treasure mesh from scene
      if (treasures[index] && treasures[index].mesh) {
        scene.remove(treasures[index].mesh);
      }

      // Create new treasure at a random position
      const position = getRandomPosition(15, [
        ...islands.map((i) => i.position),
      ]);
      position.y = 0.5; // Position slightly above water

      // Create new treasure and replace the old one
      const newTreasure = createTreasure(position);
      treasures[index] = newTreasure;
    },
  };
}
