import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    VITE_APP_API_URL: z.string().url(),
    VITE_APP_FRONTEND_URL: z.string().url(),
    VITE_APP_POSTHOG_HOST: z.string().url(),
    VITE_APP_POSTHOG_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
