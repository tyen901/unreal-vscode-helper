const path = require('path');
const fs = require('fs');
const { ensureCompileCommands, ensureClangdConfigObj } = require('./cpp');
const { ensureTasksFileObj } = require('./tasks');
const { ensureCppPropertiesFileObj } = require('./cpp');
const { ensureFileJson } = require('./fileio');
const { detectEnginePath } = require('./engine');

async function autoFix({ root, enginePath, dryRun = false } = {}) {
  root = root || process.cwd();
  enginePath = enginePath || detectEnginePath(root);
  const summary = { changes: [] };

  const cc = ensureCompileCommands(root);
  if (cc.changed) summary.changes.push({ file: cc.dest, source: cc.source });

  const tasksPath = path.join(root, '.vscode', 'tasks.json');
  const tasksRes = ensureFileJson(tasksPath, (cur) => ensureTasksFileObj(cur, root, enginePath));
  if (tasksRes.changed)
    summary.changes.push({ file: tasksPath, before: tasksRes.before, after: tasksRes.after });

  const ccppPath = path.join(root, '.vscode', 'c_cpp_properties.json');
  const ccppRes = ensureFileJson(ccppPath, (cur) => ensureCppPropertiesFileObj(cur, root));
  if (ccppRes.changed)
    summary.changes.push({ file: ccppPath, before: ccppRes.before, after: ccppRes.after });

  const settingsPath = path.join(root, '.vscode', 'settings.json');
  const settingsRes = ensureFileJson(settingsPath, (cur) => require('./settings').ensureSettingsFileObj(cur, root, enginePath));
  if (settingsRes.changed)
    summary.changes.push({ file: settingsPath, before: settingsRes.before, after: settingsRes.after });

  const clangdPath = path.join(root, '.clangd');
  const clangdObj = ensureClangdConfigObj(root);
  try {
    const prev = fs.existsSync(clangdPath) ? fs.readFileSync(clangdPath, 'utf8') : null;
    if (prev !== clangdObj.content) {
      if (!dryRun) fs.writeFileSync(clangdPath, clangdObj.content, 'utf8');
      summary.changes.push({ file: clangdPath, before: prev, after: clangdObj.content });
    }
  } catch (e) {}

  return summary;
}

module.exports = { autoFix };
