module.exports = {
  preset: "jest-expo/ios",
  testMatch: ["**/__tests__/**/*.ui.test.tsx"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native.*|@react-native(-community)?|@rn-primitives|expo.*|@expo.*/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|react-native-css-interop|lucide-react-native)/)",
  ],
};
