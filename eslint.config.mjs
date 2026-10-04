import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({
  baseDirectory: dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      'bin/**',
      'lib/**',
      'typings/**',
      'docs/**',
      'test/**',
      'build/**',
      'eslint.config.mjs',
      'types.*',
      'scenes.*',
      'filters.*',
      'format.*',
      'future.*',
      'utils.*',
      'markup.*',
      'session.*',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  ...compat.config({
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
      project: ['./tsconfig.json'],
    },
    overrides: [
      {
        files: ['*.ts', '*.mts'],
        extends: ['plugin:prettier/recommended'],
        rules: {
          '@typescript-eslint/ban-ts-comment': 'warn',
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/no-non-null-assertion': 'warn',
          '@typescript-eslint/promise-function-async': 'off',
          '@typescript-eslint/no-namespace': 'off',
          'no-undef': 'off',
        },
      },
    ],
    rules: {
      'prefer-promise-reject-errors': 'off',
      'comma-dangle': 'off',
      'space-before-function-paren': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
    plugins: ['ava'],
  }),
]
