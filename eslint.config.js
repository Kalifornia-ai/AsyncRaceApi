// eslint.config.js  – Flat config for ESLint 8.x
import globals        from 'globals';
import reactHooks     from 'eslint-plugin-react-hooks';
import reactRefresh   from 'eslint-plugin-react-refresh';
import tsParser       from '@typescript-eslint/parser';
import tsPlugin       from '@typescript-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPrettier from 'eslint-config-prettier';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  /* Ignore build artefacts */
  { ignores: ['dist/**'] },

  /* Airbnb core + Airbnb TS + TS-recommended */
  ...compat.extends(
    'airbnb',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended'
  ),

  /* React-Hooks preset (via alias) */
  ...compat.extends('plugin:react-hooks/recommended'),

  /* Our TypeScript / TSX layer */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: { project: './tsconfig.app.json' }, // type-aware
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      /* react-refresh gives one rule – add it manually */
      'react-refresh/only-export-components': 'warn',
      'react/react-in-jsx-scope': 'off',
      /* rubric extras */
      'max-lines-per-function': ['warn', 40],
      'no-magic-numbers': ['warn', { ignore: [-1, 0, 1] }],
    },
  },

  /* Prettier LAST */
  eslintPrettier,
];




