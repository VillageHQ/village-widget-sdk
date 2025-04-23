// src/globals.d.ts

export {};

/**
 * Global declarations for the Village Widget SDK, enabling typed access
 * to the `window.Village` object and related integration options.
 */
declare global {
  /**
   * Represents a Call-To-Action (CTA) button rendered in the widget UI.
   */
  interface PathCTA {
    /** Visible label for the button (e.g. "Save to CRM") */
    label: string;

    /** Function to execute when the button is clicked */
    callback: () => void;

    /**
     * Optional inline style to apply to the CTA.
     * Compatible with React-style CSSProperties.
     */
    style?: React.CSSProperties;
  }

  /**
   * Configuration options accepted by the Village widget when calling `Village.init(...)`.
   */
  interface VillageInitOptions {
    /** Optional list of CTA buttons to be displayed in the widget */
    paths_cta?: PathCTA[];
  }

  /**
   * Extension of the browser `window` object to include the `Village` SDK.
   */
  interface Window {
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
}
