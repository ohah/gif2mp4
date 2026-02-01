const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'apps', 'web', 'public');

// WASM pkgs (pkg-decode, pkg-mux + v2 경로로도 복사해 캐시 우회)
const coreDir = path.join(root, 'packages', 'core');
for (const name of ['pkg-decode', 'pkg-mux']) {
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

// 루트 cmd.gif -> public
const cmdGif = path.join(root, 'cmd.gif');
if (fs.existsSync(cmdGif)) {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.cpSync(cmdGif, path.join(publicDir, 'cmd.gif'));
  console.log('Copied cmd.gif ->', publicDir);
}
