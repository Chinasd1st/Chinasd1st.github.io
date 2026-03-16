import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  // 基础推荐规则
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],

  // 全局忽略
  {
    ignores: [
      'node_modules/',
      'dist/',
      'src/.vuepress/dist/',
      'src/.vuepress/.cache/',
      'src/.vuepress/.temp/',
      '**/*.d.ts',
      'pnpm-lock.yaml',
    ]
  },


  // 配置 TS + Vue
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      
      // TS 规则
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 通用规则
      'no-unused-vars': 'off', // 关闭 JS 的，用 TS 的
    }
  }
]