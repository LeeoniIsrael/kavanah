const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");

const fontFiles = [
  ["400Regular", "Manrope_400Regular.ttf"],
  ["500Medium", "Manrope_500Medium.ttf"],
  ["600SemiBold", "Manrope_600SemiBold.ttf"],
  ["700Bold", "Manrope_700Bold.ttf"],
];

module.exports = function withWidgetFonts(config) {
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetEntry = Object.entries(project.pbxNativeTargetSection()).find(
      ([key, value]) => !key.endsWith("_comment") && value.name === "ExpoWidgetsTarget",
    );
    const groupEntry = Object.entries(project.hash.project.objects.PBXGroup).find(
      ([key, value]) => !key.endsWith("_comment") && value.name === "ExpoWidgetsTarget",
    );
    if (!targetEntry || !groupEntry) {
      throw new Error("Expo Widgets must be configured before adding widget fonts.");
    }

    const [targetId, target] = targetEntry;
    const [widgetGroupId, widgetGroup] = groupEntry;
    const hasResourcesPhase = target.buildPhases.some((phase) =>
      project.hash.project.objects.PBXResourcesBuildPhase?.[phase.value],
    );
    if (!hasResourcesPhase) {
      project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetId);
    }
    let resourcesGroupId = widgetGroup.children
      .map((child) => child.value)
      .find((childId) => project.getPBXGroupByKey(childId)?.name === "Resources");
    if (!resourcesGroupId) {
      resourcesGroupId = project.addPbxGroup([], "Resources", "Resources").uuid;
      project.addToPbxGroup(resourcesGroupId, widgetGroupId);
    }

    for (const [, fileName] of fontFiles) {
      if (!project.hasFile(fileName)) {
        project.addResourceFile(fileName, { target: targetId }, resourcesGroupId);
      }
    }
    return config;
  });

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const widgetDirectory = path.join(platformRoot, "ExpoWidgetsTarget");
      const resourcesDirectory = path.join(widgetDirectory, "Resources");
      const infoPlistPath = path.join(widgetDirectory, "Info.plist");
      const plist = require("@expo/plist").default;
      fs.mkdirSync(resourcesDirectory, { recursive: true });

      for (const [weight, fileName] of fontFiles) {
        const sourcePath = path.join(
          projectRoot,
          "node_modules",
          "@expo-google-fonts",
          "manrope",
          weight,
          fileName,
        );
        fs.copyFileSync(sourcePath, path.join(resourcesDirectory, fileName));
      }

      const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));
      infoPlist.UIAppFonts = Array.from(
        new Set([
          ...(infoPlist.UIAppFonts ?? []),
          ...fontFiles.map(([, fileName]) => fileName),
        ]),
      );
      fs.writeFileSync(infoPlistPath, plist.build(infoPlist));
      return config;
    },
  ]);
};
