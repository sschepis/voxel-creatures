# Voxel Creatures Battle Game - Source Code Structure

## Core Framework
- `index.html` - Main entry point for the application
- `app.js` - Application initialization and setup

## Configuration
- `config/game-config.js` - Global game settings and constants
- `config/battle-config.js` - Battle-specific settings
- `config/evolution-config.js` - Evolution parameters and genetics settings
- `config/environment-config.js` - Settings for different battle arenas

## Engines

### Evolution Engine
- `engines/evolution/genetics.js` - Core genetic system implementation
- `engines/evolution/mutation.js` - Mutation system and algorithms
- `engines/evolution/breeding.js` - Creature breeding mechanics
- `engines/evolution/traits.js` - Trait definitions and effects
- `engines/evolution/species.js` - Species classification and tracking

### Physics Engine
- `engines/physics/world.js` - Physics world setup and management
- `engines/physics/creature-physics.js` - Creature-specific physics
- `engines/physics/collision.js` - Collision detection and handling
- `engines/physics/movement.js` - Movement and forces implementation

### Battle Engine
- `engines/battle/battle-manager.js` - Battle initialization and state management
- `engines/battle/turn-system.js` - Turn sequence handling
- `engines/battle/action-resolver.js` - Action execution and results
- `engines/battle/damage-calculator.js` - Damage calculation system
- `engines/battle/environment-effects.js` - Environmental interactions
- `engines/battle/ability-system.js` - Special ability implementation

## Models

### Creature Models
- `models/creature/creature.js` - Base creature class
- `models/creature/body-parts.js` - Body part definitions and functions
- `models/creature/stats.js` - Creature statistics and attributes
- `models/creature/abilities.js` - Ability definitions and effects
- `models/creature/creature-factory.js` - Creature creation and initialization

### Battle Models
- `models/battle/battle-state.js` - Battle state representation
- `models/battle/battle-action.js` - Action definitions and validation
- `models/battle/arena.js` - Arena representation and properties
- `models/battle/battle-result.js` - Battle outcome tracking

### Player Models
- `models/player/player.js` - Player profile and data
- `models/player/inventory.js` - Creature collection management
- `models/player/progress.js` - Player progression tracking
- `models/player/achievements.js` - Achievement system

## Services

### Database Services
- `services/gun/gun-setup.js` - Gun.js initialization and configuration
- `services/gun/creature-storage.js` - Creature data persistence
- `services/gun/battle-records.js` - Battle history storage
- `services/gun/user-profiles.js` - User data management
- `services/gun/synchronization.js` - Real-time data synchronization

### Game Services
- `services/game/authentication.js` - User authentication and sessions
- `services/game/matchmaking.js` - Battle matchmaking system
- `services/game/trading.js` - Creature trading functionality
- `services/game/event-system.js` - Game events and notifications
- `services/game/leaderboard.js` - Rankings and leaderboards

## Views

### UI Components
- `views/components/creature-card.js` - Reusable creature display component
- `views/components/stat-display.js` - Statistics visualization component
- `views/components/action-button.js` - Interactive button component
- `views/components/progress-bar.js` - Progress visualization component
- `views/components/genetic-chart.js` - Genetic visualization component

### Screens
- `views/screens/home-screen.js` - Main menu interface
- `views/screens/evolution-lab.js` - Creature breeding and mutation interface
- `views/screens/battle-arena.js` - Battle interface and controls
- `views/screens/creature-collection.js` - Creature management interface
- `views/screens/training-grounds.js` - Creature training interface
- `views/screens/marketplace.js` - Trading interface
- `views/screens/profile.js` - Player profile interface
- `views/screens/leaderboard.js` - Rankings display
- `views/screens/settings.js` - Game settings interface

### Rendering
- `views/rendering/scene-manager.js` - 3D scene management
- `views/rendering/creature-renderer.js` - Creature visualization
- `views/rendering/environment-renderer.js` - Battle arena rendering
- `views/rendering/animation-system.js` - Animation management
- `views/rendering/effects-renderer.js` - Special effects rendering
- `views/rendering/camera-controller.js` - Camera control system

## Controllers

### Game Controllers
- `controllers/game-controller.js` - Main game loop and state management
- `controllers/evolution-controller.js` - Evolution process control
- `controllers/battle-controller.js` - Battle sequence control
- `controllers/training-controller.js` - Training simulation control
- `controllers/collection-controller.js` - Creature collection management

### Input Controllers
- `controllers/input/keyboard-input.js` - Keyboard controls handling
- `controllers/input/mouse-input.js` - Mouse interaction handling
- `controllers/input/touch-input.js` - Touch controls for mobile
- `controllers/input/input-mapper.js` - Input mapping system

## Utilities
- `utils/math-utils.js` - Mathematical helper functions
- `utils/random-utils.js` - Random generation utilities
- `utils/object-pool.js` - Object pooling for performance
- `utils/event-bus.js` - Event system for component communication
- `utils/logger.js` - Logging and debugging utilities

## Assets
- `assets/models/` - 3D model files
- `assets/textures/` - Texture files
- `assets/sounds/` - Audio files
- `assets/environments/` - Environment assets
- `assets/ui/` - User interface assets

## Tests
- `tests/unit/` - Unit tests for individual components
- `tests/integration/` - Integration tests for system interaction
- `tests/e2e/` - End-to-end tests for complete features
- `tests/performance/` - Performance benchmarking tests

## Documentation
- `docs/api.md` - API documentation
- `docs/architecture.md` - Architecture overview
- `docs/genetics.md` - Genetic system documentation
- `docs/battle-system.md` - Battle mechanics documentation
- `docs/gun-integration.md` - Gun.js implementation details

This file structure provides a well-organized, modular approach to implementing the Voxel Creatures Battle Game, with clear separation of concerns and maintainable code organization.
