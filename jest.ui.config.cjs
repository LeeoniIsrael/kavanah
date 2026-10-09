module.exports = {
  preset: "jest-expo/ios",
  setupFilesAfterEnv: ["<rootDir>/src/test/uiSetup.ts"],
  testMatch: ["**/__tests__/**/*.ui.test.tsx"],
  moduleNameMapper: {
    "^expo/fetch$": "<rootDir>/src/test/expoFetchMock.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react-native$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native.*|@react-native(-community)?|@rn-primitives|expo.*|@expo.*/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|react-native-css-interop|lucide-react-native)/)",
  ],
};
