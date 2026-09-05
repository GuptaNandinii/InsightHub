import { Router } from 'express';
import {
  uploadDataset,
  getAllDatasets,
  getDatasetById,
  getDatasetPreview,
  queryChartData,
  deleteDataset,
} from '../controllers/dataset.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadCSV } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { queryChartDataSchema } from '../validation/dataset.validation';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Upload dataset CSV
router.post('/upload', authenticate, uploadCSV.single('file'), asyncHandler(uploadDataset));

// Get list of user datasets
router.get('/', authenticate, asyncHandler(getAllDatasets));

// Get single dataset metadata & column stats
router.get('/:id', authenticate, asyncHandler(getDatasetById));

// Get paginated row preview with search & sort
router.get('/:id/preview', authenticate, asyncHandler(getDatasetPreview));

// Query aggregated data for charting
router.get(
  '/:id/query',
  authenticate,
  validateRequest({ query: queryChartDataSchema }),
  asyncHandler(queryChartData)
);

// Delete dataset
router.delete('/:id', authenticate, asyncHandler(deleteDataset));

export default router;
