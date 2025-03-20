import * as THREE from "three";

export function createSpacecraft(scene) {
  // Spacecraft geometry - create a simple spaceship shape
  const geometry = new THREE.Group();

  // Ship body
  const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
  bodyGeometry.rotateX(Math.PI / 2);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x3366ff,
    specular: 0x111111,
    shininess: 30,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  geometry.add(body);

  // Wings
  const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
  const wingMaterial = new THREE.MeshPhongMaterial({
    color: 0x2255dd,
    specular: 0x222222,
    shininess: 20,
  });
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  wings.position.y = -0.2;
  wings.position.z = -0.5;
  geometry.add(wings);

  // Cockpit
  const cockpitGeometry = new THREE.SphereGeometry(
    0.3,
    16,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  cockpitGeometry.rotateX(Math.PI);
  const cockpitMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    specular: 0xffffff,
    shininess: 100,
    transparent: true,
    opacity: 0.7,
  });
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
  cockpit.position.z = 0.2;
  geometry.add(cockpit);

  // Engines (glowing effect)
  const engineGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.5, 8);
  engineGeometry.rotateX(Math.PI / 2);
  const engineMaterial = new THREE.MeshPhongMaterial({
    color: 0xff3311,
    emissive: 0xff4422,
    emissiveIntensity: 0.5,
    specular: 0xffffff,
    shininess: 30,
  });

  // Left engine
  const engineLeft = new THREE.Mesh(engineGeometry, engineMaterial);
  engineLeft.position.x = -0.6;
  engineLeft.position.y = -0.2;
  engineLeft.position.z = -1;
  engineLeft.scale.set(0.6, 0.6, 0.6);
  geometry.add(engineLeft);

  // Right engine
  const engineRight = new THREE.Mesh(engineGeometry, engineMaterial);
  engineRight.position.x = 0.6;
  engineRight.position.y = -0.2;
  engineRight.position.z = -1;
  engineRight.scale.set(0.6, 0.6, 0.6);
  geometry.add(engineRight);

  // Laser cannon mounts
  const cannonGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8);
  const cannonMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    specular: 0x444444,
    shininess: 40,
  });

  // Left cannon
  const cannonLeft = new THREE.Mesh(cannonGeometry, cannonMaterial);
  cannonLeft.position.x = -0.3;
  cannonLeft.position.y = 0;
  cannonLeft.position.z = 0.8;
  cannonLeft.rotation.x = Math.PI / 2;
  geometry.add(cannonLeft);

  // Right cannon
  const cannonRight = new THREE.Mesh(cannonGeometry, cannonMaterial);
  cannonRight.position.x = 0.3;
  cannonRight.position.y = 0;
  cannonRight.position.z = 0.8;
  cannonRight.rotation.x = Math.PI / 2;
  geometry.add(cannonRight);

  // Add the spacecraft to the scene
  scene.add(geometry);

  // Physics state
  const state = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
  };

  // Laser beams group to manage them
  const laserBeams = [];

  // Laser properties
  const laserSpeed = 40;
  const laserLifetime = 2; // seconds
  let laserCooldown = 0.25; // seconds between shots
  let lastShotTime = 0;

  // Special powers
  const specialPowers = {
    unlimitedLaser: false,
    doubleLaser: false,
  };

  // Function to create a laser beam
  function createLaserBeam(position, direction, elapsedTime) {
    const laserGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
    laserGeometry.rotateX(Math.PI / 2);

    const laserMaterial = new THREE.MeshPhongMaterial({
      color: specialPowers.unlimitedLaser ? 0xff0000 : 0x00ffff,
      emissive: specialPowers.unlimitedLaser ? 0xff0000 : 0x00ffff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7,
    });

    const laser = new THREE.Mesh(laserGeometry, laserMaterial);
    laser.position.copy(position);

    // Create a bounding sphere for collision detection
    laser.geometry.computeBoundingSphere();

    // Store the laser's velocity and creation time
    laser.userData = {
      velocity: direction.clone().normalize().multiplyScalar(laserSpeed),
      creationTime: elapsedTime,
      power: specialPowers.unlimitedLaser ? 5 : 1, // Higher power for unlimited laser mode
    };

    scene.add(laser);
    laserBeams.push(laser);

    return laser;
  }

  // Function to check collision between a laser and an object
  function checkLaserCollision(laser, targetObjects) {
    // Skip collision detection if laser has no bounding sphere yet
    if (!laser.geometry.boundingSphere) return false;

    // Create laser bounding sphere
    const laserSphere = new THREE.Sphere(
      laser.position.clone(),
      laser.geometry.boundingSphere.radius *
        Math.max(laser.scale.x, laser.scale.y, laser.scale.z) *
        1.2 // Slightly larger collision radius for better detection
    );

    // Check collision with each target object
    for (let i = 0; i < targetObjects.length; i++) {
      const obj = targetObjects[i];

      // Skip objects that are already hit or are not mesh objects
      if (!obj.isMesh || obj.userData.isHit || obj instanceof THREE.Points) {
        continue;
      }

      // Ensure target has a bounding sphere
      if (!obj.geometry.boundingSphere) {
        obj.geometry.computeBoundingSphere();
      }

      // Create target object bounding sphere
      const objSphere = new THREE.Sphere(
        obj.position.clone(),
        obj.geometry.boundingSphere.radius *
          Math.max(obj.scale.x, obj.scale.y, obj.scale.z)
      );

      // Check if spheres intersect
      const distance = laserSphere.center.distanceTo(objSphere.center);
      const radiusSum = laserSphere.radius + objSphere.radius;

      if (distance < radiusSum) {
        return { collided: true, target: obj };
      }
    }

    return { collided: false };
  }

  // Return the spacecraft object with update method
  return {
    mesh: geometry,
    velocity: state.velocity,

    // Get laser beams for collision detection
    getLaserBeams() {
      return laserBeams;
    },

    // Set special power
    setSpecialPower(powerName) {
      if (powerName in specialPowers) {
        specialPowers[powerName] = true;

        // If it's double laser, adjust cooldown
        if (powerName === "doubleLaser") {
          // Make cooldown shorter for double laser
          laserCooldown = 0.15;
        }
      }
    },

    update({
      keys,
      deltaTime,
      physics,
      elapsedTime,
      environmentObjects,
      onRockDestroyed,
    }) {
      // Extract physics properties
      const { acceleration, drag, maxSpeed, rotationSpeed, randomFactor } =
        physics;

      // Calculate thrust based on input
      let thrustZ = 0;
      let thrustX = 0;

      if (keys.forward) thrustZ -= acceleration;
      if (keys.backward) thrustZ += acceleration * 0.5; // Slower backward
      if (keys.left) thrustX -= acceleration * 0.8;
      if (keys.right) thrustX += acceleration * 0.8;

      // Apply random factor for probability dimension
      if (randomFactor > 0) {
        thrustZ += (Math.random() - 0.5) * randomFactor;
        thrustX += (Math.random() - 0.5) * randomFactor;
      }

      // Apply thrust as acceleration
      state.velocity.z += thrustZ * deltaTime;
      state.velocity.x += thrustX * deltaTime;

      // Apply drag
      state.velocity.x *= 1 - drag * deltaTime;
      state.velocity.y *= 1 - drag * deltaTime;
      state.velocity.z *= 1 - drag * deltaTime;

      // Enforce max speed
      const speed = state.velocity.length();
      if (speed > maxSpeed) {
        state.velocity.multiplyScalar(maxSpeed / speed);
      }

      // Update position
      geometry.position.x += state.velocity.x * deltaTime;
      geometry.position.y += state.velocity.y * deltaTime;
      geometry.position.z += state.velocity.z * deltaTime;

      // Calculate rotation based on velocity and input
      const targetRotationX = state.velocity.z * 0.1;
      const targetRotationZ = -state.velocity.x * 0.2;
      const targetRotationY = keys.left ? 0.2 : keys.right ? -0.2 : 0;

      // Smoothly interpolate to target rotation
      geometry.rotation.x +=
        (targetRotationX - geometry.rotation.x) * rotationSpeed * deltaTime;
      geometry.rotation.z +=
        (targetRotationZ - geometry.rotation.z) * rotationSpeed * deltaTime;
      geometry.rotation.y +=
        (targetRotationY - geometry.rotation.y) * rotationSpeed * deltaTime;

      // Visual effects based on thrust
      // Engine glow effect when accelerating
      if (keys.forward) {
        const engineGlowIntensity = 1 + Math.sin(elapsedTime * 10) * 0.2;
        engineLeft.material.emissiveIntensity = 0.5 + engineGlowIntensity * 0.5;
        engineRight.material.emissiveIntensity =
          0.5 + engineGlowIntensity * 0.5;
      } else {
        engineLeft.material.emissiveIntensity = 0.5;
        engineRight.material.emissiveIntensity = 0.5;
      }

      // Slightly oscillate the ship for a more dynamic feel
      geometry.position.y += Math.sin(elapsedTime * 2) * 0.01;

      // Handle laser shooting
      const canShoot =
        specialPowers.unlimitedLaser ||
        elapsedTime - lastShotTime > laserCooldown;
      if (keys.space && canShoot) {
        // Calculate the positions for left and right lasers based on the ship's position and rotation
        const leftLaserPosition = new THREE.Vector3(-0.3, 0, 0.8);
        leftLaserPosition.applyEuler(geometry.rotation);
        leftLaserPosition.add(geometry.position);

        const rightLaserPosition = new THREE.Vector3(0.3, 0, 0.8);
        rightLaserPosition.applyEuler(geometry.rotation);
        rightLaserPosition.add(geometry.position);

        // Calculate direction based on ship's rotation (forward direction)
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(geometry.rotation);

        // Create lasers
        createLaserBeam(leftLaserPosition, direction, elapsedTime);
        createLaserBeam(rightLaserPosition, direction, elapsedTime);

        // If we have double laser, add two more lasers at slightly different angles
        if (specialPowers.doubleLaser) {
          // Left side angled laser
          const leftAngleDirection = direction
            .clone()
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.1);
          createLaserBeam(leftLaserPosition, leftAngleDirection, elapsedTime);

          // Right side angled laser
          const rightAngleDirection = direction
            .clone()
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.1);
          createLaserBeam(rightLaserPosition, rightAngleDirection, elapsedTime);
        }

        // Update last shot time (only if not unlimited)
        if (!specialPowers.unlimitedLaser) {
          lastShotTime = elapsedTime;
        }
      }

      // Update existing laser beams and check for collisions
      for (let i = laserBeams.length - 1; i >= 0; i--) {
        const laser = laserBeams[i];

        // Move laser beam
        laser.position.addScaledVector(laser.userData.velocity, deltaTime);

        // Check for collisions with environment objects
        if (environmentObjects) {
          for (const realmName in environmentObjects) {
            const { collided, target } = checkLaserCollision(
              laser,
              environmentObjects[realmName]
            );

            if (collided && !target.userData.isHit) {
              // Mark the target as hit
              target.userData.isHit = true;

              // Create an explosion at the target's position
              if (onRockDestroyed) {
                onRockDestroyed(
                  target.position.clone(),
                  target.geometry.boundingSphere.radius || 1
                );
              }

              // Remove the laser
              scene.remove(laser);
              laserBeams.splice(i, 1);

              // Exit this iteration since the laser is now gone
              break;
            }
          }
        }

        // Check if laser has exceeded its lifetime
        if (
          laser &&
          elapsedTime - laser.userData.creationTime > laserLifetime
        ) {
          scene.remove(laser);
          laserBeams.splice(i, 1);
        }
      }
    },
  };
}
