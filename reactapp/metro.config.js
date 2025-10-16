const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support both JS and TS/TSX files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx'];

module.exports = config;

