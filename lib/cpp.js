const path = require('path');
const fs = require('fs');
const { dedupe } = require('./utils');
const REQUIRED_INCLUDE_PATHS = [
  '${workspaceFolder}/Source/**',
  '${workspaceFolder}/Plugins/**',
  '${workspaceFolder}/Intermediate/**',
];

function ensureIncludePaths(ccppObj) {
  const out = Object.assign({}, ccppObj || {});
  out.version = out.version || 4;
  out.configurations = Array.isArray(out.configurations)
    ? out.configurations.map((c) => Object.assign({}, c))
    : [
        {
          name: 'Win64',
          intelliSenseMode: 'msvc-x64',
          cStandard: 'c17',
          cppStandard: 'c++20',
        },
      ];
  let changed = false;
  for (const cfg of out.configurations) {
    cfg.includePath = Array.isArray(cfg.includePath) ? cfg.includePath.slice() : [];
    cfg.browse = cfg.browse || {};
    cfg.browse.path = Array.isArray(cfg.browse.path) ? cfg.browse.path.slice() : [];
    for (const p of REQUIRED_INCLUDE_PATHS) {
      if (!cfg.includePath.includes(p)) {
        cfg.includePath.push(p);
        changed = true;
      }
      if (!cfg.browse.path.includes(p)) {
        cfg.browse.path.push(p);
        changed = true;
      }
    }
    cfg.includePath = dedupe(cfg.includePath);
    cfg.browse.path = dedupe(cfg.browse.path);
  }
  return { changed, obj: out };
}

function findClOnPath() {
  const p = process.env.PATH || process.env.Path || '';
  const parts = p.split(path.delimiter);
  for (const part of parts) {
    try {
      const candidate = path.join(part, 'cl.exe');
      if (fs.existsSync(candidate)) return candidate;
    } catch (_) {}
  }
  return null;
}

function ensureCppPropertiesFileObj(ccppObj, root) {
  const res = ensureIncludePaths(ccppObj);
  const out = res.obj;
  let changed = res.changed;
  for (const cfg of out.configurations) {
    if (!cfg.compileCommands) {
      cfg.compileCommands = '${workspaceFolder}/.vscode/compile_commands.json';
      changed = true;
    }
  }
  const cl = findClOnPath();
  if (cl) {
    for (const cfg of out.configurations) {
      if (!cfg.compilerPath) {
        cfg.compilerPath = cl;
        changed = true;
      }
    }
  }
  return { changed, obj: out };
}

function ensureCompileCommands(root) {
  const vscodeDir = path.join(root, '.vscode');
  const dest = path.join(vscodeDir, 'compile_commands.json');
  const candidates = [];
  try {
    if (fs.existsSync(vscodeDir)) {
      const vfiles = fs
        .readdirSync(vscodeDir)
        .filter((f) => f.toLowerCase().startsWith('compile_commands') && f.endsWith('.json'));
      for (const f of vfiles) candidates.push(path.join(vscodeDir, f));
    }
  } catch (_) {}
  function walk(dir, depth) {
    if (depth <= 0) return;
    try {
      const items = fs.readdirSync(dir);
      for (const it of items) {
        const p = path.join(dir, it);
        try {
          const st = fs.statSync(p);
          if (st.isFile() && it.toLowerCase() === 'compile_commands.json') candidates.push(p);
          else if (st.isDirectory()) walk(p, depth - 1);
        } catch (_) {}
      }
    } catch (_) {}
  }
  walk(path.join(root, 'Intermediate'), 4);
  if (candidates.length === 0) return { changed: false };
  let source = candidates.find((c) => c.toLowerCase().includes(path.join('.vscode').toLowerCase())) || candidates[0];
  try {
    const s = fs.readFileSync(source, 'utf8');
    let need = true;
    if (fs.existsSync(dest)) {
      const d = fs.readFileSync(dest, 'utf8');
      need = d !== s;
    }
    if (need) {
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(dest, s, 'utf8');
      return { changed: true, source, dest };
    }
    return { changed: false, source, dest };
  } catch (e) {
    return { changed: false };
  }
}

function ensureClangdConfigObj(root) {
  const cfg = `CompileFlags:\n  CompilationDatabase: .vscode\nDiagnostics:\n  ClangTidy: false\nIndex:\n  Background: Build\n`;
  return { changed: true, content: cfg };
}

module.exports = {
  REQUIRED_INCLUDE_PATHS,
  ensureIncludePaths,
  ensureCppPropertiesFileObj,
  ensureCompileCommands,
  ensureClangdConfigObj,
  areIncludePathsPresent(ccppObj) {
    const res = ensureIncludePaths(ccppObj);
    return !res.changed;
  },
};
