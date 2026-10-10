import { logger, serializeError } from './logger';

const FAILURE_EXIT_CODE = 1;

export function registerProcessErrorHandlers(): void {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', serializeError(reason));
    process.exit(FAILURE_EXIT_CODE);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', serializeError(error));
    process.exit(FAILURE_EXIT_CODE);
  });
}
