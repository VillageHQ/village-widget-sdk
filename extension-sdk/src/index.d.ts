/**
 * Village Extension SDK TypeScript definitions
 */

/**
 * Configuration for ServiceWorker
 */
export interface ServiceWorkerConfig {
  /**
   * Village API URL
   */
  apiUrl: string;

  /**
   * Village frontend URL
   */
  frontendUrl: string;
}

/**
 * Configuration for ContentScript
 */
export interface ContentScriptConfig {
  [key: string]: any;
}

/**
 * Initialize the Village extension service worker
 * @param config - Configuration object
 */
export function initServiceWorker(config?: ServiceWorkerConfig): boolean;

/**
 * Initialize the Village extension content script
 * @param config - Optional configuration object
 */
export function initContentScript(config?: ContentScriptConfig): boolean;

/**
 * Village Extension SDK
 */
declare const Village: {
  /**
   * Initialize the Village extension service worker
   * @param config - Configuration object
   */
  initServiceWorker: typeof initServiceWorker;

  /**
   * Initialize the Village extension content script
   * @param config - Optional configuration object
   */
  initContentScript: typeof initContentScript;
};

export default Village;
