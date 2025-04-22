// scripts/generate-docs.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const baseOut = 'docs';
const markdownOut = path.join(baseOut, 'markdown');
const htmlOut = path.join(baseOut, 'html');

// Run TypeDoc with Markdown plugin
function runTypeDocMarkdown() {
  console.log('📝 Generating Markdown docs...');
  execSync(`npx typedoc --out ${markdownOut} --plugin typedoc-plugin-markdown`, { stdio: 'inherit' });
}

// Run TypeDoc with default HTML theme
function runTypeDocHTML() {
  console.log('🌐 Generating HTML docs...');
  execSync(`npx typedoc --out ${htmlOut} `, { stdio: 'inherit' });
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
        link: `${relativePath.replace(/\\/g, '/')}`
      });
    }
  }

  return entries;
}

// Create mint.json inside markdown directory
function writeMintJson(sidebar) {
  const mintJsonPath = path.join(markdownOut, 'mint.json');
  const json = { sidebar };
  fs.writeFileSync(mintJsonPath, JSON.stringify(json, null, 2));
  console.log(`✅ mint.json generated at ./${mintJsonPath}`);
}

// Run all
runTypeDocMarkdown();
runTypeDocHTML();
const sidebar = generateSidebar(markdownOut);
writeMintJson(sidebar);
console.log('✅ Markdown and HTML docs generated in ./docs/');
