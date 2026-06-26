const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Força transpilação de pacotes com sintaxe JS moderna (private fields #x)
const packagesToTranspile = [
  'react-native',
  '@react-native',
  '@react-navigation',
  'expo',
  '@expo',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-native-async-storage',
  '@expo/vector-icons',
];

config.resolver.unstable_enablePackageExports = false;

config.transformer = {
  ...config.transformer,
  transformIgnorePatterns: [
    `node_modules/(?!(${packagesToTranspile.join('|')})/)`,
  ],
};

module.exports = config;
