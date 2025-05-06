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
  }

  async init() {
    console.log('setupMessageHandlers');
    this.setupMessageHandlers();
    console.log('setupMutationObserver');
    this.setupMutationObserver();
    console.log('scanExistingElements');
    this.scanExistingElements();
    console.log('getUser');
    this.getUser();
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
      console.log("checkAndAddListenerIfValid addListenerToElement URL:", url);
    }else{
      console.log("checkAndAddListenerIfValid hasUrlAttr==false:", element);
    }
    this.addListenerToElement(element);
  }


  async addListenerToElement(element) {
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
      this.inlineSearchIframes.set(element, inlineIframe);
    } else {
      // Handle SYNC module (explicit or legacy data-url) by attaching click listener for overlay
      // Remove any potentially stale inline iframe reference if the module type changes
      this.inlineSearchIframes.delete(element);
      if (url && !villageModule) {
        // Legacy: data-url only -> attach click listener via handleDataUrl
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

  async getUser() {
    const token = Cookies.get("village.token");
    if (!token) return;

    try {
      const { data: user } = await axios.get(`${this.apiUrl}/user`, {
        headers: { "x-access-token": token, "app-public-key": this.partnerKey },
      });

      if (!user?.id) throw new Error("No user ID");

      const userId = `${user?.id}`;
      AnalyticsService.setUserId(userId);
    } catch (error) {
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
    // Set token in the main app context
    Cookies.set("village.token", data.token, { secure: true, expires: 60 });
    this.token = data.token;

    // -- Update Inline Search Iframes by reloading them with the new token --
    this._refreshInlineSearchIframes();

    // -- Re-evaluate SYNC buttons on the host page --
    this.refreshSyncUrlElements(); // Call new method to update sync buttons

    // Re-render the main overlay iframe (if it was open, e.g., during onboarding)
    this.renderIframe();
  }

  _refreshInlineSearchIframes() {
    this.inlineSearchIframes.forEach((iframe, containerElement) => {
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

  handleOAuthError(data) {
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
    document
      .querySelectorAll(`[${VILLAGE_URL_DATA_ATTRIBUTE}], [${VILLAGE_MODULE_ATTRIBUTE}]`)
      .forEach((el) => this.checkAndAddListenerIfValid(el));
  }

  async checkPaths(url) {
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
        Cookies.remove("village.token");
        this.token = null;
      }
      return null;
    }
  }

  getButtonChildren(element) {
    const foundElement = element.querySelector('[village-paths-availability="found"]');
    const notFoundElement = element.querySelector('[village-paths-availability="not-found"]');
    const loadingElement = element.querySelector('[village-paths-availability="loading"]');
    const errorElement = element.querySelector('[village-paths-availability="error"]');
  
    return { foundElement, notFoundElement, loadingElement, errorElement };
  }

  showErrorState(element) {
    const { foundElement, notFoundElement, loadingElement, errorElement } = this.getButtonChildren(element);
  
    if (foundElement) foundElement.style.display = "none";
    if (notFoundElement) notFoundElement.style.display = "none";
    if (loadingElement) loadingElement.style.display = "none";
    if (errorElement) errorElement.style.display = "inline-flex";
  }

  initializeButtonState(element) {
    const { foundElement, notFoundElement, loadingElement, errorElement } =
      this.getButtonChildren(element);

    if (!this.token) {
      if (foundElement) foundElement.style.display = "none";
      if (notFoundElement) notFoundElement.style.display = "inline-flex";
      if (loadingElement) loadingElement.style.display = "none";
      if (errorElement) errorElement.style.display = "none";
      return;
    }

    if (foundElement) foundElement.style.display = "none";
    if (notFoundElement) notFoundElement.style.display = "none";
    if (loadingElement) loadingElement.style.display = "inline-flex";
    if (errorElement) errorElement.style.display = "none";
  }

  async checkPathsAndUpdateButton(element, url) {
    try {
      const data = await this.checkPaths(url);
      this.updateButtonContent(element, data?.relationship);
    } catch (error) {
      logWidgetError(error, {
        additionalInfo: {
          function: "checkPathsAndUpdateButton",
          url,
          element,
        },
      });
      this.updateButtonContent(element, null);
    }
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
    const { foundElement, notFoundElement, loadingElement, errorElement } =
      this.getButtonChildren(element);

    if (loadingElement) loadingElement.style.display = "none";
    if (errorElement) errorElement.style.display = "none";

    if (relationship) {
      if (foundElement) {
        foundElement.style.display = "inline-flex";
        this.addFacePilesAndCount(foundElement, relationship);
      }
      if (notFoundElement) notFoundElement.style.display = "none";
    } else {
      if (foundElement) foundElement.style.display = "none";
      if (notFoundElement) notFoundElement.style.display = "inline-flex";
    }
  }

  renderIframe() {
    if (!this.iframe) {
      this.iframe = new Iframe();
    }
    //console.log('renderIframe', this.config);
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
    try {
      if (this.token) {
        await axios.get(`${this.apiUrl}/logout`, {
          headers: {
            "x-access-token": this.token,
            "app-public-key": this.partnerKey,
          },
        });
      }
    } catch (error) { }

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
