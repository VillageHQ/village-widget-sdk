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

export class App {
  constructor(partnerKey, config) {
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

    // Initialize cookie logging
    this._logCookieInfo('constructor', 'Initializing Village SDK');
  }

  // Cookie and token logging utility
  _logCookieInfo(method, message, extraData = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      message,
      domain: location.hostname,
      protocol: location.protocol,
      userAgent: navigator.userAgent.substring(0, 100),
      currentToken: this.token ? `${this.token.substring(0, 10)}...` : 'null',
      cookieValue: Cookies.get('village.token') ? `${Cookies.get('village.token').substring(0, 10)}...` : 'null',
      ...extraData
    };
    
    console.log(`[VILLAGE-SDK-COOKIE] ${method}:`, logData);
  }

  async init() {
    this.setupMessageHandlers();
    await this.getAuthToken();
    
    // Add small delay to prevent interference with OAuth callbacks
    setTimeout(() => {
      this.getUser();
    }, 500);

    // Delay DOM operations until after potential hydration
    this.delayedInitialize();
  }

  delayedInitialize() {
    // Use multiple requestAnimationFrame calls to ensure we're after hydration
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.setupMutationObserver();
        this.scanExistingElements();
      });
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

  isValidUrl(string) {
    if (!string || typeof string !== 'string' || string.trim() === '') {
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

  checkAndAddListenerIfValid(element) {
    const hasUrlAttr = element.hasAttribute(VILLAGE_URL_DATA_ATTRIBUTE);
    let url = '';
    if (hasUrlAttr) {
      url = element.getAttribute(VILLAGE_URL_DATA_ATTRIBUTE);
      if (!this.isValidUrl(url)) {
        console.warn("Skipping element due to invalid URL:", element);
        this.showErrorState(element);
        this.moduleHandlers.handleDataUrl(element, '');
        return;
      }
    } else {
      //console.log("checkAndAddListenerIfValid hasUrlAttr==false:", element);
    }
    this.addListenerToElement(element);
  }

  async addListenerToElement(element) {
    // Clear any existing requests for this element when re-processing
    this.elementRequests.delete(element);
    this.elementRequestIds.delete(element);

    const url = element.getAttribute(VILLAGE_URL_DATA_ATTRIBUTE);
    const villageModule = element.getAttribute(VILLAGE_MODULE_ATTRIBUTE);

    // Check if it's the SEARCH module type
    if (villageModule === ModuleTypes.SEARCH) {
      // Only render iframes on the client-side to avoid SSR hydration issues
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
    
    const cookieAttributes = { 
      secure: location.protocol === 'https:', 
      expires: 60, 
      path: "/" 
    };
    
    this._logCookieInfo('updateCookieToken', 'Attempting to update cookie token', {
      tokenLength: token ? token.length : 0,
      isValid: this.isTokenValid(token),
      cookieAttributes,
      currentLocation: location.href
    });
    
    if (this.isTokenValid(token)) {
      this.saveExtensionToken(token);
      
      try {
        Cookies.set('village.token', token, cookieAttributes);
        this._logCookieInfo('updateCookieToken', 'Cookie set successfully', {
          tokenPreview: `${token.substring(0, 10)}...`,
          cookieAttributes
        });
      } catch (error) {
        this._logCookieInfo('updateCookieToken', 'Failed to set cookie', {
          error: error.message,
          cookieAttributes
        });
      }
      
      if (this.token != token) {
        this.token = token;
        this._refreshInlineSearchIframes();
        this._logCookieInfo('updateCookieToken', 'Token updated, refreshing iframes');
      }
    } else {
      this._logCookieInfo('updateCookieToken', 'Invalid token provided', {
        tokenType: typeof token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'null'
      });
    }
  }

  isTokenValid(token) {
    const basicCheck = typeof token === 'string' && token.length > 10 && token !== 'not_found';
    
    if (!basicCheck) {
      this._logCookieInfo('isTokenValid', 'Token validation failed - basic check', {
        tokenType: typeof token,
        tokenLength: token ? token.length : 0,
        tokenValue: token,
        reason: !token ? 'no token' : 
                typeof token !== 'string' ? 'not string' :
                token.length <= 10 ? 'too short' :
                token === 'not_found' ? 'not_found value' : 'unknown'
      });
      return false;
    }
    
    // Check JWT expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        this._logCookieInfo('isTokenValid', 'Token validation failed - expired', {
          tokenExpiry: payload.exp,
          currentTime: now,
          expiredBy: now - payload.exp
        });
        return false;
      }
      
      this._logCookieInfo('isTokenValid', 'Token validation passed', {
        tokenExpiry: payload.exp,
        currentTime: now,
        expiresIn: payload.exp - now
      });
      
    } catch (error) {
      this._logCookieInfo('isTokenValid', 'Token validation failed - invalid JWT', {
        error: error.message,
        tokenPreview: token.substring(0, 20) + '...'
      });
      return false;
    }
    
    return true;
  }

  async getAuthToken(timeout = 1000) {
    this._logCookieInfo('getAuthToken', 'Starting token retrieval process', {
      timeout,
      currentLocation: location.href
    });
    
    let token = Cookies.get('village.token');
    this._logCookieInfo('getAuthToken', 'Retrieved token from cookie', {
      hasToken: !!token,
      isValid: this.isTokenValid(token),
      tokenLength: token ? token.length : 0
    });
    
    if (!this.isTokenValid(token)) {
      token = this.extractTokenFromQueryParams();
      this._logCookieInfo('getAuthToken', 'Extracted token from query params', {
        hasToken: !!token,
        isValid: this.isTokenValid(token),
        tokenLength: token ? token.length : 0
      });
    }
    
    if (!this.isTokenValid(token)) {
      try {
        this._logCookieInfo('getAuthToken', 'Attempting to get token from extension', { timeout });
        token = await this.requestExtensionToken(timeout);
        this._logCookieInfo('getAuthToken', 'Got token from extension', {
          hasToken: !!token,
          isValid: this.isTokenValid(token),
          tokenLength: token ? token.length : 0
        });
      } catch (err) {
        this._logCookieInfo('getAuthToken', 'Extension token request failed', {
          error: err.message,
          timeout
        });
      }
    }

    if (this.isTokenValid(token)) {
      this._logCookieInfo('getAuthToken', 'Valid token found, updating cookie');
      this.updateCookieToken(token);
    } else {
      this._logCookieInfo('getAuthToken', 'No valid token found', {
        tokenType: typeof token,
        tokenValue: token
      });
    }
    
    return token;
  }

  /**
   * Faz um round-trip com a extensão via window.postMessage.
   * Resolve com o token ou lança erro após o timeout.
   */
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
    // Don't interfere with ongoing OAuth flows
    const isOAuthCallback = window.location.search.includes('code=') || 
                          window.location.search.includes('state=') ||
                          window.location.pathname.includes('/login');
    
    if (isOAuthCallback) {
      this._logCookieInfo('getUser', 'Skipping user validation during OAuth callback', {
        currentLocation: window.location.href,
        hasCodeParam: window.location.search.includes('code='),
        hasStateParam: window.location.search.includes('state='),
        isLoginPath: window.location.pathname.includes('/login')
      });
      return;
    }
    
    const token = await this.getAuthToken();
    
    this._logCookieInfo('getUser', 'Starting user validation', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      apiUrl: this.apiUrl,
      partnerKey: this.partnerKey
    });
    
    if (!token) {
      this._logCookieInfo('getUser', 'No token available for user validation');
      return;
    }

    try {
      const { data: user } = await axios.get(`${this.apiUrl}/user`, {
        headers: { "x-access-token": token, "app-public-key": this.partnerKey },
      });

      this._logCookieInfo('getUser', 'User API call successful', {
        hasUserId: !!user?.id,
        userId: user?.id,
        userKeys: user ? Object.keys(user) : []
      });

      if (!user?.id) {
        this._logCookieInfo('getUser', 'No user ID in response', {
          userData: user,
          reason: 'missing user ID'
        });
        throw new Error("No user ID");
      }

      const userId = `${user?.id}`;
      AnalyticsService.setUserId(userId);
      
      this._logCookieInfo('getUser', 'User validation successful', {
        userId: userId
      });
      
    } catch (error) {
      // Only remove tokens for specific auth errors, not network errors
      const shouldRemoveToken = error.response?.status === 401 || 
                               error.response?.status === 403 ||
                               error.message.includes('No user ID');
      
      this._logCookieInfo('getUser', 'User validation failed', {
        reason: 'auth error or no user ID',
        errorMessage: error.message,
        errorStatus: error.response?.status,
        errorStatusText: error.response?.statusText,
        errorData: error.response?.data,
        apiUrl: this.apiUrl,
        willRemoveToken: shouldRemoveToken
      });
      
      if (shouldRemoveToken) {
        // Clear all requests when token becomes invalid
        this._clearAllRequests();
        this.token = null;
        
        this._logCookieInfo('getUser', 'Removing invalid token cookie', {
          reason: 'confirmed auth failure',
          errorStatus: error.response?.status
        });
        Cookies.remove("village.token");
        AnalyticsService.removeUserId();
      } else {
        this._logCookieInfo('getUser', 'Keeping token despite error', {
          reason: 'network error or temporary failure',
          errorStatus: error.response?.status
        });
      }
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

    elements.forEach((el, index) => {
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
        
        this._logCookieInfo('checkPaths', 'Removing token cookie due to auth failure', {
          apiUrl: this.apiUrl,
          error: err.message
        });
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

    // Hide all states atomically
    [foundElement, notFoundElement, loadingElement, errorElement, not_activated]
      .filter(Boolean)
      .forEach((el) => (el.style.display = "none"));

    // Show appropriate state
    switch (state) {
      case "loading":
        if (loadingElement) loadingElement.style.display = "inline-flex";
        break;
      case "found":
        if (foundElement) {
          foundElement.style.display = "inline-flex";
          if (relationship)
            this.addFacePilesAndCount(foundElement, relationship);
        }
        break;
      case "not-found":
        if (notFoundElement) notFoundElement.style.display = "inline-flex";
        break;
    }
  }

  // Clear all requests (used during auth changes)
  _clearAllRequests() {
    this.elementRequests.clear();
    this.elementRequestIds.clear();
    this.globalRequestCounter += 1000; // Invalidate old requests
  }

  // Show error state for invalid URLs
  showErrorState(element) {
    this._logCookieInfo('showErrorState', 'Showing error state for invalid URL', {
      elementTag: element.tagName,
      elementId: element.id,
      elementClass: element.className
    });
    this._setElementState(element, "not-found");
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
    // console.trace('renderIframe', location.hostname, this.token, this.config);
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

    // Clear any other potential references or intervals if added later
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
    this._logCookieInfo('logout', 'Removing token cookie during logout', {
      apiUrl: this.apiUrl
    });
    Cookies.remove("village.token");
    this.token = null;
    AnalyticsService.removeUserId(); // Clear analytics user ID

    // Refresh SYNC button states to reflect logged-out status
    this.refreshSyncUrlElements();

    // Reload inline search iframes without token
    this._refreshInlineSearchIframes();
  }
}
