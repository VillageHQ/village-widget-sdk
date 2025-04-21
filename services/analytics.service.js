import { v4 as uuidv4 } from "uuid";
import { posthog } from "./posthog";

const distinctIdStorageKey = "village.distinct_id";

export class AnalyticsService {
  static getDistinctId() {
    let distinctId = localStorage.getItem(distinctIdStorageKey);
    if (distinctId) return distinctId;

    const newDistinctId = uuidv4();
    localStorage.setItem(distinctIdStorageKey, newDistinctId);
    return newDistinctId;
  }

  static setUserId(userId) {
    const previousId = localStorage.getItem(distinctIdStorageKey);
    if (previousId && previousId !== userId) {
      posthog.merge(previousId, userId);
    }
    localStorage.setItem(distinctIdStorageKey, userId);
  }

  static removeUserId() {
    localStorage.removeItem(distinctIdStorageKey);
  }

  static trackButtonClick({ type, module, url, partnerKey }) {
    posthog.capture("PaaS Button Clicked", {
      type,
      module,
      url,
      partnerKey,
      distinct_id: this.getDistinctId(),
      $current_url: window.location.href,
    });
  }

  static trackButtonRender({ partnerKey }) {
    posthog.capture("PaaS Button Rendered", {
      partnerKey,
      distinct_id: this.getDistinctId(),
      $current_url: window.location.href,
    });
  }
}
