const { findUProject } = require('./engine');
const { defaultBuildCommand, defaultCleanCommand } = require('./engine');

function makeUETasks(root, enginePath) {
  const up = findUProject(root);
  const upPath = up.path;
  const proj = up.name;
  const buildCmd = defaultBuildCommand(enginePath);
  const cleanCmd = defaultCleanCommand(enginePath);
  const configs = ['Development', 'DebugGame', 'Shipping'];
  const tasks = [];
  for (const cfg of configs) {
    const gameLabel = `UE: Build ${proj} ${cfg}`;
    tasks.push({
      label: gameLabel,
      type: 'shell',
      command: buildCmd,
      args: [proj, 'Win64', cfg, upPath, '-waitmutex'],
      group: 'build',
      isBackground: false,
      problemMatcher: ['$msCompile'],
    });
    const cleanLabel = `UE: Clean ${proj} ${cfg}`;
    tasks.push({
      label: cleanLabel,
      type: 'shell',
      command: cleanCmd,
      args: [proj, 'Win64', cfg, upPath, '-waitmutex'],
      group: 'build',
      isBackground: false,
    });
    const rebuildLabel = `UE: Rebuild ${proj} ${cfg}`;
    tasks.push({ label: rebuildLabel, type: 'shell', dependsOn: [cleanLabel, gameLabel], group: 'build' });

    const editor = `${proj}Editor`;
    const editorLabel = `UE: Build ${editor} ${cfg}`;
    tasks.push({
      label: editorLabel,
      type: 'shell',
      command: buildCmd,
      args: [editor, 'Win64', cfg, upPath, '-waitmutex'],
      group: 'build',
      isBackground: false,
      problemMatcher: ['$msCompile'],
    });
    const editorCleanLabel = `UE: Clean ${editor} ${cfg}`;
    tasks.push({
      label: editorCleanLabel,
      type: 'shell',
      command: cleanCmd,
      args: [editor, 'Win64', cfg, upPath, '-waitmutex'],
      group: 'build',
      isBackground: false,
    });
    const editorRebuildLabel = `UE: Rebuild ${editor} ${cfg}`;
    tasks.push({ label: editorRebuildLabel, type: 'shell', dependsOn: [editorCleanLabel, editorLabel], group: 'build' });
  }
  return tasks;
}

function isBuildTaskPresent(tasksObj, projName) {
  if (!tasksObj || !Array.isArray(tasksObj.tasks)) return false;
  const tasks = tasksObj.tasks;
  if (!projName || !projName.trim()) return false;
  const matchNames = [projName.toLowerCase(), (projName + 'editor').toLowerCase()];
  return tasks.some((t) => {
    try {
      const cmd = (t.command || '').toString().toLowerCase();
      const args = Array.isArray(t.args) ? t.args : [];
      const endsWithBuild = cmd.endsWith('build.bat');
      if (!endsWithBuild) return false;
      if (args.length === 0) return false;
      const target = (args[0] || '').toString().toLowerCase();
      return matchNames.includes(target);
    } catch (_) {
      return false;
    }
  });
}

function ensureTasksFileObj(tasksObj, root, enginePath) {
  const out = Object.assign({}, tasksObj || {});
  out.version = out.version || '2.0.0';
  out.tasks = Array.isArray(out.tasks) ? out.tasks.slice() : [];
  const up = findUProject(root);
  const proj = up.name;
  const wanted = makeUETasks(root, enginePath);
  let changed = false;
  const existingLabels = new Set(out.tasks.map((t) => t && t.label));
  for (const w of wanted) {
    if (!existingLabels.has(w.label)) {
      out.tasks.push(w);
      changed = true;
    }
  }
  return { changed, obj: out };
}

module.exports = { makeUETasks, isBuildTaskPresent, ensureTasksFileObj };
