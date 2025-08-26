import {
  ModuleTypes,
  VILLAGE_URL_DATA_ATTRIBUTE,
  VILLAGE_MODULE_ATTRIBUTE,
} from "./consts";
import {
  Iframe,
  renderSearchIframeInsideElement,
  buildIframeSrc,
} from "./iframe";
import { MessageHandlers } from "./handlers/MessageHandlers";
import { ModuleHandlers } from "./handlers/ModuleHandlers";
import { AnalyticsService } from "./services/analytics.service";
import axios from "axios";
import Cookies from "js-cookie";
import { logWidgetError } from "./utils/errorLogger";

// Global singleton instance to prevent multiple initializations
let appInstance = null;

export class App {
  constructor(partnerKey, config) {
    // Singleton pattern - return existing instance if it exists
    if (appInstance) {
      return appInstance;
    }
    
    this.partnerKey = partnerKey;
    this.userReference = null;
    this.token = Cookies.get("village.token");
    this.config = config;
    this.url = null;
    this.module = null;
    this.iframe = null;
    this.observer = null;
    this.inlineSearchIframes = new Map();

    // Initialize services and handlers
    this.messageHandlers = new MessageHandlers(this);
    this.moduleHandlers = new ModuleHandlers(this);

    this.apiUrl = import.meta.env.VITE_APP_API_URL;
    this.hasRenderedButton = false;

    // ✅ FIXED: Per-element request tracking instead of global counter
    this.elementRequests = new Map(); // element -> Promise
    this.elementRequestIds = new Map(); // element -> latest request ID
    this.globalRequestCounter = 0; // Only for generating unique IDs
    
    // Signature-based tracking to prevent React re-render issues
    this.processedSignatures = new Set();
    
    // Init guard to prevent double initialization
    this.initialized = false;
    
    // Store singleton instance
    appInstance = this;
  }

  async init() {
    // Guard against multiple init calls
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    
    this.setupMessageHandlers();
    await this.getAuthToken();
    await this.getUser();

    // Delay DOM operations until after potential hydration
    this.delayedInitialize();
  }

  delayedInitialize() {
    // Ensure DOM operations happen after current render cycle
    requestAnimationFrame(() => {
      this.setupMutationObserver();
      this.scanExistingElements();
    });
  }

  setupMessageHandlers() {
    window.addEventListener("message", (event) => {
      this.messageHandlers.handle(event);
    });
  }

  setupMutationObserver() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
    });
  }

  handleMutations(mutations) {
    mutations.forEach((mutation) => {
      // Handle attribute changes on existing elements
      if (mutation.type === "attributes") {
        this.handleAttributeChange(mutation);
      } else if (mutation.type === "childList") {
        // Handle new elements added to the DOM
        this.handleNewElements(mutation);
      }
    });
  }

  // Handle attribute changes on existing elements
  handleAttributeChange(mutation) {
    const element = mutation.target;
    const attributeName = mutation.attributeName;

    const isVillageAttribute =
      attributeName === VILLAGE_URL_DATA_ATTRIBUTE ||
      attributeName === VILLAGE_MODULE_ATTRIBUTE;

    if (isVillageAttribute) {
      this.checkAndAddListenerIfValid(element);
    }
  }

  // Handle new elements added to the DOM
  handleNewElements(mutation) {
    mutation.addedNodes.forEach((node) => {
      // Skip non-element nodes (text nodes, comments, etc.)
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      // Check if the node itself has village attributes
      if (this.hasVillageAttributes(node)) {
        this.checkAndAddListenerIfValid(node);
        return;
      }

      // Check child elements for village attributes
      const selector = `[${VILLAGE_URL_DATA_ATTRIBUTE}], [${VILLAGE_MODULE_ATTRIBUTE}]`;
      node.querySelectorAll(selector).forEach((el) => {
        this.checkAndAddListenerIfValid(el);
      });
    });
  }

  // Check if an element has any village attributes
  hasVillageAttributes(element) {
    return (
      element.hasAttribute(VILLAGE_URL_DATA_ATTRIBUTE) ||
      element.hasAttribute(VILLAGE_MODULE_ATTRIBUTE)
    );
  }

  checkAndAddListenerIfValid(element) {
    this.addListenerToElement(element);
  }

  async addListenerToElement(element) {
    // Check signature to prevent reprocessing same element in React re-renders
    const signature = this.getElementSignature(element);
    if (this.processedSignatures.has(signature)) {
      return; // Already processed this element
    }
    this.processedSignatures.add(signature);
    
    // Immediately hide ALL state elements to prevent any flash or overlap
    const allStates = element.querySelectorAll('[village-paths-availability]');
    allStates.forEach(el => {
      el.style.display = "none";
    });
    
    // Clear any existing requests for this element when re-processing
    this.elementRequests.delete(element);
    this.elementRequestIds.delete(element);

    const url = element.getAttribute(VILLAGE_URL_DATA_ATTRIBUTE);
    const villageModule = element.getAttribute(VILLAGE_MODULE_ATTRIBUTE);

    // Check if it's the SEARCH module type
    if (villageModule === ModuleTypes.SEARCH) {
      const params = {
        partnerKey: this.partnerKey,
        userReference: this.userReference,
        token: this.token,
      };
      // Render and store the created iframe
      const inlineIframe = renderSearchIframeInsideElement(element, params);
      if (inlineIframe) {
        this.inlineSearchIframes.set(element, inlineIframe);
      }
    } else {
      // Handle SYNC module (explicit or legacy data-url) by attaching click listener for overlay
      // Remove any potentially stale inline iframe reference if the module type changes
      this.inlineSearchIframes.delete(element);
      //this.moduleHandlers.handleDataUrl(element, url);
      if (
        url &&
        villageModule != ModuleTypes.SYNC &&
        villageModule != ModuleTypes.SEARCH
      ) {
        this.moduleHandlers.handleDataUrl(element, url);
      } else {
        // Explicit SYNC module or unknown -> attach click listener via handleModule
        this.moduleHandlers.handleModule(
          element,
          villageModule || ModuleTypes.SYNC
        );
      }

      // Track initial button render for SYNC/legacy types
      if (!this.hasRenderedButton) {
        this.hasRenderedButton = true;
        AnalyticsService.trackButtonRender({ partnerKey: this.partnerKey });
      }
    }
  }

  extractTokenFromQueryParams() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('villageToken');
    if (token) {
      // Remove token from URL to keep things clean
      url.searchParams.delete('villageToken');
      const cleanUrl = url.pathname + url.search + url.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      return token;
    }
    return null;
  }

  updateCookieToken(token) {
      // Clear all requests before setting new token
      this._clearAllRequests();
    if (this.isTokenValid(token)) {
      this.saveExtensionToken(token);
      
      const cookieOptions = { 
        secure: location.protocol === 'https:', 
        expires: 60, 
        path: "/" 
      };
      
      Cookies.set('village.token', token, cookieOptions);
      
      if (this.token != token) {
        this.token = token;
        this._refreshInlineSearchIframes();
      }
    } else {
      // console.log('[Village SDK] Invalid token provided to updateCookieToken:', token);
    }
  }

  isTokenValid(token) {
    return typeof token === 'string' && token.length > 10 && token !== 'not_found';
  }

  async getAuthToken(timeout = 1000) {
    
    let token = Cookies.get('village.token');
    
    if (!this.isTokenValid(token)) {
      token = this.extractTokenFromQueryParams();
    }
    
    if (!this.isTokenValid(token)) {
      try {
        token = await this.requestExtensionToken(timeout);
      } catch (err) {
        // console.log('[Village SDK] Extension fallback failed:', err.message);
      }
    }

    if (this.isTokenValid(token)) {
      this.updateCookieToken(token);
    } else {
      // console.log('[Village SDK] No valid token available');
    }
    return token;
  }


  requestExtensionToken(timeout) {
    const request = { type: 'STORAGE_GET_TOKEN', source: 'VillageSDK' };

    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.source !== window) return;
        const { source, message } = event.data || {};
        
        if ((source === 'VillageExtension' || source === 'VillageSDK') && message?.token) {
          window.removeEventListener('message', listener);
          clearTimeout(timer);
          resolve(message.token);
        }
      };

      const timer = setTimeout(() => {
        window.removeEventListener('message', listener);
        reject(new Error(`Extension did not respond in time ${timeout}`));
      }, timeout);

      window.addEventListener('message', listener);
      window.postMessage(request, '*');
    });
  }

  saveExtensionToken(token) {
    const request = { type: 'STORAGE_SET_TOKEN', source: 'VillageSDK', token: token };
    window.postMessage(request, '*');
  }

  async getUser() {
    const token = await this.getAuthToken();
    if (!token) return;

    try {
      const { data: user } = await axios.get(`${this.apiUrl}/user`, {
        headers: { "x-access-token": token, "app-public-key": this.partnerKey },
      });

      if (!user?.id) throw new Error("No user ID");

      const userId = `${user?.id}`;
      AnalyticsService.setUserId(userId);
    } catch (error) {
      // Clear all requests when token becomes invalid
      this._clearAllRequests();
      this.token = null;
      Cookies.remove("village.token");
      AnalyticsService.removeUserId();
    }
  }

  handleOAuthRequest() {
    const baseUrl = `${import.meta.env.VITE_APP_FRONTEND_URL}/widget/oauth`;
    const params = new URLSearchParams();

    if (this.partnerKey) params.append("partnerKey", this.partnerKey);
    if (this.userReference) params.append("userReference", this.userReference);

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    window.open(url, "paas-oauth", "popup=true,width=500,height=600");
  }

  handleOAuthSuccess(data) {
    this.updateCookieToken(data.token);

    // -- Update Inline Search Iframes by reloading them with the new token --
    this._refreshInlineSearchIframes();

    // -- Re-evaluate SYNC buttons on the host page --
    this.refreshSyncUrlElements(); // Call new method to update sync buttons

    // Re-render the main overlay iframe (if it was open, e.g., during onboarding)
    this.renderIframe();
  }

  _refreshInlineSearchIframes() {
    this.inlineSearchIframes.forEach((iframe) => {
      if (iframe && iframe.contentWindow) {
        const params = {
          partnerKey: this.partnerKey,
          userReference: this.userReference,
          token: this.token,
          module: ModuleTypes.SEARCH,
        };
        iframe.src = buildIframeSrc(params);
      }
    });
  }

  handleOAuthError() {
    alert("Sorry, something went wrong with your login");
  }

  handleRemoveIframe() {
    this.url = null;
    this.module = null;
    this.renderIframe();
  }

  handleIframeLoaded() {
    if (this.iframe) {
      this.iframe.hideSpinner();
    }
  }

  scanExistingElements() {
    const query = `[${VILLAGE_URL_DATA_ATTRIBUTE}], [${VILLAGE_MODULE_ATTRIBUTE}]`;
    const elements = document.querySelectorAll(query);

    elements.forEach((el) => {
      this.checkAndAddListenerIfValid(el);
    });
  }

  async checkPaths(url) {
    if (!this.token) {
      this.token = await this.getAuthToken();
    }
    if (!this.token) return null;
    try {
      const { data } = await axios.post(
        `${this.apiUrl}/paths-check`,
        { url },
        {
          headers: {
            "x-access-token": this.token,
            "app-public-key": this.partnerKey,
          },
        }
      );
      return data;
    } catch (err) {
      if (err?.response?.data?.auth === false) {
        // Clear all requests when auth fails
        this._clearAllRequests();
        Cookies.remove("village.token");
        this.token = null;
      }
      return null;
    }
  }

  getButtonChildren(element) {
    const foundElement = element.querySelector(
      '[village-paths-availability="found"]'
    );
    const notFoundElement = element.querySelector(
      '[village-paths-availability="not-found"]'
    );
    const loadingElement = element.querySelector(
      '[village-paths-availability="loading"]'
    );

    // DEPRECATED, SHOULD BE ALWAYS HIDDEN
    const errorElement = element.querySelector(
      '[village-paths-availability="error"]'
    );
    if (errorElement) {
      errorElement.style.display = "none";
    }
    const not_activated = element.querySelector(
      '[village-paths-availability="not-activated"]'
    );

    return {
      foundElement,
      notFoundElement,
      loadingElement,
      errorElement,
      not_activated,
    };
  }

  initializeButtonState(element) {
    // First ensure ALL states are hidden to prevent overlap
    const allStates = element.querySelectorAll('[village-paths-availability]');
    allStates.forEach(el => {
      el.style.display = "none";
    });
    
    // Use atomic state management for consistency
    if (!this.token) {
      this._setElementState(element, "not-found");
    } else {
      this._setElementState(element, "loading");
    }
  }

  async checkPathsAndUpdateButton(element, url) {
    // Deduplication - if request already exists, return existing promise
    const existingRequest = this.elementRequests.get(element);
    if (existingRequest) {
      return existingRequest;
    }

    // Version check for stale request prevention
    const requestId = ++this.globalRequestCounter;

    const requestPromise = this._executePathCheck(element, url, requestId);
    this.elementRequests.set(element, requestPromise);
    this.elementRequestIds.set(element, requestId);

    try {
      await requestPromise;
    } finally {
      this.elementRequests.delete(element);
      this.elementRequestIds.delete(element);
    }
  }

  async _executePathCheck(element, url, requestId) {
    // Atomic state update
    this._setElementState(element, "loading");

    try {
      const data = await this.checkPaths(url);

      // ✅ FIXED: Only allow the exact latest request to update UI
      if (requestId === this.elementRequestIds.get(element)) {
        this._setElementState(
          element,
          data?.relationship ? "found" : "not-found",
          data?.relationship
        );
      }
    } catch (error) {
      logWidgetError(error, {
        additionalInfo: {
          function: "_executePathCheck",
          url,
          element,
        },
      });

      // ✅ FIXED: Only allow the exact latest request to update UI
      if (requestId === this.elementRequestIds.get(element)) {
        this._setElementState(element, "not-found");
      }
    }
  }

  // ✅ ATOMIC: Centralized state management prevents race conditions
  _setElementState(element, state, relationship = null) {
    const {
      foundElement,
      notFoundElement,
      loadingElement,
      errorElement,
      not_activated,
    } = this.getButtonChildren(element);

    // Hide ALL states atomically with important flag to ensure they're hidden
    [foundElement, notFoundElement, loadingElement, errorElement, not_activated]
      .filter(Boolean)
      .forEach((el) => {
        el.style.display = "none";
        el.setAttribute('style', 'display: none !important');
      });

    // Show ONLY the appropriate state (overriding CSS with inline styles)
    switch (state) {
      case "loading":
        if (loadingElement) {
          loadingElement.style.cssText = 'display: inline-flex !important';
        }
        break;
      case "found":
        if (foundElement) {
          foundElement.style.cssText = 'display: inline-flex !important';
          if (relationship)
            this.addFacePilesAndCount(foundElement, relationship);
        }
        break;
      case "not-found":
        if (notFoundElement) {
          notFoundElement.style.cssText = 'display: inline-flex !important';
        }
        break;
      case "error":
        // Never show error state - show not-found instead
        if (notFoundElement) {
          notFoundElement.style.cssText = 'display: inline-flex !important';
        }
        break;
    }
  }

  // Clear all requests (used during auth changes)
  _clearAllRequests() {
    this.elementRequests.clear();
    this.elementRequestIds.clear();
    this.globalRequestCounter += 1000; // Invalidate old requests
    // Clear processed signatures so elements can be reprocessed after auth errors
    this.processedSignatures?.clear();
  }
  
  // Generate a unique signature for an element based on its attributes and content
  getElementSignature(element) {
    const url = element.getAttribute(VILLAGE_URL_DATA_ATTRIBUTE) || '';
    const module = element.getAttribute(VILLAGE_MODULE_ATTRIBUTE) || '';
    const id = element.id || '';
    const textContent = element.textContent?.trim().substring(0, 100) || '';
    return `${url}|${module}|${id}|${textContent}`;
  }

  addFacePilesAndCount(element, relationship) {
    const facePilesContainer = element.querySelector(
      '[village-paths-data="facepiles"]'
    );

    if (facePilesContainer) {
      facePilesContainer.innerHTML = `${relationship.paths.avatars
        .slice(0, 3)
        .map(
          (avatar) =>
            `<img src="${avatar}" onerror="this.src='https://randomuser.me/api/portraits/thumb/women/75.jpg';this.classList.add('village-facepiler-avatar-not-found')" />`
        )
        .join("")}`;
    }

    const countContainer = element.querySelector(
      '[village-paths-data="count"]'
    );

    if (countContainer) {
      countContainer.innerHTML = relationship.paths.count;
    }
  }

  updateButtonContent(element, relationship) {
    // Redirect to atomic state management for consistency
    this._setElementState(
      element,
      relationship ? "found" : "not-found",
      relationship
    );
  }

  async renderIframe() {
    if (!this.iframe) {
      this.iframe = new Iframe();
    }
    if (!this.token) {
      this.token = await this.getAuthToken();
    }
    this.iframe.update({
      partnerKey: this.partnerKey,
      userReference: this.userReference,
      token: this.token,
      url: this.url,
      module: this.module,
      config: this.config,
    });

    this.iframe.render(document.body);
  }

  setUserReference(userReference, details = null) {
    return new Promise((resolve, reject) => {
      try {
        this.userReference = userReference;

        this.renderIframe();

        if (details?.team) {
          this.upsertTeam(details.team);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async upsertTeam(team) {
    if (!this.token || !team) return;

    try {
      await axios.post(
        `${this.apiUrl}/v1/teams/upsert`,
        { teamId: team.id, teamName: team.name },
        {
          params: { partnerKey: this.partnerKey },
          headers: { "x-access-token": this.token },
        }
      );
    } catch (error) {
      console.error(
        "[VILLAGE-PAAS] Failed to link user to team:",
        error.message
      );
    }
  }

  destroy() {
    // Clear all active requests
    this._clearAllRequests();

    // Clear processed signatures
    this.processedSignatures.clear();

    // Disconnect MutationObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clean up inline search iframes
    this.inlineSearchIframes.forEach((iframe, element) => {
      if (iframe.parentNode === element) {
        element.removeChild(iframe);
      }
    });
    this.inlineSearchIframes.clear();

    // Remove listeners attached by ModuleHandlers
    const elements = this.moduleHandlers.getAllElementsWithListeners();
    elements.forEach((element) => {
      this.moduleHandlers.removeListener(element);
    });
    // Note: ModuleHandlers.removeListener also clears internal tracking sets/maps

    // Clean up main overlay iframe if it exists
    if (this.iframe && this.iframe.element && this.iframe.element.parentNode) {
      this.iframe.element.parentNode.removeChild(this.iframe.element);
    }
    if (this.iframe && this.iframe.spinner && this.iframe.spinner.parentNode) {
      this.iframe.spinner.parentNode.removeChild(this.iframe.spinner);
    }
    this.iframe = null;

    // Clear singleton instance reference
    if (appInstance === this) {
      appInstance = null;
    }
    
    // Reset initialization flag
    this.initialized = false;
  }

  // New method placeholder
  refreshSyncUrlElements() {
    // Get the map of tracked elements and their URLs
    const elementsToRefresh = this.moduleHandlers.getSyncUrlElements();
    elementsToRefresh.forEach((url, element) => {
      // Re-initialize button state (important to show loading indicator)
      this.initializeButtonState(element);
      // Re-trigger path check with the new token
      this.checkPathsAndUpdateButton(element, url);
    });
  }

  async logout() {
    // Clear all requests before logout
    this._clearAllRequests();

    try {
      if (this.token) {
        await axios.get(`${this.apiUrl}/logout`, {
          headers: {
            "x-access-token": this.token,
            "app-public-key": this.partnerKey,
          },
        });
      }
    } catch (error) {}

    // Clear local state regardless of API call success
    Cookies.remove("village.token");
    this.token = null;
    AnalyticsService.removeUserId(); // Clear analytics user ID

    // Refresh SYNC button states to reflect logged-out status
    this.refreshSyncUrlElements();

    // Reload inline search iframes without token
    this._refreshInlineSearchIframes();
  }
}
