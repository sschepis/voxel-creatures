// UI.js - Handles all user interface interactions and rendering

class UI {
  constructor(simulation) {
    this.simulation = simulation;
    this.elements = {};
    this.lineageChart = null;
    
    // Initialize UI elements
    this.initUIElements();
    this.attachEventListeners();
  }
  
  // Find and store all UI elements
  initUIElements() {
    // Main containers
    this.elements.voxelViewer = document.querySelector(".voxel-container");
    this.elements.threeContainer = document.getElementById("three-container");
    this.elements.populationGrid = document.getElementById("population-grid");
    this.elements.loadingOverlay = document.getElementById("loading-overlay");
    this.elements.statsOverlay = document.getElementById("stats-overlay");
    
    // Counters and displays
    this.elements.generationCounter = document.getElementById("generation-counter");
    this.elements.fitnessScore = document.getElementById("fitness-score");
    this.elements.foodCount = document.getElementById("food-count");
    
    // Control buttons
    this.elements.startBtn = document.getElementById("start-btn");
    this.elements.pauseBtn = document.getElementById("pause-btn");
    this.elements.resetBtn = document.getElementById("reset-btn");
    this.elements.breedBtn = document.getElementById("breed-btn");
    this.elements.mutateBtn = document.getElementById("mutate-btn");
    this.elements.followBtn = document.getElementById("follow-btn");
    
    // Input elements
    this.elements.environmentSelect = document.getElementById("environment-type");
    this.elements.populationSizeInput = document.getElementById("population-size");
    this.elements.physicsAccuracyInput = document.getElementById("physics-accuracy");
    this.elements.mutationRateInput = document.getElementById("mutation-rate");
    this.elements.foodAmountInput = document.getElementById("food-amount");
    
    // Selected creature information
    this.elements.selectedCreature = document.getElementById("selected-creature");
    this.elements.creatureAge = document.getElementById("creature-age");
    this.elements.creatureFitness = document.getElementById("creature-fitness");
    this.elements.creatureGeneration = document.getElementById("creature-generation");
    this.elements.creatureSpecies = document.getElementById("creature-species");
    
    // Stat displays
    this.elements.statSpeed = document.getElementById("stat-speed");
    this.elements.statStrength = document.getElementById("stat-strength");
    this.elements.statSize = document.getElementById("stat-size");
    this.elements.statHealth = document.getElementById("stat-health");
    this.elements.statEnergy = document.getElementById("stat-energy");
    this.elements.statAge = document.getElementById("stat-age");
    
    // Gene visualization
    this.elements.speedBar = document.getElementById("speed-bar");
    this.elements.strengthBar = document.getElementById("strength-bar");
    this.elements.sizeBar = document.getElementById("size-bar");
    this.elements.healthBar = document.getElementById("health-bar");
    this.elements.behaviorBar = document.getElementById("behavior-bar");
    this.elements.specializationBar = document.getElementById("specialization-bar");
    this.elements.speedValue = document.getElementById("speed-value");
    this.elements.strengthValue = document.getElementById("strength-value");
    this.elements.sizeValue = document.getElementById("size-value");
    this.elements.healthValue = document.getElementById("health-value");
    this.elements.behaviorType = document.getElementById("behavior-type");
    this.elements.specialization = document.getElementById("specialization");
    
    // Chart
    this.elements.lineageChart = document.getElementById("lineage-chart");
  }
  
  // Attach event listeners to UI elements
  attachEventListeners() {
    // Control buttons
    this.elements.startBtn.addEventListener("click", () => this.startSimulation());
    this.elements.pauseBtn.addEventListener("click", () => this.pauseSimulation());
    this.elements.resetBtn.addEventListener("click", () => this.resetSimulation());
    this.elements.breedBtn.addEventListener("click", () => this.breedSelectedCreature());
    this.elements.mutateBtn.addEventListener("click", () => this.mutateSelectedCreature());
    this.elements.followBtn.addEventListener("click", () => this.toggleFollowCreature());
    
    // Environment select
    this.elements.environmentSelect.addEventListener("change", () => {
      this.simulation.setEnvironmentType(this.elements.environmentSelect.value);
    });
    
    // Physics accuracy
    this.elements.physicsAccuracyInput.addEventListener("input", () => {
      this.simulation.setPhysicsAccuracy(parseInt(this.elements.physicsAccuracyInput.value));
    });
    
    // Food amount
    this.elements.foodAmountInput.addEventListener("input", () => {
      this.simulation.setFoodAmount(parseInt(this.elements.foodAmountInput.value));
    });
    
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (this.simulation.simulationRunning) {
          this.pauseSimulation();
        } else {
          this.startSimulation();
        }
      }
      
      if (e.code === "KeyF") {
        e.preventDefault();
        if (this.simulation.selectedCreature) {
          this.toggleFollowCreature();
        }
      }
    });
    
    // Window resize
    window.addEventListener("resize", () => {
      this.simulation.handleResize(this.elements.voxelViewer);
    });
  }
  
  // Initialize the lineage chart
  initLineageChart() {
    const ctx = this.elements.lineageChart.getContext("2d");
    
    this.lineageChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 15 }, (_, i) => `Gen ${i}`),
        datasets: [
          {
            label: "Top Fitness",
            data: Array(15).fill(0),
            borderColor: "#4fd1c5",
            backgroundColor: "rgba(79, 209, 197, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.05)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          }
        },
        elements: {
          point: {
            radius: 0
          }
        }
      }
    });
    
    return this.lineageChart;
  }
  
  // Update chart data
  updateChartData(fitnessHistory, currentGeneration) {
    if (!this.lineageChart) return;
    
    // Shift data if needed
    const labels = Array.from({ length: 15 }, (_, i) => {
      const gen = currentGeneration - (14 - i);
      return `Gen ${gen >= 0 ? gen : ""}`;
    });
    
    // Pad fitness history with zeros if needed
    const paddedFitness = [
      ...Array(Math.max(0, 15 - fitnessHistory.length)).fill(0),
      ...fitnessHistory
    ];
    
    this.lineageChart.data.labels = labels;
    this.lineageChart.data.datasets[0].data = paddedFitness;
    this.lineageChart.update();
  }
  
  // Render population grid
  renderPopulation() {
    if (!this.elements.populationGrid) return;
    
    this.elements.populationGrid.innerHTML = "";
    
    // Sort by fitness
    const sortedCreatures = [...this.simulation.creatures].sort(
      (a, b) => b.fitness - a.fitness
    );
    
    sortedCreatures.forEach((creature) => {
      const color = new THREE.Color(`hsl(${creature.genes.color}, 70%, 50%)`);
      
      const card = document.createElement("div");
      card.className = `creature-card bg-gray-700 rounded-lg p-3 cursor-pointer transition ${
        this.simulation.selectedCreature?.id === creature.id ? "ring-2 ring-teal-400" : ""
      }`;
      
      // Create a simple visual representation for the card
      const visual = document.createElement("div");
      visual.className =
        "h-24 mb-2 flex items-center justify-center rounded bg-gray-800 relative";
      
      // Main body
      const body = document.createElement("div");
      body.className = "absolute w-8 h-8";
      body.style.backgroundColor = `hsl(${creature.genes.color}, 70%, 50%)`;
      body.style.borderRadius =
        creature.genes.bodyShape === "spherical" ? "50%" : "0";
      body.style.transform = `
        translate(-50%, -50%)
        ${
          creature.genes.bodyShape === "slender"
            ? "scaleX(0.7) scaleY(1.4)"
            : ""
        }
        ${
          creature.genes.bodyShape === "elongated"
            ? "scaleX(1.5) scaleY(0.7)"
            : ""
        }
      `;
      
      // Add some limbs based on symmetry and count
      const limbs = [];
      const showLimbs = Math.min(4, creature.genes.limbs);
      const limbColor = `hsl(${(creature.genes.color + 20) % 360}, 70%, 50%)`;
      
      if (creature.genes.symmetry === "radial") {
        for (let i = 0; i < showLimbs; i++) {
          const angle = (i / showLimbs) * Math.PI * 2;
          const x = Math.cos(angle) * 20;
          const y = Math.sin(angle) * 20;
          
          limbs.push(`
            <div class="absolute w-2 h-4" style="
                background-color: ${limbColor};
                left: 50%;
                top: 50%;
                margin-left: -1px;
                margin-top: -2px;
                transform: translate(${x}px, ${y}px) rotate(${angle}rad);
            "></div>
          `);
        }
      } else {
        for (let i = 0; i < showLimbs; i++) {
          const xOffset = i % 2 === 0 ? -15 : 15;
          const yPos = -15 + Math.floor(i / 2) * 15;
          
          limbs.push(`
            <div class="absolute h-2 w-4" style="
                background-color: ${limbColor};
                left: 50%;
                top: 50%;
                margin-left: -8px;
                margin-top: -1px;
                transform: translate(${xOffset}px, ${yPos}px);
            "></div>
          `);
        }
      }
      
      visual.innerHTML = `
        ${limbs.join("")}
        <div class="absolute w-8 h-8" style="
            background-color: ${color.getStyle()};
            left: 50%;
            top: 50%;
            margin-left: -16px;
            margin-top: -16px;
            border-radius: ${
              creature.genes.bodyShape === "spherical"
                ? "50%"
                : "0"
            };
            transform: translate(0, 0)
                ${
                  creature.genes.bodyShape === "slender"
                    ? "scaleX(0.7) scaleY(1.4)"
                    : ""
                }
                ${
                  creature.genes.bodyShape === "elongated"
                    ? "scaleX(1.5) scaleY(0.7)"
                    : ""
                };
        "></div>
      `;
      
      card.appendChild(visual);
      
      // Add creature info
      const info = document.createElement("div");
      info.className = "text-sm";
      info.innerHTML = `
        <div class="flex justify-between mb-1">
            <span class="font-medium">Gen ${
              creature.generation
            }</span>
            <span class="text-xs bg-gray-600 px-1 rounded">${Math.round(
              creature.fitness * 100
            )}%</span>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>${
              creature.speciesId
                ? `Species ${creature.speciesId}`
                : "New"
            }</span>
            <span>Age ${creature.age}</span>
        </div>
        <div class="h-1 w-full bg-gray-600 rounded-full mb-1">
            <div class="h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style="width: ${
              creature.energy
            }%"></div>
        </div>
        <div class="h-1 w-full bg-gray-600 rounded-full">
            <div class="h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style="width: ${Math.min(
              100,
              creature.eaten * 10
            )}%"></div>
        </div>
      `;
      
      card.appendChild(info);
      
      card.addEventListener("click", () => this.simulation.selectCreature(creature));
      this.elements.populationGrid.appendChild(card);
    });
  }
  
  // Update selected creature info
  updateSelectedCreatureInfo(creature) {
    if (!creature) {
      this.elements.selectedCreature.textContent = "None";
      this.elements.statsOverlay.classList.add("hidden");
      return;
    }
    
    this.elements.statsOverlay.classList.remove("hidden");
    
    // Update creature info
    this.elements.selectedCreature.textContent = `Creature #${creature.id
      .toString()
      .padStart(4, "0")}`;
    this.elements.creatureAge.textContent = `Age: ${creature.age}`;
    this.elements.creatureFitness.textContent = `Fitness: ${(
      creature.fitness * 100
    ).toFixed(1)}%`;
    this.elements.creatureGeneration.textContent = `Gen: ${creature.generation}`;
    this.elements.creatureSpecies.textContent = `Species: ${
      creature.speciesId !== null ? creature.speciesId : "New"
    }`;
    
    // Update stats display
    this.elements.statSpeed.textContent = (
      creature.genes.speed * 10
    ).toFixed(1);
    this.elements.statStrength.textContent = (
      creature.genes.strength * 10
    ).toFixed(1);
    this.elements.statSize.textContent = (
      creature.genes.size * 10
    ).toFixed(1);
    this.elements.statHealth.textContent = (
      creature.genes.health * 10
    ).toFixed(1);
    this.elements.statEnergy.textContent = Math.round(
      creature.energy
    );
    this.elements.statAge.textContent = creature.age;
    
    // Update gene visualization
    this.updateGeneVisualization(creature);
    
    // Highlight selected card
    this.highlightSelectedCard();
  }
  
  // Update gene visualization bars
  updateGeneVisualization(creature) {
    if (!creature) return;
    
    // Update progress bars
    this.elements.speedBar.style.width = `${creature.genes.speed * 100}%`;
    this.elements.strengthBar.style.width = `${creature.genes.strength * 100}%`;
    this.elements.sizeBar.style.width = `${creature.genes.size * 100}%`;
    this.elements.healthBar.style.width = `${creature.genes.health * 100}%`;
    this.elements.behaviorBar.style.width = `${((creature.genes.behavior + 1) / 2) * 100}%`;
    
    // Update values
    this.elements.speedValue.textContent = `${(creature.genes.speed * 10).toFixed(1)}`;
    this.elements.strengthValue.textContent = `${(creature.genes.strength * 10).toFixed(1)}`;
    this.elements.sizeValue.textContent = `${(creature.genes.size * 10).toFixed(1)}`;
    this.elements.healthValue.textContent = `${(creature.genes.health * 10).toFixed(1)}`;
    this.elements.behaviorType.textContent =
      creature.genes.behavior > 0
        ? "Aggressive"
        : creature.genes.behavior < 0
        ? "Passive"
        : "Neutral";
    
    // Update specialization
    const spec = creature.getSpecialization();
    this.elements.specializationBar.style.width = `${spec.score * 100}%`;
    this.elements.specialization.textContent =
      spec.trait === "generalist" ? "Generalist" : `${spec.trait} specialist`;
  }
  
  // Highlight the selected creature's card
  highlightSelectedCard() {
    document.querySelectorAll(".creature-card").forEach((card) => {
      if (this.simulation.selectedCreature && 
          card.querySelector(".font-medium").textContent.includes(`Gen ${this.simulation.selectedCreature.generation}`)) {
        card.classList.add("ring-2", "ring-teal-400");
      } else {
        card.classList.remove("ring-2", "ring-teal-400");
      }
    });
  }
  
  // Start simulation
  startSimulation() {
    if (!this.simulation.simulationRunning) {
      this.simulation.start();
      this.elements.startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Running...';
      this.elements.startBtn.classList.replace("bg-teal-600", "bg-teal-700");
    }
  }
  
  // Pause simulation
  pauseSimulation() {
    this.simulation.pause();
    this.elements.startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Evolution';
    this.elements.startBtn.classList.replace("bg-teal-700", "bg-teal-600");
  }
  
  // Reset simulation
  resetSimulation() {
    this.pauseSimulation();
    
    const populationSize = parseInt(this.elements.populationSizeInput.value);
    this.simulation.initSimulation(populationSize);
  }
  
  // Breed selected creature
  breedSelectedCreature() {
    const child = this.simulation.breedSelectedCreature();
    if (child) {
      this.renderPopulation();
      this.updateSelectedCreatureInfo(child);
    }
  }
  
  // Mutate selected creature
  mutateSelectedCreature() {
    if (this.simulation.forceMutateCreature()) {
      this.updateSelectedCreatureInfo(this.simulation.selectedCreature);
      this.renderPopulation();
    }
  }
  
  // Toggle follow mode for selected creature
  toggleFollowCreature() {
    const isFollowing = this.simulation.toggleFollowCreature();
    
    if (isFollowing) {
      this.elements.followBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i> Following';
      this.elements.followBtn.classList.remove("bg-green-600", "hover:bg-green-500");
      this.elements.followBtn.classList.add("bg-green-700", "text-white");
    } else {
      this.elements.followBtn.innerHTML = '<i class="fas fa-eye mr-1"></i> Follow';
      this.elements.followBtn.classList.remove("bg-green-700", "text-white");
      this.elements.followBtn.classList.add("bg-green-600", "hover:bg-green-500");
    }
  }
  
  // Update food count display
  updateFoodCount(count) {
    this.elements.foodCount.textContent = count;
  }
  
  // Update generation counter display
  updateGenerationCounter(generation) {
    this.elements.generationCounter.textContent = generation;
  }
  
  // Update fitness score display
  updateFitnessScore(fitness) {
    this.elements.fitnessScore.textContent = fitness.toFixed(2);
  }
  
  // Set up simulation with callbacks
  setupSimulationCallbacks() {
    // Set up callbacks from simulation to UI
    return {
      onGenerationChange: (gen) => this.updateGenerationCounter(gen),
      onFitnessUpdate: (fitness) => this.updateFitnessScore(fitness),
      onFoodCountUpdate: (count) => this.updateFoodCount(count),
      onPopulationRender: () => this.renderPopulation(),
      onCreatureSelect: (creature) => this.updateSelectedCreatureInfo(creature),
      onChartUpdate: (fitnessHistory) => this.updateChartData(
        fitnessHistory, 
        this.simulation.currentGeneration
      )
    };
  }
  
  // Show/hide loading overlay
  showLoading(show) {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = show ? "flex" : "none";
    }
  }
}

export default UI;