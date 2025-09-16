const assert = require("assert");
const {
  isBuildTaskPresent,
  ensureTasksFileObj,
  ensureIncludePaths,
  REQUIRED_INCLUDE_PATHS,
  findUProject,
} = require('../lib');

describe("helpers/simple", () => {
  describe("build task", () => {
    it("detects missing build task", () => {
      // strict mode requires a project name to detect; without name should return false
      assert.strictEqual(isBuildTaskPresent({ tasks: [] }, ""), false);
      assert.strictEqual(isBuildTaskPresent({}, ""), false);
    });

    it("detects existing build task for project", () => {
      const proj = "Sequencing";
      const obj = {
        tasks: [
          {
            label: "UE: Build Sequencing Development",
            type: "shell",
            command: "Build.bat",
            args: [proj, "Win64", "Development"],
          },
        ],
      };
      assert.strictEqual(isBuildTaskPresent(obj, proj), true);
    });

    it("injects default build tasks when missing", () => {
      const root = "C:/Proj";
      const { changed, obj } = ensureTasksFileObj({}, root, "C:/UE");
      assert.strictEqual(changed, true);
      assert.ok(Array.isArray(obj.tasks));
      assert.ok(obj.tasks.find((t) => t.group === "build"));
      assert.strictEqual(obj.version, "2.0.0");
    });

    it("does not duplicate build tasks when present", () => {
      const root = "C:/Proj";
      // ensureTasksFileObj derives project name from the uproject or folder; using 'Proj' here
      const initial = {
        version: "2.0.0",
        tasks: [
          {
            label: "UE: Build Proj Development",
            type: "shell",
            command: "Build.bat",
            args: ["Proj", "Win64", "Development"],
          },
        ],
      };
      const { changed, obj } = ensureTasksFileObj(initial, root, "");
      // with only one UE task present, ensureTasksFileObj will append the rest of the UE tasks
      assert.strictEqual(changed, true);
      assert.ok(obj.tasks.length > 1);
      // ensure the existing label wasn't duplicated
      const name = "UE: Build Proj Development";
      const count = obj.tasks.filter((t) => t && t.label === name).length;
      assert.strictEqual(count, 1);
    });
  });

  describe("include paths", () => {
    it("detects missing include paths", () => {
      // Use ensureIncludePaths to examine behavior; an empty config should produce changed=true
      const res = ensureIncludePaths({});
      assert.strictEqual(Array.isArray(res.obj.configurations), true);
      assert.strictEqual(res.changed, true);
    });

    it("injects required include paths", () => {
      const { changed, obj } = ensureIncludePaths({});
      assert.strictEqual(Array.isArray(obj.configurations), true);
      const cfg = obj.configurations[0];
      for (const p of REQUIRED_INCLUDE_PATHS) {
        assert.ok(cfg.includePath.includes(p));
        assert.ok(cfg.browse.path.includes(p));
      }
      // new object should be considered changed as it added defaults
      assert.strictEqual(changed, true);
    });

    it("adds missing include paths to existing config", () => {
      const base = { configurations: [{ name: "Win64", includePath: [] }] };
      const { changed, obj } = ensureIncludePaths(base);
      assert.strictEqual(changed, true);
      for (const cfg of obj.configurations) {
        for (const p of REQUIRED_INCLUDE_PATHS) {
          assert.ok(cfg.includePath.includes(p));
        }
      }
    });

    it("does not change when all present", () => {
      const base = {
        configurations: [
          {
            includePath: [...REQUIRED_INCLUDE_PATHS],
            browse: { path: [...REQUIRED_INCLUDE_PATHS] },
          },
        ],
      };
      const { changed, obj } = ensureIncludePaths(base);
      assert.strictEqual(changed, false);
      // ensureIncludePaths should not modify an already-correct config
      for (const cfg of obj.configurations) {
        for (const p of REQUIRED_INCLUDE_PATHS) {
          assert.ok(cfg.includePath.includes(p));
        }
      }
    });
  });
});
