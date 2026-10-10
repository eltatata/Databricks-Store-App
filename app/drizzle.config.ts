import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema/app.schema.ts',
  out: './server/database/migrations',
  schemaFilter: ['app'],
});
