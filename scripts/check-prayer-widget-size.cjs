/* global __dirname */
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.expo', 'widget-size-tests');
fs.mkdirSync(output, { recursive: true });
const candidates = [process.env.JAVA_HOME,
  process.platform === 'win32' && 'C:/Program Files/Android/Android Studio/jbr'].filter(Boolean);
const suffix = process.platform === 'win32' ? '.exe' : '';
const jdk = candidates.find(folder => fs.existsSync(path.join(folder, 'bin', `javac${suffix}`)));
const binary = name => jdk ? path.join(jdk, 'bin', `${name}${suffix}`) : name;
function run(name, args) {
  const result = spawnSync(binary(name), args, { cwd: root, stdio: 'inherit' });
  if (result.error) { console.error(`${name}: ${result.error.message}. Set JAVA_HOME to a JDK.`); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
run('javac', ['-d', output, 'modules/home-widgets/android/src/main/java/expo/modules/homewidgets/PrayerWidgetSize.java', 'tests/native/PrayerWidgetSizeTest.java']);
run('java', ['-cp', output, 'PrayerWidgetSizeTest']);
