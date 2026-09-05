import { Router } from 'express';
import { register, login, getMe, demoLogin } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validation/auth.validation';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), asyncHandler(register));
router.post('/login', validateRequest({ body: loginSchema }), asyncHandler(login));
router.post('/demo-login', asyncHandler(demoLogin));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
