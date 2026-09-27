const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('node:fs/promises');
const path = require('node:path');

// Keep locally signed debug builds separate from the installed release/preview app.
module.exports = function withAndroidDevelopmentApp(config) {
  config = withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy' ||
        !/buildTypes\s*\{\s*debug\s*\{/.test(mod.modResults.contents)) {
      throw new Error('withAndroidDevelopmentApp requires the Expo Groovy debug build block.');
    }
    mod.modResults.contents = mergeContents({
      src: mod.modResults.contents,
      newSrc: '            applicationIdSuffix ".dev"',
      tag: 'manarat-android-development-app',
      anchor: /buildTypes\s*\{/,
      offset: 2,
      comment: '//',
    }).contents;
    mod.modResults.contents = mergeContents({
      src: mod.modResults.contents,
      newSrc: "            if (findProperty('manaratStandalonePreview') == 'true') applicationIdSuffix \".dev\"",
      tag: 'manarat-standalone-preview', anchor: /^        release \{/, offset: 1, comment: '//',
    }).contents;
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/debug/res/values');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'development_app_name.xml'),
      '<resources>\n  <string name="app_name">Manarat Al-Muslim Dev</string>\n</resources>\n');
    return mod;
  }]);
};
