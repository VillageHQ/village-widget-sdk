import ServiceWorkerImpl from "./service-worker";
import ContentScriptImpl from "./content-script";

/**
 * Initialize the Village extension service worker
 * @param {Object} config - Configuration object
 * @param {string} config.apiUrl - Village API URL
 * @param {string} config.frontendUrl - Village frontend URL
 */
export function initServiceWorker(config) {
  try {
    ServiceWorkerImpl(config);

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Initialize the Village extension content script
 * @param {Object} config - Optional configuration object
 */
export function initContentScript(config = {}) {
  try {
    // Initialize the content script implementation with the config
    ContentScriptImpl(config);

    return true;
  } catch (error) {
    throw error;
  }
}

const Village = {
  initServiceWorker,
  initContentScript,
};

export default Village;
