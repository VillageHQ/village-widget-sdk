/*
 * Configuration for mutual connections fetching
 */
const MUTUAL_CONNECTIONS_CONFIG = {
  maxPages: 5,
  pageSize: 50,
  delayBetweenRequests: { min: 500, max: 1000 },
  endpoints: {
    current: { enabled: true, timeout: 10000 },
    legacy: { enabled: true, timeout: 10000 },
  },
  onRateLimit: 'RETURN_EMPTY', // or 'THROW_ERROR'
};

/*
 * Function : makeLinkedInRequest()
 * Description: Wrapper for fetch with LinkedIn API defaults (auto-detects Chrome extension or browser)
 */
async function makeLinkedInRequest(url, options = {}) {
  const csrfToken = await getCsrfToken();

  const { timeout, headers, ...restOptions } = options;
  const controller = new AbortController();

  const defaultOptions = {
    method: 'GET',
    headers: {
      'csrf-token': csrfToken,
      accept: '*/*',
      ...headers, // Merge provided headers after defaults
    },
    credentials: 'include',
    signal: controller.signal,
    ...restOptions, // Spread other options but headers already handled
  };

  // Set up timeout if provided
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const response = await fetch(url, defaultOptions);

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    // Handle abort errors as timeout
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.status = 408;
      throw timeoutError;
    }

    throw error;
  }
}

/*
 * Function : getContactInfoFromAPI()
 * Description: Get contact profile info from linkein API
 */
async function getContactInfoFromAPI(profile_id) {
  try {
    const contact_info = await makeLinkedInRequest(
      'https://www.linkedin.com/voyager/api/identity/profiles/' +
        profile_id +
        '/profileContactInfo',
    );

    const contact_info_obj = {};
    if (contact_info && contact_info.emailAddress) {
      contact_info_obj.emailAddress = contact_info.emailAddress;
    }
    if (contact_info && contact_info.websites) {
      contact_info_obj.websites = contact_info.websites;
    }
    if (contact_info && contact_info.twitterHandles) {
      contact_info_obj.twitterHandles = contact_info.twitterHandles;
    }
    if (contact_info && contact_info.phoneNumbers) {
      contact_info_obj.phoneNumbers = contact_info.phoneNumbers;
    }

    return contact_info_obj;
  } catch (error) {
    return {};
  }
}

/*
 * Function : getCsrfToken()
 * Description: Get profile user details data from linkein API
 */
async function getProfileUserDetailsFromAPI(profile_id) {
  try {
    const profileViewRes = await makeLinkedInRequest(
      'https://www.linkedin.com/voyager/api/identity/profiles/' + profile_id + '/profileView',
    );

    if (profileViewRes && profileViewRes.entityUrn) {
      return profileViewRes;
    }
    return {};
  } catch (error) {
    return {};
  }
}

/**
 * Parses legacy endpoint response into connection objects
 * This endpoint returns data in searchDashClustersByAll format
 */
function parseLegacyConnectionResponse(apiResponse) {
  const data = apiResponse?.data;

  try {
    if (!data || !data?.searchDashClustersByAll?.elements?.[0]?.items) {
      return [];
    }

    return data.searchDashClustersByAll.elements[0].items
      .filter((item) => item?.item?.entityResult)
      .map((item) => transformEntityToConnection(item.item.entityResult));
  } catch (error) {
    console.error('Error parsing legacy connection response:', error);
    return [];
  }
}

/**
 * Fetches mutual connections using the legacy LinkedIn GraphQL endpoint
 * This is the older, established endpoint that returns clustered search results
 */
async function fetchMutualConnectionsViaLegacyEndpoint(profileSlug, config) {
  try {
    const profileId = await fetchProfileInformation(profileSlug);
    const allConnections = [];

    for (let pageIndex = 0; pageIndex < config.maxPages; pageIndex++) {
      const connections = await fetchLegacyConnectionPage(profileId, pageIndex, config);

      if (!connections || connections.length === 0) {
        break; // No more data
      }

      allConnections.push(...connections);

      if (shouldDelayNextRequest(pageIndex, config.maxPages)) {
        await delayExecution(generateRequestDelay(config));
      }
    }

    return allConnections;
  } catch (error) {
    console.error('Error fetching mutual connections via legacy endpoint:', error);
    throw error;
  }
}

/**
 * Fetches a single page of connections from legacy endpoint
 */
async function fetchLegacyConnectionPage(profileId, pageIndex, config) {
  const startIndex = pageIndex * config.pageSize;
  const url = buildLegacyEndpointUrl(profileId, startIndex, config.pageSize);

  try {
    const response = await makeLinkedInRequest(url, { timeout: config.endpoints.legacy.timeout });
    return parseLegacyConnectionResponse(response);
  } catch (error) {
    console.log(`Error fetching legacy endpoint page ${pageIndex}:`, error.message);
    return []; // Return empty for this page, continue with others
  }
}

/**
 * Builds the legacy GraphQL endpoint URL
 */
function buildLegacyEndpointUrl(profileId, startIndex, pageSize) {
  return `https://www.linkedin.com/voyager/api/graphql?variables=(start:${startIndex},count:${pageSize},origin:MEMBER_PROFILE_CANNED_SEARCH,query:(flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:connectionOf,value:List(${profileId})),(key:network,value:List(F)),(key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false))&queryId=voyagerSearchDashClusters.92cc53470cef3c578ab1d34676d5320c`;
}

/**
 * Parses current endpoint response into connection objects
 * This endpoint returns normalized JSON with included array
 */
function parseCurrentConnectionResponse(apiResponse) {
  try {
    // Check for new format with included array
    if (apiResponse?.included && Array.isArray(apiResponse.included)) {
      return apiResponse.included
        .filter((item) => item.$type === 'com.linkedin.voyager.dash.search.EntityResultViewModel')
        .map((profile) => transformEntityToConnection(profile));
    }

    return [];
  } catch (error) {
    console.error('Error parsing current connection response:', error);
    return [];
  }
}

/**
 * Fetches mutual connections using the current LinkedIn GraphQL endpoint
 * This is the newer endpoint that returns normalized JSON with better structure
 */
async function fetchMutualConnectionsViaCurrentEndpoint(profileSlug, config) {
  try {
    const profileId = await fetchProfileInformation(profileSlug);
    const allConnections = [];

    for (let pageIndex = 0; pageIndex < config.maxPages; pageIndex++) {
      const connections = await fetchCurrentConnectionPage(profileId, pageIndex, config);

      if (!connections || connections.length === 0) {
        break; // No more data
      }

      allConnections.push(...connections);

      if (shouldDelayNextRequest(pageIndex, config.maxPages)) {
        await delayExecution(generateRequestDelay(config));
      }
    }

    return allConnections;
  } catch (error) {
    console.error('Error fetching mutual connections via current endpoint:', error);
    throw error;
  }
}

/**
 * Fetches a single page of connections from current endpoint
 */
async function fetchCurrentConnectionPage(profileId, pageIndex, config) {
  const startIndex = pageIndex * config.pageSize;
  const url = buildCurrentEndpointUrl(profileId, startIndex, config.pageSize);

  try {
    const response = await makeLinkedInRequest(url, {
      mode: 'cors',
      timeout: config.endpoints.current.timeout,
      headers: {
        accept: 'application/vnd.linkedin.normalized+json+2.1',
      },
    });
    return parseCurrentConnectionResponse(response);
  } catch (error) {
    console.log(`Error fetching current endpoint page ${pageIndex}:`, error.message);
    return []; // Return empty for this page, continue with others
  }
}

/**
 * Builds the current GraphQL endpoint URL
 */
function buildCurrentEndpointUrl(profileId, startIndex, pageSize) {
  return `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(start:${startIndex},count:${pageSize},origin:MEMBER_PROFILE_CANNED_SEARCH,query:(flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:connectionOf,value:List(${profileId})),(key:network,value:List(F)),(key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false))&queryId=voyagerSearchDashClusters.5ba32757c00b31aea747c8bebb92855c`;
}

/**
 * Main entry point for fetching mutual connections
 * Attempts current endpoint first, falls back to legacy if needed
 * @param {string} profileSlug - LinkedIn profile identifier
 * @returns {Promise<Array>} Array of mutual connections
 */
async function fetchMutualConnections(profileSlug) {
  const config = MUTUAL_CONNECTIONS_CONFIG;
  // Always try current endpoint first, then fallback to legacy
  const endpoints = ['current', 'legacy'];

  let lastEncounteredError = null;

  for (const endpoint of endpoints) {
    if (!isEndpointEnabled(config, endpoint)) continue;

    try {
      console.log(`Attempting to fetch mutual connections using ${endpoint} endpoint`);

      const connections = await fetchConnectionsFromEndpoint(profileSlug, endpoint, config);

      console.log(
        `Successfully fetched ${connections.length} connections using ${endpoint} endpoint`,
      );
      return connections;
    } catch (error) {
      console.error(`Failed with ${endpoint} endpoint:`, error.message);

      if (isRateLimitError(error)) {
        return handleRateLimitError(config);
      }

      lastEncounteredError = error;
    }
  }

  throw lastEncounteredError || new Error('All endpoints failed to fetch mutual connections');
}

/**
 * Routes to the appropriate endpoint implementation
 */
function fetchConnectionsFromEndpoint(profileSlug, endpoint, config) {
  switch (endpoint) {
    case 'legacy':
      return fetchMutualConnectionsViaLegacyEndpoint(profileSlug, config);
    case 'current':
      return fetchMutualConnectionsViaCurrentEndpoint(profileSlug, config);
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

/**
 * Checks if an endpoint is enabled in configuration
 */
function isEndpointEnabled(config, endpoint) {
  return config.endpoints[endpoint]?.enabled === true;
}

/**
 * Checks if an error is a rate limit error
 */
function isRateLimitError(error) {
  return (
    error.status === 429 ||
    /status:\s*429/i.test(error.message || '') ||
    error.message?.toLowerCase().includes('rate limit') ||
    error.message?.toLowerCase().includes('too many requests')
  );
}

/**
 * Handles rate limit errors based on configuration
 */
function handleRateLimitError(config) {
  if (config.onRateLimit === 'RETURN_EMPTY') {
    console.log('Rate limited - returning empty result');
    return [];
  }
  throw new Error('Rate limited - stopping execution');
}

/**
 * Generates a random delay between requests
 */
function generateRequestDelay(config) {
  const { min, max } = config.delayBetweenRequests;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Delays execution for a specified duration
 */
function delayExecution(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Determines if we should delay before the next request
 */
function shouldDelayNextRequest(currentPageIndex, maxPages) {
  return currentPageIndex < maxPages - 1;
}

/**
 * Fetches profile information required for mutual connections
 */
async function fetchProfileInformation(profileSlug) {
  const profileDetails = await getProfileUserDetailsFromAPI(profileSlug);

  if (!profileDetails.entityUrn) {
    throw new Error('Could not retrieve profile details');
  }

  return extractProfileId(profileDetails.entityUrn);
}

/**
 * Extracts profile ID from LinkedIn entity URN
 */
function extractProfileId(entityUrn) {
  return entityUrn.replace('urn:li:fs_profileView:', '');
}

/**
 * Extracts profile slug from LinkedIn URL
 */
function extractProfileSlug(navigationUrl) {
  return navigationUrl.split('/in/')?.[1]?.split('?')?.[0] || '';
}

/**
 * Cleans profile URL by removing query parameters
 */
function cleanProfileUrl(navigationUrl) {
  try {
    const url = new URL(navigationUrl);
    return url.origin + url.pathname;
  } catch {
    return navigationUrl.split('?')?.[0] || '';
  }
}

/**
 * Transforms a LinkedIn entity object into a standardized connection object
 */
function transformEntityToConnection(entity) {
  const navigationUrl = entity.navigationUrl || '';
  const profileSlug = extractProfileSlug(navigationUrl);
  const profileUrl = cleanProfileUrl(navigationUrl);

  return {
    name: entity.title?.text || '',
    slug: profileSlug,
    headline: entity.primarySubtitle?.text || '',
    location: entity.secondarySubtitle?.text || '',
    profileUrl: profileUrl,
    distance: entity.entityCustomTrackingInfo?.memberDistance || '',
  };
}

/*
 * Function : getCsrfToken()
 * Description: Get CSRF token from LinkedIn (auto-detects Chrome extension or browser)
 */
function getCsrfToken() {
  return new Promise((resolve, reject) => {
    // Check if Chrome API is available
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.get) {
      // Chrome extension environment
      chrome.cookies.get(
        {
          url: 'https://www.linkedin.com',
          name: 'JSESSIONID',
        },
        function done(data) {
          let xt = data || {};
          resolve(xt.value.replace(/"/g, ''));
        },
      );
    } else {
      // Browser environment - use document.cookie
      try {
        const cookies = document.cookie.split(';');
        let jsessionid = null;

        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'JSESSIONID') {
            jsessionid = value;
            break;
          }
        }

        if (jsessionid) {
          resolve(jsessionid.replace(/"/g, ''));
        } else {
          reject(new Error('JSESSIONID cookie not found'));
        }
      } catch (error) {
        reject(error);
      }
    }
  });
}

// Export only the main public API functions
export {
  fetchMutualConnections,
  getContactInfoFromAPI,
  getProfileUserDetailsFromAPI,
  getCsrfToken,
};
