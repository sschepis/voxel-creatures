// Component Loader - Dynamically loads HTML components into the page

document.addEventListener('DOMContentLoaded', async () => {
  // Identify all component placeholders
  const componentPlaceholders = document.querySelectorAll('[data-component]');
  
  // Load each component
  for (const placeholder of componentPlaceholders) {
    const componentPath = placeholder.getAttribute('data-component');
    try {
      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${componentPath}`);
      }
      
      const html = await response.text();
      placeholder.innerHTML = html;
      
      // Dispatch event after component is loaded (for any initialization code)
      placeholder.dispatchEvent(new CustomEvent('component-loaded'));
    } catch (error) {
      console.error(`Error loading component ${componentPath}:`, error);
      placeholder.innerHTML = `<div class="error">Failed to load component: ${componentPath}</div>`;
    }
  }
  
  // Dispatch event when all components are loaded
  document.dispatchEvent(new CustomEvent('components-loaded'));
});