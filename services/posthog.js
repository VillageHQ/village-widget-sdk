import axios from "axios";

const posthogApi = axios.create({
  baseURL: import.meta.env.VITE_APP_POSTHOG_HOST,
});

posthogApi.interceptors.request.use((config) => {
  config.data = {
    ...config.data,
    api_key: import.meta.env.VITE_APP_POSTHOG_KEY,
  };
  return config;
});

const posthog = {
  capture: (event, properties) =>
    posthogApi.post("/capture", {
      event,
      properties,
    }),
  merge: (previousId, newId) =>
    posthogApi.post("/capture", {
      event: "$merge_dangerously",
      distinct_id: newId,
      properties: {
        alias: previousId,
      },
    }),
};

export { posthog };
