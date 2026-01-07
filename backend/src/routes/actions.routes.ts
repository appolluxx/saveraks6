import { Router } from 'express';
import { analyzeWaste } from '../services/waste.service.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all actions (for feed)
router.get('/', async (req, res) => {
    try {
        const actions = await prisma.ecoAction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 actions
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

        // Transform to match frontend expected format
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

// Submit new action (for frontend)
router.post('/', async (req, res) => {
    try {
        const { type, description, imageBase64, srtOverride } = req.body;

        // For demo purposes, use a demo user ID
        // In production, this would come from auth middleware
        const userId = 'demo-user-id';

        // Here you would upload image to MinIO and get URL
        const imageUrl = imageBase64 ? "https://placeholder.co/image.jpg" : null;

        const action = await prisma.ecoAction.create({
            data: {
                userId,
                actionType: type,
                description,
                imageUrl,
                pointsEarned: srtOverride || 10,
                status: 'approved'
            }
        });

        // Try to update user points (may fail if user doesn't exist)
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    totalPoints: {
                        increment: srtOverride || 10
                    }
                }
            });
        } catch (userError) {
            // User doesn't exist, create demo user
            await prisma.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    studentId: 'demo-user',
                    phone: '1234567890',
                    passwordHash: 'demo-hash',
                    fullName: 'Demo User',
                    role: 'STUDENT',
                    status: 'active',
                    totalPoints: srtOverride || 10
                }
            });
        }

        // Transform to match frontend expected format
        const transformedAction = {
            id: action.id,
            userId: action.userId,
            userName: 'Demo User',
            type: action.actionType,
            srtEarned: action.pointsEarned,
            description: action.description,
            timestamp: action.createdAt.getTime(),
            status: action.status,
            imageUrl: action.imageUrl
        };

        res.json(transformedAction);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analyze waste image
router.post('/analyze', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, error: 'Image required' });
        }

        const analysis = await analyzeWaste(imageBase64);

        res.json({ success: true, wasteSorting: analysis });
    } catch (error: any) {
        console.error('Analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit waste action
router.post('/submit', async (req, res) => {
    try {
        const { userId, actionType, description, imageBase64, sortingAnalysis } = req.body;

        // Here you would upload the image to MinIO and get the URL
        // For now we'll just use a placeholder
        const imageUrl = "https://placeholder.co/image.jpg";

        const pointsMap: Record<string, number> = {
            'recycling': 10,
            'zero_waste': 8,
            'eco_product': 5,
            'walk': 10,
            'bicycle': 8,
            'commute': 5,
            'tree_planting': 10,
            'energy_saving': 5,
            'report': 5,
            'waste_sorting': 10
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

        // Update user points
        await prisma.user.update({
            where: { id: userId },
            data: {
                totalPoints: {
                    increment: points
                }
            }
        });

        res.json({ success: true, data: action });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
