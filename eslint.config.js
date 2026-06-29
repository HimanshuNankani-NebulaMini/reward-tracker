import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage']
  },
  {
    files: ['**/*.js'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'no-console': 'error',
      'react/prop-types': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }]
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
      parserOptions: { 
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true } 
      },
    },
    settings: {
      react: {
        version: '19.0',
      },
    }
  },
  {
    files: ['src/utils/logger.js'],
    rules: {
      'no-console': 'off'
    }
  }
]
