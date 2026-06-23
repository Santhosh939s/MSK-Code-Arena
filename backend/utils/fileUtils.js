const fs = require('fs');
const path = require('path');

const TMP_DIR = path.join(__dirname, '..', 'tmp');

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function writeSourceFile(id, code) {
  ensureTmpDir();
  const srcPath = path.join(TMP_DIR, `${id}.cpp`);
  fs.writeFileSync(srcPath, code, 'utf8');
  return srcPath;
}

function getBinaryPath(id) {
  return path.join(TMP_DIR, id);
}

function cleanup(id) {
  const files = [`${id}.cpp`, id];
  for (const f of files) {
    const fullPath = path.join(TMP_DIR, f);
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (_) {}
  }
}

module.exports = { writeSourceFile, getBinaryPath, cleanup, TMP_DIR };
