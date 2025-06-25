import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: ['./tsconfig.json'] } },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-magic-numbers': ['error', { ignore: [0, 1, -1] }],
    },
  },
];
