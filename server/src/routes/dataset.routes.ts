import { Router } from 'express';
import {
  uploadDataset,
  getAllDatasets,
  getDatasetById,
  getDatasetPreview,
  queryChartData,
  deleteDataset,
  previewCleanDataset,
  cleanDataset,
} from '../controllers/dataset.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadCSV } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  queryChartDataSchema,
  cleanDatasetSchema,
} from '../validation/dataset.validation';
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

// Preview data cleaning operations without persisting
router.post(
  '/:id/clean/preview',
  authenticate,
  validateRequest({ body: cleanDatasetSchema }),
  asyncHandler(previewCleanDataset)
);

// Apply data cleaning operations (save as new or overwrite)
router.post(
  '/:id/clean',
  authenticate,
  validateRequest({ body: cleanDatasetSchema }),
  asyncHandler(cleanDataset)
);

// Delete dataset
router.delete('/:id', authenticate, asyncHandler(deleteDataset));

export default router;
