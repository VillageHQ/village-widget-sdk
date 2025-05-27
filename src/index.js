import { App } from "./app.js";
import "./styles.css";
import { VillageEvents } from "./config/village-events.js";;
import { on, emit } from "./sdk-wrapper";
import { Console } from "console";
import Cookies from "js-cookie";

const villageToken = 'village.token';
// ---------------------------------------------------------------------------
// Village – Session-recovery iframe
// Always injects <https://village.do/auth/iframe> (hidden) to recover token
// ---------------------------------------------------------------------------
(function injectVillageAuthIframe() {
  if (document.getElementById("villageAuth")) return;           // avoid duplicates
  const iframe = document.createElement("iframe");
  const token = Cookies.get(villageToken);
  iframe.id = "villageAuth";
  iframe.src = `${import.meta.env.VITE_APP_FRONTEND_URL}/iframe?token=${encodeURIComponent(token)}`;
  iframe.style.display = "none";
  iframe.sandbox = "allow-scripts allow-same-origin allow-storage-access-by-user-activation";
  if(document?.body){
    document.body.appendChild(iframe);
  }
})();

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

      sendStorageGetToken() {
        window.postMessage({
          source: "VillageSDK",
          type: "STORAGE_GET_TOKEN"
        }, "*");
      },

      sendStorageSetToken(token) {
        if (typeof token !== "string") {
          console.warn("Token must be a string.");
          return;
        }

        window.postMessage({
          source: "VillageSDK",
          type: "STORAGE_SET_TOKEN",
          token: token
        }, "*");
      },

      sendStorageDeleteToken() {
        window.postMessage({
          source: "VillageSDK",
          type: "STORAGE_DELETE_TOKEN"
        }, "*");
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
        // Try to get from internal config
        const pathsCTA = Array.isArray(v?._config?.paths_cta) && v._config.paths_cta.length > 0
          ? v._config.paths_cta
          : [];

        // If not present or empty, try to load from the URL
        if (!Array.isArray(pathsCTA) || pathsCTA.length === 0) {
          const urlParam = new URLSearchParams(window.location.search).get('paths_cta');
          try {
            // Try to decode and parse the URL parameter as JSON
            const parsed = JSON.parse(decodeURIComponent(urlParam));
            if (Array.isArray(parsed)) {
              pathsCTA = parsed;
            } else {
              pathsCTA = [];
            }
          } catch (err) {
            pathsCTA = [];
          }
        }

        return pathsCTA || [];
      },

      executeCallback(payload) {
        const ctas = v.getPathsCTA();
        for (let index = 0; index < ctas.length; index++) {
          const cta = ctas[index];
          if (cta.callback && payload.index == index) {
            cta.callback(payload);
            return true;
          } 
        }
        if (window !== window.parent) {
          window.parent.postMessage(payload, "*");
        }
      }
    };

    v.authorize = v.identify;
    return v;
  }

  const existingVillage = window.Village;
  const existingQueue = existingVillage?.q || [];

  window.Village = createVillage();
  window.Village.on = on;
  window.Village.emit = emit;
  window.Village.q = existingQueue.concat(window.Village.q);
  window.Village._processQueue();

  window.Village.on(VillageEvents.widgetReady, ({ partnerKey, userReference }) => {
    //console.log("✅ Village widget is ready");
  });
  window.Village.on(VillageEvents.pathCtaClicked, (payload) => {
    window.Village.executeCallback(payload);
  });

  window.Village.on(VillageEvents.oauthSuccess, (payload) => {
    console.log("✅ Village OAuth success", payload);
  });
  if (!window.__village_message_listener_attached__) {
    //console.log("✅ __village_message_listener_attached__");
    window.addEventListener("message", async (event) => {
      const { origin, data } = event;
      const domainA = new URL(origin).hostname;
      const domainB = new URL(import.meta.env.VITE_APP_FRONTEND_URL).hostname;

      if (domainA === domainB && data?.type === "VillageSDK") {
        console.log("[SDK cookie] message from iframe:", data);
        const token = data.token ?? null;

        if (!token && document.requestStorageAccess) {
          try {
            await document.requestStorageAccess();
            const recoveredToken = Cookies.get(villageToken);
            const recoveredTokenS = sessionStorage.getItem('village.token');
            console.warn("[VillageSDK] Storage Access ", recoveredToken, recoveredTokenS);
            if (recoveredToken) {
              sessionStorage.setItem(villageToken, recoveredToken);
              window.Village.broadcast(VillageEvents.oauthSuccess, { token: recoveredToken });
            }
          } catch (e) {
            console.warn("[VillageSDK] Storage Access denied or failed", e);
          }
          return;
        }

        if (token) {
          Cookies.set(villageToken, token, {
            secure: true,
            sameSite: "None",
            expires: 60,
          });
          sessionStorage.setItem(villageToken, token);
          window.Village.broadcast(VillageEvents.oauthSuccess, { token });
        } else {
          Cookies.remove(villageToken);
          sessionStorage.removeItem(villageToken);
          window.Village.broadcast(VillageEvents.userLoggedOut, {});
        }
        return;
      }

      if (!data || data.source !== "VillageSDK") return;
      if (data.type === VillageEvents.pathCtaClicked) {
        window.Village.executeCallback(data.payload || data);
      }
    });


    window.__village_message_listener_attached__ = true;
  }
})(window);

export default window.Village;
