const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  // The legacy screens are not compiled with React Compiler yet. Keep its
  // migration diagnostics visible without treating them as runtime failures.
  { rules: {
    'react-hooks/refs': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/static-components': 'warn',
  } },
  { ignores: ['android/**', 'ios/**', '.local-backups/**', 'dist/**'] },
]);
