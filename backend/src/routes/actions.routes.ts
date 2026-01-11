
import { Router } from 'express';
import { analyzeWaste } from '../services/waste.service.js';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../utils/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Get all actions (for feed)
router.get('/', async (req, res) => {
    try {
        const actions = await prisma.ecoAction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true
                    }
                }
            }
        });

        const transformedActions = actions.map(action => ({
            id: action.id,
            userId: action.userId,
            userName: action.user?.fullName || action.user?.studentId || 'Unknown User',
            type: action.actionType,
            srtEarned: action.pointsEarned,
            description: action.description,
            timestamp: action.createdAt.getTime(),
            status: action.status,
            imageUrl: action.imageUrl
        }));

        res.json(transformedActions);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit new action (authenticated)
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { type, description, imageBase64, srtOverride } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const imageUrl = imageBase64 ? "https://placehold.co/600x400" : null;

        const action = await prisma.ecoAction.create({
            data: {
                userId,
                actionType: type,
                description,
                imageUrl,
                pointsEarned: srtOverride || 10,
                status: 'approved'
            },
            include: { user: true }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: srtOverride || 10 } }
        });

        res.json({
            id: action.id,
            userId: action.userId,
            userName: action.user?.fullName || 'User',
            type: action.actionType,
            srtEarned: action.pointsEarned,
            description: action.description,
            timestamp: action.createdAt.getTime(),
            status: action.status,
            imageUrl: action.imageUrl
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analyze waste image
router.post('/analyze', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ success: false, error: 'Image required' });
        const analysis = await analyzeWaste(imageBase64);
        res.json({ success: true, wasteSorting: analysis });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit waste action (authenticated)
router.post('/submit', authenticate, async (req: AuthRequest, res) => {
    try {
        const { actionType, description, imageBase64, sortingAnalysis } = req.body;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const imageUrl = "https://placehold.co/600x400";
        const pointsMap: Record<string, number> = {
            'recycling': 10, 'zero_waste': 8, 'eco_product': 5, 'walk': 10, 'bicycle': 8,
            'commute': 5, 'tree_planting': 10, 'energy_saving': 5, 'report': 5, 'waste_sorting': 10
        };
        const points = pointsMap[actionType] || 10;

        const action = await prisma.ecoAction.create({
            data: {
                userId,
                actionType,
                description,
                imageUrl,
                aiAnalysis: JSON.stringify(sortingAnalysis),
                pointsEarned: points,
                status: 'approved'
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: points } }
        });

        res.json({ success: true, data: action });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
