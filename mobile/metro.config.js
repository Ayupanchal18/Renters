const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

// Ensure Metro watches files in the shared folder
config.watchFolders = [
    path.resolve(workspaceRoot, "shared"),
];

// Configure Metro to resolve @shared package aliases to the shared folder
config.resolver.extraNodeModules = {
    "@shared": path.resolve(workspaceRoot, "shared"),
};

// Ensure Metro only resolves from mobile/node_modules first,
// preventing React version conflicts with the root web app.
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
];

module.exports = config;
