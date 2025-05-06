import { App } from "./app.js";
import "./styles.css";
import { VillageEvents } from "./config/village-events.js";;
import { on, emit } from "./sdk-wrapper";

(function (window) {
  function createVillage() {
    const listeners = {};

    const v = {
      q: [],
      _config: {
        paths_cta: []
      },
      _partnerKey: null,
      _userReference: null,
      _app: null,
      _initialized: false,

      /** Replace the entire CTA list */
      updatePathsCTA(newList = []) {
        v._config.paths_cta = Array.isArray(newList) ? newList : [];
        v.broadcast?.(VillageEvents.pathsCtaUpdated, v._config.paths_cta);
        return v;           // permite encadear chamadas se quiser
      },

      /** Add a single CTA object on the fly */
      addPathCTA(cta) {
        if (cta && typeof cta.label === "string" && cta.callback) {
          v._config.paths_cta.push(cta);
          v.broadcast?.(VillageEvents.pathsCtaUpdated, v._config.paths_cta);
        } else {
          console.warn("[Village] Invalid CTA object:", cta);
        }
        return v;
      },


      off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((cb) => cb !== callback);
      },

      on,
      emit,

      dispatch(event, data) {
        try {
          window.dispatchEvent(new CustomEvent(event, { detail: data }));
        } catch (err) {
          console.warn(`[Village] Failed to dispatch CustomEvent in current window for "${event}":`, err);
        }
      },

      broadcast(event, data) {
        v.emit?.(event, data);
        v.dispatch?.(event, data);
      },

      _processQueue: function () {
        while (v.q.length > 0) {
          var item = v.q.shift();
          var method = item[0];
          var args = item.slice(1);
          if (typeof v[method] === "function") {
            v[method].apply(v, ...args);
          }
        }
      },

      init(partnerKey, config) {
        if (v._initialized) return v;
        if (!partnerKey) throw new Error("Village: Partner key is required");

        v._partnerKey = partnerKey;

        // Start with an empty list; CTAs will be injected via updatePathsCTA
        v._config = {
          ...config,
          paths_cta: [],          // placeholder, will be filled below (if any)
        };

        v._initialized = true;
        v._renderWidget();        // widgetReady will be broadcast here

        console.log('init', config)
        // If the caller passed paths_cta, replace the list and broadcast the update
        if (Array.isArray(config?.paths_cta) && config.paths_cta.length) {
          v.updatePathsCTA(config.paths_cta);   // <— emits pathsCtaUpdated
        }

        return v;
      },

      identify: function (userReference, details) {
        if (!v._initialized) {
          v.q.push(["identify", userReference, details]);
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          v._userReference = userReference;
          v._app
            .setUserReference(userReference, details)
            .then(() => resolve())
            .catch((error) => reject(error));
        });
      },

      logout: function () {
        if (!v._initialized) {
          v.q.push(["logout"]);
          return;
        }
        if (v._app) {
          v._app.logout();
        }
      },

      _renderWidget: function () {
        return new Promise((resolve, reject) => {
          try {
            if (!v._app) {
              v._app = new App(v._partnerKey, v._config);
            }
            v._app.init();

            v.broadcast?.(VillageEvents.widgetReady, {
              partnerKey: v._partnerKey,
              userReference: v._userReference,
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      },

      // ✅ Expor CTAs
      getPathsCTA() {
        // 🔍 Debug: log the initial config
        console.log('getPathsCTA - initial config:', v?._config);

        // Try to get from internal config
        const pathsCTA = Array.isArray(v?._config?.paths_cta) && v._config.paths_cta.length > 0
          ? v._config.paths_cta
          : [];


        // If not present or empty, try to load from the URL
        if (!Array.isArray(pathsCTA) || pathsCTA.length === 0) {
          console.log('getPathsCTA - no valid paths_cta in config, checking URL...');

          const urlParam = new URLSearchParams(window.location.search).get('paths_cta');

          try {
            // Try to decode and parse the URL parameter as JSON
            const parsed = JSON.parse(decodeURIComponent(urlParam));
            console.log('getPathsCTA - parsed from URL:', parsed);

            if (Array.isArray(parsed)) {
              pathsCTA = parsed;
            } else {
              console.warn('getPathsCTA - URL param is not a valid array');
              pathsCTA = [];
            }
          } catch (err) {
            console.warn('getPathsCTA - failed to parse paths_cta from URL:', err);
            pathsCTA = [];
          }
        }

        // 🔍 Final result
        console.log('getPathsCTA - returning:', pathsCTA);

        return pathsCTA || [];
      },

      executeCallback(payload) {
        const ctas = v.getPathsCTA();
        //console.log("getPathsCTA", ctas, payload);
        for (let index = 0; index < ctas.length; index++) {
          const cta = ctas[index];
          if (cta.callback && payload.index == index) {
            //console.log("executeCallback", cta);
            cta.callback(payload);
            return true;
          } else {
            console.log("getPathsCTA not execute", index, cta);
          }
        }
        console.log("📨 Relay received:", payload);

        if (window !== window.parent) {
          window.parent.postMessage(payload, "*");
        }
      }
    };

    v.authorize = v.identify;
    return v;
  }



  function autoInitFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const partnerKey = urlParams.get("PARTNER_PUBLIC_KEY");
    const pathsCtaParam = urlParams.get("paths_cta");

    if (partnerKey) {
      let parsedPathsCTA = [];

      if (pathsCtaParam) {
        try {
          parsedPathsCTA = JSON.parse(decodeURIComponent(pathsCtaParam));
          if (!Array.isArray(parsedPathsCTA)) {
            console.warn("paths_cta is not a valid array, ignoring.");
            parsedPathsCTA = [];
          }
        } catch (e) {
          console.warn("Failed to parse paths_cta from URL:", e);
        }
      }

      console.log("🔁 Auto-initializing Village with partnerKey from URL");
      window.Village.init(partnerKey, {
        paths_cta: parsedPathsCTA,
      });
    }
  }
  
  const existingVillage = window.Village;
  const existingQueue = existingVillage?.q || [];

  window.Village = createVillage();
  window.Village.on = on;
  window.Village.emit = emit;
  window.Village.q = existingQueue.concat(window.Village.q);
  window.Village._processQueue();

  window.Village.on(VillageEvents.widgetReady, ({ partnerKey, userReference }) => {
    console.log("✅ Village widget is ready");
  });
  window.Village.on(VillageEvents.pathCtaClicked, (payload) => {
    window.Village.executeCallback(payload);
  });
  if (!window.__village_message_listener_attached__) {
    console.log("✅ __village_message_listener_attached__");
    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (!msg || !(msg.source == "VillageSDK" || msg.source == "dynamic-cta")) return;
      //console.log(msg);
      if (msg.type === VillageEvents.pathCtaClicked) {
        window.Village.executeCallback(msg.payload || msg);
      }
    });

    window.__village_message_listener_attached__ = true;
  }
  autoInitFromUrl();
})(window);

export default window.Village;
