const { spawn } = require('node:child_process');
const path = require('node:path');

// Expo establishes adb reverse for the chosen Metro port. Advertising localhost
// keeps phone assets and the development websocket on that USB connection.
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const child = spawn(process.execPath, [cli, 'run:android', '--app-id', 'com.manaratalmuslim.dev', '--device', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
