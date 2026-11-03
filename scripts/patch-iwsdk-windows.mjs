// Windows fix: the IWSDK dev plugin asks PowerShell for the process start time
// with a 1.5 s timeout. PowerShell often needs longer to start on a cold
// Windows laptop, which fails `npm start` with "Cannot establish this process
// birth identity". Give it 20 s instead. Safe to run more than once.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = 'node_modules/@iwsdk/vite-plugin-dev/dist/index.js';
if (existsSync(file)) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(
    /(\], \{\n\s+encoding: 'utf8',\n\s+)timeout: 1500,(\n\s+stdio: \['ignore', 'pipe', 'ignore'\],)/g,
    '$1timeout: 20000,$2',
  );
  if (out !== src) {
    writeFileSync(file, out);
    console.log('[smriti] patched IWSDK PowerShell timeout for Windows');
  }
}
