// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Native build outputs and local visual QA artifacts must not trigger app reloads.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList || []),
  /[\\/]\.local-backups(?:[\\/]|$)/,
  /[\\/]android[\\/](?:app[\\/])?(?:build|\.gradle|\.cxx)(?:[\\/]|$)/,
  /[\\/]\.expo[\\/](?:validation[^\\/]*(?:[\\/]|$)|[^\\/]+\.png$)/,
];

module.exports = config;
