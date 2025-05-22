// combine-components.js
// A utility script to combine all HTML components into a single file for deployment
// Usage: node combine-components.js

const fs = require('fs');
const path = require('path');

// Paths
const indexPath = path.join(__dirname, '..', 'index.html');
const outputPath = path.join(__dirname, '..', 'dist', 'index-combined.html');
const componentsDir = path.join(__dirname, '..', 'components');

// Ensure the dist directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
}

// Read the index file
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Find all component placeholders
const componentRegex = /<div data-component="components\/(.*?)\.html"><\/div>/g;
let match;
let componentPromises = [];

// Create a mapping of component paths to their content
const componentMap = {};

// Read all component files
fs.readdirSync(componentsDir)
  .filter(file => file.endsWith('.html'))
  .forEach(file => {
    const componentPath = `components/${file}`;
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    componentMap[componentPath] = content;
  });

// Replace component placeholders with their content
while ((match = componentRegex.exec(indexContent)) !== null) {
  const fullMatch = match[0];
  const componentFile = `components/${match[1]}.html`;
  
  if (componentMap[componentFile]) {
    indexContent = indexContent.replace(
      fullMatch, 
      `<!-- Begin ${componentFile} -->\n${componentMap[componentFile]}\n<!-- End ${componentFile} -->`
    );
  } else {
    console.error(`Component not found: ${componentFile}`);
  }
}

// Remove the component loader script since we don't need it anymore
indexContent = indexContent.replace(
  /<script src="js\/components-loader\.js"><\/script>/,
  '<!-- Component loader removed in combined version -->'
);

// Write the combined file
fs.writeFileSync(outputPath, indexContent);
console.log(`Combined HTML file created at: ${outputPath}`);