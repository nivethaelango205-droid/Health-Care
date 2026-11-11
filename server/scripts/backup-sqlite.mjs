import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'server/data';
const backupDir = 'server/data/backups';
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const files = fs.readdirSync(srcDir).filter(f => f.startsWith('ruralcare.sqlite'));

console.log('Found SQLite files to backup:', files);
for (const f of files) {
  const src = path.join(srcDir, f);
  if (fs.statSync(src).isFile()) {
    const dest = path.join(backupDir, `${f}.${timestamp}.bak`);
    fs.copyFileSync(src, dest);
    console.log(`Backed up: ${src} -> ${dest} (${fs.statSync(dest).size} bytes)`);
  }
}
console.log('SQLite backup completed successfully.');

