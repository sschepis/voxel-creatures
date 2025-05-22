class VoxelCreature {
  constructor(genes = null, generation = 0, params) {
    const { 
      world, 
      scene, 
      WORLD_SIZE, 
      nextCreatureId, 
      speciesCount 
    } = params;
    
    this.world = world;
    this.scene = scene;
    
    this.id = nextCreatureId;
    this.generation = generation;
    this.age = 0;
    this.energy = 100;
    this.alive = true;
    this.eaten = 0;
    this.mated = false;
    this.speciesId = null;
    this.speciesColor = Math.floor(Math.random() * 360);

    // Physics body
    this.body = null;
    this.meshes = [];
    this.limbBodies = [];
    this.constraints = [];

    // Movement control
    this.movementTimer = 0;
    this.targetDirection = new THREE.Vector3();
    this.currentDirection = new THREE.Vector3();
    this.lastDecisionTime = 0;
    this.targetFood = null;

    // Genes
    if (genes) {
      this.genes = { ...genes };
      this.speciesId = genes.speciesId || null;
    } else {
      this.genes = {
        // Basic attributes
        speed: Math.random(),
        strength: Math.random(),
        size: 0.3 + Math.random() * 0.7, // Ensure minimum size
        health: Math.random(),
        
        // Appearance
        color: Math.floor(Math.random() * 360),
        colorPattern: ["solid", "striped", "spotted", "gradient"][Math.floor(Math.random() * 4)],
        patternIntensity: Math.random(),
        
        // Body structure
        symmetry: ["radial", "bilateral", "asymmetric", "segmented"][Math.floor(Math.random() * 4)],
        segmentCount: Math.floor(2 + Math.random() * 5), // For segmented bodies
        limbs: Math.floor(2 + Math.random() * 8),
        bodyShape: ["blocky", "slender", "spherical", "elongated", "flattened", "spiked", "amorphous", "composite"][
          Math.floor(Math.random() * 8)
        ],
        
        // Special features
        hasShell: Math.random() > 0.7,
        shellThickness: Math.random(),
        hasSensors: Math.random() > 0.6,
        sensorSize: Math.random(),
        hasSpikes: Math.random() > 0.8,
        spikeLength: Math.random(),
        
        // Limb specialization
        limbType: ["generic", "grasping", "swimming", "jumping", "climbing", "digging"][
          Math.floor(Math.random() * 6)
        ],
        limbLength: 0.5 + Math.random() * 1.5,
        limbThickness: 0.3 + Math.random() * 0.7,
        
        // Behavior and ecology
        behavior: Math.random() * 2 - 1, // -1 to 1 (passive to aggressive)
        metabolism: 0.5 + Math.random() * 0.5, // Energy consumption rate
        senseRange: 0.5 + Math.random() * 0.5, // How far they can sense food/mates
        dietType: ["herbivore", "carnivore", "omnivore"][Math.floor(Math.random() * 3)],
        environmentalPreference: ["land", "water", "air", "subterranean"][Math.floor(Math.random() * 4)],
        
        // Learning and adaptation
        adaptability: Math.random(), // How quickly it can adapt to new environments
        memory: Math.random(), // How well it remembers successful strategies
        
        // Environmental adaptations
        temperatureResistance: Math.random(), // Resistance to extreme temperatures
        waterAdaptation: Math.random(), // Ability to move in water
        terrainAdaptation: Math.random(), // Ability to navigate difficult terrain
        camouflage: Math.random(), // Ability to hide from predators
        toxinResistance: Math.random(), // Resistance to environmental toxins
        
        // Evolution traits
        mutationSusceptibility: Math.random(), // How likely genes are to mutate
        hybridVigor: Math.random() // Benefit from genetic diversity in parents
      };

      // Assign species ID only to first generation creatures
      if (generation === 0) {
        this.speciesId = speciesCount;
      }
    }

    // Calculate initial fitness
    this.calculateFitness();

    // Create physics and visual representation
    this.createPhysicsBody();
    this.createVisualRepresentation();
  }

  createPhysicsBody() {
    // Main body physics
    const bodySize = 0.5 + this.genes.size * 1.5; // 0.5 to 2 meters

    this.body = new CANNON.Body({
      mass: 5 * this.genes.size * this.genes.strength,
      position: new CANNON.Vec3(
        (Math.random() - 0.5) * this.constructor.WORLD_SIZE * 0.8,
        this.constructor.WORLD_SIZE / 4,
        (Math.random() - 0.5) * this.constructor.WORLD_SIZE * 0.8
      ),
      shape: new CANNON.Sphere(bodySize * 0.5),
      linearDamping: 0.5,
      angularDamping: 0.7,
      material: new CANNON.Material({ friction: 0.3, restitution: 0.3 })
    });

    this.body.creature = this; // Reference back to creature
    this.world.addBody(this.body);

    // Add limbs based on symmetry
    const limbRadius = bodySize * 0.15;
    const limbLength = bodySize * 0.7;
    const limbMass = 0.5 * this.genes.size * this.genes.strength;

    if (this.genes.symmetry === "radial") {
      // Radial symmetry - limbs arranged in a circle
      const angleIncrement = (2 * Math.PI) / this.genes.limbs;

      for (let i = 0; i < this.genes.limbs; i++) {
        const angle = i * angleIncrement;
        const dx = Math.cos(angle) * (bodySize / 2 + limbLength / 2);
        const dz = Math.sin(angle) * (bodySize / 2 + limbLength / 2);

        const limbBody = new CANNON.Body({
          mass: limbMass,
          position: new CANNON.Vec3(dx, 0, dz),
          shape: new CANNON.Box(
            new CANNON.Vec3(limbRadius, limbLength / 2, limbRadius)
          ),
          material: new CANNON.Material({ friction: 0.4, restitution: 0.2 })
        });

        // Position relative to main body
        limbBody.position.vadd(this.body.position, limbBody.position);

        // Add constraint (joint) to main body
        const constraint = new CANNON.PointToPointConstraint(
          this.body,
          new CANNON.Vec3(dx, 0, dz),
          limbBody,
          new CANNON.Vec3(0, -limbLength / 2, 0)
        );

        this.world.addBody(limbBody);
        this.world.addConstraint(constraint);

        this.limbBodies.push(limbBody);
        this.constraints.push(constraint);
      }
    } else {
      // Bilateral symmetry - pairs of limbs on sides
      const limbsPerSide = Math.ceil(this.genes.limbs / 2);
      const yOffset = (bodySize * 0.7) / (limbsPerSide + 1);

      for (let side = 0; side < 2; side++) {
        const xOffset =
          side === 0
            ? -(bodySize / 2 + limbLength / 2)
            : bodySize / 2 + limbLength / 2;

        for (let i = 0; i < limbsPerSide; i++) {
          if (this.limbBodies.length >= this.genes.limbs) break;

          const yPos = -bodySize / 2 + (i + 1) * yOffset;

          const limbBody = new CANNON.Body({
            mass: limbMass,
            position: new CANNON.Vec3(xOffset, yPos, 0),
            shape: new CANNON.Box(
              new CANNON.Vec3(limbLength / 2, limbRadius, limbRadius)
            ),
            material: new CANNON.Material({ friction: 0.4, restitution: 0.2 })
          });

          // Position relative to main body
          limbBody.position.vadd(this.body.position, limbBody.position);

          // Add constraint (joint) to main body
          const constraint = new CANNON.PointToPointConstraint(
            this.body,
            new CANNON.Vec3(
              xOffset > 0 ? bodySize / 2 : -bodySize / 2,
              yPos,
              0
            ),
            limbBody,
            new CANNON.Vec3(0, 0, 0)
          );

          this.world.addBody(limbBody);
          this.world.addConstraint(constraint);

          this.limbBodies.push(limbBody);
          this.constraints.push(constraint);
        }
      }
    }
  }

  createVisualRepresentation() {
    const bodyColor = new THREE.Color(`hsl(${this.genes.color}, 60%, 50%)`);
    const limbColor = new THREE.Color(
      `hsl(${(this.genes.color + 30) % 360}, 60%, 50%)`
    );

    // Main body
    const bodySize = 0.5 + this.genes.size * 1.5;
    let bodyGeometry;

    switch (this.genes.bodyShape) {
      case "slender":
        bodyGeometry = new THREE.BoxGeometry(
          bodySize * 0.6,
          bodySize * 1.4,
          bodySize * 0.6
        );
        break;
      case "spherical":
        bodyGeometry = new THREE.SphereGeometry(bodySize * 0.5, 12, 12);
        break;
      case "elongated":
        bodyGeometry = new THREE.BoxGeometry(
          bodySize * 1.5,
          bodySize * 0.6,
          bodySize * 0.6
        );
        break;
      default:
        // 'blocky'
        bodyGeometry = new THREE.BoxGeometry(bodySize, bodySize, bodySize);
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.7,
      metalness: 0.1
    });

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.creature = this; // Reference back to creature

    if (this.genes.bodyShape === "spherical") {
      bodyMesh.position.copy(this.body.position);
    } else {
      bodyMesh.position.copy(this.body.position);
    }

    this.meshes.push(bodyMesh);
    this.scene.add(bodyMesh);

    // Limbs
    const limbRadius = bodySize * 0.15;
    const limbLength = bodySize * 0.7;

    this.limbBodies.forEach((limbBody, i) => {
      let limbGeometry;

      if (this.genes.symmetry === "radial") {
        limbGeometry = new THREE.CylinderGeometry(
          limbRadius,
          limbRadius,
          limbLength,
          8
        );
      } else {
        limbGeometry = new THREE.BoxGeometry(
          limbLength,
          limbRadius * 2,
          limbRadius * 2
        );
      }

      const limbMaterial = new THREE.MeshStandardMaterial({
        color: limbColor,
        roughness: 0.7,
        metalness: 0.1
      });

      const limbMesh = new THREE.Mesh(limbGeometry, limbMaterial);
      limbMesh.castShadow = true;
      limbMesh.receiveShadow = true;

      if (this.genes.symmetry === "radial") {
        limbMesh.rotation.x = Math.PI / 2;
      }

      this.meshes.push(limbMesh);
      this.scene.add(limbMesh);
    });

    // Eyes
    if (Math.random() > 0.3) {
      const eyeSize = bodySize * 0.1;
      const eyeGeometry = new THREE.SphereGeometry(eyeSize, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

      for (let i = 0; i < 2; i++) {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const pupil = new THREE.Mesh(
          new THREE.SphereGeometry(eyeSize * 0.6, 8, 8),
          pupilMaterial
        );
        pupil.position.set(0, 0, eyeSize * 0.4);

        // Position eyes based on symmetry
        if (this.genes.symmetry === "radial") {
          eye.position.set(
            (i === 0 ? -1 : 1) * bodySize * 0.3,
            bodySize * 0.4,
            -bodySize * 0.2
          );
        } else {
          eye.position.set(
            (i === 0 ? -1 : 1) * bodySize * 0.2,
            bodySize * 0.3,
            -bodySize * 0.3
          );
        }

        eye.add(pupil);
        bodyMesh.add(eye);
        this.meshes.push(eye, pupil);
      }
    }
  }

  updateVisualRepresentation() {
    if (this.meshes.length === 0 || !this.body) return;

    // Update main body mesh
    this.meshes[0].position.copy(this.body.position);
    this.meshes[0].quaternion.copy(this.body.quaternion);

    // Update limb meshes
    this.limbBodies.forEach((limb, i) => {
      if (this.meshes[i + 1]) {
        this.meshes[i + 1].position.copy(limb.position);
        this.meshes[i + 1].quaternion.copy(limb.quaternion);
      }
    });
  }

  makeDecision(time) {
    if (time - this.lastDecisionTime < 1) return; // Only make decisions every second

    this.lastDecisionTime = time;

    // Age and energy consumption - adjusted by metabolism and environment
    this.age++;
    this.energy -= 0.2 * this.genes.metabolism;
    
    // Apply environmental energy drain
    if (this.environmentalEnergyDrain) {
      this.energy -= this.environmentalEnergyDrain;
    }

    if (this.energy <= 0) {
      this.alive = false;
      return;
    }

    // Random chance to change direction, influenced by memory
    const directionChangeChance = 0.3 * (1 - this.genes.memory * 0.5);
    if (Math.random() < directionChangeChance) {
      this.targetDirection
        .set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1)
        .normalize();
    }

    // Look for nearby food - more actively if energy is low
    const foodSearchThreshold = this.genes.metabolism > 0.7 ? 80 : 70;
    if (this.energy < foodSearchThreshold || Math.random() < 0.5) {
      this.findFood();
    }

    // If we have a target food, move toward it
    if (this.targetFood) {
      const direction = new CANNON.Vec3(
        this.targetFood.body.position.x - this.body.position.x,
        0,
        this.targetFood.body.position.z - this.body.position.z
      ).unit();

      this.targetDirection.set(direction.x, 0, direction.z);
    }

    // Chance to mate if energy is high and not already mated
    // Higher chance if population has low diversity (from parent simulation data)
    const mateEnergyThreshold = 70;
    const baseMateProbability = 0.1;
    const populationDiversityBonus = this.lowPopulationDiversity ? 0.1 : 0;
    
    if (this.energy > mateEnergyThreshold && !this.mated &&
        Math.random() < (baseMateProbability + populationDiversityBonus)) {
      this.findMate();
    }
    
    // Check for environmental adaptation opportunities
    this.checkEnvironmentalAdaptation();
  }
  
  // New method: Environmental adaptation
  checkEnvironmentalAdaptation() {
    // If creature has high adaptability, occasionally adjust genes to current environment
    if (Math.random() < this.genes.adaptability * 0.01) {
      // Small chance to adapt a trait to current environment
      const currentEnvironment = this.currentEnvironmentType || "plains";
      
      switch (currentEnvironment) {
        case "ocean":
          if (this.genes.waterAdaptation < 0.8) {
            this.genes.waterAdaptation += 0.01;
          }
          break;
        case "desert":
          if (this.genes.temperatureResistance < 0.8) {
            this.genes.temperatureResistance += 0.01;
          }
          break;
        case "mountains":
          if (this.genes.terrainAdaptation < 0.8) {
            this.genes.terrainAdaptation += 0.01;
          }
          break;
        case "predators":
          if (this.genes.camouflage < 0.8) {
            this.genes.camouflage += 0.01;
          }
          break;
      }
      
      // Apply the adaptation visually in rare cases
      if (Math.random() < 0.1) {
        this.applyAdaptationVisual(currentEnvironment);
      }
    }
  }
  
  // Visual adaptation to environment
  applyAdaptationVisual(environmentType) {
    if (!this.meshes.length || !this.meshes[0]) return;
    
    // Get the main body mesh
    const bodyMesh = this.meshes[0];
    const material = bodyMesh.material;
    
    // Adjust color based on environment for camouflage
    switch (environmentType) {
      case "desert":
        // Shift color toward sandy/tan
        this.genes.color = Math.max(30, Math.min(60, this.genes.color));
        material.color.setHSL(this.genes.color/360, 0.4, 0.6);
        break;
      case "forest":
        // Shift color toward green
        this.genes.color = Math.max(90, Math.min(150, this.genes.color));
        material.color.setHSL(this.genes.color/360, 0.6, 0.4);
        break;
      case "ocean":
        // Shift color toward blue
        this.genes.color = Math.max(180, Math.min(240, this.genes.color));
        material.color.setHSL(this.genes.color/360, 0.7, 0.5);
        break;
      case "mountains":
        // Shift color toward gray
        material.color.setHSL(0, 0, 0.5);
        break;
    }
  }

  findFood(foods) {
    if (!foods || foods.length === 0) return;
    
    let closestFood = null;
    let closestDistance = Infinity;
    let bestFoodValue = 0;
    const senseRange = 5 + this.genes.senseRange * 10;
    
    // Increase sense range for creatures with sensors
    const effectiveSenseRange = this.genes.hasSensors ?
      senseRange * (1 + this.genes.sensorSize) : senseRange;

    foods.forEach((food) => {
      if (!food.alive) return;
      
      const distance = this.body.position.distanceTo(food.body.position);
      if (distance < effectiveSenseRange) {
        // Consider both distance and food type
        const dietPreference = this.getDietPreferenceForFood(food);
        const foodValue = food.nutritionalValue * dietPreference;
        
        // Food quality/distance calculation - prefer better food that's not too far
        const qualityDistanceRatio = foodValue / (Math.max(1, distance) * 0.5);
        
        if (qualityDistanceRatio > bestFoodValue) {
          bestFoodValue = qualityDistanceRatio;
          closestDistance = distance;
          closestFood = food;
        }
      }
    });

    this.targetFood = closestFood;
  }
  
  // Calculate diet preference based on food type
  getDietPreferenceForFood(food) {
    if (!food.foodType) return 1.0; // Default if no type specified
    
    switch (this.genes.dietType) {
      case "herbivore":
        if (food.foodType === "plant") return 1.5;
        if (food.foodType === "fruit") return 1.3;
        return 0.5; // Less preference for meat
        
      case "carnivore":
        if (food.foodType === "meat") return 1.5;
        return 0.6; // Less preference for plants
        
      case "omnivore":
        return 1.0; // Equal preference for all food types
        
      default:
        return 1.0;
    }
  }

  findMate(creatures) {
    let closestMate = null;
    let closestDistance = 10; // Only look for mates within 10 meters

    creatures.forEach((creature) => {
      if (
        creature.id !== this.id &&
        creature.energy > 70 &&
        !creature.mated
      ) {
        const distance = this.body.position.distanceTo(
          creature.body.position
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMate = creature;
        }
      }
    });

    if (closestMate && Math.random() < 0.7) {
      // 70% chance to mate if found
      this.mateWith(closestMate);
    }
  }

  mateWith(mate, mutationRate, callbacks = {}) {
    if (this.mated || mate.mated) return;

    const { onBreed, onRenderPopulation, onSelectCreature } = callbacks;
    
    const child = this.breedWith(mate, mutationRate);

    // Mark both parents as mated
    this.mated = true;
    mate.mated = true;

    // Call callbacks if provided
    if (onBreed) onBreed(child);
    
    // Update UI in next frame
    setTimeout(() => {
      if (onRenderPopulation) onRenderPopulation();
      if (onSelectCreature && this.isSelected) {
        onSelectCreature(child);
      }
    }, 0);
    
    return child;
  }

  move(time) {
    if (!this.alive) return;

    // Apply movement forces
    const speed = 5 + this.genes.speed * 15;

    // Dampen existing velocity
    this.body.velocity.x *= 0.9;
    this.body.velocity.z *= 0.9;

    // Apply new force in target direction scaled by speed
    const force = new CANNON.Vec3(
      this.targetDirection.x * speed,
      0,
      this.targetDirection.z * speed
    );

    this.body.applyForce(force, this.body.position);

    // Animate limbs if time is available
    if (time && this.limbBodies.length > 0) {
      const cycle = Math.sin(time * 5 * this.genes.speed) * 0.5;

      this.limbBodies.forEach((limb, i) => {
        // For radial limbs
        if (this.genes.symmetry === "radial") {
          const angleOffset = (i / this.limbBodies.length) * Math.PI * 2;
          const swing =
            Math.sin(time * 5 * this.genes.speed + angleOffset) * 0.2;

          // Apply force to swing limbs
          const swingForce = new CANNON.Vec3(
            this.targetDirection.x * swing * speed * 0.5,
            0,
            this.targetDirection.z * swing * speed * 0.5
          );

          limb.applyForce(swingForce, limb.position);
        } else {
          // For bilateral limbs
          const phase = i % 2 === 0 ? 0 : Math.PI;
          const swing = Math.sin(time * 5 * this.genes.speed + phase) * 0.2;

          // Apply force to swing limbs forward/back
          const swingForce = new CANNON.Vec3(
            this.targetDirection.x * swing * speed,
            0,
            this.targetDirection.z * swing * speed
          );

          limb.applyForce(swingForce, limb.position);
        }
      });
    }
  }

  checkForCollisions() {
    if (!this.alive) return;

    // Check for food collisions
    if (!this.targetFood || !this.targetFood.alive) {
      this.targetFood = null;
      return;
    }

    const distance = this.body.position.distanceTo(
      this.targetFood.body.position
    );
    const collisionDistance = 1 + this.genes.size;

    if (distance < collisionDistance) {
      this.eat(this.targetFood);
      this.targetFood = null;
    }
  }

  eat(food, FOOD_ENERGY, callbacks = {}) {
    if (!food.alive) return;

    const { onUpdateFoodCount, onRemoveFood } = callbacks;

    // Consume the food
    this.energy += FOOD_ENERGY * this.genes.health;
    this.energy = Math.min(100, this.energy);
    this.eaten++;
    food.alive = false;

    // Remove food from world and scene
    this.world.removeBody(food.body);
    this.scene.remove(food.mesh);

    // Call callbacks if provided
    if (onRemoveFood) onRemoveFood(food);
    if (onUpdateFoodCount) onUpdateFoodCount();
  }

  calculateFitness(environmentType = "plains") {
    // Store current environment for adaptation purposes
    this.currentEnvironmentType = environmentType;
    
    // Base fitness on energy, age, and eaten food
    const survivalFitness = (this.age / 100) * 0.2;
    const energyFitness = (this.energy / 100) * 0.3;
    const foodFitness = Math.min(1, this.eaten / 20);

    // Environment-specific adaptations
    let environmentalFitness = 0;

    switch (environmentType) {
      case "plains":
        environmentalFitness =
          this.genes.speed * 0.2 +
          this.genes.health * 0.1 +
          (this.genes.environmentalPreference === "land" ? 0.1 : 0);
        break;
        
      case "ocean":
        environmentalFitness =
          this.genes.speed * 0.2 +
          this.genes.waterAdaptation * 0.3 -
          this.genes.size * 0.1 +
          (this.genes.limbType === "swimming" ? 0.2 : 0) +
          (this.genes.environmentalPreference === "water" ? 0.15 : 0);
        break;
        
      case "mountains":
        environmentalFitness =
          this.genes.strength * 0.25 +
          this.genes.terrainAdaptation * 0.2 +
          (this.genes.limbType === "climbing" ? 0.2 : 0) +
          (this.genes.bodyShape === "slender" ? 0.1 : 0);
        break;
        
      case "desert":
        environmentalFitness =
          this.genes.health * 0.2 +
          this.genes.temperatureResistance * 0.3 -
          this.genes.metabolism * 0.2 + // Lower metabolism is better in desert
          (this.genes.waterAdaptation < 0.3 ? 0.1 : 0); // Desert-adapted creatures
        break;
        
      case "forest":
        const colorFitness = 1 - Math.abs(this.genes.color - 120) / 360; // Green is good
        environmentalFitness =
          colorFitness * 0.2 +
          this.genes.size * 0.1 +
          this.genes.camouflage * 0.2 +
          (this.genes.limbType === "climbing" ? 0.15 : 0);
        break;
        
      case "predators":
        // Higher aggression is better in predator-rich environments
        environmentalFitness =
          (this.genes.behavior + 1) * 0.15 + // More aggressive is better
          this.genes.speed * 0.15 +
          this.genes.camouflage * 0.2 +
          (this.genes.hasShell ? this.genes.shellThickness * 0.15 : 0) +
          (this.genes.hasSpikes ? this.genes.spikeLength * 0.15 : 0);
        break;
    }

    // Special trait bonuses
    const specialTraitBonus = this.calculateSpecialTraitBonus(environmentType);

    // Combine fitness components
    this.fitness =
      survivalFitness +
      energyFitness +
      foodFitness * 0.5 +
      environmentalFitness +
      specialTraitBonus;

    // Ensure fitness is between 0 and 1
    this.fitness = Math.max(0, Math.min(1, this.fitness));
    return this.fitness;
  }
  
  // Calculate bonus from special traits
  calculateSpecialTraitBonus(environmentType) {
    let bonus = 0;
    
    // Adaptability provides a general bonus in all environments
    bonus += this.genes.adaptability * 0.05;
    
    // Specific environmental traits
    switch (environmentType) {
      case "ocean":
        if (this.genes.limbType === "swimming" && this.genes.waterAdaptation > 0.7) {
          bonus += 0.1; // Specialized water creature
        }
        break;
        
      case "mountains":
        if (this.genes.limbType === "climbing" && this.genes.terrainAdaptation > 0.7) {
          bonus += 0.1; // Specialized climbing creature
        }
        break;
        
      case "desert":
        if (this.genes.temperatureResistance > 0.8 && this.genes.metabolism < 0.3) {
          bonus += 0.15; // Desert specialist
        }
        break;
        
      case "predators":
        if ((this.genes.hasShell && this.genes.shellThickness > 0.7) ||
            (this.genes.hasSpikes && this.genes.spikeLength > 0.7)) {
          bonus += 0.1; // Defensive specialist
        }
        break;
    }
    
    // Evolutionary advantage from hybridization - more distantly related parents
    if (this.parentGeneticDistance && this.parentGeneticDistance > 0.4) {
      bonus += this.genes.hybridVigor * 0.1;
    }
    
    return bonus;
  }

  mutate(mutationRate) {
    const mutationFactor = mutationRate / 50; // Scale to 0.02 to 0.2

    for (const gene in this.genes) {
      if (gene === "symmetry" || gene === "bodyShape") {
        // For discrete traits, chance to flip to another value
        if (Math.random() < mutationFactor * 0.5) {
          if (gene === "symmetry") {
            this.genes.symmetry =
              this.genes.symmetry === "radial" ? "bilateral" : "radial";
          } else {
            const shapes = ["blocky", "slender", "spherical", "elongated"];
            this.genes.bodyShape =
              shapes[Math.floor(Math.random() * shapes.length)];
          }
        }
      } else if (gene === "limbs") {
        // Limbs can change by +- 1 or 2 with mutation
        if (Math.random() < mutationFactor) {
          this.genes.limbs = Math.max(
            2,
            this.genes.limbs + (Math.random() < 0.5 ? -1 : 1)
          );
        }
      } else {
        // For continuous traits, add or subtract small amount
        if (Math.random() < mutationFactor) {
          const change = (Math.random() - 0.5) * 0.3 * mutationFactor;
          this.genes[gene] = Math.max(
            0,
            Math.min(1, this.genes[gene] + change)
          );
        }
      }
    }

    // After mutation, recalculate fitness
    this.calculateFitness();

    // If body changed significantly, recreate physics and visuals
    if (Math.random() < mutationFactor * 0.5) {
      this.recreatePhysicsAndVisuals();
    }
  }

  recreatePhysicsAndVisuals() {
    // Remove old physics bodies and constraints
    this.removePhysicsBodies();

    // Remove old meshes
    this.meshes.forEach((mesh) => this.scene.remove(mesh));
    this.meshes = [];

    // Create new physics and visual representation
    this.createPhysicsBody();
    this.createVisualRepresentation();
  }

  removePhysicsBodies() {
    if (this.body) this.world.removeBody(this.body);

    this.limbBodies.forEach((limb) => {
      if (limb) this.world.removeBody(limb);
    });

    this.constraints.forEach((constraint) => {
      if (constraint) this.world.removeConstraint(constraint);
    });

    this.limbBodies = [];
    this.constraints = [];
  }

  breedWith(partner, mutationRate) {
    // Calculate genetic distance between parents
    const geneticDistance = this.calculateGeneticDistance(partner);
    
    // Sexual recombination
    const childGenes = {};

    for (const gene in this.genes) {
      if (gene === "symmetry" || gene === "bodyShape" || gene === "limbType" || gene === "dietType" || gene === "environmentalPreference") {
        // Discrete traits - 50/50 chance from either parent
        childGenes[gene] =
          Math.random() < 0.5 ? this.genes[gene] : partner.genes[gene];
      } else {
        // Continuous traits - blend of both parents with bias toward fitter parent
        const parentFitnessDiff = this.fitness - partner.fitness;
        const parentBias = 0.5 + (parentFitnessDiff * 0.2); // 0.3 to 0.7 range
        
        // Weighted average based on fitness
        childGenes[gene] = (this.genes[gene] * parentBias) +
                          (partner.genes[gene] * (1 - parentBias));
                          
        // Add small random variation
        childGenes[gene] += (Math.random() - 0.5) * 0.1;
        
        // Ensure values stay in range
        childGenes[gene] = Math.max(0, Math.min(1, childGenes[gene]));
      }
    }

    // Inherit species from more fit parent
    const parent1Fitness = this.fitness;
    const parent2Fitness = partner.fitness;

    childGenes.speciesId =
      parent1Fitness > parent2Fitness ? this.speciesId : partner.speciesId;
      
    // Small chance of speciation if parents are genetically distant
    if (geneticDistance > 0.5 && Math.random() < 0.1) {
      // New species
      childGenes.speciesId = null; // Will be assigned in constructor
    }

    // Create child with combined genes
    const child = new VoxelCreature(
      childGenes,
      Math.max(this.generation, partner.generation) + 1,
      {
        world: this.world,
        scene: this.scene,
        WORLD_SIZE: this.constructor.WORLD_SIZE,
        nextCreatureId: this.constructor.nextCreatureId++,
        speciesCount: 0 // Not creating a new species
      }
    );
    
    // Store parent genetic distance for hybrid vigor calculation
    child.parentGeneticDistance = geneticDistance;

    // Apply mutations - with adjusted rate for some genes
    child.mutate(mutationRate);
    
    // If parents are well-adapted to different environments, boost adaptability
    if (this.currentEnvironmentType !== partner.currentEnvironmentType) {
      child.genes.adaptability = Math.min(1, child.genes.adaptability * 1.2);
    }

    return child;
  }
  
  // Calculate genetic distance between this creature and another
  calculateGeneticDistance(other) {
    let totalDifference = 0;
    let geneCount = 0;
    
    // Only use continuous genes for distance calculation
    for (const gene in this.genes) {
      if (typeof this.genes[gene] === 'number') {
        totalDifference += Math.abs(this.genes[gene] - other.genes[gene]);
        geneCount++;
      }
    }
    
    return totalDifference / geneCount;
  }

  getSpecialization() {
    const traits = {
      speed: this.genes.speed,
      strength: this.genes.strength,
      size: this.genes.size,
      health: this.genes.health,
      behavior: this.genes.behavior
    };

    const maxTrait = Object.keys(traits).reduce((a, b) =>
      traits[a] > traits[b] ? a : b
    );
    const minTrait = Object.keys(traits).reduce((a, b) =>
      traits[a] < traits[b] ? a : b
    );

    const specializationScore = traits[maxTrait] - traits[minTrait];

    if (specializationScore > 0.4) {
      return {
        trait: maxTrait,
        score: specializationScore
      };
    } else {
      return {
        trait: "generalist",
        score: specializationScore
      };
    }
  }

  // Static properties to be set by the simulation
  static WORLD_SIZE = 30;
  static nextCreatureId = 0;
}

export default VoxelCreature;