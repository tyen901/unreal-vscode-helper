function ensureSettingsFileObj(settingsObj, root, enginePath) {
  const out = Object.assign({}, settingsObj || {});
  let changed = false;
  out['clangd.path'] = out['clangd.path'] || 'C:\\lib\\clangd\\bin\\clangd.exe';
  const wantArgs = [
    '--compile-commands-dir=.vscode',
    '--query-driver=C:/lib/clangd/bin/clang-cl.exe;C:/Program Files/Microsoft Visual Studio/*/VC/Tools/MSVC/*/bin/Hostx64/x64/cl.exe',
    '--background-index',
    '--pch-storage=memory',
    '--header-insertion=never',
  ];
  out['clangd.arguments'] = Array.isArray(out['clangd.arguments']) ? out['clangd.arguments'].slice() : [];
  for (const a of wantArgs) {
    if (!out['clangd.arguments'].includes(a)) {
      out['clangd.arguments'].push(a);
      changed = true;
    }
  }
  if (out['C_Cpp.intelliSenseEngine'] !== 'disabled') {
    out['C_Cpp.intelliSenseEngine'] = 'disabled';
    changed = true;
  }
  if (out['C_Cpp.codeAnalysis.enabled'] !== false) {
    out['C_Cpp.codeAnalysis.enabled'] = false;
    changed = true;
  }
  if (out['C_Cpp.codeAnalysis.clangTidy.enabled'] !== false) {
    out['C_Cpp.codeAnalysis.clangTidy.enabled'] = false;
    changed = true;
  }
  if (out['C_Cpp.default.compileCommands'] !== '${workspaceFolder}/.vscode/compile_commands.json') {
    out['C_Cpp.default.compileCommands'] = '${workspaceFolder}/.vscode/compile_commands.json';
    changed = true;
  }
  return { changed, obj: out };
}

module.exports = { ensureSettingsFileObj };
