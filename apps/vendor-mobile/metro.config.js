// Metro config for an npm-workspaces monorepo (Expo SDK 56).
// Without this, Metro's dev server picks the hoisted workspace-root node_modules
// as its server root and tries to resolve the entry "./index" from E:\.services_app
// (where there is no index.ts), so the web/native bundle fails to load.
// Pinning projectRoot to this app + watching the workspace root fixes it.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
