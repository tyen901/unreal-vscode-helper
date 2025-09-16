const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const {
  isBuildTaskPresent,
  ensureBuildTask,
  areIncludePathsPresent,
  ensureIncludePaths,
} = require('./lib');

// Minimal extension: prompt to fix tasks.json and c_cpp_properties.json
// when missing a build task or required include paths.

function activate(context) {
  const run = () => runValidationAndPrompt();
  const disposable = vscode.commands.registerCommand(
    "unrealVscodeHelper.validate",
    async () => run()
  );
  context.subscriptions.push(disposable);

  // Also check on startup
  setTimeout(run, 1500);
}

async function runValidationAndPrompt() {
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  if (workspaceFolders.length === 0) return;
  const root = workspaceFolders[0].uri.fsPath;
  const vscodeDir = path.join(root, ".vscode");
  const tasksPath = path.join(vscodeDir, "tasks.json");
  const ccppPath = path.join(vscodeDir, "c_cpp_properties.json");
  const cfg = vscode.workspace.getConfiguration("unrealVscodeHelper");
  const enginePath = (cfg.get("enginePath") || "").toString();

  let needsTasksFix = true;
  if (fs.existsSync(tasksPath)) {
    try {
      const obj = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      needsTasksFix = !isBuildTaskPresent(obj);
    } catch (_) {
      needsTasksFix = true;
    }
  }

  let needsCppFix = true;
  if (fs.existsSync(ccppPath)) {
    try {
      const obj = JSON.parse(fs.readFileSync(ccppPath, "utf8"));
      needsCppFix = !areIncludePathsPresent(obj);
    } catch (_) {
      needsCppFix = true;
    }
  }

  if (!needsTasksFix && !needsCppFix) return;

  const details = [];
  if (needsTasksFix) details.push("tasks.json missing a build task");
  if (needsCppFix) details.push("c_cpp_properties.json missing include paths");

  const choice = await vscode.window.showWarningMessage(
    `Unreal VSCode Helper: ${details.join("; ")}. Fix now?`,
    { modal: false },
    "Fix",
    "Dismiss"
  );
  if (choice !== "Fix") return;

  if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir, { recursive: true });

  // Apply tasks fix
  try {
    let tasksObj = {};
    if (fs.existsSync(tasksPath)) tasksObj = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
    const { obj: newTasks } = ensureBuildTask(tasksObj, root, enginePath);
    fs.writeFileSync(tasksPath, JSON.stringify(newTasks, null, 2), "utf8");
  } catch (e) {
    const { obj: newTasks } = ensureBuildTask({}, root, enginePath);
    fs.writeFileSync(tasksPath, JSON.stringify(newTasks, null, 2), "utf8");
  }

  // Apply c_cpp_properties fix
  try {
    let ccppObj = {};
    if (fs.existsSync(ccppPath)) ccppObj = JSON.parse(fs.readFileSync(ccppPath, "utf8"));
    const { obj: newCpp } = ensureIncludePaths(ccppObj);
    fs.writeFileSync(ccppPath, JSON.stringify(newCpp, null, 2), "utf8");
  } catch (e) {
    const { obj: newCpp } = ensureIncludePaths({});
    fs.writeFileSync(ccppPath, JSON.stringify(newCpp, null, 2), "utf8");
  }

  vscode.window.showInformationMessage(
    "Unreal: VS Code config fixed (tasks.json, c_cpp_properties.json)."
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
