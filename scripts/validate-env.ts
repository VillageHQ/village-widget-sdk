#!/usr/bin/env node

(() => {
  const requiredEnvVars = [
    'VITE_APP_API_URL',
    'VITE_APP_FRONTEND_URL',
    'VITE_APP_POSTHOG_HOST',
    'VITE_APP_POSTHOG_KEY'
  ] as const;

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease ensure all required environment variables are set.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  process.exit(0);
})();