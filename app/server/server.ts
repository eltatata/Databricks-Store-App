import { createApp, genie, lakebase, server } from '@databricks/appkit';
import { agents } from '@databricks/appkit/beta';
import { loadEnvironment } from './config/env';
import { initDatabase } from './database/client';
import { runMigrations } from './database/migrate';
import { registerApiRoutes } from './routes';
import { logger, serializeError, setLogLevel } from './utils/logger';
import { registerProcessErrorHandlers } from './utils/process-handlers';

const GENIE_SPACE_ALIAS = 'olist';

const environment = loadEnvironment(process.env);
setLogLevel(environment.LOG_LEVEL);
registerProcessErrorHandlers();

const devUserEmail = environment.NODE_ENV === 'production' ? undefined : environment.DEV_USER_EMAIL;

createApp({
  plugins: [
    agents(),
    genie({ spaces: { [GENIE_SPACE_ALIAS]: process.env.DATABRICKS_GENIE_SPACE_ID ?? '' } }),
    lakebase(),
    server(),
  ],
  async onPluginsReady(appkit) {
    initDatabase(appkit.lakebase.getPgConfig());
    await runMigrations();
    appkit.server.extend((app) => registerApiRoutes(app, { devUserEmail }));
    logger.info('API routes registered');
  },
}).catch((error: unknown) => {
  logger.error('Application failed to start', serializeError(error));
  process.exit(1);
});
