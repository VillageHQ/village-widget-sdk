// src/globals.d.ts

/**
   * Represents a Call-To-Action (CTA) button rendered in the widget UI.
   */
export interface PathCTA {
  /** Visible label for the button (e.g. "Save to CRM") */
  label: string;

  /**
   * Function to execute when the button is clicked.
   * Can receive any arguments passed from the widget runtime.
   */
  callback: (...args: any[]) => void;

  /**
   * Optional inline style to apply to the CTA.
   * Compatible with React-style CSSProperties.
   */
  style?: React.CSSProperties;
}


/**
 * Configuration options accepted by the Village widget when calling `Village.init(...)`.
 */
export interface VillageInitOptions {
  /** Optional list of CTA buttons to be displayed in the widget */
  paths_cta?: PathCTA[];
}

/**
 * Configuration for the autopilot feature
 */
export interface AutopilotConfig {
  /** Initial search query to populate */
  initialQuery?: string;
  
  /** Search criteria/filters */
  criteria?: {
    /** Filter by location */
    location?: string;
    /** Filter by company */
    company?: string;
    /** Filter by role/title */
    role?: string;
    /** Custom filters */
    [key: string]: any;
  };
  
  /** Callback functions for autopilot events */
  callbacks?: {
    /** Called when a result is clicked */
    onResultClick?: (result: any) => void;
    /** Called when autopilot flow is completed */
    onComplete?: (data: any) => void;
    /** Called when autopilot is closed */
    onClose?: () => void;
  };
}

/**
 * Extension of the browser `window` object to include the `Village` SDK.
 */
export interface Window {
  Village?: {
    /**
     * Subscribes to an event emitted by the Village widget.
     * @param event - Event name (e.g., `village.widget.ready`)
     * @param callback - Function to handle the event payload
     */
    on?: (event: string, callback: (data: any) => void) => void;

    /**
     * Emits an event to the local Village widget instance.
     * @param event - Event name
     * @param data - Payload for the event
     */
    emit?: (event: string, data: any) => void;

    /**
     * Broadcasts an event to all widget instances (e.g., across iframes).
     * @param event - Event name
     * @param data - Payload for the event
     */
    broadcast?: (event: string, data: any) => void;

    /**
     * Starts the authorization flow (typically OAuth).
     * Can accept dynamic arguments depending on auth implementation.
     */
    authorize?: (...args: any[]) => void;

    /**
     * Initializes the widget with a public API key and optional configuration.
     * @param publicKey - Your partner/public API key
     * @param options - Widget configuration options
     */
    init?: (publicKey: string, options?: VillageInitOptions) => void;

    /**
     * Indicates whether the widget has completed initialization.
     */
    loaded?: boolean;

    /**
     * Internal queue of deferred events emitted before initialization.
     */
    q?: any[];
  };
}
