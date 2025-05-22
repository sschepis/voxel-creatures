# Voxel Creatures Evolutionary Simulator

A physics-based evolution simulation built with Three.js and Cannon.js.

## Project Structure

The project has been refactored into a component-based architecture for better maintainability:

```
/
├── components/           # HTML components
│   ├── controls.html     # Simulation control panel
│   ├── footer.html       # Page footer
│   ├── head.html         # Head section content
│   ├── header.html       # Page header
│   ├── population.html   # Population grid
│   ├── scripts.html      # Script imports
│   ├── stats.html        # Statistics and genetics panel
│   └── viewer.html       # 3D viewer component
│
├── css/                  # Stylesheets
│   └── style.css         # Main stylesheet
│
├── js/                   # JavaScript files
│   ├── components-loader.js  # Component loader utility
│   ├── main.js           # Main application entry point
│   ├── simulation.js     # Simulation logic
│   ├── ui.js             # UI interaction logic
│   ├── utils.js          # Utility functions
│   └── entities/         # Simulation entities
│       ├── Food.js       # Food entity
│       └── VoxelCreature.js  # Creature entity
│
├── index.html            # Main HTML file (loads components)
├── DESIGN.md             # Design documentation
├── FILES.md              # File structure documentation
├── README.md             # This file
└── TODO.md               # Future improvements
```

## How It Works

### Component System

The application uses a client-side component loading system to break the UI into manageable pieces:

1. Each UI section is defined in its own HTML file in the `components/` directory
2. The `index.html` file contains placeholders with `data-component` attributes
3. The `components-loader.js` script loads each component when the page loads
4. Components are inserted into the DOM and initialized

### Adding New Components

To add a new component:

1. Create a new HTML file in the `components/` directory
2. Add the component's HTML content to the file
3. Add a placeholder in `index.html` with the `data-component` attribute pointing to your component file:
   ```html
   <div data-component="components/your-component.html"></div>
   ```

## Running the Project

You need to serve the files from a web server due to module imports and component loading:

```bash
# Using Python's built-in server
python -m http.server

# Or using Node.js with http-server
npx http-server
```

Then open `http://localhost:8000` in your browser.

## Technology Stack

- **Three.js** - 3D rendering
- **Cannon.js** - Physics simulation
- **Chart.js** - Data visualization
- **Vanta.js** - Background effects
- **TailwindCSS** - Styling
- **JavaScript Modules** - Code organization
- **Component-based Architecture** - UI organization