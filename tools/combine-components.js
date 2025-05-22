// combine-components.js
// A utility script to combine all HTML components into a single file for deployment
// and copy all necessary JavaScript files
// Usage: node combine-components.js

const fs = require('fs');
const path = require('path');

// Paths
const indexPath = path.join(__dirname, '..', 'index.html');
const outputPath = path.join(__dirname, '..', 'dist', 'index-combined.html');
const componentsDir = path.join(__dirname, '..', 'components');
const jsDir = path.join(__dirname, '..', 'js');
const distDir = path.join(__dirname, '..', 'dist');
const distJsDir = path.join(distDir, 'js');

// Ensure the dist and dist/js directories exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(distJsDir)) {
  fs.mkdirSync(distJsDir, { recursive: true });
}

// Read the index file
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Find all component placeholders
const componentRegex = /<div data-component="components\/(.*?)\.html"><\/div>/g;
let match;

// Create a mapping of component paths to their content
const componentMap = {};

// Collect all inline scripts from components
let inlineScripts = '';

// Read all component files
fs.readdirSync(componentsDir)
  .filter(file => file.endsWith('.html'))
  .forEach(file => {
    const componentPath = `components/${file}`;
    let content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    
    // Extract any inline scripts from the component
    const scriptMatches = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/g);
    if (scriptMatches) {
      scriptMatches.forEach(script => {
        inlineScripts += `\n/* Inline script from ${file} */\n${script}\n`;
        // Remove script from content that will be inserted directly
        content = content.replace(script, '<!-- Script moved to consolidated scripts section -->');
      });
    }
    
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

// Add any inline scripts we collected from components right before the closing body tag
if (inlineScripts) {
  indexContent = indexContent.replace(
    '</body>',
    `<!-- Consolidated inline scripts from components -->\n${inlineScripts}\n</body>`
  );
}

// Write the combined file
fs.writeFileSync(outputPath, indexContent);
console.log(`Combined HTML file created at: ${outputPath}`);

// Copy all JavaScript files to dist directory
function copyJSFilesRecursively(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const items = fs.readdirSync(sourceDir);
  
  items.forEach(item => {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyJSFilesRecursively(sourcePath, targetPath);
    } else if (item.endsWith('.js') && item !== 'components-loader.js') {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied JS file: ${sourcePath} -> ${targetPath}`);
    }
  });
}

// Copy JS files
copyJSFilesRecursively(jsDir, distJsDir);

// Also copy CSS directory if it exists
const cssDir = path.join(__dirname, '..', 'css');
const distCssDir = path.join(distDir, 'css');
if (fs.existsSync(cssDir)) {
  if (!fs.existsSync(distCssDir)) {
    fs.mkdirSync(distCssDir, { recursive: true });
  }
  
  fs.readdirSync(cssDir).forEach(file => {
    if (file.endsWith('.css')) {
      fs.copyFileSync(path.join(cssDir, file), path.join(distCssDir, file));
      console.log(`Copied CSS file: ${file}`);
    }
  });
}

console.log(`All JavaScript and CSS files copied to dist directory`);