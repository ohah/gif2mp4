const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'apps', 'web', 'public');

// WASM pkg (pkg-decode + v2 경로로도 복사해 캐시 우회)
const coreDir = path.join(root, 'packages', 'core');
for (const name of ['pkg-decode']) {
  const src = path.join(coreDir, name);
  const dest = path.join(publicDir, name);
  const destV2 = path.join(publicDir, name + '-v2');
  const destV3 = path.join(publicDir, name + '-v3');
  const destV4 = path.join(publicDir, name + '-v4');
  const destV5 = path.join(publicDir, name + '-v5');
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    fs.cpSync(src, destV2, { recursive: true });
    fs.cpSync(src, destV3, { recursive: true });
    fs.cpSync(src, destV4, { recursive: true });
    fs.cpSync(src, destV5, { recursive: true });
    console.log('Copied', name, '->', dest, destV2, destV3, destV4, destV5);
  }
}

// 루트 움짤.gif -> public/umjjal.gif (없으면 cmd.gif로 대체)
const umjjalDest = path.join(publicDir, 'umjjal.gif');
fs.mkdirSync(publicDir, { recursive: true });
try {
  const umjjalSrc = path.join(root, '움짤.gif');
  const cmdGif = path.join(root, 'cmd.gif');
  if (fs.existsSync(umjjalSrc)) {
    fs.cpSync(umjjalSrc, umjjalDest);
    console.log('Copied 움짤.gif ->', umjjalDest);
  } else if (fs.existsSync(cmdGif)) {
    fs.cpSync(cmdGif, umjjalDest);
    console.log('Copied cmd.gif -> umjjal.gif (fallback)');
  } else {
    console.warn('Sample GIF copy skipped: neither 움짤.gif nor cmd.gif found.');
  }
} catch (e) {
  console.warn('Sample GIF copy skipped:', e.message);
}
