const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

const RULES_BOUNDARY =
  'ADR 0002: the rules run in plain Node and never reach for React, React Native or a browser. Keep this out of src/rules.';

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // `.agents` is vendored from mattpocock/skills and must stay byte-identical
    // to its source, so it is neither linted nor auto-fixed here.
    ignores: ['dist/*', 'node_modules/*', '.expo/*', '.agents/**'],
  },
  {
    // Enforcement, not convention: ADR 0002 requires the rules module to run in
    // plain Node, and this is what makes a violation fail CI rather than review.
    files: ['src/rules/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-native',
                'react-native/*',
                '@react-native/*',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
              ],
              message: RULES_BOUNDARY,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: RULES_BOUNDARY },
        { name: 'document', message: RULES_BOUNDARY },
        { name: 'navigator', message: RULES_BOUNDARY },
        { name: 'localStorage', message: RULES_BOUNDARY },
      ],
    },
  },
]);
