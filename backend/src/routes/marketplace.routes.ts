
import { Router } from 'express';
import { purchaseItem } from '../controllers/marketplace.controller.js';
import { authenticate } from '../utils/auth.middleware.js';

const router = Router();

// POST /api/marketplace/purchase - Redeem an item
router.post('/purchase', authenticate, purchaseItem);

export default router;
