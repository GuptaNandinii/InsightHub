import { Router } from 'express';
import authRoutes from './auth.routes';
import datasetRoutes from './dataset.routes';
import dashboardRoutes from './dashboard.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'InsightHub API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
