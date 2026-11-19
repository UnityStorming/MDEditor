import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [
  'index.html',
  'favicon.svg',
  'css/app.css',
  'js/themes.js',
  'js/templates.js',
  'js/converter.js',
  'js/editor-highlight.js',
  'js/app.js',
];

for (const file of files) {
  const destination = path.join(root, 'dist', file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, file), destination);
}
console.log(`Exported ${files.length} static site files to ${path.join(root, 'dist')}`);
