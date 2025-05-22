class Food {
  constructor(world, scene, WORLD_SIZE, FOOD_SIZE) {
    this.alive = true;
    this.world = world;
    this.scene = scene;
    this.id = Math.random().toString(36).substr(2, 9);
    
    // Randomly determine food type
    this.foodType = this.determineRandomFoodType();
    
    // Set properties based on food type
    this.setPropertiesByType(FOOD_SIZE);
    
    // Create physics body with position based on food type
    const position = this.getPositionByType(WORLD_SIZE);
    
    this.body = new CANNON.Body({
      mass: 0, // Static body
      position: position,
      shape: new CANNON.Sphere(this.size * 0.5),
      material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
    });
    
    this.body.food = this; // Reference back to food
    world.addBody(this.body);
    
    // Create visual representation
    this.createVisualRepresentation(scene);
  }
  
  determineRandomFoodType() {
    const types = [
      "plant",     // Standard green plant food (common)
      "fruit",     // High energy, grows on trees (less common)
      "mushroom",  // Special properties, in shady areas (uncommon)
      "meat",      // From dead creatures, high protein (rare)
      "mineral"    // Rare minerals with special properties (very rare)
    ];
    
    // Weighted random selection
    const weights = [0.6, 0.2, 0.1, 0.07, 0.03];
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random < cumulativeWeight) {
        return types[i];
      }
    }
    
    return "plant"; // Default fallback
  }
  
  setPropertiesByType(baseSize) {
    switch (this.foodType) {
      case "plant":
        this.energyContent = 50;
        this.size = baseSize;
        this.color = new THREE.Color("hsl(120, 70%, 50%)"); // Green
        this.nutritionalValue = {
          protein: 0.2,
          carbs: 0.7,
          fat: 0.1
        };
        this.lifespan = 100; // Standard lifespan
        break;
        
      case "fruit":
        this.energyContent = 80;
        this.size = baseSize * 1.2;
        this.color = new THREE.Color("hsl(30, 90%, 60%)"); // Orange
        this.nutritionalValue = {
          protein: 0.1,
          carbs: 0.8,
          fat: 0.1
        };
        this.lifespan = 60; // Shorter lifespan (spoils faster)
        break;
        
      case "mushroom":
        this.energyContent = 30;
        this.size = baseSize * 0.8;
        this.color = new THREE.Color("hsl(30, 30%, 60%)"); // Tan
        this.nutritionalValue = {
          protein: 0.4,
          carbs: 0.4,
          fat: 0.2
        };
        this.lifespan = 150; // Longer lifespan
        this.specialEffect = Math.random() > 0.5 ? "boost" : "toxic";
        break;
        
      case "meat":
        this.energyContent = 100;
        this.size = baseSize * 1.4;
        this.color = new THREE.Color("hsl(0, 70%, 50%)"); // Red
        this.nutritionalValue = {
          protein: 0.7,
          carbs: 0.0,
          fat: 0.3
        };
        this.lifespan = 40; // Spoils quickly
        break;
        
      case "mineral":
        this.energyContent = 20;
        this.size = baseSize * 0.6;
        this.color = new THREE.Color("hsl(180, 70%, 60%)"); // Cyan
        this.nutritionalValue = {
          protein: 0.0,
          carbs: 0.0,
          fat: 0.0,
          minerals: 1.0
        };
        this.lifespan = 300; // Very long lifespan
        this.specialEffect = "evolution_boost";
        break;
    }
  }
  
  getPositionByType(worldSize) {
    // Base position - random in world
    let x = (Math.random() - 0.5) * worldSize * 0.8;
    let y = 0.5; // Default just above ground
    let z = (Math.random() - 0.5) * worldSize * 0.8;
    
    // Adjust based on food type
    switch (this.foodType) {
      case "fruit":
        // Fruits appear higher up (as if on trees)
        y = 1.5 + Math.random() * 2;
        break;
        
      case "mushroom":
        // Mushrooms tend to cluster in certain areas
        // Create cluster effect by biasing position
        if (Math.random() > 0.7) {
          const clusterX = (Math.random() - 0.5) * worldSize * 0.5;
          const clusterZ = (Math.random() - 0.5) * worldSize * 0.5;
          x = clusterX + (Math.random() - 0.5) * 3; // Small variation around cluster
          z = clusterZ + (Math.random() - 0.5) * 3;
        }
        break;
        
      case "meat":
        // Meat appears in random places but not too spread out
        x = (Math.random() - 0.5) * worldSize * 0.6;
        z = (Math.random() - 0.5) * worldSize * 0.6;
        break;
        
      case "mineral":
        // Minerals tend to be in specific regions
        // Create a few "mineral deposits" areas
        const depositAngle = Math.random() * Math.PI * 2;
        const depositDistance = (0.5 + Math.random() * 0.3) * worldSize/2;
        x = Math.cos(depositAngle) * depositDistance;
        z = Math.sin(depositAngle) * depositDistance;
        break;
    }
    
    return new CANNON.Vec3(x, y, z);
  }
  
  createVisualRepresentation(scene) {
    let geometry, material;
    
    switch (this.foodType) {
      case "plant":
        // Simple plant - sphere with small cylinders as leaves
        geometry = new THREE.SphereGeometry(this.size * 0.5, 8, 8);
        material = new THREE.MeshStandardMaterial({
          color: this.color,
          roughness: 0.7,
          metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add leaves
        const leafMaterial = new THREE.MeshStandardMaterial({
          color: 0x008800,
          roughness: 0.7,
          metalness: 0.0
        });
        
        for (let i = 0; i < 3; i++) {
          const leafGeometry = new THREE.CylinderGeometry(0.05, 0.2, 0.5, 4);
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          
          // Position leaves randomly around the plant
          const angle = (i / 3) * Math.PI * 2;
          leaf.position.set(
            Math.cos(angle) * this.size * 0.3,
            this.size * 0.2,
            Math.sin(angle) * this.size * 0.3
          );
          
          // Rotate leaves to point outward
          leaf.rotation.x = Math.PI / 4;
          leaf.rotation.y = angle;
          
          this.mesh.add(leaf);
        }
        break;
        
      case "fruit":
        // Fruit - slightly oval sphere with stem
        geometry = new THREE.SphereGeometry(this.size * 0.5, 10, 10);
        // Squish the geometry slightly to make it oval
        const positionAttribute = geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
          const y = positionAttribute.getY(i);
          // Scale Y based on position
          positionAttribute.setY(i, y * 1.2);
        }
        
        material = new THREE.MeshStandardMaterial({
          color: this.color,
          roughness: 0.5,
          metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add stem
        const fruitStemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 4);
        const fruitStemMaterial = new THREE.MeshStandardMaterial({
          color: 0x885500,
          roughness: 0.9,
          metalness: 0.0
        });
        
        const fruitStem = new THREE.Mesh(fruitStemGeometry, fruitStemMaterial);
        fruitStem.position.set(0, this.size * 0.5, 0);
        this.mesh.add(fruitStem);
        break;
        
      case "mushroom":
        // Mushroom - stem and cap
        const capGeometry = new THREE.SphereGeometry(this.size * 0.5, 8, 8);
        // Flatten the bottom half of the sphere
        const capPositionAttribute = capGeometry.getAttribute('position');
        for (let i = 0; i < capPositionAttribute.count; i++) {
          const y = capPositionAttribute.getY(i);
          if (y < 0) {
            capPositionAttribute.setY(i, y * 0.3);
          }
        }
        
        const capMaterial = new THREE.MeshStandardMaterial({
          color: this.color,
          roughness: 0.7,
          metalness: 0.1
        });
        
        const mushroomStemGeometry = new THREE.CylinderGeometry(
          this.size * 0.1,
          this.size * 0.15,
          this.size * 0.6,
          8
        );
        
        const mushroomStemMaterial = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.7,
          metalness: 0.1
        });
        
        // Create a group to hold cap and stem
        this.mesh = new THREE.Group();
        
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.set(0, this.size * 0.6 / 2, 0);
        
        const mushroomStem = new THREE.Mesh(mushroomStemGeometry, mushroomStemMaterial);
        mushroomStem.position.set(0, this.size * 0.6 / 4, 0);
        
        this.mesh.add(mushroomStem);
        this.mesh.add(cap);
        break;
        
      case "meat":
        // Meat - irregular shape
        geometry = new THREE.BoxGeometry(
          this.size * 0.6, 
          this.size * 0.3, 
          this.size * 0.4
        );
        
        // Make it more organic by distorting vertices
        const meatPositionAttribute = geometry.getAttribute('position');
        for (let i = 0; i < meatPositionAttribute.count; i++) {
          meatPositionAttribute.setX(i, meatPositionAttribute.getX(i) + (Math.random() - 0.5) * 0.1);
          meatPositionAttribute.setY(i, meatPositionAttribute.getY(i) + (Math.random() - 0.5) * 0.05);
          meatPositionAttribute.setZ(i, meatPositionAttribute.getZ(i) + (Math.random() - 0.5) * 0.1);
        }
        
        material = new THREE.MeshStandardMaterial({
          color: this.color,
          roughness: 0.6,
          metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        break;
        
      case "mineral":
        // Mineral - crystal shape
        geometry = new THREE.OctahedronGeometry(this.size * 0.4, 0);
        
        material = new THREE.MeshStandardMaterial({
          color: this.color,
          roughness: 0.3,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Add inner glow effect
        const glowGeometry = new THREE.OctahedronGeometry(this.size * 0.3, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glowMesh);
        break;
    }
    
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.food = this; // Reference back to food
    scene.add(this.mesh);
  }
  
  updateVisualRepresentation() {
    if (this.mesh && this.body) {
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
      
      // Add subtle animation/rotation based on food type
      if (this.foodType === "fruit") {
        this.mesh.rotation.y += 0.001;
      } else if (this.foodType === "mineral") {
        this.mesh.rotation.y += 0.003;
        
        // Pulse the inner glow
        if (this.mesh.children[0]) {
          const scale = 0.8 + Math.sin(Date.now() * 0.003) * 0.1;
          this.mesh.children[0].scale.set(scale, scale, scale);
        }
      }
    }
  }
  
  // Method to get energy value for creatures with specific diets
  getEnergyFor(dietType) {
    // Base energy from the food
    let energy = this.energyContent;
    
    // Apply diet-specific modifiers
    switch (dietType) {
      case "herbivore":
        if (this.foodType === "plant" || this.foodType === "fruit") {
          energy *= 1.5; // Herbivores extract more energy from plants
        } else if (this.foodType === "meat") {
          energy *= 0.2; // Herbivores get very little from meat
        }
        break;
        
      case "carnivore":
        if (this.foodType === "meat") {
          energy *= 1.8; // Carnivores extract more energy from meat
        } else if (this.foodType === "plant" || this.foodType === "fruit") {
          energy *= 0.3; // Carnivores get very little from plants
        }
        break;
        
      case "omnivore":
        // Omnivores get moderate benefits from all food types
        if (this.foodType === "mushroom") {
          energy *= 1.2; // Slight bonus for mushrooms
        }
        break;
    }
    
    // Apply special effects
    if (this.foodType === "mushroom" && this.specialEffect === "boost") {
      energy *= 1.5; // Boosted mushroom gives extra energy
    } else if (this.foodType === "mushroom" && this.specialEffect === "toxic") {
      energy *= 0.5; // Toxic mushroom gives less energy
    } else if (this.foodType === "mineral" && this.specialEffect === "evolution_boost") {
      // Minerals don't provide much energy but have other benefits
      // (these would be applied in the creature's eat method)
    }
    
    return Math.round(energy);
  }
  
  // Apply special effects when eaten
  applyEffectsTo(creature) {
    if (!this.specialEffect) return;
    
    switch (this.specialEffect) {
      case "boost":
        // Temporary energy boost
        creature.energy = Math.min(100, creature.energy + 20);
        break;
        
      case "toxic":
        // Toxic effect
        creature.energy = Math.max(10, creature.energy - 10);
        break;
        
      case "evolution_boost":
        // Increases mutation rate temporarily
        creature.evolutionBoost = true;
        // This would be checked during breeding in the creature class
        break;
    }
  }
}

export default Food;