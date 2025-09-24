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

  triggerPathsOpen(url) {
    if (!url || !this.isValidUrl(url)) {
      console.warn('[Village] Invalid URL provided to triggerPathsOpen:', url);
      return;
    }

    AnalyticsService.trackButtonClick({
      type: "paths",
      validURL: url,
      partnerKey: this.app.partnerKey,
    });

    this.app.url = url;
    this.app.module = null;
    this.app.renderIframe();
  }

  triggerSyncOpen() {
    AnalyticsService.trackButtonClick({
      type: "sync",
      partnerKey: this.app.partnerKey,
    });

    this.app.module = ModuleTypes.SYNC;
    this.app.url = null;
    this.app.renderIframe();
  }

  handleDataUrl(element, url) {
    if (!url || !this.isValidUrl(url)) {
      console.warn('[Village] Invalid URL in village-data-url attribute:', url);
      return;
    }

    this.app.elementRequests.delete(element);
    this.removeListener(element);
    this.syncUrlElements.set(element, url);

    const clickHandler = () => {
      this.triggerPathsOpen(url);
    };
    this.listenerMap.set(element, clickHandler);
    element.addEventListener("click", clickHandler);
    this.elementsWithListeners.add(element);
    if (url !== "") {
      this.app.initializeButtonState(element);
    }
    if (this.app.token) {
      this.app.checkPathsAndUpdateButton(element, url);
    }
  }

  handleModule(element, moduleValue) {
    this.app.elementRequests.delete(element);

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
    this.elementsWithListeners.add(element);
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
