import { computePosition, shift } from "@floating-ui/dom";
import {
  appendElement,
  pathsLoader,
  processPathsComponent,
  tracking,
} from "../shared";
import { createPortal, createShadowRoot } from "./utils";
import { pathsIconStyles, tooltipStyles } from "../../../styles";
import { getFromSyncStorage } from "../../../utils/storage";
import { PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY } from "../../../utils/consts";

export function setIconDisplayAccordingToStatus({ status }) {
  const displayProperty = status === "ENABLED" ? "inline-block" : "none";
  document
    .querySelectorAll(
      "[data-village-path-icon='strong'], [data-village-path-icon='weak'], [data-village-path-icon='noRelationship']"
    )
    .forEach((icon) => {
      icon.style.display = displayProperty;
    });
}

export async function createPathsEverywhereComponent({ relationship, url }) {
  // Read the persisted status
  const currentStatus =
    (await getFromSyncStorage(PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY)) ||
    "ENABLED"; // Default to ENABLED if not set

  let alreadyRendered = false;

  const warmthScore = relationship ? relationship.warmth_score : 0;
  let relationshipStrength = "noRelationship";

  if (warmthScore >= 1) {
    relationshipStrength = "strong";
  } else if (warmthScore > 0) {
    relationshipStrength = "weak";
  }

  const icon = document.createElement("span");
  // Set initial display based on persisted status
  const initialDisplay = currentStatus === "ENABLED" ? "inline-block" : "none";
  Object.assign(icon.style, pathsIconStyles.icon(initialDisplay));
  icon.setAttribute("data-village-path-icon", relationshipStrength); // Add data attribute

  const iconCircle = document.createElement("span");
  Object.assign(iconCircle.style, pathsIconStyles.outerSpan); // Apply outer span base styles
  Object.assign(iconCircle.style, pathsIconStyles[relationshipStrength]); // Apply strength-specific styles (e.g., background)
  icon.appendChild(iconCircle);

  const iconChild = document.createElement("span");
  Object.assign(iconChild.style, pathsIconStyles.innerSpan); // Apply inner span styles
  iconCircle.appendChild(iconChild);

  // Create the tooltip element
  const tooltip = document.createElement("div");

  // Apply Tooltip Styles
  Object.assign(tooltip.style, tooltipStyles.tooltip);

  // Function to check if the mouse is over the element or tooltip
  let isMouseOver = false;

  const showTooltip = async () => {
    isMouseOver = true;

    if (!alreadyRendered) {
      alreadyRendered = true;
      const portal = createPortal();
      const { shadowHost, shadowRoot } = createShadowRoot();
      portal.appendChild(shadowHost);
      shadowRoot.appendChild(tooltip);

      computePosition(icon, tooltip, {
        middleware: [shift()],
      }).then(({ x, y }) => {
        const tooltipWidth = tooltip.offsetWidth;
        const centerX = x + tooltipWidth / 2;
        Object.assign(tooltip.style, {
          left: `${centerX}px`,
          top: `${y}px`,
        });
      });

      tooltip.style.display = "block";

      if (relationshipStrength === "noRelationship") {
        const child = document.createElement("div");
        const text = document.createElement("p");
        Object.assign(text.style, tooltipStyles.tooltipParagraph);
        text.textContent =
          "We haven't found any reliable paths based on available data.";
        child.appendChild(text);
        tooltip.appendChild(child);
      } else {
        tracking({
          eventName: "Paths Previewed",
          properties: {
            $current_url: window.location.href,
            context: "Paths Everywhere",
            url,
          },
        });

        const { element: loader } = pathsLoader();

        appendElement({
          element: loader,
          wrapper: tooltip,
          appendOnWrapper: true,
        });

        const { element } = await processPathsComponent({
          url,
          page: {
            entity: "",
            path: "",
            styles: "",
          },
          isPathsEverywhere: true,
        });

        loader.remove();

        appendElement({
          element,
          wrapper: tooltip,
          appendOnWrapper: true,
        });
      }
    } else {
      computePosition(icon, tooltip, {
        middleware: [shift()],
      }).then(({ x, y }) => {
        const tooltipWidth = tooltip.offsetWidth;
        const centerX = x + tooltipWidth / 2;
        Object.assign(tooltip.style, {
          left: `${centerX}px`,
          top: `${y}px`,
        });
      });

      tooltip.style.display = "block";
    }
  };

  const hideTooltip = () => {
    if (!isMouseOver) {
      tooltip.style.display = "none";
    }
  };

  // Add event listeners
  icon.addEventListener("mouseenter", showTooltip);
  tooltip.addEventListener("mouseenter", showTooltip);

  icon.addEventListener("mouseleave", () => {
    isMouseOver = false;
    setTimeout(hideTooltip, 500); // Delay to allow transition to tooltip
  });

  tooltip.addEventListener("mouseleave", () => {
    isMouseOver = false;
    hideTooltip();
  });

  return {
    iconToHover: icon,
  };
}
