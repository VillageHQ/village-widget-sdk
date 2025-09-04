import axios from "axios";

const posthog = axios.create({ baseURL: "https://app.posthog.com" });

posthog.interceptors.request.use((config) => {
  config.data = {
    ...config.data,
    api_key: import.meta.env.VITE_POSTHOG_KEY,
  };
  return config;
});

export { posthog };
