import { runPathsEverywhere } from "../services/paths/paths-everywhere";
import { runQuickIntros } from "../services/quick-intros";
import { initTokenManager } from "../services/token-manager.js";

/**
 * Content Script implementation
 * @param {Object} config - Optional configuration object
 */
export default function ContentScriptImpl(config = {}) {
  initTokenManager();
  chrome.runtime.onMessage.addListener(
    function (request, _sender, _sendResponse) {
      if (request && request.type === "pathsEverywhere") {
        const blockedUrls = ["village.do", "localhost"];

        if (blockedUrls.some((url) => window.location.href.includes(url)))
          return;

        runPathsEverywhere();
      }

      if (request && request.type === "fillUpEmail") {
        _sendResponse({ status: "ok" });

        // Find the compose button element
        const loaderId = setInterval(() => {
          var composeButton =
            document.getElementsByClassName("T-I T-I-KE L3")[0];

          if (!composeButton) {
            return;
          } else {
            runQuickIntros(composeButton, request.email);
            return clearInterval(loaderId);
          }
        }, 500);
      }
    }
  );
}
