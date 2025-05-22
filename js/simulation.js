// Simulation.js - Handles physics world and simulation mechanics

class Simulation {
  constructor(config = {}) {
    // Constants and settings
    this.WORLD_SIZE = config.worldSize || 30;
    this.FOOD_SIZE = config.foodSize || 1;
    this.FOOD_ENERGY = config.foodEnergy || 50;
    this.MAX_FOOD = config.maxFood || 30;
    
    // Physics parameters
    this.PHYSICS_STEP = 1 / 60;
    this.SUBSTEPS = config.physicsAccuracy || 3;
    
    // Simulation state
    this.world = null; // Cannon.js physics world
    this.scene = null; // Three.js scene
    this.camera = null; // Three.js camera
    this.renderer = null; // Three.js renderer
    this.creatures = [];
    this.foods = [];
    this.obstacles = []; // Environmental obstacles
    this.currentGeneration = 0;
    this.simulationRunning = false;
    this.lastTime = 0;
    this.selectedCreature = null;
    this.followedCreature = null;
    this.fitnessHistory = [];
    this.environmentType = config.environmentType || "plains";
    this.nextCreatureId = 0;
    this.speciesCount = 0;
    
    // Environmental factors
    this.environmentSettings = {
      terrain: config.terrain || "flat",
      temperature: config.temperature || "moderate",
      foodDistribution: config.foodDistribution || "uniform",
      predatorPressure: config.predatorPressure || "low",
      mutationStimulus: config.mutationStimulus || 1.0,
      competitionIntensity: config.competitionIntensity || 1.0
    };
    
    // Time-based dynamics
    this.environmentCycleTime = 0;
    this.environmentCycleDirection = 1;
    this.environmentCyclePeriod = 5000; // ms
    this.seasonalChanges = config.seasonalChanges || false;
    
    // Callbacks for UI updates
    this.callbacks = {
      onGenerationChange: config.onGenerationChange || (() => {}),
      onFitnessUpdate: config.onFitnessUpdate || (() => {}),
      onFoodCountUpdate: config.onFoodCountUpdate || (() => {}),
      onPopulationRender: config.onPopulationRender || (() => {}),
      onCreatureSelect: config.onCreatureSelect || (() => {}),
      onChartUpdate: config.onChartUpdate || (() => {})
    };
  }
  
  // Initialize physics world and Three.js scene
  initPhysicsWorld(container) {
    // Setup Cannon.js physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0); // Earth gravity
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // Create ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.world.addBody(groundBody);

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a202c);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.offsetWidth / container.offsetHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 30);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(this.WORLD_SIZE, this.WORLD_SIZE / 2);
    this.scene.add(gridHelper);

    // Add world bounds
    this.addWorldBounds();
    
    // Pass necessary static values to creature class
    import('./entities/VoxelCreature.js').then(VoxelCreatureModule => {
      VoxelCreatureModule.default.WORLD_SIZE = this.WORLD_SIZE;
      VoxelCreatureModule.default.nextCreatureId = this.nextCreatureId;
    });
  }

  // Add physical boundaries to world
  addWorldBounds() {
    // Create invisible walls around the world
    const wallMaterial = new CANNON.Material({
      friction: 0.3,
      restitution: 0.7
    });
    const wallShape = new CANNON.Box(new CANNON.Vec3(this.WORLD_SIZE / 2, 10, 1));

    // North wall
    const northWall = new CANNON.Body({ mass: 0 });
    northWall.addShape(wallShape);
    northWall.position.set(0, 5, -this.WORLD_SIZE / 2);
    this.world.addBody(northWall);

    // South wall
    const southWall = new CANNON.Body({ mass: 0 });
    southWall.addShape(wallShape);
    southWall.position.set(0, 5, this.WORLD_SIZE / 2);
    this.world.addBody(southWall);

    // West wall
    const westWall = new CANNON.Body({ mass: 0 });
    westWall.addShape(new CANNON.Box(new CANNON.Vec3(1, 10, this.WORLD_SIZE / 2)));
    westWall.position.set(-this.WORLD_SIZE / 2, 5, 0);
    this.world.addBody(westWall);

    // East wall
    const eastWall = new CANNON.Body({ mass: 0 });
    eastWall.addShape(new CANNON.Box(new CANNON.Vec3(1, 10, this.WORLD_SIZE / 2)));
    eastWall.position.set(this.WORLD_SIZE / 2, 5, 0);
    this.world.addBody(eastWall);
  }

  // Start the animation loop
  startAnimation() {
    const animate = (time) => {
      requestAnimationFrame(animate);
      
      // Update physics
      this.updatePhysics(time);
      
      // Update camera to follow creature
      if (this.followedCreature && this.followedCreature.body) {
        this.camera.position.lerp(
          new THREE.Vector3(
            this.followedCreature.body.position.x,
            this.followedCreature.body.position.y + 10,
            this.followedCreature.body.position.z + 20
          ),
          0.1
        );
        this.camera.lookAt(
          new THREE.Vector3(
            this.followedCreature.body.position.x,
            this.followedCreature.body.position.y + 5,
            this.followedCreature.body.position.z
          )
        );
      }
      
      // Render scene
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  // Update physics simulation
  updatePhysics(time) {
    if (!this.simulationRunning) return;
    
    // Update environment cycle time
    if (this.seasonalChanges) {
      this.environmentCycleTime += this.environmentCycleDirection;
      
      // Reverse direction at extremes
      if (this.environmentCycleTime >= this.environmentCyclePeriod ||
          this.environmentCycleTime <= 0) {
        this.environmentCycleDirection *= -1;
        
        // When cycle completes, possibly change environment factors
        if (this.environmentCycleTime >= this.environmentCyclePeriod) {
          if (Math.random() < 0.2) {
            this.applySeasonalEffect();
          }
        }
      }
    }
    
    // Spawn food periodically - adjusted by environment
    const foodSpawnRate = this.getFoodSpawnRate();
    if (this.foods.length < this.getMaxFoodCount() && Math.random() < foodSpawnRate) {
      this.spawnFood();
    }
    
    // Apply environmental effects to creatures
    this.applyEnvironmentalEffects();
    
    // Update creatures
    this.creatures.forEach((creature) => {
      if (creature.alive) {
        creature.makeDecision(time);
        creature.move(time);
        
        // Pass all foods to checkForCollisions for improved food finding
        creature.findFood(this.foods);
        creature.checkForCollisions();
        
        // Apply environment-specific effects to creature movement
        this.applyEnvironmentToCreature(creature, time);
        
        creature.updateVisualRepresentation();
        creature.calculateFitness(this.environmentType);
      }
    });
    
    // Update food visuals with animation
    this.foods.forEach((food) => {
      if (food.alive) {
        food.updateVisualRepresentation();
      }
    });
    
    // Update obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.mesh && obstacle.body) {
        obstacle.mesh.position.copy(obstacle.body.position);
        obstacle.mesh.quaternion.copy(obstacle.body.quaternion);
      }
    });
    
    // Step physics world
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    if (deltaTime > 0) {
      this.world.step(this.PHYSICS_STEP, deltaTime, this.SUBSTEPS);
    }
    
    // Remove dead creatures
    this.cleanupDeadCreatures();
    
    // Check if should advance generation
    this.checkGenerationAdvance();
  }

  // Spawn new food in the environment
  spawnFood() {
    if (this.foods.length >= this.getMaxFoodCount()) return;
    
    import('./entities/Food.js').then(FoodModule => {
      const Food = FoodModule.default;
      const food = new Food(this.world, this.scene, this.WORLD_SIZE, this.FOOD_SIZE);
      this.foods.push(food);
      this.callbacks.onFoodCountUpdate(this.foods.length);
      
      // Add additional food-related environmental effects
      if (this.environmentSettings.foodDistribution === "clustered") {
        // Clustered food distribution: spawn additional food nearby
        if (Math.random() < 0.3) {
          const clusterSize = Math.floor(Math.random() * 3) + 1;
          const clusterRadius = 3;
          
          for (let i = 0; i < clusterSize; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * clusterRadius;
            const offsetX = Math.cos(angle) * distance;
            const offsetZ = Math.sin(angle) * distance;
            
            const clusterFood = new Food(this.world, this.scene, this.WORLD_SIZE, this.FOOD_SIZE);
            
            // Position near original food
            clusterFood.body.position.x = food.body.position.x + offsetX;
            clusterFood.body.position.z = food.body.position.z + offsetZ;
            
            this.foods.push(clusterFood);
          }
          
          this.callbacks.onFoodCountUpdate(this.foods.length);
        }
      }
    });
  }

  // Get maximum allowed food based on settings
  getMaxFoodCount() {
    return Math.floor((this.MAX_FOOD * this.foodScale) / 10);
  }

  // Clean up dead creatures
  cleanupDeadCreatures() {
    const aliveCreatures = [];
    
    this.creatures.forEach((creature) => {
      if (creature.alive && creature.energy > 0) {
        aliveCreatures.push(creature);
      } else {
        // Remove physics bodies and visuals
        creature.removePhysicsBodies();
        creature.meshes.forEach((mesh) => this.scene.remove(mesh));
        
        // If this was the selected/followed creature, clear selection
        if (this.selectedCreature && this.selectedCreature.id === creature.id) {
          this.selectedCreature = null;
          this.callbacks.onCreatureSelect(null);
        }
        
        if (this.followedCreature && this.followedCreature.id === creature.id) {
          this.followedCreature = null;
        }
      }
    });
    
    this.creatures = aliveCreatures;
  }

  // Check if generation should advance
  checkGenerationAdvance() {
    // Advance generation when 80% of creatures have died
    const survivalThreshold = Math.max(3, this.creatures.length * 0.2);
    
    if (this.creatures.length <= survivalThreshold && this.simulationRunning) {
      this.nextGeneration();
    }
  }

  // Create the next generation of creatures
  nextGeneration() {
    // Evaluate fitness for all creatures in current environment
    this.creatures.forEach((creature) => creature.calculateFitness(this.environmentType));
    
    // Sort by fitness (descending)
    this.creatures.sort((a, b) => b.fitness - a.fitness);
    
    // Keep top performers (elitism) - environmental pressures affect selection rate
    const selectionPressure = this.getSelectionPressure();
    const keepCount = Math.max(3, Math.floor(this.creatures.length * selectionPressure));
    const nextGen = this.creatures.slice(0, keepCount);
    
    // Breed to fill population
    import('./entities/VoxelCreature.js').then(VoxelCreatureModule => {
      const VoxelCreature = VoxelCreatureModule.default;
      
      // Determine if any special breeding adaptations are needed
      const currentMutationRate = this.getAdjustedMutationRate();
      
      // Fill population - with occasional diversity boosts
      while (nextGen.length < this.populationSize) {
        // Special case: if too low diversity, create some random creatures
        if (this.checkLowDiversity() && Math.random() < 0.2) {
          // Add a fresh random creature to stimulate diversity
          const newRandomCreature = new VoxelCreature(null, this.currentGeneration, {
            world: this.world,
            scene: this.scene,
            WORLD_SIZE: this.WORLD_SIZE,
            nextCreatureId: this.nextCreatureId++,
            speciesCount: this.speciesCount++
          });
          nextGen.push(newRandomCreature);
        } else {
          // Select parents using fitness-proportionate selection
          const parent1 = this.selectParent();
          const parent2 = this.selectParent();
          
          if (parent1 && parent2) {
            // Apply environmental effects to mutation
            const child = parent1.breedWith(parent2, currentMutationRate);
            
            // For extreme environments, apply additional mutations
            if (this.isExtremeEnvironment() && Math.random() < 0.3) {
              child.mutate(currentMutationRate * 1.5);
            }
            
            nextGen.push(child);
          }
        }
      }
      
      // Reset mated status for new generation
      nextGen.forEach((creature) => (creature.mated = false));
      
      this.creatures = nextGen;
      this.currentGeneration++;
      
      // Change environment occasionally to force adaptation
      if (this.seasonalChanges && this.currentGeneration % 5 === 0) {
        this.cyclicEnvironmentChange();
      }
      
      this.callbacks.onGenerationChange(this.currentGeneration);
      this.callbacks.onPopulationRender();
      
      // Store fitness history
      const maxFitness = this.creatures[0]?.fitness || 0;
      this.fitnessHistory.push(maxFitness * 100);
      if (this.fitnessHistory.length > 15) {
        this.fitnessHistory.shift();
      }
      
      // Update fitness score
      this.callbacks.onFitnessUpdate(maxFitness);
      this.callbacks.onChartUpdate(this.fitnessHistory);
      
      // Show fittest creature
      if (this.creatures.length > 0) {
        this.selectCreature(this.creatures[0]);
      }
      
      // Spawn new food
      this.respawnFood();
      
      // Update obstacles and terrain features
      this.updateEnvironmentalObstacles();
    });
  }

  // Select parent based on fitness
  selectParent() {
    // Fitness proportionate selection
    const fitnessSum = this.creatures.reduce(
      (sum, creature) => sum + creature.fitness,
      0
    );
    const random = Math.random() * fitnessSum;
    let runningSum = 0;
    
    for (const creature of this.creatures) {
      runningSum += creature.fitness;
      if (runningSum >= random) {
        return creature;
      }
    }
    
    return this.creatures[0]; // fallback
  }

  // Respawn all food
  respawnFood() {
    // Remove all existing food
    this.foods.forEach((food) => {
      this.world.removeBody(food.body);
      this.scene.remove(food.mesh);
    });
    this.foods = [];
    
    // Spawn new food
    for (let i = 0; i < this.getMaxFoodCount(); i++) {
      this.spawnFood();
    }
  }

  // Initialize the simulation with creatures
  initSimulation(populationSize = 12) {
    this.clearPopulation();
    this.populationSize = populationSize;
    
    // Create initial population
    import('./entities/VoxelCreature.js').then(VoxelCreatureModule => {
      const VoxelCreature = VoxelCreatureModule.default;
      
      for (let i = 0; i < populationSize; i++) {
        const params = {
          world: this.world,
          scene: this.scene,
          WORLD_SIZE: this.WORLD_SIZE,
          nextCreatureId: this.nextCreatureId++,
          speciesCount: this.speciesCount++
        };
        
        this.creatures.push(new VoxelCreature(null, 0, params));
      }
      
      this.currentGeneration = 0;
      this.callbacks.onGenerationChange(this.currentGeneration);
      
      // Spawn initial food
      this.respawnFood();
      
      this.callbacks.onPopulationRender();
      this.callbacks.onChartUpdate(this.fitnessHistory);
      
      // Select a random creature
      if (this.creatures.length > 0) {
        this.selectCreature(this.creatures[Math.floor(Math.random() * this.creatures.length)]);
      }
    });
  }

  // Select a creature
  selectCreature(creature) {
    this.selectedCreature = creature;
    this.callbacks.onCreatureSelect(creature);
  }

  // Clear the population
  clearPopulation() {
    // Remove all creatures
    this.creatures.forEach((creature) => {
      creature.removePhysicsBodies();
      creature.meshes.forEach((mesh) => this.scene.remove(mesh));
    });
    
    this.creatures = [];
    this.foods = [];
    
    this.callbacks.onPopulationRender();
    this.selectedCreature = null;
    this.followedCreature = null;
    this.callbacks.onCreatureSelect(null);
    this.callbacks.onFitnessUpdate(0);
    this.fitnessHistory = [];
    this.callbacks.onChartUpdate(this.fitnessHistory);
    this.callbacks.onFoodCountUpdate(0);
  }

  // Set environment type
  setEnvironmentType(type) {
    this.environmentType = type;
    
    // Update environment appearance
    this.updateEnvironmentAppearance();
    
    // Recalculate all fitness scores
    this.creatures.forEach((creature) => creature.calculateFitness(this.environmentType));
    
    // Sort by new fitness
    this.creatures.sort((a, b) => b.fitness - a.fitness);
    
    // Update display if we have a selected creature
    if (this.selectedCreature) {
      this.callbacks.onCreatureSelect(this.selectedCreature);
    }
    
    this.callbacks.onPopulationRender();
    
    // Update environmental obstacles
    this.updateEnvironmentalObstacles();
  }

  // Set physics accuracy
  setPhysicsAccuracy(accuracy) {
    this.SUBSTEPS = accuracy;
  }

  // Set food amount
  setFoodAmount(scale) {
    this.foodScale = scale;
    
    // Adjust food to new amount
    while (this.foods.length > this.getMaxFoodCount()) {
      const food = this.foods.pop();
      if (food) {
        this.world.removeBody(food.body);
        this.scene.remove(food.mesh);
      }
    }
    
    this.callbacks.onFoodCountUpdate(this.foods.length);
  }

  // Set mutation rate
  setMutationRate(rate) {
    this.mutationRate = rate;
  }

  // Start simulation
  start() {
    this.simulationRunning = true;
    this.lastTime = performance.now();
  }

  // Pause simulation
  pause() {
    this.simulationRunning = false;
  }

  // Toggle follow mode for selected creature
  toggleFollowCreature() {
    if (!this.selectedCreature) return;
    
    if (this.followedCreature && this.followedCreature.id === this.selectedCreature.id) {
      this.followedCreature = null;
      return false;
    } else {
      this.followedCreature = this.selectedCreature;
      return true;
    }
  }

  // Breed selected creature with random mate
  breedSelectedCreature() {
    if (!this.selectedCreature || this.creatures.length < 2) return null;
    
    // Find a mate (not the same as selected)
    let mate;
    do {
      mate = this.creatures[Math.floor(Math.random() * this.creatures.length)];
    } while (mate.id === this.selectedCreature.id);
    
    const child = this.selectedCreature.breedWith(mate, this.mutationRate);
    
    // Add child to population
    this.creatures.push(child);
    
    // Select the new child
    this.selectCreature(child);
    this.callbacks.onPopulationRender();
    
    return child;
  }

  // Force mutate selected creature
  forceMutateCreature() {
    if (!this.selectedCreature) return false;
    
    const mutationRate = this.mutationRate * 2; // More intense for forced mutation
    this.selectedCreature.mutate(mutationRate);
    
    // Update display
    this.callbacks.onCreatureSelect(this.selectedCreature);
    this.callbacks.onPopulationRender();
    
    return true;
  }

  // Handle window resize
  handleResize(container) {
    if (this.renderer && this.camera) {
      this.camera.aspect = container.offsetWidth / container.offsetHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    }
  }
  
  // Get food spawn rate based on environment
  getFoodSpawnRate() {
    let baseRate = 0.05;
    
    // Adjust based on environment
    switch (this.environmentType) {
      case "plains":
        baseRate = 0.08; // More food in plains
        break;
      case "forest":
        baseRate = 0.07; // Slightly more food in forests
        break;
      case "desert":
        baseRate = 0.03; // Less food in desert
        break;
      case "predators":
        baseRate = 0.04; // Less food with predators
        break;
    }
    
    // Seasonal effects
    if (this.seasonalChanges) {
      // Calculate seasonal modifier (0.5 to 1.5)
      const seasonalMod = 1 + 0.5 * Math.sin(this.environmentCycleTime / this.environmentCyclePeriod * Math.PI * 2);
      baseRate *= seasonalMod;
    }
    
    return baseRate;
  }
  
  // Apply seasonal effects when cycle completes
  applySeasonalEffect() {
    const effects = [
      "drought", // Less food
      "abundance", // More food
      "cold", // Movement penalty
      "optimal", // Growth bonus
      "predation" // Higher danger
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    switch (effect) {
      case "drought":
        this.environmentSettings.foodDistribution = "sparse";
        break;
      case "abundance":
        this.environmentSettings.foodDistribution = "abundant";
        break;
      case "cold":
        this.environmentSettings.temperature = "cold";
        break;
      case "optimal":
        this.environmentSettings.temperature = "moderate";
        break;
      case "predation":
        this.environmentSettings.predatorPressure = "high";
        break;
    }
    
    // Notify of seasonal change
    if (this.callbacks.onSeasonalChange) {
      this.callbacks.onSeasonalChange(effect);
    }
  }
  
  // Apply environmental effects to creatures
  applyEnvironmentalEffects() {
    // Apply global effects to all creatures
    this.creatures.forEach(creature => {
      // Temperature effects
      if (this.environmentSettings.temperature === "extreme") {
        // Extreme temperatures drain energy faster
        if (Math.random() < 0.1) {
          creature.energy = Math.max(10, creature.energy - 1);
        }
        
        // Creatures with adaptations suffer less
        if (this.environmentType === "desert" && creature.genes.environmentalPreference === "land") {
          // Land creatures handle desert better
          creature.energy += 0.5;
        } else if (this.environmentType === "ocean" && creature.genes.environmentalPreference === "water") {
          // Water creatures thrive in ocean
          creature.energy += 0.5;
        }
      }
      
      // Predator pressure effects
      if (this.environmentSettings.predatorPressure === "high") {
        // Occasionally simulate predator attacks
        if (Math.random() < 0.005) {
          // Larger creatures are less vulnerable
          const escapeChance = creature.genes.size * 0.7 + creature.genes.speed * 0.3;
          
          if (Math.random() > escapeChance) {
            // Failed to escape - take damage
            creature.energy = Math.max(10, creature.energy - 20);
            
            // Visual feedback
            if (creature.meshes && creature.meshes[0]) {
              // Flash red to indicate damage
              const originalColor = creature.meshes[0].material.color.clone();
              creature.meshes[0].material.color.set(0xff0000);
              
              // Reset color after 300ms
              setTimeout(() => {
                if (creature.meshes && creature.meshes[0]) {
                  creature.meshes[0].material.color.copy(originalColor);
                }
              }, 300);
            }
          }
        }
      }
    });
  }
  
  // Apply environment-specific effects to creature movement
  applyEnvironmentToCreature(creature, time) {
    switch (this.environmentType) {
      case "ocean":
        // Buoyancy effect - reduced gravity
        creature.body.gravity.set(0, -4.9, 0);
        
        // Swimming creatures move faster in water
        if (creature.genes.limbType === "swimming") {
          creature.body.velocity.x *= 1.2;
          creature.body.velocity.z *= 1.2;
        } else {
          // Non-swimming creatures move slower in water
          creature.body.velocity.x *= 0.8;
          creature.body.velocity.z *= 0.8;
        }
        break;
        
      case "mountains":
        // Stronger gravity
        creature.body.gravity.set(0, -12, 0);
        
        // Climbing creatures are less affected
        if (creature.genes.limbType === "climbing") {
          creature.body.gravity.set(0, -9, 0);
        }
        break;
        
      case "desert":
        // Normal gravity but higher movement cost
        creature.body.gravity.set(0, -9.82, 0);
        
        // Creatures lose energy faster when moving in desert
        if (creature.body.velocity.length() > 2) {
          creature.energy -= 0.01;
        }
        break;
        
      default:
        // Reset to normal gravity
        creature.body.gravity.set(0, -9.82, 0);
    }
  }
  
  // Get selection pressure based on environment
  getSelectionPressure() {
    let pressure = 0.3; // Default - keep top 30%
    
    // Adjust based on environment type
    switch (this.environmentType) {
      case "desert":
      case "predators":
        pressure = 0.2; // Harsher environments - only top 20% survive
        break;
      case "plains":
      case "forest":
        pressure = 0.4; // More forgiving environments
        break;
    }
    
    // Further modify by competition intensity
    pressure *= (2 - this.environmentSettings.competitionIntensity);
    
    // Ensure reasonable bounds
    return Math.max(0.1, Math.min(0.5, pressure));
  }
  
  // Get adjusted mutation rate based on environmental factors
  getAdjustedMutationRate() {
    let rate = this.mutationRate;
    
    // Increase mutation rate in extreme environments
    if (this.isExtremeEnvironment()) {
      rate *= 1.5;
    }
    
    // Apply environmental mutation stimulus
    rate *= this.environmentSettings.mutationStimulus;
    
    // Generation-based adjustments (higher in early generations)
    if (this.currentGeneration < 5) {
      rate *= 1.2;
    }
    
    // Check if any creatures consumed minerals with evolution boost
    const hasEvolutionBoost = this.creatures.some(c => c.evolutionBoost);
    if (hasEvolutionBoost) {
      rate *= 1.3;
    }
    
    return rate;
  }
  
  // Determine if environment is extreme (high selection pressure)
  isExtremeEnvironment() {
    return this.environmentType === "desert" ||
           this.environmentType === "predators" ||
           this.environmentSettings.temperature === "extreme" ||
           this.environmentSettings.predatorPressure === "high";
  }
  
  // Check if population has low genetic diversity
  checkLowDiversity() {
    if (this.creatures.length < 2) return true;
    
    // Sample a few random gene pairs to check diversity
    const geneNames = ["speed", "strength", "size", "health", "behavior"];
    const sampleSize = Math.min(5, this.creatures.length);
    const samples = [];
    
    // Get random sample of creatures
    for (let i = 0; i < sampleSize; i++) {
      const randIndex = Math.floor(Math.random() * this.creatures.length);
      samples.push(this.creatures[randIndex]);
    }
    
    // Check genetic diversity
    let totalVariance = 0;
    
    for (const gene of geneNames) {
      const values = samples.map(c => c.genes[gene]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      
      // Calculate variance
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    }
    
    // If average variance is below threshold, diversity is low
    return (totalVariance / geneNames.length) < 0.05;
  }
  
  // Create cyclic environment changes
  cyclicEnvironmentChange() {
    const environments = ["plains", "forest", "ocean", "mountains", "desert"];
    const currentIndex = environments.indexOf(this.environmentType);
    
    // Move to next environment type (or cycle back to start)
    const nextIndex = (currentIndex + 1) % environments.length;
    this.setEnvironmentType(environments[nextIndex]);
    
    // Update UI with environment change notification
    if (this.callbacks.onEnvironmentChange) {
      this.callbacks.onEnvironmentChange(this.environmentType);
    }
  }
  
  // Add and update environmental obstacles
  updateEnvironmentalObstacles() {
    // Clear existing obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.body) this.world.removeBody(obstacle.body);
      if (obstacle.mesh) this.scene.remove(obstacle.mesh);
    });
    
    this.obstacles = [];
    
    // Skip if using flat terrain
    if (this.environmentSettings.terrain === "flat") return;
    
    // Number of obstacles based on terrain type
    let obstacleCount;
    switch (this.environmentSettings.terrain) {
      case "rocky":
        obstacleCount = 15;
        break;
      case "mountainous":
        obstacleCount = 25;
        break;
      case "hilly":
        obstacleCount = 10;
        break;
      default:
        obstacleCount = 5;
    }
    
    // Create obstacles
    for (let i = 0; i < obstacleCount; i++) {
      this.createObstacle();
    }
  }
  
  // Create a single obstacle
  createObstacle() {
    // Random position in world
    const position = new CANNON.Vec3(
      (Math.random() - 0.5) * this.WORLD_SIZE * 0.8,
      0.5,
      (Math.random() - 0.5) * this.WORLD_SIZE * 0.8
    );
    
    // Random size
    const size = 0.5 + Math.random() * 2;
    
    // Create physics body
    const shape = Math.random() > 0.5 ?
      new CANNON.Box(new CANNON.Vec3(size, size, size)) :
      new CANNON.Sphere(size);
    
    const body = new CANNON.Body({
      mass: 0, // Static obstacle
      position: position,
      shape: shape,
      material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
    });
    
    this.world.addBody(body);
    
    // Create visual representation
    let geometry;
    if (shape instanceof CANNON.Box) {
      geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
    } else {
      geometry = new THREE.SphereGeometry(size, 16, 16);
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: this.getObstacleColor(),
      roughness: 0.8,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(body.position);
    
    this.scene.add(mesh);
    
    // Store obstacle
    this.obstacles.push({ body, mesh });
  }
  
  // Get color based on environment
  getObstacleColor() {
    switch (this.environmentType) {
      case "plains":
        return 0x8B4513; // Brown
      case "forest":
        return 0x2E8B57; // Forest green
      case "ocean":
        return 0x5F9EA0; // Cadet blue
      case "mountains":
        return 0x808080; // Gray
      case "desert":
        return 0xF4A460; // Sandy brown
      default:
        return 0x808080; // Gray
    }
  }
  
  // Update the visual appearance of the environment
  updateEnvironmentAppearance() {
    // Change ground color based on environment type
    const groundColor = this.getGroundColor();
    
    // Update lighting based on environment
    this.updateEnvironmentLighting();
    
    // If we have a grid helper, update its colors
    if (this.scene && this.scene.children) {
      this.scene.children.forEach(child => {
        if (child instanceof THREE.GridHelper) {
          child.material.color.set(groundColor);
          child.material.vertexColors = false;
        }
      });
    }
    
    // Update scene background color
    if (this.scene) {
      switch (this.environmentType) {
        case "ocean":
          this.scene.background = new THREE.Color(0x1a3c6e); // Deep blue
          this.scene.fog = new THREE.Fog(0x1a3c6e, 20, this.WORLD_SIZE * 0.8);
          break;
        case "desert":
          this.scene.background = new THREE.Color(0xffd7a8); // Light sand color
          this.scene.fog = new THREE.Fog(0xffd7a8, 25, this.WORLD_SIZE);
          break;
        case "mountains":
          this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
          this.scene.fog = new THREE.Fog(0x87ceeb, 15, this.WORLD_SIZE * 0.7);
          break;
        case "predators":
          this.scene.background = new THREE.Color(0x3c1a1a); // Dark red
          this.scene.fog = new THREE.Fog(0x3c1a1a, 10, this.WORLD_SIZE * 0.6);
          break;
        default: // Plains and forest
          this.scene.background = new THREE.Color(0x1a202c); // Dark blue-gray
          this.scene.fog = null;
      }
    }
  }
  
  // Get ground color based on environment
  getGroundColor() {
    switch (this.environmentType) {
      case "plains":
        return 0x7cfc00; // Lawn green
      case "forest":
        return 0x228b22; // Forest green
      case "ocean":
        return 0x1e90ff; // Dodger blue
      case "mountains":
        return 0x708090; // Slate gray
      case "desert":
        return 0xf4a460; // Sandy brown
      case "predators":
        return 0x8b0000; // Dark red
      default:
        return 0x333333; // Dark gray
    }
  }
  
  // Update lighting based on environment
  updateEnvironmentLighting() {
    if (!this.scene) return;
    
    // Find existing lights
    let ambientLight, dirLight;
    
    this.scene.children.forEach(child => {
      if (child instanceof THREE.AmbientLight) {
        ambientLight = child;
      } else if (child instanceof THREE.DirectionalLight) {
        dirLight = child;
      }
    });
    
    // Adjust lighting based on environment
    if (ambientLight && dirLight) {
      switch (this.environmentType) {
        case "desert":
          // Bright, harsh lighting
          ambientLight.intensity = 0.7;
          dirLight.intensity = 1.2;
          dirLight.position.set(10, 30, 10);
          break;
        case "forest":
          // Filtered, dappled lighting
          ambientLight.intensity = 0.4;
          dirLight.intensity = 0.6;
          dirLight.position.set(5, 15, 10);
          break;
        case "ocean":
          // Blue-tinted, watery lighting
          ambientLight.intensity = 0.5;
          ambientLight.color.set(0x6688aa);
          dirLight.intensity = 0.7;
          dirLight.position.set(10, 20, -10);
          break;
        case "mountains":
          // Clear, crisp lighting
          ambientLight.intensity = 0.3;
          dirLight.intensity = 1.0;
          dirLight.position.set(-10, 25, 10);
          break;
        case "predators":
          // Dark, ominous lighting
          ambientLight.intensity = 0.2;
          dirLight.intensity = 0.5;
          dirLight.position.set(0, 15, 5);
          break;
        default: // Plains
          // Standard balanced lighting
          ambientLight.intensity = 0.5;
          ambientLight.color.set(0x404040);
          dirLight.intensity = 0.8;
          dirLight.position.set(10, 20, 10);
      }
    }
  }
}

export default Simulation;