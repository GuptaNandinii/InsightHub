import { Router } from 'express';
import {
  getDatasetProfiling,
  getColumnDistribution,
} from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/:id/profiling', authenticate, asyncHandler(getDatasetProfiling));
router.get('/:id/distribution/:column', authenticate, asyncHandler(getColumnDistribution));

export default router;
