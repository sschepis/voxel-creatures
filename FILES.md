# Voxel Creatures Evolutionary Simulator - File Structure

## Main Files
- `index.html` - Main entry point that loads components dynamically
- `README.md` - Project documentation and overview
- `DESIGN.md` - Design decisions and architecture documentation
- `TODO.md` - Planned improvements and future features

## Component Files
The UI is broken down into reusable HTML components:

- `components/head.html` - Contains the document head content, metadata, and CSS imports
- `components/header.html` - Page header with title and description
- `components/controls.html` - Simulation control panel with settings
- `components/viewer.html` - 3D simulation viewer and creature control interface
- `components/population.html` - Population grid for viewing and selecting creatures
- `components/stats.html` - Statistics and genetics panels with charts
- `components/footer.html` - Page footer with keyboard shortcuts
- `components/scripts.html` - External script dependencies

## JavaScript Files

### Core System
- `js/main.js` - Application initialization and setup
- `js/components-loader.js` - Client-side component loading system
- `js/simulation.js` - Core simulation logic and physics world management
- `js/ui.js` - User interface interaction handling
- `js/utils.js` - Utility functions and helpers

### Entity Models
- `js/entities/VoxelCreature.js` - Creature entity with genetics, physics, and behaviors
- `js/entities/Food.js` - Food resource entity that creatures consume

## Stylesheets
- `css/style.css` - Main application styles

## File Descriptions

### Core Files

#### index.html
The main HTML file that uses component placeholders with `data-component` attributes. These are replaced with actual component content by the component loader system.

#### js/components-loader.js
A client-side component loader that:
- Identifies all elements with `data-component` attributes
- Fetches the HTML content from the specified files
- Injects the content into the placeholders
- Dispatches events when components are loaded

#### js/main.js
The application entry point that:
- Initializes the Vanta.js background effect
- Waits for components to load
- Creates the simulation instance
- Sets up the UI
- Initializes creatures and environment
- Starts the animation loop

#### js/simulation.js
The core simulation class that:
- Manages the physics world (Cannon.js)
- Creates and updates creatures
- Handles food spawning and consumption
- Processes creature collisions
- Manages environmental factors
- Implements the genetic algorithm
- Handles generational advancement
- Tracks fitness and evolutionary progress

#### js/ui.js
Handles all user interface interactions:
- Connects UI controls to simulation parameters
- Updates statistics displays
- Manages creature selection
- Handles button clicks
- Renders the population grid
- Updates the lineage chart

### Entity Files

#### js/entities/VoxelCreature.js
The creature model with:
- Genetic traits and inheritance
- Physical body with joints and constraints
- Visual representation with Three.js
- Movement and decision-making logic
- Collision detection
- Fitness calculation
- Breeding and mutation mechanisms
- Environmental adaptation

#### js/entities/Food.js
The food resource model with:
- Physical properties
- Visual representation
- Energy content
- Spawn and consumption logic

This file structure provides a clean separation of concerns between the simulation logic, entity models, and user interface components, making the codebase more maintainable and extensible.
