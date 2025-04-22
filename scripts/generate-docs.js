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
        link: `${relativePath.replace(/\\/g, '/')}`
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

// (continua a partir do seu código anterior)
function createIndexMarkdown(sidebar) {
  let content = `# 📚 Village Widget SDK – Documentation Index\n\n`;

  function addLinks(items, level = 2) {
    for (const item of items) {
      if (item.link) {
        const label = item.label.replace(/-/g, ' ');
        content += `- [${label}](${item.link})\n`;
      } else if (item.children) {
        content += `\n${'#'.repeat(level)} ${item.label}\n\n`;
        addLinks(item.children, level + 1);
      }
    }
  }

  addLinks(sidebar);

  const indexPath = path.join(docsDir, 'index.md');
  fs.writeFileSync(indexPath, content);
  console.log(`✅ index.md generated at ./${indexPath}`);
}


// Run everything
runTypeDoc();
const sidebar = generateSidebar(docsDir);
writeMintJson(sidebar);
createIndexMarkdown(sidebar);
console.log('✅ Docs ready for Mintlify in ./docs');
