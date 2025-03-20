import * as THREE from "three";
import { SHIP_PHYSICS } from "./gameConfig";

export function createShip(scene) {
  // Ship group to hold all parts
  const shipGroup = new THREE.Group();

  // Ship physics state
  const physics = {
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 0, 0),
    angularVelocity: 0,
    angularAcceleration: 0,
    direction: new THREE.Vector3(0, 0, 1),
    targetRotation: new THREE.Euler(),
    speed: 0,
    maxSpeed: SHIP_PHYSICS.MAX_SPEED,
    drag: SHIP_PHYSICS.DRAG,
    rotationDamping: SHIP_PHYSICS.ROTATION_DAMPING,
    turnResponsiveness: SHIP_PHYSICS.TURN_RESPONSIVENESS,
    accelerationSmoothing: SHIP_PHYSICS.ACCELERATION_SMOOTHING,
    anchorDeployed: false,
    anchorTimer: 0,
  };

  // Create the main hull
  const hullGeometry = new THREE.BoxGeometry(2, 1, 4);
  const hullMaterial = new THREE.MeshPhongMaterial({
    color: 0x795548,
    specular: 0x111111,
    shininess: 20,
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 0.5;
  hull.castShadow = true;
  hull.receiveShadow = true;
  shipGroup.add(hull);

  // Create the deck
  const deckGeometry = new THREE.BoxGeometry(1.8, 0.2, 3.8);
  const deckMaterial = new THREE.MeshPhongMaterial({
    color: 0x8d6e63,
    specular: 0x222222,
    shininess: 30,
  });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 1.1;
  deck.castShadow = true;
  deck.receiveShadow = true;
  shipGroup.add(deck);

  // Create the cabin
  const cabinGeometry = new THREE.BoxGeometry(1.2, 1, 1.5);
  const cabinMaterial = new THREE.MeshPhongMaterial({
    color: 0x8d6e63,
    specular: 0x222222,
    shininess: 30,
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = 1.7;
  cabin.position.z = -0.8;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  shipGroup.add(cabin);

  // Create the mast
  const mastGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
  const mastMaterial = new THREE.MeshPhongMaterial({
    color: 0x5d4037,
    specular: 0x111111,
    shininess: 10,
  });
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.y = 3.6;
  mast.position.z = 0.5;
  mast.castShadow = true;
  mast.receiveShadow = true;
  shipGroup.add(mast);

  // Create the sail
  const sailGeometry = new THREE.PlaneGeometry(2.5, 3);
  const sailMaterial = new THREE.MeshPhongMaterial({
    color: 0xeeeeee,
    side: THREE.DoubleSide,
    specular: 0x444444,
    shininess: 10,
  });
  const sail = new THREE.Mesh(sailGeometry, sailMaterial);
  sail.rotation.y = Math.PI / 2;
  sail.position.y = 3;
  sail.position.z = 0.5;
  sail.castShadow = true;
  sail.receiveShadow = true;
  shipGroup.add(sail);

  // Create the bowsprit (front spar)
  const bowspritGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
  const bowspritMaterial = new THREE.MeshPhongMaterial({
    color: 0x5d4037,
    specular: 0x111111,
    shininess: 10,
  });
  const bowsprit = new THREE.Mesh(bowspritGeometry, bowspritMaterial);
  bowsprit.rotation.x = Math.PI / 2;
  bowsprit.position.y = 1;
  bowsprit.position.z = 2.5;
  bowsprit.castShadow = true;
  bowsprit.receiveShadow = true;
  shipGroup.add(bowsprit);

  // Create the flag
  const flagGeometry = new THREE.PlaneGeometry(0.8, 0.5);
  const flagMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
    specular: 0x444444,
    shininess: 20,
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.y = 6;
  flag.position.z = 0.5;
  flag.position.x = -0.4;
  flag.castShadow = true;
  flag.receiveShadow = false;
  shipGroup.add(flag);

  // Create the rudder
  const rudderGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
  const rudderMaterial = new THREE.MeshPhongMaterial({
    color: 0x5d4037,
    specular: 0x111111,
    shininess: 10,
  });
  const rudder = new THREE.Mesh(rudderGeometry, rudderMaterial);
  rudder.position.y = 0.1;
  rudder.position.z = -2.2;
  rudder.castShadow = true;
  rudder.receiveShadow = true;
  shipGroup.add(rudder);

  // Create the anchor
  const anchorGroup = new THREE.Group();

  const anchorPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
  const anchorPoleMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    specular: 0x111111,
    shininess: 40,
  });
  const anchorPole = new THREE.Mesh(anchorPoleGeometry, anchorPoleMaterial);
  anchorGroup.add(anchorPole);

  const anchorCrossGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
  const anchorCross = new THREE.Mesh(anchorCrossGeometry, anchorPoleMaterial);
  anchorCross.rotation.x = Math.PI / 2;
  anchorCross.position.y = -0.3;
  anchorGroup.add(anchorCross);

  // Add hooks to the anchor
  const hookGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);

  const leftHook = new THREE.Mesh(hookGeometry, anchorPoleMaterial);
  leftHook.rotation.z = Math.PI / 2;
  leftHook.rotation.y = Math.PI / 2;
  leftHook.position.y = -0.3;
  leftHook.position.x = 0.3;
  anchorGroup.add(leftHook);

  const rightHook = new THREE.Mesh(hookGeometry, anchorPoleMaterial);
  rightHook.rotation.z = Math.PI / 2;
  rightHook.rotation.y = -Math.PI / 2;
  rightHook.position.y = -0.3;
  rightHook.position.x = -0.3;
  anchorGroup.add(rightHook);

  // Position anchor on the side of the ship (not visible initially)
  anchorGroup.position.set(1.1, 1, 1.5);
  anchorGroup.visible = false;
  shipGroup.add(anchorGroup);

  // Create shield effect (not visible initially)
  const shieldGeometry = new THREE.SphereGeometry(3, 32, 32);
  const shieldMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.visible = false;
  shipGroup.add(shield);

  // Create wake effect behind the ship
  const wakeGeometry = new THREE.PlaneGeometry(1.5, 3);
  const wakeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const wake = new THREE.Mesh(wakeGeometry, wakeMaterial);
  wake.rotation.x = -Math.PI / 2;
  wake.position.y = 0.05;
  wake.position.z = -3;
  shipGroup.add(wake);

  // Functions to animate the ship parts
  function animateFlag(time) {
    // Simple flag waving animation
    const waveAmount = Math.sin(time * 5) * 0.2;
    flag.rotation.y = waveAmount;
    flag.rotation.z = Math.sin(time * 3) * 0.1;
  }

  function animateSail(time, weather, speed) {
    // Sail billowing in the wind based on weather and speed
    const baseWind = 0.1;
    let windFactor = 0;

    switch (weather) {
      case "calm":
        windFactor = baseWind;
        break;
      case "windy":
        windFactor = baseWind * 3;
        break;
      case "foggy":
        windFactor = baseWind * 1.5;
        break;
      case "stormy":
        windFactor = baseWind * 4;
        break;
    }

    // Add speed influence to sail billowing
    const speedEffect = Math.min(1, speed / 10) * 0.5;
    const billowAmount = Math.sin(time * 2) * windFactor + speedEffect;

    sail.geometry.dispose();
    sail.geometry = createBillowingSailGeometry(2.5, 3, billowAmount);
  }

  function createBillowingSailGeometry(width, height, billowAmount) {
    // Create a sail that bulges in the middle
    const geometry = new THREE.PlaneGeometry(width, height, 10, 10);
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Calculate distance from center
      const centerX = 0;
      const centerY = 0;
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );

      // Apply bulge based on distance (more in the center, less at the edges)
      const normalizedDistance =
        1 - Math.min(distanceFromCenter / (Math.max(width, height) / 2), 1);
      const bulge = normalizedDistance * billowAmount;

      positions.setZ(i, bulge);
    }

    return geometry;
  }

  function animateWake(speed) {
    // Adjust wake opacity based on speed
    const opacity = Math.min(0.6, (speed / physics.maxSpeed) * 0.6);
    wakeMaterial.opacity = opacity;

    // Adjust wake size based on speed
    const scale = 1 + speed / physics.maxSpeed;
    wake.scale.set(scale, 1 + scale * 0.5, 1);
  }

  function animateRocking(time, weather, speed) {
    // Rocking animation based on weather and speed
    let rockAmount = 0;

    switch (weather) {
      case "calm":
        rockAmount = 0.01;
        break;
      case "windy":
        rockAmount = 0.03;
        break;
      case "foggy":
        rockAmount = 0.02;
        break;
      case "stormy":
        rockAmount = 0.05;
        break;
    }

    // Add speed influence to rocking - more speed means more stability in X axis
    // but more variability in Z axis
    const speedFactor = Math.min(1, speed / 10);
    shipGroup.rotation.z = Math.sin(time * 2) * rockAmount;
    shipGroup.rotation.x =
      (Math.sin(time * 1.5) * rockAmount) / (2 + speedFactor);
  }

  // Function to deploy anchor
  function deployAnchor() {
    if (!physics.anchorDeployed) {
      physics.anchorDeployed = true;
      physics.anchorTimer = 2; // 2 seconds of anchor effect

      // Make anchor visible
      anchorGroup.visible = true;

      // Create anchor chain
      const chainGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 8);
      const chainMaterial = new THREE.MeshPhongMaterial({
        color: 0x555555,
        specular: 0x222222,
        shininess: 30,
      });
      const chain = new THREE.Mesh(chainGeometry, chainMaterial);
      chain.position.set(1.1, 0, 1.5);
      chain.rotation.x = Math.PI / 2;
      shipGroup.add(chain);

      // Store chain reference for removal
      anchorGroup.userData.chain = chain;

      // Tween anchor position downward
      const anchorStartY = anchorGroup.position.y;

      // Animation loop for anchor deployment
      const startTime = Date.now();
      const animateAnchor = () => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        if (elapsed < 1) {
          // Move anchor down over 1 second
          anchorGroup.position.y = anchorStartY - elapsed * 3;
          requestAnimationFrame(animateAnchor);
        } else {
          anchorGroup.position.y = anchorStartY - 3;
        }
      };

      animateAnchor();
    }
  }

  // Function to retrieve anchor
  function retrieveAnchor() {
    if (physics.anchorDeployed) {
      physics.anchorDeployed = false;

      // Animate anchor back to original position
      const anchorEndY = 1;
      const startPosition = anchorGroup.position.y;
      const startTime = Date.now();

      const animateAnchorRetrieval = () => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        if (elapsed < 0.5) {
          // Move anchor up over 0.5 second
          anchorGroup.position.y =
            startPosition + (anchorEndY - startPosition) * (elapsed / 0.5);
          requestAnimationFrame(animateAnchorRetrieval);
        } else {
          anchorGroup.position.y = anchorEndY;
          anchorGroup.visible = false;

          // Remove anchor chain
          if (anchorGroup.userData.chain) {
            shipGroup.remove(anchorGroup.userData.chain);
            anchorGroup.userData.chain.geometry.dispose();
            anchorGroup.userData.chain.material.dispose();
            anchorGroup.userData.chain = null;
          }
        }
      };

      animateAnchorRetrieval();
    }
  }

  // Function to show damage effect
  function showDamageEffect() {
    // Flash the hull red
    const originalColor = hullMaterial.color.clone();
    hullMaterial.color.set(0xff0000);

    // Shake the ship
    const originalRotation = {
      x: shipGroup.rotation.x,
      y: shipGroup.rotation.y,
      z: shipGroup.rotation.z,
    };

    let shakeCount = 0;
    const maxShakes = 5;
    const shakeAmount = 0.1;

    const shakeShip = () => {
      if (shakeCount >= maxShakes) {
        // Reset ship rotation
        shipGroup.rotation.x = originalRotation.x;
        shipGroup.rotation.y = originalRotation.y;
        shipGroup.rotation.z = originalRotation.z;

        // Reset hull color
        hullMaterial.color.copy(originalColor);
        return;
      }

      // Apply random rotation
      shipGroup.rotation.x =
        originalRotation.x + (Math.random() - 0.5) * shakeAmount;
      shipGroup.rotation.y =
        originalRotation.y + (Math.random() - 0.5) * shakeAmount;
      shipGroup.rotation.z =
        originalRotation.z + (Math.random() - 0.5) * shakeAmount;

      shakeCount++;
      setTimeout(shakeShip, 50);
    };

    shakeShip();
  }

  // Function to activate shield
  function activateShield() {
    shield.visible = true;

    // Animation loop for shield effect
    const pulseShield = () => {
      if (!shield.visible) return;

      shield.scale.x = 1 + Math.sin(Date.now() / 300) * 0.05;
      shield.scale.y = 1 + Math.sin(Date.now() / 400) * 0.05;
      shield.scale.z = 1 + Math.sin(Date.now() / 500) * 0.05;

      requestAnimationFrame(pulseShield);
    };

    pulseShield();
  }

  // Function to deactivate shield
  function deactivateShield() {
    shield.visible = false;
  }

  // Function to get random wind direction based on weather
  function getWindDirection(weather) {
    const baseDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize();

    let windStrength = 0;

    switch (weather) {
      case "calm":
        windStrength = 0.1;
        break;
      case "windy":
        windStrength = 1.0;
        break;
      case "foggy":
        windStrength = 0.3;
        break;
      case "stormy":
        windStrength = 1.5;
        break;
    }

    return baseDirection.multiplyScalar(windStrength);
  }

  // Update function
  function updateShip({ keys, deltaTime, weather, speedBoost }) {
    const windDirection = getWindDirection(weather);
    const elapsedTime = Date.now() / 1000;

    // Update anchor timer
    if (physics.anchorDeployed) {
      physics.anchorTimer -= deltaTime;
      if (physics.anchorTimer <= 0) {
        retrieveAnchor();
      }
    }

    // Calculate target acceleration based on inputs
    const targetAcceleration = new THREE.Vector3(0, 0, 0);

    if (keys.forward) {
      // Use custom acceleration if available, otherwise use config value
      const baseAcceleration =
        shipGroup.userData.customAcceleration || SHIP_PHYSICS.BASE_ACCELERATION;
      const boostMultiplier = keys.boost ? SHIP_PHYSICS.BOOST_MULTIPLIER : 1;
      const acceleration = baseAcceleration * boostMultiplier;
      const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(
        shipGroup.quaternion
      );
      targetAcceleration.add(forwardVector.multiplyScalar(acceleration));
    }

    if (keys.backward) {
      if (physics.speed > 0.1) {
        // Apply brake force - smoothly slow down
        physics.velocity.multiplyScalar(
          1 - SHIP_PHYSICS.BRAKE_FORCE * deltaTime * 0.7
        );
      } else if (physics.speed <= 0.1 && physics.speed > -2) {
        // Apply reverse force smoothly
        const backwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(
          shipGroup.quaternion
        );
        targetAcceleration.add(
          backwardVector.multiplyScalar(SHIP_PHYSICS.REVERSE_FORCE)
        );
      }
    }

    // Smooth acceleration changes
    physics.acceleration.lerp(
      targetAcceleration,
      physics.accelerationSmoothing
    );

    // Handle turning with improved smoothing
    let targetAngularVelocity = 0;

    if (keys.left) {
      // Make turn rate dependent on speed for more realistic feel
      const turnRate = 2.5 * Math.min(1, Math.max(0.2, physics.speed / 5));
      targetAngularVelocity = turnRate;

      // Calculate target tilt based on turn rate
      const targetTiltZ = Math.max(-0.1, -0.05 - turnRate * 0.02);
      shipGroup.rotation.z +=
        (targetTiltZ - shipGroup.rotation.z) *
        physics.turnResponsiveness *
        deltaTime;
    } else if (keys.right) {
      const turnRate = 2.5 * Math.min(1, Math.max(0.2, physics.speed / 5));
      targetAngularVelocity = -turnRate;

      // Calculate target tilt based on turn rate
      const targetTiltZ = Math.min(0.1, 0.05 + turnRate * 0.02);
      shipGroup.rotation.z +=
        (targetTiltZ - shipGroup.rotation.z) *
        physics.turnResponsiveness *
        deltaTime;
    } else {
      // Reset tilt gradually with smooth damping
      shipGroup.rotation.z *= 0.9;
    }

    // Apply angular acceleration with smoothing
    physics.angularVelocity =
      physics.angularVelocity * physics.rotationDamping +
      targetAngularVelocity * (1 - physics.rotationDamping);

    // Apply rotation with deltaTime for frame-rate independence
    shipGroup.rotation.y += physics.angularVelocity * deltaTime;

    // Handle anchor drop (space)
    if (keys.space && !physics.anchorDeployed) {
      deployAnchor();
    }

    // Apply physics
    if (physics.anchorDeployed) {
      // When anchor is deployed, quickly reduce speed
      physics.velocity.multiplyScalar(0.8);
    } else {
      // Apply drag based on weather
      let weatherDrag = physics.drag;

      switch (weather) {
        case "calm":
          weatherDrag = SHIP_PHYSICS.CALM_DRAG;
          break;
        case "windy":
          weatherDrag = SHIP_PHYSICS.WINDY_DRAG; // Less drag in windy conditions
          break;
        case "foggy":
          weatherDrag = SHIP_PHYSICS.FOGGY_DRAG;
          break;
        case "stormy":
          weatherDrag = SHIP_PHYSICS.STORMY_DRAG; // More drag in stormy conditions
          break;
      }

      // Apply wind effect in windy and stormy conditions
      if (weather === "windy" || weather === "stormy") {
        physics.velocity.add(windDirection.clone().multiplyScalar(deltaTime));
      }

      // Apply drag with deltaTime scaling for frame-rate independence
      const scaledDrag = Math.pow(weatherDrag, deltaTime * 60);
      physics.velocity.multiplyScalar(scaledDrag);

      // Apply acceleration scaled by deltaTime for frame-rate independence
      physics.velocity.add(
        physics.acceleration.clone().multiplyScalar(deltaTime)
      );

      // Limit speed with improved smoothing near the limit
      const maxSpeedMultiplier = speedBoost ? 1.5 : 1;
      const weatherSpeedMultiplier = weather === "stormy" ? 0.7 : 1;
      const currentMaxSpeed =
        physics.maxSpeed * maxSpeedMultiplier * weatherSpeedMultiplier;

      const currentSpeed = physics.velocity.length();
      if (currentSpeed > currentMaxSpeed) {
        // Smoothly approach max speed instead of hard clipping
        const reduction =
          1 - ((currentSpeed - currentMaxSpeed) / currentSpeed) * 0.5;
        physics.velocity.multiplyScalar(reduction);
      }
    }

    // Move ship with improved delta-based movement
    shipGroup.position.add(physics.velocity.clone().multiplyScalar(deltaTime));

    // Add more realistic bobbing motion based on speed and weather
    let bobAmplitude = 0.1;
    let bobFrequency = 2;

    // Adjust bobbing based on weather
    if (weather === "stormy") {
      bobAmplitude = 0.3;
      bobFrequency = 3;
    }

    // Add speed influence to bobbing
    const speedFactor = Math.min(1, physics.speed / 5);
    shipGroup.position.y =
      0.5 +
      Math.sin(elapsedTime * bobFrequency) * bobAmplitude +
      Math.sin(elapsedTime * bobFrequency * 1.5) *
        bobAmplitude *
        0.3 *
        speedFactor;

    // Calculate current speed
    physics.speed = physics.velocity.length();

    // Animate ship parts with improved sail movement based on speed
    animateFlag(elapsedTime);
    animateSail(elapsedTime, weather, physics.speed);
    animateWake(physics.speed);
    animateRocking(elapsedTime, weather, physics.speed);
  }

  // Return the ship object
  return {
    mesh: shipGroup,
    update: updateShip,
    showDamageEffect,
    activateShield,
    deactivateShield,
    getSpeed: () => physics.speed,
    getPosition: () => shipGroup.position.clone(),
    updatePhysicsParams: ({ maxSpeed, acceleration }) => {
      if (maxSpeed !== undefined) {
        physics.maxSpeed = maxSpeed;
      }

      if (acceleration !== undefined) {
        shipGroup.userData.customAcceleration = acceleration;
      }
    },
  };
}
