// Village SDK Module - Importable wrapper for the existing widget
import "./styles.css";
import { VillageEvents } from "./config/village-events.js";

// Import and execute the existing widget code to set up window.Village
// This ensures all the same functionality and flow
import "./index.js";

// Wait for the widget to be available and then export it
function getVillageFromWindow() {
  if (typeof window !== 'undefined' && window.Village) {
    return window.Village;
  }
  
  // If window.Village is not available yet, return a proxy that will work when it's ready
  return new Proxy({}, {
    get(target, prop) {
      if (typeof window !== 'undefined' && window.Village && window.Village[prop]) {
        return typeof window.Village[prop] === 'function' 
          ? window.Village[prop].bind(window.Village)
          : window.Village[prop];
      }
      
      // Return a placeholder function that warns if Village isn't ready
      return function(...args) {
        console.warn(`[Village] ${prop} called before Village SDK is ready. Make sure to call Village.init() first.`);
      };
    }
  });
}

// Get the Village instance
const Village = getVillageFromWindow();

// Export for module usage - this allows import Village from './village-module.js'
export { VillageEvents };
export default Village;
