const fs = require('fs');
const path = require('path');
const os = require('os');

function readJson(filePath, fallback = {}) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return fallback;
  }
}

function writeJson(filePath, obj) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + os.EOL, 'utf8');
}

function ensureFileJson(filePath, transformFn) {
  const before = readJson(filePath, null);
  const original = before === null ? null : JSON.stringify(before);
  const current = before === null ? {} : before;
  const { changed, obj } = transformFn(current);
  const after = obj;
  const same = JSON.stringify(after) === original;
  if (changed && !same) {
    writeJson(filePath, after);
    return { changed: true, before, after };
  }
  return { changed: false, before, after };
}

module.exports = { readJson, writeJson, ensureFileJson };
