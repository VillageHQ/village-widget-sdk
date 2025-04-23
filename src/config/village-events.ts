/**
 * A registry of all supported Village SDK event constants.
 *
 * Use these values when calling `Village.on(...)` or `Village.broadcast(...)`
 * to subscribe or broadcast custom widget-related events.
 *
 * @example
 * ```ts
 * Village.on(VillageEvents.pathCtaClicked, (payload) => {
 *   console.log("CTA clicked:", payload);
 * });
 * 
 * Village.broadcast(VillageEvents.userSynced, {
 *   userId: "abc123",
 *   syncedAt: new Date().toISOString(),
 * });
 * ```
 */
export const VillageEvents = {
  /** Fired when a CTA (e.g. button) is clicked */
  pathCtaClicked: "village.path.cta.clicked",

  /** Fired when the list of CTAs is updated */
  pathsCtaUpdated: "village.paths_cta.updated",

  /** Fired after user graph is successfully synced */
  userSynced: "village.user.synced",

  /** Fired when user graph sync fails */
  userSyncFailed: "village.user.sync.failed",

  /** Fired when OAuth popup is opened */
  oauthStarted: "village.oauth.started",

  /** Fired when OAuth login completes successfully */
  oauthSuccess: "village.oauth.success",

  /** Fired when OAuth login fails or is canceled */
  oauthError: "village.oauth.error",

  /** Fired when a general error occurs inside the widget */
  widgetError: "village.widget.error",

  /** Fired when the widget (App) is fully initialized and ready */
  widgetReady: "village.widget.ready"
} as const;

/**
 * A union type of all valid Village event names.
 * Derived directly from `VillageEvents`.
 *
 * @example
 * ```ts
 * function broadcast<K extends VillageEventName>(
 *   event: K,
 *   payload: VillageEventMap[K]
 * ) { ... }
 * ```
 */
export type VillageEventName = typeof VillageEvents[keyof typeof VillageEvents];

/**
 * Basic person object used in paths and network data.
 */
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
 * Defines the payloads for each Village event.
 * Used to ensure `Village.broadcast()` and `Village.on()` are strongly typed.
 */
export interface VillageEventMap {
  /**
   * @event village.path.cta.clicked
   * Fired when a CTA (e.g., "Send Intro", "Save to CRM") is clicked.
   *
   * @example
   * ```ts
   * Village.on(VillageEvents.pathCtaClicked, ({ cta }) => {
   *   console.log("CTA clicked:", cta.label);
   * });
   * ```
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
   * @event village.user.synced
   * Fired when a user's network has been successfully flattened.
   */
  [VillageEvents.userSynced]: {
    userId: string;
    syncedAt: string;
  };

  /**
   * @event village.user.sync.failed
   * Fired when user sync fails (e.g., expired token, server error).
   */
  [VillageEvents.userSyncFailed]: {
    reason: string;
  };

  /**
   * @event village.oauth.started
   * Fired when the OAuth popup window is opened.
   */
  [VillageEvents.oauthStarted]: void;

  /**
   * @event village.oauth.success
   * Fired when the OAuth flow completes successfully.
   */
  [VillageEvents.oauthSuccess]: {
    token: string;
  };

  /**
   * @event village.oauth.error
   * Fired when the OAuth flow fails or is canceled.
   */
  [VillageEvents.oauthError]: {
    error: string;
  };

  /**
   * @event village.widget.error
   * Fired when an internal error occurs in the widget.
   */
  [VillageEvents.widgetError]: {
    message: string;
    source: string;
    details?: any;
  };

  /**
   * @event village.widget.ready
   * Fired when the widget finishes initializing.
   */
  [VillageEvents.widgetReady]: void;

  /**
   * @event village.paths_cta.updated
   * Fired when the list of available CTAs changes.
   */
  [VillageEvents.pathsCtaUpdated]: PathCTA[];
}


