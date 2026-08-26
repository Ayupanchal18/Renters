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

// Exclude native build directories and intermediate files from Metro watcher/resolver
// to prevent ENOENT errors when Gradle compiles native modules concurrently.
const blockListPatterns = [
    /.*[\\/](android|ios)[\\/](build|\.cxx|\.transforms|\.gradle)[\\/].*/,
    /.*[\\/]build[\\/]intermediates[\\/].*/,
    /.*[\\/]\.gradle[\\/].*/,
];

if (Array.isArray(config.resolver.blockList)) {
    config.resolver.blockList.push(...blockListPatterns);
} else if (config.resolver.blockList) {
    config.resolver.blockList = [config.resolver.blockList, ...blockListPatterns];
} else {
    config.resolver.blockList = blockListPatterns;
}

module.exports = config;

