import fs from 'fs';
import path from 'path';

// Regex to detect Vietnamese characters
const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;

function scanDir(dir: string, results: { file: string; line: number; text: string }[]) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git' && f !== 'locales') {
        scanDir(full, results);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      // Exclude data mocks/seeds if pure data, but check components
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
        if (vietnameseRegex.test(line)) {
          results.push({ file: full, line: idx + 1, text: trimmed });
        }
      });
    }
  }
}

const results: { file: string; line: number; text: string }[] = [];
scanDir('./src', results);

console.log(`Found ${results.length} lines with Vietnamese characters in src (excluding locales).`);
// Group by file
const byFile: Record<string, number> = {};
for (const r of results) {
  byFile[r.file] = (byFile[r.file] || 0) + 1;
}

for (const [file, count] of Object.entries(byFile)) {
  console.log(`${file}: ${count} matches`);
}
