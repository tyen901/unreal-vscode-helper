const fs = require('fs');
const path = require('path');

function projectNameFromUproject(root) {
  try {
    const files = fs.readdirSync(root).filter((f) => f.endsWith('.uproject'));
    if (files.length > 0) return path.basename(files[0], '.uproject');
  } catch (_) {}
  return path.basename(root);
}

function findUProject(root) {
  try {
    const files = fs.readdirSync(root).filter((f) => f.endsWith('.uproject'));
    if (files.length > 0) {
      const p = path.join(root, files[0]);
      return { path: p, name: path.basename(files[0], '.uproject') };
    }
  } catch (_) {}
  return {
    path: path.join(root, 'project.uproject'),
    name: projectNameFromUproject(root),
  };
}

function defaultBuildCommand(enginePath) {
  if (enginePath && enginePath.trim().length > 0)
    return path.join(enginePath, 'Engine', 'Build', 'BatchFiles', 'Build.bat');
  return 'Build.bat';
}

function defaultCleanCommand(enginePath) {
  if (enginePath && enginePath.trim().length > 0)
    return path.join(enginePath, 'Engine', 'Build', 'BatchFiles', 'Clean.bat');
  return 'Clean.bat';
}

function detectEnginePath(root, override) {
  if (override && override.trim()) return override;
  if (process.env.UE_ENGINE_PATH && process.env.UE_ENGINE_PATH.trim())
    return process.env.UE_ENGINE_PATH;

  const candidates = [];
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  try {
    const dirs = fs.readdirSync(pf);
    for (const d of dirs) {
      if (d.startsWith('UE_') || d.startsWith('UE-')) {
        const possible = path.join(pf, d);
        if (
          fs.existsSync(
            path.join(possible, 'Engine', 'Build', 'BatchFiles', 'Build.bat')
          )
        )
          candidates.push(possible);
      }
      if (d.startsWith('Epic Games')) {
        const sub = path.join(pf, d);
        try {
          const subs = fs.readdirSync(sub);
          for (const s of subs) {
            if (s.startsWith('UE_')) {
              const possible = path.join(sub, s);
              if (
                fs.existsSync(
                  path.join(
                    possible,
                    'Engine',
                    'Build',
                    'BatchFiles',
                    'Build.bat'
                  )
                )
              )
                candidates.push(possible);
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  if (candidates.length > 0) {
    candidates.sort();
    return candidates[candidates.length - 1];
  }
  return null;
}

module.exports = {
  projectNameFromUproject,
  findUProject,
  defaultBuildCommand,
  defaultCleanCommand,
  detectEnginePath,
};
