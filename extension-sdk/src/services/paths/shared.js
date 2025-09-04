import { VILLAGE_FRONTEND_URL } from "../../utils/consts";
import { getFromSyncStorage } from "../../utils/storage";
import { icon_loader } from "./ui/icons";
import { createPathsWithStrengthComponent } from "./ui/paths-with-strength";
import { createViewPathsButton } from "./ui/view-paths-button";
import { tooltipStyles } from "../../styles";

export function tracking({ eventName, properties }) {
  communicateWithBackground({
    command: "tracking",
    eventName,
    properties,
  });
}

export const communicateWithBackground = (message) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, function (reply) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      }

      if (reply) {
        return resolve(reply);
      } else {
        return resolve("no reply");
      }
    });
  });
};

const renderPathsModal = ({
  token,
  partnerKey,
  url,
  userReference,
  eventProperties,
}) => {
  const params = new URLSearchParams();

  if (token) params.append("token", token);
  if (url) {
    params.append("url", encodeURIComponent(url));
  }
  if (partnerKey) params.append("partnerKey", partnerKey);
  if (userReference) params.append("userReference", userReference);

  // Create the iframe element
  const iframe = document.createElement("iframe");
  iframe.id = "village-iframe";
  iframe.src = `${VILLAGE_FRONTEND_URL}/widget?${params.toString()}`;
  iframe.setAttribute(
    "style",
    "display: block; position: fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 2147483647;"
  );

  tracking({
    eventName: "Paths Viewed",
    properties: {
      $current_url: window.location.href,
      ...eventProperties,
    },
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      iframe.remove();
    }
  });

  window.addEventListener("message", function (event) {
    // Handle VILLAGE_REMOVE_IFRAME message
    if (
      event.data?.type === "VILLAGE_REMOVE_IFRAME" ||
      event.data === "remove-iframe"
    ) {
      iframe.remove();
    }
  });

  // Add the iframe to the DOM
  document.body.appendChild(iframe);
};

export const appendElement = ({ wrapper, element, appendOnWrapper }) => {
  appendOnWrapper
    ? wrapper.appendChild(element)
    : wrapper.parentElement.insertBefore(element, wrapper);
};

export const pathsLoader = () => {
  const wrapper = document.createElement("div");

  const loaderParagraph = document.createElement("p");
  Object.assign(loaderParagraph.style, tooltipStyles.tooltipParagraph);
  Object.assign(loaderParagraph.style, tooltipStyles.loader);
  loaderParagraph.innerHTML = `<span>${icon_loader}</span> Loading paths...`;

  const loaderSpan = loaderParagraph.querySelector("span");
  if (loaderSpan) {
    Object.assign(loaderSpan.style, tooltipStyles.loaderSpan);
  }

  wrapper.appendChild(loaderParagraph);

  return {
    element: wrapper,
  };
};

export const processPathsComponent = async ({
  url,
  page,
  isPathsEverywhere,
}) => {
  try {
    const [data, user_logged_obj] = await Promise.allSettled([
      communicateWithBackground({
        command: "checkPaths",
        url,
      }),
      getFromSyncStorage("user_logged_obj"),
    ]).then((results) =>
      results.map((result) =>
        result.status === "fulfilled" ? result.value : null
      )
    );

    const userApp = user_logged_obj?.app;

    const APP_COLOR = userApp?.config?.branding?.color;
    const APP_LOGO = userApp?.config?.features?.pathsEverywhere?.logo;

    if (!data?.relationship || !data?.relationship?.paths?.avatars?.length) {
      return false;
    }

    const relationship = data.relationship;

    const entity = "people" in relationship ? "company" : "person";

    const label = getLabel({ entity });

    const pathsWithStrengthComponent = createPathsWithStrengthComponent({
      avatars: relationship.paths.avatars,
      score: relationship.warmth_score,
      total: relationship.paths.count,
      entity,
    });

    if (isPathsEverywhere) {
      // Apply component layout styles when inside the tooltip
      Object.assign(pathsWithStrengthComponent.style, tooltipStyles.component);
    }
    const images = pathsWithStrengthComponent.getElementsByTagName("img");

    for (let i = 0; i < images.length; i++) {
      images[i].onerror = function () {
        const previousSrc = this.src;
        this.src = `https://ui-avatars.com/api/?length=1&font-size=0.5&size=256&bold=true&background=2dbed8&color=ffffff&name=${onErrorProp(
          getSlug(previousSrc)
        )}`;
        this.onerror = null;
      };
    }

    const wrapper = document.createElement("div");

    wrapper.setAttribute("data-village-wrapper", "true");

    wrapper.setAttribute(
      "style",
      `position: relative; width: 100%; height: 100%;`
    );

    // Apply tooltip wrapper styles if inside the tooltip context
    if (isPathsEverywhere) {
      Object.assign(wrapper.style, tooltipStyles.tooltipWrapper);
    }

    const openModal = (e) => {
      renderPathsModal({
        token: data.token,
        partnerKey: "pk_zT4HzZn7oV8x7dg7YuCjBEG40AM4Dhzu",
        userReference: data?.userReference,
        url,
        eventProperties: {
          url,
          context: pathsModalContext(isPathsEverywhere),
        },
      });

      e.stopPropagation();
      e.preventDefault();
    };

    if (isPathsEverywhere) {
      const pathsWithStrengthRow = pathsWithStrengthComponent.querySelector(
        "div.paths-with-strength"
      );
      pathsWithStrengthRow.onclick = openModal;

      const logo = document.createElement("img");
      logo.src = APP_LOGO;
      logo.style.height = "30px";
      logo.style.width = "fit-content";
      logo.style.borderRadius = "5px";
      wrapper.appendChild(logo);

      if (label) {
        const labelComponent = document.createElement("p");
        labelComponent.innerHTML = label;
        Object.assign(labelComponent.style, tooltipStyles.tooltipParagraph);
        pathsWithStrengthComponent.insertBefore(
          labelComponent,
          pathsWithStrengthComponent.firstChild
        );
      }
    }

    wrapper.appendChild(pathsWithStrengthComponent);

    if (isPathsEverywhere) {
      const viewPathsButton = createViewPathsButton({
        color: APP_COLOR,
      });
      viewPathsButton.onclick = openModal;
      wrapper.appendChild(viewPathsButton);

      const psText = document.createElement("p");
      psText.textContent =
        "P.S. To hide this icon from showing, click on the icon on the right edge of this page";
      psText.style.fontSize = "10px";
      psText.style.color = "#999";
      wrapper.appendChild(psText);
    } else {
      const clickable = document.createElement("div");
      clickable.setAttribute(
        "style",
        "height: 100%; width: 100%; z-index: 9999; position: absolute; top: 0; left:0; cursor: pointer;"
      );

      clickable.onclick = openModal;
      wrapper.appendChild(clickable);
    }

    return {
      element: wrapper,
    };
  } catch (err) {
    console.log("erro");
    console.log(err);
    return false;
  }
};

function pathsModalContext(isPathsEverywhere) {
  return isPathsEverywhere ? "Paths Everywhere" : "Paths Anywhere";
}

function getLabel({ entity }) {
  if (entity === "company") {
    return `<strong>Awesome! 🎉</strong> We've found some people who can connect you</strong>`;
  }

  return `<strong>Awesome! 🎉</strong> We've found you a reliable connection</strong>`;
}

const onErrorProp = (slug) =>
  `onerror="this.onerror=null;this.src='${`https://ui-avatars.com/api/?length=1&font-size=0.7&size=256&bold=true&background=2dbed8&color=ffffff&name=${encodeURIComponent(
    slug || "U"
  )}`}';"`;

const getSlug = (avatar) => {
  const arr = avatar.split(
    "https://village.sfo3.cdn.digitaloceanspaces.com/l-"
  );
  if (arr && arr.length > 1) {
    return arr[1].slice(0, -4);
  } else {
    return "";
  }
};
