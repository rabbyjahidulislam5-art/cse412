import app from './app';
import { config } from './config';
import prisma from './config/prisma';

const server = app.listen(config.port, () => {
  console.log(`[Smart Campus API] Running on port ${config.port}`);
  console.log(`[Environment] ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});

export { server };
