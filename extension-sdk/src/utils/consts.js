export const PATHS_EVERYWHERE_ACTIVE_KEY = "isPathsEverywhereActive";
export const PATHS_EVERYWHERE_FLOATING_ICON_SHOWN_KEY =
  "village.paths-everywhere.is-active";

function getEnvVar(key) {
  const val = import.meta.env[key];
  if (!val) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Env var ${key} is not defined`);
  }
  return val;
}

export const VILLAGE_API_URL = getEnvVar('VITE_VILLAGE_API_URL');
export const VILLAGE_FRONTEND_URL = getEnvVar('VITE_VILLAGE_FRONTEND_URL');
