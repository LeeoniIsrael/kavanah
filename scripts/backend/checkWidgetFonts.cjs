const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const xcode = require("xcode");
const plist = require("@expo/plist").default;

// Inspect actual prebuild output, including the paths Xcode resolves through groups.
// Usage: node scripts/backend/checkWidgetFonts.cjs /path/to/generated/ios
const ios = path.resolve(process.argv[2] || "ios");
const project = xcode.project(path.join(ios, "Kavanah.xcodeproj/project.pbxproj"));
project.parseSync();
const objects = project.hash.project.objects;
const clean = (value) => String(value ?? "").replace(/^"|"$/g, "");
const entries = (section) => Object.entries(section).filter(([key]) => !key.endsWith("_comment"));
const parents = new Map();
for (const [id, group] of entries(objects.PBXGroup)) {
  for (const child of group.children) parents.set(child.value, id);
}
function directory(id, seen = new Set()) {
  if (!id) return ios;
  assert(!seen.has(id), "Cyclic Xcode group hierarchy");
  seen.add(id);
  const group = objects.PBXGroup[id];
  assert(group, `Missing Xcode group ${id}`);
  const tree = clean(group.sourceTree);
  assert(["<group>", "SOURCE_ROOT"].includes(tree), `Unexpected group source tree: ${tree}`);
  return path.resolve(tree === "SOURCE_ROOT" ? ios : directory(parents.get(id), seen), clean(group.path));
}
const target = entries(objects.PBXNativeTarget).find(([, t]) => clean(t.name) === "ExpoWidgetsTarget")?.[1];
assert(target, "Widget target missing");
const resources = target.buildPhases.flatMap(({ value }) => objects.PBXResourcesBuildPhase[value]?.files ?? []);
const fonts = new Map([
  ["Manrope_400Regular.ttf", "400Regular"],
  ["Manrope_500Medium.ttf", "500Medium"],
  ["Manrope_600SemiBold.ttf", "600SemiBold"],
  ["Manrope_700Bold.ttf", "700Bold"],
]);
const counts = new Map();
for (const resource of resources) {
  const fileId = objects.PBXBuildFile[resource.value].fileRef;
  const file = objects.PBXFileReference[fileId];
  const name = clean(file.name);
  if (!fonts.has(name)) continue;
  assert.equal(clean(file.sourceTree), "<group>");
  const resolved = path.resolve(directory(parents.get(fileId)), clean(file.path));
  assert(fs.existsSync(resolved), `Widget font resource does not exist: ${resolved}`);
  const source = require.resolve(`@expo-google-fonts/manrope/${fonts.get(name)}/${name}`);
  assert.deepEqual(fs.readFileSync(resolved), fs.readFileSync(source), `Font contents differ: ${name}`);
  counts.set(name, (counts.get(name) ?? 0) + 1);
}
const info = plist.parse(fs.readFileSync(path.join(ios, "ExpoWidgetsTarget/Info.plist"), "utf8"));
for (const name of fonts.keys()) {
  assert.equal(counts.get(name), 1, `Expected one widget resource entry for ${name}`);
  assert.equal(info.UIAppFonts.filter((font) => font === name).length, 1, `Expected one UIAppFonts entry for ${name}`);
}
console.log("All four widget fonts resolve through the generated Xcode groups, match source bytes and have one resource/plist registration.");
