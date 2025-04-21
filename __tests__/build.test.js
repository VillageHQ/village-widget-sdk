// __tests__/build.test.js
import { describe, it } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Production bundle', () => {
  it('builds without errors and has valid JS syntax', () => {
    // 1) Run the production build
    execSync('npm run build', { stdio: 'inherit' });

    // 2) Locate the generated file (adjust path if needed)
    const bundle = path.resolve(__dirname, '../dist/index.js');

    // 3) Check for syntax errors
    execSync(`node --check ${bundle}`, { stdio: 'inherit' });
  });
});