import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Server-side tests (actions, security, repositories) use node env
    // to avoid jsdom pulling in @asamuzakjp/css-color ESM incompatibility
    environment: 'node',
    setupFiles: [],
    globals: true,
    css: false,
    pool: 'vmThreads',
    include: ['__tests__/actions/**', '__tests__/security/**', '__tests__/repositories/**'],
    exclude: ['node_modules', '.next', 'tests/e2e/**', '__tests__/components/**', '__tests__/api/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/e2e/**',
        '**/*.config.*',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@csstools/css-calc': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
      '@csstools/css-color-parser': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
      '@csstools/css-parser-algorithms': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
      '@csstools/css-tokenizer': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
      '@csstools/color-helpers': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
      '@asamuzakjp/css-color': path.resolve(__dirname, './__tests__/utils/emptyMock.js'),
    },
    server: {
      deps: {
        inline: [/@csstools/, /@asamuzakjp/, /std-env/, /entities/]
      }
    }
  },
});
