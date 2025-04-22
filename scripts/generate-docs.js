// scripts/generate-docs.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const docsDir = 'docs';

// Run TypeDoc
function runTypeDoc() {
  console.log('🔄 Running TypeDoc...');
  execSync('npx typedoc', { stdio: 'inherit' });
}

// Recursively generate the sidebar based on .md files
function generateSidebar(dir, basePath = '') {
  const entries = [];

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.join(basePath, file.name);

    if (file.isDirectory()) {
      const children = generateSidebar(fullPath, relativePath);
      if (children.length > 0) {
        entries.push({
          label: file.name,
          children
        });
      }
    } else if (file.name.endsWith('.md')) {
      entries.push({
        label: file.name.replace(/\.md$/, ''),
        link: `/${relativePath.replace(/\\/g, '/')}`
      });
    }
  }

  return entries;
}

// Create mint.json inside the docs folder
function writeMintJson(sidebar) {
  const mintJsonPath = path.join(docsDir, 'mint.json');
  const json = { sidebar };
  fs.writeFileSync(mintJsonPath, JSON.stringify(json, null, 2));
  console.log(`✅ mint.json generated at ./${mintJsonPath}`);
}

// Run everything
runTypeDoc();
const sidebar = generateSidebar(docsDir);
writeMintJson(sidebar);
console.log('✅ Docs ready for Mintlify in ./docs');
