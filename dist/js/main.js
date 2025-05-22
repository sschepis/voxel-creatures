// main.js - Entry point and initialization

import Simulation from './simulation.js';
import UI from './ui.js';
import * as Utils from './utils.js';

// Initialize Vanta.js background when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Vanta.js background
  VANTA.GLOBE({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x3f83f8,
    backgroundColor: 0x111827,
    size: 1.0
  });
});

// Initialize the application when all components are loaded
document.addEventListener("components-loaded", function() {
  console.log("All components loaded, initializing application...");
  checkCannonLoaded();
});

// Initialize the simulation
function initApp() {
  // Show loading indicator
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) loadingOverlay.style.display = "flex";
  
  // Get container element
  const voxelViewer = document.querySelector(".voxel-container");
  const threeContainer = document.getElementById("three-container");
  
  // Create config for simulation
  const populationSize = parseInt(document.getElementById("population-size").value);
  const mutationRate = parseInt(document.getElementById("mutation-rate").value);
  const physicsAccuracy = parseInt(document.getElementById("physics-accuracy").value);
  const foodAmount = parseInt(document.getElementById("food-amount").value);
  const environmentType = document.getElementById("environment-type").value;
  
  const config = {
    worldSize: 30,
    foodSize: 1,
    foodEnergy: 50,
    maxFood: 30,
    populationSize,
    mutationRate,
    physicsAccuracy,
    foodAmount,
    environmentType
  };
  
  // Create simulation
  const simulation = new Simulation(config);
  
  // Create UI and connect it to simulation
  const ui = new UI(simulation);
  
  // Set up callbacks from simulation to UI
  simulation.callbacks = ui.setupSimulationCallbacks();
  
  // Initialize physics world
  simulation.initPhysicsWorld(threeContainer);
  
  // Initialize lineage chart
  ui.initLineageChart();
  
  // Initialize simulation with creatures
  simulation.initSimulation(populationSize);
  
  // Set initial values in simulation
  simulation.setMutationRate(mutationRate);
  simulation.setPhysicsAccuracy(physicsAccuracy);
  simulation.setFoodAmount(foodAmount);
  
  // Start animation loop
  simulation.startAnimation();
  
  // Hide loading overlay
  ui.showLoading(false);
  
  console.log("Simulation initialized successfully");
}

// Check if Cannon.js and other dependencies are loaded
function checkCannonLoaded() {
  if (typeof CANNON !== "undefined" &&
      typeof THREE !== "undefined" &&
      typeof Chart !== "undefined") {
    console.log("All dependencies loaded");
    initApp();
  } else {
    console.log("Waiting for dependencies...");
    setTimeout(checkCannonLoaded, 100);
  }
}