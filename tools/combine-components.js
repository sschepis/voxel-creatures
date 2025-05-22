// combine-components.js
// A utility script to combine all HTML components and JavaScript into a single file for deployment
// Usage: node combine-components.js

const fs = require('fs');
const path = require('path');

// Paths
const indexPath = path.join(__dirname, '..', 'index.html');
const outputPath = path.join(__dirname, '..', 'dist', 'index-combined.html');
const componentsDir = path.join(__dirname, '..', 'components');
const jsDir = path.join(__dirname, '..', 'js');
const distDir = path.join(__dirname, '..', 'dist');

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
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

// Function to read all JavaScript files
function readJsFile(filePath) {
  try {
    const fullPath = path.resolve(path.join(__dirname, '..', filePath));
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`Error reading JS file ${filePath}:`, error);
    return `/* Error loading ${filePath} */`;
  }
}

// Recursively read JS file and its imports
function processJsModule(filePath, processedFiles = new Set()) {
  if (processedFiles.has(filePath)) {
    return ''; // Already processed this file
  }
  
  processedFiles.add(filePath);
  let content = readJsFile(filePath);
  
  // Find and process imports
  const importRegex = /import\s+.*\s+from\s+['"](.+?)['"]/g;
  let importMatch;
  let processedImports = '';
  
  while ((importMatch = importRegex.exec(content)) !== null) {
    const importPath = importMatch[1];
    
    // Only process local imports (not npm packages)
    if (!importPath.startsWith('.')) continue;
    
    // Resolve relative path
    const resolvedPath = path.resolve(path.dirname(filePath), importPath);
    const relativePath = path.relative(path.join(__dirname, '..'), resolvedPath);
    
    // Add .js extension if needed
    const importFilePath = relativePath.endsWith('.js') ? relativePath : `${relativePath}.js`;
    
    // Process this import
    processedImports += processJsModule(importFilePath, processedFiles);
    
    // Remove this import statement as we're inlining it
    content = content.replace(importMatch[0], '// Import inlined: ' + importMatch[0]);
  }
  
  return `
/* File: ${filePath} */
${processedImports}
${content}
`;
}

// Find all script tags with src attributes referencing local files
const scriptRegex = /<script[^>]*src=["']([^"']*?)["'][^>]*><\/script>/g;
let scriptMatch;
let jsContent = '';

// First pass to collect all scripts
while ((scriptMatch = scriptRegex.exec(indexContent)) !== null) {
  const src = scriptMatch[1];
  
  // Only process local scripts, not CDN references
  if (src.startsWith('js/')) {
    const scriptType = scriptMatch[0].includes('type="module"') ? 'module' : 'regular';
    
    // For module scripts, we need to process imports
    if (scriptType === 'module') {
      jsContent += processJsModule(src);
    } else {
      // For regular scripts, just include the content
      jsContent += `\n/* File: ${src} */\n${readJsFile(src)}\n`;
    }
    
    // Remove the script tag since we're inlining it
    indexContent = indexContent.replace(
      scriptMatch[0],
      `<!-- Script inlined: ${src} -->`
    );
  }
}

// Remove the component loader script since we don't need it anymore
indexContent = indexContent.replace(
  /<script src="js\/components-loader\.js"><\/script>/,
  '<!-- Component loader removed in combined version -->'
);

// Create a single inlined script tag for all JS content
const inlinedScriptTag = `
<!-- All JavaScript inlined below -->
<script>
${jsContent}

// Initialize the application manually since we removed the module script tags
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initApplication === 'function') {
    initApplication();
  }
});
</script>
`;

// Add the consolidated scripts before the closing body tag
indexContent = indexContent.replace(
  '</body>',
  `${inlinedScriptTag}\n${inlineScripts ? '<!-- Consolidated inline scripts from components -->\n' + inlineScripts + '\n' : ''}</body>`
);

// Inline CSS files
const cssLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*?)["'][^>]*>/g;
let cssMatch;

while ((cssMatch = cssLinkRegex.exec(indexContent)) !== null) {
  const href = cssMatch[1];
  
  // Only process local CSS files, not CDN references
  if (href.startsWith('css/')) {
    try {
      const cssPath = path.join(__dirname, '..', href);
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Replace the link tag with an inline style tag
      indexContent = indexContent.replace(
        cssMatch[0],
        `<!-- CSS inlined from ${href} -->\n<style>\n${cssContent}\n</style>`
      );
      
      console.log(`Inlined CSS file: ${href}`);
    } catch (error) {
      console.error(`Error reading CSS file ${href}:`, error);
    }
  }
}

// Write the combined file
fs.writeFileSync(outputPath, indexContent);
console.log(`Combined HTML file with inlined JS/CSS created at: ${outputPath}`);