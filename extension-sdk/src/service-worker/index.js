import axios from 'axios';
import { posthog } from '../services/posthog';
import {
  PATHS_EVERYWHERE_ACTIVE_KEY,
  PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY,
  VILLAGE_API_URL,
  VILLAGE_FRONTEND_URL,
} from '../utils/consts';
import { generateRandomId, isEmptyObject } from '../utils/helpers';
import { parseConnection, parseProfileData } from '../utils/parsers';
import { getFromSyncStorage, setToSyncStorage } from '../utils/storage';
import {
  getContactInfoFromAPI,
  fetchMutualConnections,
  getProfileUserDetailsFromAPI,
  getCsrfToken,
} from './data-fetchers';

/**
 * Service Worker implementation
 * @param {Object} CONFIG - Configuration object with API_URL and FRONTEND_URL
 */
export default function ServiceWorkerImpl(CONFIG) {
  // --- Logging Constants ---
  const SDK_DEBUG_MODE_KEY = 'sdk_debug_mode';
  const SDK_LOG_LIMIT = 500; // Keep last 100 logs
  var logs = [];

  // --- Logging Utility ---
  const sdkLog = async (level, message, context = {}, forceConsole = false) => {
    const logEntry = {
      ts: new Date().toISOString(), // Use ISO string for readability
      lvl: level,
      msg: message,
      ctx: context,
    };

    try {
      // Check debug mode for console logging
      const debugMode = await chrome.storage.local.get([SDK_DEBUG_MODE_KEY]);
      if (debugMode[SDK_DEBUG_MODE_KEY] || forceConsole) {
        const logFn = console[level] || console.log;
        logFn(
          `[village-extension-sdk] ${message}`,
          context && Object.keys(context).length > 0 ? context : '',
        );
      }

      // Persist log
      logs.push(logEntry);

      // Rotate logs if limit is exceeded
      if (logs.length > SDK_LOG_LIMIT) {
        logs = logs.slice(logs.length - SDK_LOG_LIMIT);
      }
    } catch (error) {
      console.error('[village-extension-sdk] Failed to write SDK log:', error, logEntry);
    }
  };

  // --- Console Commands ---
  const getSdkLogs = async () => {
    try {
      console.log(`--- Village Extension SDK Logs (Last ${logs.length}) ---`);
      console.table(logs);
    } catch (error) {
      console.error('[village-extension-sdk] Failed to retrieve logs:', error);
    }
  };

  const enableSdkDebug = async () => {
    try {
      await chrome.storage.local.set({ [SDK_DEBUG_MODE_KEY]: true });
      sdkLog(
        'warn',
        'Village Extension SDK Debug Mode ENABLED. Verbose logs will now appear in the console.',
      );
      console.log('[village-extension-sdk] Debug mode enabled.');
    } catch (error) {
      console.error('[village-extension-sdk] Failed to enable debug mode:', error);
    }
  };

  const disableSdkDebug = async () => {
    try {
      await chrome.storage.local.set({ [SDK_DEBUG_MODE_KEY]: false });
      sdkLog('warn', 'Village Extension SDK Debug Mode DISABLED.');
      console.log('[village-extension-sdk] Debug mode disabled.');
    } catch (error) {
      console.error('[village-extension-sdk] Failed to disable debug mode:', error);
    }
  };

  const clearSdkLogs = () => {
    try {
      logs = [];
      sdkLog('warn', 'Village Extension SDK logs cleared.');
      console.log('[village-extension-sdk] Logs cleared.');
    } catch (error) {
      console.error('[village-extension-sdk] Failed to clear logs:', error);
    }
  };

  // --- Village Extension Console API ---
  // Attach commands to a namespaced object on the global scope
  self.villageExtension = {
    getLogs: getSdkLogs,
    enableDebug: enableSdkDebug, // Renamed for consistency
    disableDebug: disableSdkDebug, // Renamed for consistency
    clearLogs: clearSdkLogs,
  };

  // --- Core API Check ---
  const checkCoreApis = () => {
    const criticalApis = {
      runtime: chrome?.runtime,
      storage: chrome?.storage,
      alarms: chrome?.alarms,
      webRequest: chrome?.webRequest,
      webNavigation: chrome?.webNavigation,
      cookies: chrome?.cookies,
      tabs: chrome?.tabs, // Less critical for init, but good to check
      permissions: chrome?.permissions, // Needed for permission check itself
    };
    let allPresent = true;
    for (const [name, api] of Object.entries(criticalApis)) {
      if (!api) {
        sdkLog(
          'error',
          `Critical Chrome API missing for Village Extension SDK: chrome.${name}. Check manifest.json or browser compatibility.`,
          {},
          true,
        );
        allPresent = false;
      }
    }
    if (allPresent) {
      sdkLog('info', 'All critical Chrome APIs for Village Extension SDK seem present.');
    }
    return allPresent;
  };

  // Run the check early
  checkCoreApis();

  // --- Initial Log Call ---
  // Use setTimeout to ensure storage is likely ready and avoid potential race conditions at startup

  sdkLog('info', 'ServiceWorker initializing...', {
    CONFIG,
    manifestVersion: chrome?.runtime?.getManifest?.()?.version,
  });

  sdkLog('info', 'Checking permissions...');
  // Check required permissions
  const requiredPermissions = [
    'cookies',
    'storage',
    'webRequest',
    'alarms',
    'webNavigation', // Add this
  ];

  if (chrome && chrome.permissions) {
    chrome.permissions.contains({ permissions: requiredPermissions }, (hasPermissions) => {
      if (!hasPermissions) {
        sdkLog(
          'warn',
          `Missing required permissions for Village Extension SDK. Ensure these are granted: ${requiredPermissions.join(', ')}`,
        );
        // Keep console warn for immediate visibility if needed
        console.error(
          `[village-extension-sdk] Missing required permissions. Ensure these are granted: ${requiredPermissions.join(', ')}`,
        );
      } else {
        sdkLog('info', 'All required permissions for Village Extension SDK granted.');
      }
    });
  } else {
    sdkLog(
      'warn',
      'Cannot check permissions for Village Extension SDK (chrome.permissions API not available).',
    );
  }

  async function getUiSettings() {
    const [linkedin_login, linkedin_loggedin_email, frontend_login, user_logged_obj] =
      await Promise.allSettled([
        getFromSyncStorage('linkedin_login'),
        getFromSyncStorage('linkedin_loggedin_email'),
        getFromSyncStorage('frontend_login'),
        getFromSyncStorage('user_logged_obj'),
      ]).then((results) =>
        results.map((result) => (result.status === 'fulfilled' ? result.value : null)),
      );
    const version = chrome.runtime.getManifest().version;
    const uiSettings = {
      linkedin_login,
      linkedin_loggedin_email,
      frontend_login,
      user_logged_obj,
      version,
    };

    return uiSettings;
  }

  async function checkPaths({ url }) {
    try {
      const cookie = await getFrontendCookie();

      const uiSettings = await getUiSettings();

      if (!cookie) {
        return {
          message: `Login on Village to find the best possible paths`,
          redirect: true,
        };
      }

      const { data: paths } = await axios.post(
        `${VILLAGE_API_URL}paths-check`,
        {
          url,
        },
        { headers: { 'x-access-token': cookie } },
      );

      return {
        ...paths,
        token: cookie,
        userReference: uiSettings?.user_logged_obj?.id,
      };
    } catch (err) {
      // add logger
    }
  }

  async function getLinkedinLoggedinUserInfo() {
    const is_linkedin_loggedin = await checkLinkedinSession();
    if (!is_linkedin_loggedin) return {};

    const csrf_token = await getCsrfToken();

    let linkedin_loggedin_email = await getFromSyncStorage('linkedin_loggedin_email');

    if (!linkedin_loggedin_email) {
      try {
        const { data: contact_info } = await axios.get(
          'https://www.linkedin.com/voyager/api/identity/profiles/me/profileContactInfo',
          { headers: { 'csrf-token': csrf_token }, withCredentials: true },
        );

        if (contact_info && contact_info.emailAddress) {
          let email = contact_info.emailAddress;
          if (email.indexOf('phishing') >= 0) {
            email = decodeURIComponent(email).replace(/(.*?)https:.*?=(.*)/, '$1$2');
          }

          await setToSyncStorage('linkedin_loggedin_email', email);
          return { email };
        }
      } catch (error) {
        return {};
      }
    } else {
      return { email: linkedin_loggedin_email };
    }

    return {};
  }

  function checkLinkedinSession() {
    return new Promise((resolve, reject) => {
      chrome.cookies.get(
        { url: 'https://www.linkedin.com/', name: 'li_at' },
        async function (cookie) {
          if (cookie != null) {
            await setToSyncStorage('linkedin_login', true);
            resolve(true);
          } else {
            await setToSyncStorage('linkedin_login', false);
            notifyUserLinkedinLogin();
            resolve(false);
          }
        },
      );
    });
  }

  // Cache for the frontend login state to reduce storage writes
  var cachedFrontendLoginState = null;

  function getFrontendCookie() {
    return new Promise((resolve, reject) => {
      chrome.cookies.get(
        { url: `${VILLAGE_FRONTEND_URL}`, name: 'village.token' },
        async function (cookie) {
          const isLoggedIn = cookie !== null;

          // Only write to storage if the state has changed or hasn't been initialized
          if (cachedFrontendLoginState !== isLoggedIn) {
            await setToSyncStorage('frontend_login', isLoggedIn);
            cachedFrontendLoginState = isLoggedIn;
          }

          resolve(isLoggedIn ? cookie.value : false);
        },
      );
    });
  }

  chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    // Log received message
    // Use setTimeout to allow synchronous response sending first if needed by handler
    setTimeout(
      () =>
        sdkLog('info', 'Received external message', {
          type: request?.message,
          hasCallback: !!sendResponse,
          senderId: sender?.id,
          senderUrl: sender?.url,
        }),
      0,
    );

    const knownMessages = [
      'getExtensionStatus',
      'livelinessCheck',
      'fillUpEmail',
      'GET_MUTUAL_CONNECTIONS',
    ];

    if (request && request.message && knownMessages.includes(request.message)) {
      const handleAsyncExternalMessage = async () => {
        try {
          if (request.message === 'getExtensionStatus') {
            const uiSettings = await getUiSettings();
            sendResponse(uiSettings);
            request.shouldTriggerReset && getUserIntegration();
          } else if (request.message === 'livelinessCheck') {
            const res = await extensionLivelyCheck();
            sendResponse(res);
          } else if (request.message === 'fillUpEmail') {
            chrome.tabs.create(
              {
                url: `https://mail.google.com`,
                active: true,
              },
              (tab) => {
                const loaderId = setInterval(() => {
                  chrome.tabs.sendMessage(
                    tab.id,
                    {
                      type: 'fillUpEmail',
                      email: request.email,
                    },
                    function (reply) {
                      if (chrome.runtime.lastError) {
                        return;
                      }

                      if (reply) {
                        return clearInterval(loaderId);
                      } else {
                        return;
                      }
                    },
                  );
                }, 500);
              },
            );
          } else if (request.message === 'GET_MUTUAL_CONNECTIONS') {
            const { profileSlug } = request;
            if (!profileSlug) {
              sendResponse({
                error: true,
                message: 'Profile slug is required',
              });
              return;
            }
            try {
              const mutualConnections = await fetchMutualConnections(profileSlug);
              sendResponse(mutualConnections);
            } catch (error) {
              sendResponse({ error: true, message: error?.message });
            }
          }
        } catch (error) {
          // add logger
          try {
            sendResponse({
              error: true,
              message: error?.message || 'Unknown error',
            });
          } catch (e) {
            // add logger
          }
        }
      };

      handleAsyncExternalMessage().catch((err) => {});
      return true;
    }

    return false;
  });

  // The variables are barely understandable due to compatibility issues

  // TLDR:
  // 🔧 Settings (which is popup when you click the extension icon)
  // The sync storage variable is called 'PATHS_EVERYWHERE_ACTIVE_KEY' (boolean)
  // For the daily report we use 'is_paths_everywhere_settings_enabled'
  // The event when the user clicks on it is 'Paths Everywhere Activated/Deactivated'

  // ⬜ Floating icon (that is the floating icon that shows how many paths there are on the page)
  // The sync storage variable is called 'PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY' (string DISABLED/ENABLED)
  // For the daily report we use 'is_paths_everywhere_floating_enabled'
  // The event when the user clicks on it is 'Paths Everywhere Shown/Hidden'

  async function dailyReport() {
    const uiSettings = await getUiSettings();

    const report = {
      is_loggedin_on_linkedin: uiSettings.linkedin_login,
      linkedin_email: uiSettings.linkedin_loggedin_email,
    };

    const frontendCookie = await getFrontendCookie();
    report['is_loggedin_on_frontend'] = Boolean(frontendCookie);

    const is_paths_everywhere_settings_enabled = await getFromSyncStorage(
      PATHS_EVERYWHERE_ACTIVE_KEY,
    );
    report['is_paths_everywhere_settings_enabled'] = Boolean(is_paths_everywhere_settings_enabled);

    const is_paths_everywhere_floating_status = await getFromSyncStorage(
      PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY,
    );
    report['is_paths_everywhere_floating_enabled'] =
      is_paths_everywhere_floating_status === 'DISABLED' ? false : true;

    tracking({
      eventName: 'Extension daily report',
      properties: report,
      force: true,
    });
  }

  async function saveLinkedinConnectionsIds(prevStartFrom) {
    try {
      const cookie = await getFrontendCookie();
      const is_linkedin_loggedin = await checkLinkedinSession();
      if (is_linkedin_loggedin == true) {
        const csrf_token = await getCsrfToken();

        let areThereMoreConnections = true;
        let startFrom = prevStartFrom ? prevStartFrom : 0;

        while (areThereMoreConnections) {
          try {
            const { data } = await axios.get(
              'https://www.linkedin.com/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-15&count=500&q=search&sortType=RECENTLY_ADDED&start=' +
                startFrom,
              { headers: { 'csrf-token': csrf_token }, withCredentials: true },
            );

            const { elements: connections } = data;

            const connectionsIds = connections
              .filter((c) => c.connectedMemberResolutionResult)
              .map((c) => parseConnection(c));

            const isFinished = connections.length < 500;

            await axios.post(
              VILLAGE_API_URL + 'extension/saveids',
              {
                connections: connectionsIds,
                isFinished,
                startFrom: !isFinished ? startFrom + 500 : startFrom,
              },
              { headers: { 'x-access-token': cookie } },
            );

            if (isFinished) {
              areThereMoreConnections = false;
              await setToSyncStorage('fetched_connections', true);
            } else {
              startFrom += 500;
            }
          } catch (err) {}
        }
      } else {
      }
    } catch (err) {}
  }

  async function getUserIntegration() {
    const user_logged_obj = await getFromSyncStorage('user_logged_obj');

    if (user_logged_obj && !isEmptyObject(user_logged_obj) && user_logged_obj?.name) {
      const is_linkedin_loggedin = await checkLinkedinSession();
      if (is_linkedin_loggedin == true) {
        const { email: linkedinEmail } = await getLinkedinLoggedinUserInfo();
        const cookie = await getFrontendCookie();

        if (!cookie) {
          return;
        }

        try {
          const { data: integration } = await axios.post(
            VILLAGE_API_URL + 'extension/integration',
            { linkedinEmail, extensionId: chrome.runtime.id },
            {
              headers: { 'x-access-token': cookie },
            },
          );
          await setToSyncStorage('user_integration', integration);
          handleUserIntegration(integration);
        } catch (err) {
          if (err && err.response && err.response.status && Number(err.response.status) === 400) {
            notifyUserAppLogin();
          }

          return err;
        }
      } else {
      }
    } else {
      extensionLogin();
    }
  }

  async function extensionLogin() {
    const cookie = await getFrontendCookie();

    if (!cookie) {
      return;
    }

    try {
      const { data: user } = await axios.get(VILLAGE_API_URL + 'user', {
        headers: { 'x-access-token': cookie },
      });
      await setToSyncStorage('user_logged_obj', user);
      getUserIntegration();
    } catch (err) {
      return err;
    }
  }

  var isHandleUserIntegrationRunning = false;

  async function handleUserIntegration(integration) {
    if (isHandleUserIntegrationRunning) {
      return;
    }

    isHandleUserIntegrationRunning = true;

    try {
      const data = integration.sync_data || false;

      if (!data || !data.user_profile) {
        await getAndSendUsersProfileData();
      }

      if (!data.connection_ids || !data.connection_ids.is_finished) {
        await saveLinkedinConnectionsIds(
          data.connection_ids && data.connection_ids.start_from
            ? data.connection_ids.start_from
            : undefined,
        );
      }
    } catch (err) {}

    isHandleUserIntegrationRunning = false;
  }

  async function extensionLivelyCheck() {
    const statuses = {
      getProfileUserDetails: false,
      getContactInfo: false,
      getLinkedinLoggedinUserInfo: false,
      getProfileConnections: false,
    };
    try {
      await getProfileUserDetailsFromAPI('me');
      statuses.getProfileUserDetails = true;
    } catch (e) {
      statuses.getProfileUserDetails = false;
    }
    try {
      await getContactInfoFromAPI('me');
      statuses.getContactInfo = true;
    } catch (e) {
      statuses.getContactInfo = false;
    }
    try {
      await getLinkedinLoggedinUserInfo();
      statuses.getLinkedinLoggedinUserInfo = true;
    } catch (e) {
      statuses.getLinkedinLoggedinUserInfo = false;
    }
    try {
      const csrf_token = await getCsrfToken();
      await axios.get(
        'https://www.linkedin.com/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-15&count=500&q=search&sortType=RECENTLY_ADDED&start=' +
          0,
        { headers: { 'csrf-token': csrf_token }, withCredentials: true },
      );
      statuses.getProfileConnections = true;
    } catch (e) {
      statuses.getProfileConnections = false;
    }
    return statuses;
  }

  async function getAndSendUsersProfileData() {
    try {
      const userContactData = await getContactInfoFromAPI('me');
      const userProfileData = await getProfileUserDetailsFromAPI('me');
      var parsedProfile = parseProfileData(userProfileData);
      parsedProfile['contact_info'] = userContactData;
      parsedProfile['public_identifier'] = userProfileData.profile.miniProfile.publicIdentifier;
    } catch (error) {}
    const cookie = await getFrontendCookie();

    if (!cookie) {
      return;
    }

    try {
      const response = await axios.post(
        VILLAGE_API_URL + 'extension/saveuserprofile',
        { userProfileData: parsedProfile },
        {
          headers: { 'x-access-token': cookie },
        },
      );
      await setToSyncStorage('saved_profile', true);
      return;
    } catch (err) {
      throw new Error('Failed to save user profile data');
    }
  }

  async function notifyUserLinkedinLogin() {
    const cookie = await getFrontendCookie();

    if (!cookie) {
      return;
    }

    try {
      await axios.get(VILLAGE_API_URL + 'notify-linkedin', {
        headers: { 'x-access-token': cookie },
      });
    } catch (err) {
      return err;
    }
  }

  async function notifyUserAppLogin() {
    const user_logged_obj = await getFromSyncStorage('user_logged_obj');

    if (user_logged_obj && !isEmptyObject(user_logged_obj)) {
      try {
        await axios.get(`${VILLAGE_API_URL}notify-app/${user_logged_obj.id}`);
      } catch (err) {
        return err;
      }
    } else {
    }
  }

  async function tracking({ eventName, properties, force }) {
    const user_logged_obj = await getFromSyncStorage('user_logged_obj');
    try {
      if (!user_logged_obj || (isEmptyObject(user_logged_obj) && !force)) {
        return;
      }

      const userId = user_logged_obj.id || generateRandomId();

      const postHogPayload = {
        event: eventName,
        properties: {
          ...properties,
          distinct_id: userId,
        },
      };

      const [posthogResponse] = await Promise.allSettled([
        posthog.post('/capture', postHogPayload),
      ]);
    } catch (error) {
      // add logger
    }
  }

  async function logicForTriggeringPaths(tabId, url) {
    if (url) {
      const isUserLoggedIn = await getFrontendCookie();

      if (!isUserLoggedIn) {
        return;
      }

      const { pathname } = new URL(url);

      const user_logged_obj = await getFromSyncStorage('user_logged_obj');
      const userHasCache = Boolean(user_logged_obj?.last_cache_date);

      if (!userHasCache) {
        return;
      }

      const isPathsEverywhereEnabled =
        user_logged_obj?.app?.config?.features?.pathsEverywhere?.enabled;

      if (!isPathsEverywhereEnabled) {
        return;
      }

      const urlIsPartnerWebsite = url.includes(user_logged_obj?.app?.domain_name);

      if (urlIsPartnerWebsite) {
        return;
      }

      if (url.includes('village.do')) {
        return;
      }

      getFromSyncStorage(PATHS_EVERYWHERE_ACTIVE_KEY)
        .then((didUserOptIn) => {
          const didUserOptInIsUndefined = typeof didUserOptIn === 'undefined';

          if (didUserOptInIsUndefined) {
            setToSyncStorage(PATHS_EVERYWHERE_ACTIVE_KEY, true);
          }

          if (didUserOptIn || didUserOptInIsUndefined) {
            try {
              chrome.tabs.sendMessage(
                tabId,
                {
                  type: 'pathsEverywhere',
                },
                (response) => {
                  // This callback will detect the error
                  if (chrome.runtime.lastError) {
                    // Error is handled here, won't become an uncaught promise rejection
                    return;
                  }
                },
              );
            } catch (err) {
              // Synchronous errors are still caught here
            }
          } else {
            // add logger
          }
        })
        .catch((err) => {
          // Handle any errors from getFromSyncStorage
        });
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[EXT] Received message:', message);
    // Define the list of commands this listener handles
    const knownCommands = [
      'village:bind:extension',
      'saveUISettings',
      'getUserIntegration',
      'getSettings',
      'checkPaths',
      'tracking',
    ];

    // Check if the command is one this listener should handle
    if (knownCommands.includes(message.command)) {
      console.log(`[EXT] Handling known command: ${message.command}`);
      const handleAsyncOperation = async () => {
        try {
          console.log('[EXT] getUserIntegration switch ', message.command);
          switch (message.command) {
            case 'village:bind:extension':
              await setToSyncStorage('village:bind:extension', message.data);
              sendResponse({ success: true });
              break;
            case 'saveUISettings':
              await setToSyncStorage('user_logged_obj', message.data);
              sendResponse({ success: true });
              break;
            case 'getUserIntegration':
              await getUserIntegration();
              sendResponse({ success: true });
              break;
            case 'getSettings':
              const uiSettings = await getUiSettings();
              sendResponse({ uiSettings });
              break;
            case 'checkPaths':
              const relationship = await checkPaths({
                url: message.url,
              });
              sendResponse(relationship);
              break;
            case 'tracking':
              await tracking({
                eventName: message.eventName,
                properties: message.properties,
              });
              sendResponse({ success: true });
              break;
            // No default case needed here anymore, as we checked the command above
          }
        } catch (error) {
          console.error('[EXT] Error handling command:', error);
          // Still send an error response if handling failed for a known command
          sendResponse({ error: error.message });
        }
      };

      handleAsyncOperation().catch((err) => {
        console.error('[EXT] Async operation error:', err); // 🔍
      });

      console.log('[EXT] Unknown command received, ignoring:', message.command);
      // Return true because we are handling this known command asynchronously
      return true;
    }

    // If the command is not in knownCommands, do nothing and implicitly return undefined.
    // This allows the message to propagate to other listeners.
    // console.log(`Command ${message.command} not handled by this listener.`); // Optional: for debugging
    return false; // Explicitly return false for clarity, equivalent to returning undefined
  });

  // --- Setup Alarms ---
  sdkLog('info', 'Setting up alarms...');
  try {
    // Setup alarms only if the API is available
    if (chrome && chrome.alarms) {
      // Clear and create getUserIntegration alarm
      sdkLog('info', 'Attempting to clear/create getUserIntegration alarm.');
      chrome.alarms.clear('getUserIntegration', (wasCleared) => {
        if (chrome.runtime.lastError) {
          sdkLog('error', 'Error clearing getUserIntegration alarm', {
            error: chrome.runtime.lastError.message,
          });
        } else {
          sdkLog('info', `getUserIntegration alarm cleared (existed: ${wasCleared})`);
          chrome.alarms.create('getUserIntegration', {
            delayInMinutes: 60,
            periodInMinutes: 60,
          });
          sdkLog('info', 'Created getUserIntegration alarm (60 min period).');
        }
      });

      // Clear and create dailyReport alarm
      sdkLog('info', 'Attempting to clear/create dailyReport alarm.');
      chrome.alarms.clear('dailyReport', (wasCleared) => {
        if (chrome.runtime.lastError) {
          sdkLog('error', 'Error clearing dailyReport alarm', {
            error: chrome.runtime.lastError.message,
          });
        } else {
          sdkLog('info', `dailyReport alarm cleared (existed: ${wasCleared})`);
          chrome.alarms.create('dailyReport', {
            delayInMinutes: 5, // Start 5 minutes after the extension is loaded/installed
            periodInMinutes: 1440, // Set to run every 1440 minutes (24 hours)
          });
          sdkLog('info', 'Created dailyReport alarm (24 hour period).');
        }
      });
    } else {
      // Silently skip alarm setup if API is not present.
      // checkCoreApis() would have already logged the missing API.
    }
  } catch (error) {
    sdkLog('error', 'Unexpected error during alarm setup', {
      error: error?.message,
      stack: error?.stack,
    });
  }
  sdkLog('info', 'Alarm setup phase complete.');

  // Web Request Listeners
  sdkLog('info', 'Attaching webRequest listeners...');
  try {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      async function (details) {
        if (details.url.indexOf('signin') > 0 || details.url.indexOf('login-submit') > 0) {
          await setToSyncStorage('linkedin_login', true);
          await new Promise((resolve) => setTimeout(resolve, 7500));
          getUserIntegration();
        } else if (details.url.indexOf('/logout') > 0) {
          await setToSyncStorage('linkedin_login', false);
        }
        return {
          requestHeaders: details.requestHeaders,
        };
      },
      {
        urls: ['*://*.linkedin.com/*/*'],
      },
      ['requestHeaders'],
    );
  } catch (error) {
    sdkLog(
      'error',
      'Failed to attach LinkedIn webRequest listener',
      { error: error?.message },
      true,
    );
  }

  try {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      async function (details) {
        if (details.url.indexOf('/callback') > 0) {
          await setToSyncStorage('frontend_login', true);
          await new Promise((resolve) => setTimeout(resolve, 7500));
          getUserIntegration();
        } else if (details.url.indexOf('/logout') > 0) {
          await setToSyncStorage('frontend_login', false);
        }
        return {
          requestHeaders: details.requestHeaders,
        };
      },
      {
        urls: [`${VILLAGE_API_URL}*`, `${VILLAGE_API_URL}*/*/*`],
      },
      ['requestHeaders'],
    );
  } catch (error) {
    sdkLog(
      'error',
      'Failed to attach Frontend webRequest listener',
      { error: error?.message },
      true,
    );
  }

  chrome.alarms.onAlarm.addListener(function (alarm) {
    sdkLog('info', `Alarm triggered: ${alarm.name}`);
    if (alarm.name == 'getUserIntegration') {
      getUserIntegration().catch((err) => {});
    }

    if (alarm.name === 'dailyReport') {
      dailyReport().catch((err) => {});
    }
  });

  chrome.runtime.onInstalled.addListener((details) => {
    extensionLogin().catch((err) => {});
  });

  chrome.runtime.onStartup.addListener(() => {
    extensionLogin().catch((err) => {});
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    logicForTriggeringPaths(tabId, changeInfo.url).catch((err) => {});
  });

  chrome.webNavigation.onCompleted.addListener((details) => {
    const { tabId, url } = details;
    logicForTriggeringPaths(tabId, url).catch((err) => {});
  });
}
