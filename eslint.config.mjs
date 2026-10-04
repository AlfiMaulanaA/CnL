import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        crypto: 'readonly',
        process: 'readonly',
        globalThis: 'readonly',
        Worker: 'readonly',
        self: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        MessageEvent: 'readonly',
        AbortController: 'readonly',
        EventSource: 'readonly',
        queueMicrotask: 'readonly',
        KeyboardEvent: 'readonly',
        PointerEvent: 'readonly',
        CustomEvent: 'readonly',
        AudioContext: 'readonly',
        WebKitAudioContext: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly'
      }
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      '@typescript-eslint': tseslint,
      '@next/next': nextPlugin,
      react,
      'react-hooks': reactHooks
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs['eslint-recommended'].rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'object-shorthand': 'error',

      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off'
    }
  },
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },
  {
    files: ['**/*.worker.ts', '*.mjs', 'next.config.mjs', 'server.js', 'realtime-server.js'],
    rules: { 'no-console': 'off' }
  },
  prettier
];
