module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-async-storage|react-native-reanimated|expo-av|react-native-safe-area-context|react-native-worklets|expo-keep-awake)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
