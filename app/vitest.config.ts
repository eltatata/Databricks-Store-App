import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const alias = { '@': path.resolve(__dirname, './client/src') };
const exclude = ['**/node_modules/**', '**/dist/**', '**/.databricks/**'];

export default defineConfig({
  resolve: { alias },
  test: {
    passWithNoTests: true,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'server',
          globals: true,
          environment: 'node',
          include: ['tests/server/**/*.test.ts'],
          exclude,
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'client',
          globals: true,
          environment: 'jsdom',
          include: ['tests/client/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/client/setup.ts'],
          server: { deps: { inline: ['@databricks/appkit-ui'] } },
          exclude,
        },
      },
    ],
  },
});
