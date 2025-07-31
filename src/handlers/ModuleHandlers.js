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
    const validURL = this.isValidUrl(url) ? url : "http://invalidURL.com";

    // ✅ ENHANCED: Clear any existing requests for this element
    this.app.elementRequests.delete(element);

    this.removeListener(element); // Remove previous general listeners
    this.syncUrlElements.set(element, validURL); // Track this element and its URL

    const clickHandler = (event) => {
      // Prevent default behavior to stop navigation
      event.preventDefault();
      event.stopPropagation();
      
      AnalyticsService.trackButtonClick({
        type: "paths",
        validURL,
        partnerKey: this.app.partnerKey,
      });

      this.app.url = validURL;
      this.app.module = null; // Explicitly null for data-url
      this.app.renderIframe();
    };
    this.listenerMap.set(element, clickHandler);
    element.addEventListener("click", clickHandler);
    this.elementsWithListeners.add(element); // Track element
    if (url !== "") {
      this.app.initializeButtonState(element);
    }
    if (this.app.token) {
      this.app.checkPathsAndUpdateButton(element, validURL);
    }
  }

  // Restored original handleModule (primarily for SYNC onboarding click)
  handleModule(element, moduleValue) {
    // ✅ ENHANCED: Clear any existing requests for this element
    this.app.elementRequests.delete(element);

    // If an element switches from data-url to module="sync", stop tracking it here
    this.syncUrlElements.delete(element);
    // Basic validation
    if (!Object.values(ModuleTypes).includes(moduleValue)) {
      console.warn(`Invalid module type: ${moduleValue}`);
      return;
    }

    this.removeListener(element);
    const clickHandler = (event) => {
      // Prevent default behavior to stop navigation
      event.preventDefault();
      event.stopPropagation();
      
      try {
        // Determine analytics type based on module
        const analyticsType = moduleValue === ModuleTypes.AUTOPILOT ? "autopilot" : "onboarding";
        
        AnalyticsService.trackButtonClick({
          type: analyticsType,
          module: moduleValue,
          partnerKey: this.app.partnerKey,
        });

        this.app.url = null; // No URL for module-based trigger
        this.app.module = moduleValue;
        
        // For autopilot, check if there's any config stored
        if (moduleValue === ModuleTypes.AUTOPILOT && window.Village?._autopilotConfig) {
          this.app.autopilotConfig = window.Village._autopilotConfig;
        }
        
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

    // ✅ ENHANCED: Clear any existing requests when removing listeners
    this.app.elementRequests.delete(element);

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

  isValidUrl(string) {
    if (!string || typeof string !== "string" || string.trim() === "") {
      return false;
    }

    const trimmed = string.trim();

    // Require the URL to start with http:// or https://
    if (!/^https?:\/\//i.test(trimmed)) {
      return false;
    }

    try {
      new URL(trimmed);
      return true;
    } catch (_) {
      return false;
    }
  }
}
