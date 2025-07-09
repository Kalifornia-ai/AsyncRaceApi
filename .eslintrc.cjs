// .eslintrc.cjs

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json',
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },

  env: { browser: true, node: true, jest: true },

  plugins: ['@typescript-eslint'],

  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],

  settings: {
    'import/resolver': {
      // first try TS, then Node
      typescript: {
        project: './tsconfig.eslint.json',
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },

  rules: {

    // allow window.confirm / alert
    'no-restricted-globals': 'off',
    'no-alert': 'off',
    // allow `void fn()` calls
    'no-void': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'error',

    // 1) allow RTK slice mutations
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['state'],
    }],

    // 2) drop extensions on TS/JS imports
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],

    // 3) React17+ JSX doesn’t need React in scope
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],

    // 4) enforce real module resolution
    'import/no-unresolved': 'error',

    // your existing customizations:
    'no-console': 'off',
    'no-alert': 'off',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'consistent-return': 'off',
    'one-var': 'off',
    'no-nested-ternary': 'off',

    'max-lines-per-function': ['warn', { max: 200 }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-unsafe-assignment': 'warn',
  },

  overrides: [
    {
      // TSX: no need for defaultProps
      files: ['*.tsx'],
      rules: { 'react/require-default-props': 'off' },

      
    },

      // disable param reassign *completely* in uiSlice.ts
      {
        files: ['src/app/uiSlice.ts'],
        rules: {
          'no-param-reassign': 'off',
        },
      },
  
  
      // TS resolver for .cjs
      {
        files: ['.eslintrc.cjs'],
        parserOptions: { sourceType: 'script' },
      },


    {
      // slice files & API definitions legitimately exceed 40 lines
      files: ['src/app/uiSlice.ts','src/api/garageApi.ts','src/api/winnersApi.ts'],
      rules: { 'max-lines-per-function': 'off' },
    },

    {
      files: ['src/components/garage/**'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },

  ],
};



  