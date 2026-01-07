
import { Router } from 'express';
import { PrismaClient, ActionType } from '@prisma/client';
import { authenticate, AuthRequest } from '../utils/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Get all pins
router.get('/', async (req, res) => {
    try {
        const pins = await prisma.ecoAction.findMany({
            where: {
                locationLat: { not: null },
                locationLng: { not: null }
            },
            include: {
                user: {
                    select: {
                        fullName: true
                    }
                }
            }
        });

        const transformedPins = pins.map(pin => ({
            id: pin.id,
            lat: Number(pin.locationLat),
            lng: Number(pin.locationLng),
            type: pin.actionType === ActionType.report ? 'HAZARD' : 'MAINTENANCE',
            description: pin.description || '',
            status: pin.status === 'approved' ? 'RESOLVED' : 'OPEN',
            reportedBy: pin.user?.fullName || 'Anonymous',
            timestamp: pin.createdAt.getTime()
        }));

        res.json(transformedPins);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Post new pin (Authenticated)
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { lat, lng, type, description } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const pin = await prisma.ecoAction.create({
            data: {
                userId,
                actionType: ActionType.report,
                description: description,
                locationLat: lat,
                locationLng: lng,
                status: 'pending',
                pointsEarned: 5
            },
            include: { user: true }
        });

        // Add points for reporting
        await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: 5 } }
        });

        res.status(201).json({
            id: pin.id,
            lat: Number(pin.locationLat),
            lng: Number(pin.locationLng),
            type: type,
            description: pin.description,
            status: 'OPEN',
            reportedBy: pin.user?.fullName || 'You',
            timestamp: pin.createdAt.getTime()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
