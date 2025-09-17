# Unreal VSCode Helper

Minimal VS Code extension to validate and optionally fix Unreal Engine related VS Code config files.

Features
- Check `.vscode/tasks.json` for Unreal build tasks and add default UE build/clean/rebuild tasks if missing.
- Check `.vscode/c_cpp_properties.json` configurations for required include paths:
  - `${workspaceFolder}/Source/**`
  - `${workspaceFolder}/Plugins/**`
  - `${workspaceFolder}/Intermediate/**`
- Copy a discovered `compile_commands.json` into `.vscode/` when available.
- Suggest and set useful `clangd` and `C_Cpp` settings in `.vscode/settings.json`.

Usage
1. Open your Unreal project workspace folder in VS Code.
2. Run the command "Unreal: Validate VSCode Config" from the Command Palette.
3. If issues are found you can choose "Fix" to automatically create or patch the relevant files.

Notes
- The extension attempts to guess an Unreal Engine install path (or you can configure one). If no engine path is provided, generated tasks will call `Build.bat`/`Clean.bat` assuming they are on PATH.
- The command only modifies files when you accept the prompt.

Testing
- Run the unit tests with:

```powershell
npm test
```

Packaging
- To build a .vsix for installation, use `vsce` (`npm i -g vsce`) and run:

```powershell
npx vsce package
```

CI
- The repository uses GitHub Actions to run tests on push and pull requests to `main`/`master`.
- Packaging and publishing of the `.vsix` (and running semantic-release) only occurs when a tag is pushed (for example `v1.2.3`).

To create a release/build, tag a commit and push the tag:

```powershell
git tag v1.2.3
git push --tags
```

