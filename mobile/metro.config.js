const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure Metro only resolves from mobile/node_modules first,
// preventing React version conflicts with the root web app.
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, "node_modules"),
];

module.exports = config;
