import { EmbedService } from "./embed.service";
import {
  appendElement,
  communicateWithBackground,
  processPathsComponent,
} from "./shared";
import { createFloatingIconComponent } from "./ui/floating-icon";
import { createPathsEverywhereComponent } from "./ui/paths-everywhere";
import {
  addMutationObserverToKeepTippyLowerThanVillagePaths,
  doAfterDocumentReady,
} from "./ui/utils";
import { UrlService } from "./url.service";

class PathsEverywhere {
  constructor() {
    this.intervalId = null;
    this.currentTab = null;
    this.mappedUrls = new Set();
    this.urlService = new UrlService();
    this.isProcessingPage = false; // Lock flag
  }

  async run() {
    const pageUrl = this.urlService.getUrlWithoutParams(window.location.href);

    if (this.currentTab === pageUrl) {
      return;
    }
    // Reset the lock on new page runs
    this.isProcessingPage = false;

    this.updateCurrentTab(pageUrl);

    doAfterDocumentReady(async () => {
      this.clearVillageIcons();
      const listenerStrategy = this.urlService.getPageListenerStrategy({
        hostname: window.location.hostname,
      });

      if (listenerStrategy === "mutation") {
        this.googleSheetsStrategy();
      }
      // Initialize UI first - we only do this once
      await this.initializeUI();

      if (pageUrl.includes("linkedin.com/in/")) {
        if (!this.isProcessingPage) {
          this.isProcessingPage = true;
          this.handleLinkedInProfile(pageUrl);
        }
      }

      if (listenerStrategy === "interval") {
        this.fetchAndProcessLinks();
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.fetchAndProcessLinks(), 3000);
      }
    });
  }

  /**
   * Adds the Village component specifically to a LinkedIn person profile page.
   * @param {string} profileUrl - The URL of the LinkedIn profile page (likely hostname + pathname).
   */
  async handleLinkedInProfile(profileUrl) {
    // Find the container and add the element - uses retry logic internally
    const findContainerAndAddElement = async () => {
      const elementToAppend =
        document.querySelector(".ph5.pb5")?.lastElementChild;

      if (!elementToAppend) {
        // Keep the lock and retry
        setTimeout(findContainerAndAddElement, 1000);
        return;
      }

      // Clean up previous wrappers
      const existingElements = document.querySelectorAll(
        "[data-village-wrapper]"
      );

      if (existingElements.length) {
        existingElements.forEach((element) => element.remove());
      }

      const { element } = await processPathsComponent({
        url: profileUrl,
        page: {
          styles: "height: 47px; margin-top: 1.2rem; width: 100%",
        },
      });

      if (element && elementToAppend) {
        appendElement({
          wrapper: elementToAppend,
          element,
        });
      }

      // Release lock after attempting to add
      // Important: This runs even if processPathsComponent or appendElement threw an error
      this.isProcessingPage = false;
    };

    // Start the process
    findContainerAndAddElement();
  }

  updateCurrentTab(url) {
    this.currentTab = url;
  }

  clearVillageIcons() {
    document
      .querySelectorAll("[data-village-path-icon], [data-village-wrapper]") // Combine selectors
      .forEach((el) => el.remove());
  }

  async initializeUI() {
    createFloatingIconComponent();
    addMutationObserverToKeepTippyLowerThanVillagePaths();
  }

  fetchAndProcessLinks() {
    const selector = this.urlService.getPageSelector({
      hostname: window.location.hostname,
    });
    const linksInDocument = document.querySelectorAll(selector);

    for (const link of linksInDocument) {
      this.processLink(link);
    }
  }

  async processLink(link) {
    const url = this.urlService.extractUrl(link);
    const uniqueReference = this.urlService.processUrlIntoUnique(url);

    if (this.mappedUrls.has(uniqueReference)) return;
    this.mappedUrls.add(uniqueReference);

    await this.attachPathsIconToLink({ link, url });
  }

  async googleSheetsStrategy() {
    const googleSheetsRelevantElementObserver = new MutationObserver(
      (mutationList, observer) => {
        for (const mutation of mutationList) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "href"
          ) {
            const link = mutation.target;
            this.clearVillageIcons();
            this.processSheetsLink(link);
          }
        }
      }
    );

    const documentBodyObserver = new MutationObserver(
      (mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === "childList") {
            if (mutation.addedNodes.length) {
              const newElementOnPage = mutation.addedNodes[0];

              const isGoogleRelevantElement =
                newElementOnPage.classList.contains(
                  "docs-multi-linkbubble-bubble"
                );

              if (isGoogleRelevantElement) {
                let googleSheetsRelevantElement = newElementOnPage;

                const link = googleSheetsRelevantElement.querySelector("a");
                this.processSheetsLink(link);

                googleSheetsRelevantElementObserver.observe(
                  googleSheetsRelevantElement,
                  {
                    attributes: true,
                    childList: true,
                    subtree: true,
                  }
                );
              }
            }
          }
        }
      }
    );

    documentBodyObserver.observe(document.body, {
      childList: true,
    });
  }

  async processSheetsLink(link) {
    const url = this.urlService.extractUrl(link);
    if (!url) return;
    await this.attachPathsIconToLink({ link, url });
  }

  async attachPathsIconToLink({ link, url }) {
    const { relationship } = await communicateWithBackground({
      command: "checkPaths",
      url,
    });
    const { iconToHover } = await createPathsEverywhereComponent({
      relationship,
      url,
    });
    new EmbedService(this.currentTab).execute({ link, iconToHover });
  }
}

const PathsEverywhereInstance = new PathsEverywhere();

export const runPathsEverywhere = () => {
  PathsEverywhereInstance.run();
};
