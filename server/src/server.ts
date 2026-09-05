import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`[InsightHub API] Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    console.log(`[InsightHub API] Health check at http://localhost:${ENV.PORT}/api/health`);
  });

  const shutdown = () => {
    console.log('[InsightHub API] Shutting down gracefully...');
    server.close(() => {
      console.log('[InsightHub API] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
