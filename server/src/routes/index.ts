import { Router } from 'express';
import { checkPassword, getStatus, getHealth } from '../controllers/passwordController';

const router = Router();

router.post('/check-password', checkPassword);
router.get('/status', getStatus);
router.get('/health', getHealth);

export default router;
