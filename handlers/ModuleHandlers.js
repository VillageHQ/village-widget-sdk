import { ModuleTypes } from "../consts";
import { logWidgetError } from "../utils/errorLogger";
import { AnalyticsService } from "../services/analytics.service";

export class ModuleHandlers {
  constructor(app) {
    this.app = app;
    this.listenerMap = new WeakMap(); // Tracks listeners for cleanup
    this.syncUrlElements = new Map(); // Tracks elements with data-url <Element, string>
    this.elementsWithListeners = new Set(); // Track all elements with active listeners attached by this handler
  }

  // Restored original handleDataUrl
  handleDataUrl(element, url) {
    this.removeListener(element); // Remove previous general listeners
    this.syncUrlElements.set(element, url); // Track this element and its URL

    const clickHandler = () => {
      AnalyticsService.trackButtonClick({
        type: "paths",
        url,
        partnerKey: this.app.partnerKey,
      });

      this.app.url = url;
      this.app.module = null; // Explicitly null for data-url
      this.app.renderIframe();
    };
    this.listenerMap.set(element, clickHandler);
    element.addEventListener("click", clickHandler);
    this.elementsWithListeners.add(element); // Track element

    this.app.initializeButtonState(element);
    if (this.app.token) {
      this.app.checkPathsAndUpdateButton(element, url);
    }
  }

  // Restored original handleModule (primarily for SYNC onboarding click)
  handleModule(element, moduleValue) {
    // If an element switches from data-url to module="sync", stop tracking it here
    this.syncUrlElements.delete(element);
    // Basic validation
    if (!Object.values(ModuleTypes).includes(moduleValue)) {
      console.warn(`Invalid module type: ${moduleValue}`);
      return;
    }

    this.removeListener(element);
    const clickHandler = () => {
      try {
        AnalyticsService.trackButtonClick({
          type: "onboarding", // Assuming non-url module is onboarding
          module: moduleValue,
          partnerKey: this.app.partnerKey,
        });

        this.app.url = null; // No URL for module-based trigger
        this.app.module = moduleValue;
        this.app.renderIframe();
      } catch (error) {
        logWidgetError(error, {
          additionalInfo: {
            function: "handleModule (click)",
            moduleValue,
            element,
          },
        });
      }
    };
    this.listenerMap.set(element, clickHandler);
    element.addEventListener("click", clickHandler);
    this.elementsWithListeners.add(element); // Track element
    // No initial button state/path check needed for non-url modules here
  }

  removeListener(element) {
    const existingHandler = this.listenerMap.get(element);
    if (existingHandler) {
      element.removeEventListener("click", existingHandler);
    }
    // Also clean up tracking if listener is removed externally
    this.syncUrlElements.delete(element);
    this.elementsWithListeners.delete(element); // Stop tracking if listener is removed
  }

  // Method to get tracked elements for refresh
  getSyncUrlElements() {
    return this.syncUrlElements; // Returns the Map <Element, string>
  }

  // Method to get all tracked elements for destroy cleanup
  getAllElementsWithListeners() {
    return this.elementsWithListeners;
  }
}
