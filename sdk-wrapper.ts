import {
    VillageEvents,
    VillageEventMap,
  } from "village-sdk-events";
  
  type VillageEventName = keyof VillageEventMap;
  
  /* ------------------------------------------------------------------ */
  /*                            Type helpers                            */
  /* ------------------------------------------------------------------ */
  type TypedListener<K extends keyof VillageEventMap> = (
    payload: VillageEventMap[K],
  ) => void;
  type AnyListener = (payload: any) => void;
  
  /**
   * Internally store listeners using any event name (typed or not)
   */
  const listeners: Record<string, AnyListener[]> = {};
  
  /* ------------------------------------------------------------------ */
  /*                              on()                                  */
  /* ------------------------------------------------------------------ */
  
  /**
   * Overloads – preserves type-safety for official events,
   * but accepts arbitrary strings for legacy compatibility.
   */
  export function on<K extends VillageEventName>(
    event: K,
    callback: TypedListener<K>,
  ): void;
  export function on(event: string, callback: AnyListener): void;
  export function on(event: string, callback: AnyListener) {
    (listeners[event] ??= []).push(callback);
  }
  
  /* ------------------------------------------------------------------ */
  /*                              emit()                                */
  /* ------------------------------------------------------------------ */
  
  export function emit<K extends keyof VillageEventMap>(
    event: K,
    payload: VillageEventMap[K],
  ): void;
  export function emit(event: string, payload?: any): void;
  export function emit(event: string, payload?: any): void {
    if (typeof event !== "string") {
      console.warn(
        `[Village] Event name must be a string. Received: ${typeof event}`,
      );
      return;
    }
  
    /* 1) Invoke local listeners ---------------------------------------- */
    const local = listeners[event];
    if (local) {
      local.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(
            `[Village] Error in listener for "${event}":`,
            err as Error,
          );
        }
      });
    } else {
      console.warn(`[Village] No listeners registered for event: ${event}`, payload);
    }
  
    /* 2) Relay via postMessage (iframe / popup) ------------------------ */
    const message = { source: "VillageSDK", type: event, payload };
  
    try {
      window.postMessage(message, "*");
    } catch (err) {
      console.warn(
        `[Village] Failed to postMessage to window for event "${event}":`,
        err,
      );
    }
  
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(message, "*");
      } catch (err) {
        console.warn(
          `[Village] Failed to postMessage to parent for event "${event}":`,
          err,
        );
      }
    }
  }
  