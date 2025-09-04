import { autoUpdate, computePosition, hide } from "@floating-ui/dom";
import { pathsIconStyles } from "../../styles";

class EmbedService {
  constructor(currentTab) {
    this.currentTab = currentTab;
  }

  execute({ link, iconToHover }) {
    if (this.shouldUsePortalStrategy()) {
      this.attachUsingPortal({ link, iconToHover });
    } else {
      this.attachInsideElement({ link, iconToHover });
    }
  }

  shouldUsePortalStrategy() {
    const portalTabs = [
      "docs.google.com",
      "mail.google.com",
      "airtable.com",
      "notion.so",
      "notion.site",
    ];
    return portalTabs.some((domain) => this.currentTab.includes(domain));
  }

  attachUsingPortal({ link, iconToHover }) {
    Object.assign(iconToHover.style, pathsIconStyles.iconAbsolute);
    document.body.appendChild(iconToHover);

    autoUpdate(link, iconToHover, () =>
      computePosition(link, iconToHover, {
        placement: "right",
        middleware: [hide()],
      }).then(({ x, y, middlewareData }) => {
        Object.assign(iconToHover.style, {
          left: `${x}px`,
          top: `${y}px`,
        });

        if (middlewareData.hide) {
          Object.assign(iconToHover.style, {
            visibility: middlewareData.hide.referenceHidden
              ? "hidden"
              : "visible",
          });
        }
      })
    );
  }

  attachInsideElement({ link, iconToHover }) {
    link.appendChild(iconToHover);
  }
}

export { EmbedService };
