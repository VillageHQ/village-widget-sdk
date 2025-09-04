import { computePosition } from "@floating-ui/dom";
import { PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY } from "../../../utils/consts";
import { tracking } from "../shared";
import { icon_chevron_down, icon_chevron_up } from "./icons";
import { setIconDisplayAccordingToStatus } from "./paths-everywhere";
import { createPortal, createShadowRoot } from "./utils";
import { getFromSyncStorage, setToSyncStorage } from "../../../utils/storage";
import { floatingIconStyles, tooltipStyles } from "../../../styles";

var status;
var alreadyRendered = false;
var flotingIconViewHeight = 50;

const statusToLabel = {
  ENABLED: "Shown",
  DISABLED: "Hidden",
};

function handleFloatingIconClick(floatingIconImage) {
  const newStatus = status === "ENABLED" ? "DISABLED" : "ENABLED";

  status = newStatus;

  if (newStatus === "ENABLED") {
    floatingIconImage.style.filter = "none";
  } else {
    floatingIconImage.style.filter = "grayscale(100%)";
  }

  setIconDisplayAccordingToStatus({ status: newStatus });

  setToSyncStorage(PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY, newStatus);

  tracking({
    eventName: `Paths Everywhere ${statusToLabel[newStatus]}`,
    properties: {
      $current_url: window.location.href,
    },
  });
}

const DEFAULT_FLOATING_ICON_STATUS = "ENABLED";

export async function createFloatingIconComponent() {
  if (alreadyRendered) return;
  alreadyRendered = true;

  const [initialStatus, user_logged_obj] = await Promise.allSettled([
    getFromSyncStorage(PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY),

    getFromSyncStorage("user_logged_obj"),
  ]).then((results) =>
    results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    )
  );

  const userApp = user_logged_obj?.app;

  if (!initialStatus) {
    setToSyncStorage(
      PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY,
      DEFAULT_FLOATING_ICON_STATUS
    );
  }

  status = initialStatus ? initialStatus : DEFAULT_FLOATING_ICON_STATUS;

  const portal = createPortal();
  portal.style.width = "100%";
  portal.style.height = "100%";
  portal.style.pointerEvents = "none";

  const { shadowHost, shadowRoot } = createShadowRoot();
  portal.appendChild(shadowHost);

  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, tooltipStyles.tooltip);

  const child = document.createElement("div");
  const text = document.createElement("p");
  Object.assign(text.style, tooltipStyles.tooltipParagraph);

  const learnMoreLink = document.createElement("a");
  learnMoreLink.href =
    "https://villagehq.notion.site/Introducing-Paths-Everywhere-3974bc7f953b45538ee3644ee9afcc4d?pvs=4";
  learnMoreLink.target = "_blank";
  learnMoreLink.textContent = "Learn more";

  child.appendChild(text);
  child.appendChild(learnMoreLink);

  tooltip.appendChild(child);

  shadowRoot.appendChild(tooltip);

  const floatingIconWrapper = document.createElement("div");
  Object.assign(floatingIconWrapper.style, floatingIconStyles.wrapper);
  floatingIconWrapper.style.top = `${flotingIconViewHeight}vh`;

  shadowRoot.appendChild(floatingIconWrapper);

  const floatingIcon = document.createElement("div");
  Object.assign(floatingIcon.style, floatingIconStyles.icon);

  const villageLogo = document.createElement("img");
  Object.assign(villageLogo.style, floatingIconStyles.iconImage);
  villageLogo.src = userApp?.logo;
  villageLogo.style.filter = status === "ENABLED" ? "none" : "grayscale(100%)";
  villageLogo.style.borderRadius = "5px";

  floatingIconWrapper.appendChild(floatingIcon);
  floatingIcon.appendChild(villageLogo);
  const repositioner = createRepositioner({
    elementToBeMoved: floatingIconWrapper,
  });
  floatingIconWrapper.appendChild(repositioner);

  floatingIcon.onclick = () => {
    handleFloatingIconClick(villageLogo);
  };

  const totalPathsNumberBadge = document.createElement("span");
  Object.assign(totalPathsNumberBadge.style, floatingIconStyles.iconBadge);

  floatingIcon.appendChild(totalPathsNumberBadge);

  setInterval(() => {
    const totalElements = getTotalElementsWithPaths();
    totalPathsNumberBadge.innerText = totalElements;

    // have a default display none on the floating icon wrapper
    if (!floatingIconWrapper.style.display) {
      floatingIconWrapper.style.display = "none";
    }

    // if total elements > 0 && floating icon was hidden, show it and track it
    if (totalElements > 0 && floatingIconWrapper.style.display === "none") {
      floatingIconWrapper.style.display = "flex";
      tracking({
        eventName: `Paths Everywhere Floating Icon Shown`,
        properties: {
          $current_url: window.location.href,
          status,
        },
      });
    }

    // if total elements > 0 and status is enabled show icon on links
    if (totalElements > 0 && status === "ENABLED") {
      setIconDisplayAccordingToStatus({ status });
    }

    // if total elements === 0 hide floating icon and hide icon on links
    if (totalElements === 0) {
      floatingIconWrapper.style.display = "none";
      setIconDisplayAccordingToStatus({ status: "DISABLED" });
    }
  }, 1000);

  // Function to check if the mouse is over the element or tooltip
  let shouldBeShowingTooltip = false;

  const showTooltip = async () => {
    shouldBeShowingTooltip = true;
    text.textContent = getStatusText(status);
    computePosition(floatingIcon, tooltip).then(({ x, y }) => {
      Object.assign(tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
    tooltip.style.display = "block";
    tooltip.style.pointerEvents = "auto";
  };

  const hideTooltip = () => {
    if (!shouldBeShowingTooltip) {
      tooltip.style.display = "none";
    }
  };

  // Add event listeners
  floatingIcon.addEventListener("mouseenter", showTooltip);
  tooltip.addEventListener("mouseenter", showTooltip);

  floatingIcon.addEventListener("mouseleave", () => {
    shouldBeShowingTooltip = false;
    setTimeout(hideTooltip, 500); // Delay to allow transition to tooltip
  });

  tooltip.addEventListener("mouseleave", () => {
    shouldBeShowingTooltip = false;
    hideTooltip();
  });

  let shouldBeShowingRepositioner = false;

  const showRepositioner = () => {
    shouldBeShowingRepositioner = true;
    repositioner.firstChild.style.width = "20px";
    repositioner.lastChild.style.width = "20px";
  };

  const hideRepositioner = () => {
    if (!shouldBeShowingRepositioner) {
      repositioner.firstChild.style.width = "0px";
      repositioner.lastChild.style.width = "0px";
    }
  };

  floatingIconWrapper.addEventListener("mouseenter", () => {
    showRepositioner();
  });
  floatingIconWrapper.addEventListener("mouseleave", () => {
    shouldBeShowingRepositioner = false;
    setTimeout(hideRepositioner, 500);
  });
  repositioner.addEventListener("mouseenter", () => {
    showRepositioner();
  });
  repositioner.addEventListener("mouseleave", () => {
    shouldBeShowingRepositioner = false;
    setTimeout(hideRepositioner, 500);
  });
}

function getTotalElementsWithPaths() {
  const strongElements = document.querySelectorAll(
    '[data-village-path-icon="strong"]'
  ).length;
  const weakElements = document.querySelectorAll(
    '[data-village-path-icon="weak"]'
  ).length;
  const totalElements = strongElements + weakElements;
  return totalElements;
}

function createRepositioner({ elementToBeMoved }) {
  const positionerWrapper = document.createElement("div");
  Object.assign(positionerWrapper.style, floatingIconStyles.positionerWrapper);

  const topDraggableButton = document.createElement("button");
  Object.assign(topDraggableButton.style, floatingIconStyles.positionerButton);
  topDraggableButton.innerHTML = icon_chevron_up;

  const bottomDraggableButton = document.createElement("button");
  Object.assign(
    bottomDraggableButton.style,
    floatingIconStyles.positionerButton
  );
  bottomDraggableButton.innerHTML = icon_chevron_down;

  positionerWrapper.appendChild(topDraggableButton);
  positionerWrapper.appendChild(bottomDraggableButton);

  let intervalId;

  topDraggableButton.addEventListener("mousedown", () => {
    intervalId = setInterval(() => {
      flotingIconViewHeight -= 2;
      elementToBeMoved.style.top = `${flotingIconViewHeight}vh`;
    }, 100); // Adjust interval timing as needed
  });

  bottomDraggableButton.addEventListener("mousedown", () => {
    intervalId = setInterval(() => {
      flotingIconViewHeight += 2;
      elementToBeMoved.style.top = `${flotingIconViewHeight}vh`;
    }, 100); // Adjust interval timing as needed
  });

  const clear = () => {
    clearInterval(intervalId);
  };

  topDraggableButton.addEventListener("mouseup", clear);
  topDraggableButton.addEventListener("mouseleave", clear);

  bottomDraggableButton.addEventListener("mouseup", clear);
  bottomDraggableButton.addEventListener("mouseleave", clear);

  return positionerWrapper;
}

const getStatusText = (status) => {
  return status === "DISABLED"
    ? "Click to activate and see all paths on the page"
    : "Click to deactivate and stop seeing paths on the page";
};
