// __tests__/build.test.js
import { describe, it } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Production bundle', () => {
  it('builds without errors and has valid JS syntax (both ESM and UMD)', () => {
    // 1) Run the production build
    console.log('🚀 Running production build...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2) Locate the generated production bundles
    const bundleESM = path.resolve(__dirname, '../dist/prod/index.es.js');
    const bundleUMD = path.resolve(__dirname, '../dist/prod/index.umd.js');

    // 3) Ensure the bundles exist
    if (!fs.existsSync(bundleESM)) {
      throw new Error(`❌ ESM bundle not found at: ${bundleESM}`);
    }
    if (!fs.existsSync(bundleUMD)) {
      throw new Error(`❌ UMD bundle not found at: ${bundleUMD}`);
    }

    // 4) Check syntax of ESM bundle
    console.log('🔎 Checking syntax for index.es.js (ESM)');
    execSync(`node --check ${bundleESM}`, { stdio: 'inherit' });

    // 5) Check syntax of UMD bundle
    console.log('🔎 Checking syntax for index.umd.js (UMD)');
    execSync(`node --check ${bundleUMD}`, { stdio: 'inherit' });
  });
});
