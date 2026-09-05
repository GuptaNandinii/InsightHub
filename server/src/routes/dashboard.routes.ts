import { Router } from 'express';
import {
  createDashboard,
  getAllDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard,
  getPublicDashboard,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createDashboardSchema,
  updateDashboardSchema,
} from '../validation/dashboard.validation';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Public dashboard route (No auth required)
router.get('/public/:shareToken', asyncHandler(getPublicDashboard));

// Protected user routes
router.post(
  '/',
  authenticate,
  validateRequest({ body: createDashboardSchema }),
  asyncHandler(createDashboard)
);

router.get('/', authenticate, asyncHandler(getAllDashboards));
router.get('/:id', authenticate, asyncHandler(getDashboardById));

router.put(
  '/:id',
  authenticate,
  validateRequest({ body: updateDashboardSchema }),
  asyncHandler(updateDashboard)
);

router.delete('/:id', authenticate, asyncHandler(deleteDashboard));

export default router;
