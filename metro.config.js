const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("./node_modules/nativewind/dist/metro/index.js");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, "wasm"])];
module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
