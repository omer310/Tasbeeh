const { withMainActivity } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

module.exports = function withPrayerAlarmControls(config) {
  return withMainActivity(config, mod => {
    if (mod.modResults.language !== 'kt') throw new Error('Prayer alarm controls require a Kotlin MainActivity.');
    let source = mod.modResults.contents;
    // Existing checked-in native code already has the override; fresh prebuilds
    // receive the same control here. Never add two dispatchKeyEvent overrides.
    if (source.includes('AzanPlaybackService.isRunning')) return mod;
    for (const name of ['android.view.KeyEvent', 'android.content.Intent', 'expo.modules.prayeralarm.AzanPlaybackService']) {
      if (!source.includes(`import ${name}`)) source = source.replace(/^(package [^\r\n]+)/m, `$1\nimport ${name}`);
    }
    mod.modResults.contents = mergeContents({ src: source, tag: 'manarat-azan-volume-control',
      anchor: /class MainActivity : ReactActivity\(\) \{/, offset: 1, comment: '//',
      newSrc: `  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN && AzanPlaybackService.isRunning) {
      if (event.action == KeyEvent.ACTION_DOWN) stopService(Intent(this, AzanPlaybackService::class.java))
      return true
    }
    return super.dispatchKeyEvent(event)
  }`,
    }).contents;
    return mod;
  });
};
