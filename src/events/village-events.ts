/**
 * Registry of supported Village SDK events and their payloads.
 * Used for typed emit/on listener logic in partner integrations.
 *
 * Example usage:
 *
 *   Village.on(VillageEvents.pathCtaClicked, (payload) => {
 *     console.log("CTA clicked:", payload);
 *   });
 *
 *   Village.emit(VillageEvents.userSynced, {
 *     userId: "abc123",
 *     syncedAt: new Date().toISOString(),
 *   });
 */
export const VillageEvents = {
  // 🔗 CTA interactions
  pathCtaClicked: "village.path.cta.clicked",
  pathsCtaUpdated: "village.paths_cta.updated",

  // 👤 User sync events
  userSynced: "village.user.synced",
  userSyncFailed: "village.user.sync.failed",

  // 🔐 OAuth flow events
  oauthStarted: "village.oauth.started",
  oauthSuccess: "village.oauth.success",
  oauthError: "village.oauth.error",

  // ⚠️ General widget error
  widgetError: "village.widget.error",

  /** Fired when the widget (App) has been initialized and is ready. */
  widgetReady: "village.widget.ready",
} as const;

/**
 * A union of all valid Village event names, inferred from VillageEvents.
 *
 * Example:
 *   function emit<K extends VillageEventName>(event: K, data: VillageEventMap[K]) { ... }
 */
export type VillageEventName = typeof VillageEvents[keyof typeof VillageEvents];

export interface VillagePerson {
  id: string;
  identity_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
  linkedin_identifier?: string;
  linkedin_url?: string;
  summary?: string;
  village_person_url?: string;
}

/**
 * Typed payloads for each Village SDK event.
 */
export interface VillageEventMap {
  /**
   * Fired when a CTA (e.g., "Send Intro", "Save to CRM") is clicked.
   *
   * Example:
   *   Village.on(VillageEvents.pathCtaClicked, ({ action, data }) => {
   *     console.log("CTA", action, "clicked by", data.introducer.email);
   *   });
   */
  [VillageEvents.pathCtaClicked]: {
    source: string;
    type: "village.path.cta.clicked";
    index: number;
    cta: {
      label: string;
      style?: Record<string, any>;
    };
    context: {
      from: string;
      path: {
        start_person: VillagePerson;
        connector_person?: VillagePerson;
        end_person: VillagePerson;
        start_connector_warmth_score?: number;
        connector_end_warmth_score?: number;
        start_end_warmth_score?: number;
        type: string;
        paid_intro?: any;
        group_type?: any;
      };
      partnerDomain: string;
    };
  };
  

  /**
   * Fired when a user's graph/network has been successfully flattened.
   *
   * Example:
   *   Village.on(VillageEvents.userSynced, ({ userId }) => {
   *     console.log("User synced:", userId);
   *   });
   */
  [VillageEvents.userSynced]: {
    userId: string;
    syncedAt: string;
  };

  /**
   * Fired when the sync fails (e.g., token expired, rate-limited, etc).
   *
   * Example:
   *   Village.on(VillageEvents.userSyncFailed, ({ reason }) => {
   *     alert("Sync failed: " + reason);
   *   });
   */
  [VillageEvents.userSyncFailed]: {
    reason: string;
  };

  /**
   * Fired when the OAuth flow starts and popup is opened.
   *
   * Example:
   *   Village.on(VillageEvents.oauthStarted, () => {
   *     console.log("OAuth popup opened");
   *   });
   */
  [VillageEvents.oauthStarted]: void;

  /**
   * Fired when OAuth login completes successfully.
   *
   * Example:
   *   Village.on(VillageEvents.oauthSuccess, ({ token }) => {
   *     console.log("OAuth success with token:", token);
   *   });
   */
  [VillageEvents.oauthSuccess]: {
    token: string;
  };

  /**
   * Fired when OAuth flow fails or user closes the popup.
   *
   * Example:
   *   Village.on(VillageEvents.oauthError, ({ error }) => {
   *     console.error("OAuth failed:", error);
   *   });
   */
  [VillageEvents.oauthError]: {
    error: string;
  };

  /**
   * Fired when an unhandled error happens in the widget.
   *
   * Example:
   *   Village.on(VillageEvents.widgetError, ({ message }) => {
   *     console.error("Widget error:", message);
   *   });
   */
  [VillageEvents.widgetError]: {
    message: string;
    source: string;
    details?: any;
  };

  /**
   * Fired when the widget (App) has been initialized and is ready.
   *
   * Example:
   *   Village.on(VillageEvents.widgetReady, () => {
   *     console.log("Widget is now ready!");
   *   });
   */
  [VillageEvents.widgetReady]: void;
}