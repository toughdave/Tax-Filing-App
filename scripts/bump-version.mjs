#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");
const changelogPath = path.join(root, "CHANGELOG.md");

function parseArgs(argv) {
  const args = { type: "patch" };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--type") {
      args.type = argv[index + 1] ?? "patch";
      index += 1;
    }
  }

  return args;
}

function bumpVersion(current, type) {
  const [majorRaw, minorRaw, patchRaw] = current.split(".");
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  if ([major, minor, patch].some((value) => Number.isNaN(value))) {
    throw new Error(`Invalid semantic version: ${current}`);
  }

  if (type === "major") {
    return `${major + 1}.0.0`;
  }

  if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  if (type === "patch") {
    return `${major}.${minor}.${patch + 1}`;
  }

  throw new Error(`Unsupported bump type: ${type}`);
}

function updatePackageJson(type) {
  const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonRaw);
  const nextVersion = bumpVersion(packageJson.version, type);
  packageJson.version = nextVersion;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

  return nextVersion;
}

function updateChangelog(nextVersion) {
  const currentDate = new Date().toISOString().slice(0, 10);
  const header = `## [${nextVersion}] - ${currentDate}`;

  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(
      changelogPath,
      `# Changelog\n\nAll notable changes to this project are documented in this file.\n\n${header}\n### Changed\n- Version bump.\n`,
      "utf8"
    );
    return;
  }

  const existing = fs.readFileSync(changelogPath, "utf8");
  if (existing.includes(header)) {
    return;
  }

  const lines = existing.split("\n");
  const insertionIndex = 3;
  lines.splice(
    insertionIndex,
    0,
    `${header}`,
    "### Changed",
    "- Version bump.",
    ""
  );

  fs.writeFileSync(changelogPath, `${lines.join("\n").trimEnd()}\n`, "utf8");
}

function main() {
  const { type } = parseArgs(process.argv);
  const nextVersion = updatePackageJson(type);
  updateChangelog(nextVersion);
  // Output in plain text so CI can parse without jq.
  console.log(nextVersion);
}

main();
