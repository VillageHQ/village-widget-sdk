export function createPortal() {
  const portal = document.createElement("div");
  portal.style.position = "fixed";
  portal.style.top = "0";
  portal.style.left = "0";
  portal.style.zIndex = "2147483647";
  document.body.appendChild(portal);
  return portal;
}
export function createShadowRoot() {
  const shadowHost = document.createElement("span");
  shadowHost.style.position = "absolute";
  shadowHost.style.zIndex = "2";
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  return {
    shadowHost,
    shadowRoot,
  };
}

export function addStylesFile({ fileUrl, host }) {
  return new Promise((resolve) => {
    const stylesUrl = chrome.runtime.getURL(fileUrl);

    const link = document.createElement("link");
    link.href = stylesUrl;
    link.rel = "stylesheet";
    link.type = "text/css";
    host.appendChild(link);

    link.onload = () => {
      resolve();
    };
  });
}

export function addMutationObserverToKeepTippyLowerThanVillagePaths() {
  const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        if (mutation.addedNodes.length) {
          const addedNode = mutation.addedNodes[0];

          if (addedNode && typeof addedNode.hasAttribute === "function") {
            const isTippy = addedNode.hasAttribute("data-tippy-root");
            if (isTippy) {
              mutation.addedNodes[0].style.zIndex = "2147483646";
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
  });
}

export function doAfterDocumentReady(callback) {
  const loaderId = setInterval(() => {
    if (!document.body) {
      return;
    } else {
      callback();
      return clearInterval(loaderId);
    }
  }, 50);
}
