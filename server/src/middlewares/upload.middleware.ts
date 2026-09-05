import multer from 'multer';
import { ApiError } from '../utils/apiError';

// Use memory storage so we can stream/parse the buffer directly
const storage = multer.memoryStorage();

export const uploadCSV = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
  fileFilter: (_req, file, cb) => {
    const isCsvMime = [
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
      'application/csv',
    ].includes(file.mimetype);

    const isCsvExt = file.originalname.toLowerCase().endsWith('.csv');

    if (isCsvMime || isCsvExt) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only CSV (.csv) files are supported.'));
    }
  },
});
