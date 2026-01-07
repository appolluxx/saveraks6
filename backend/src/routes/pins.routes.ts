
import { Router } from 'express';
import { PrismaClient, ActionType } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all pins (Filter only actions with locations)
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

// Post new pin
router.post('/', async (req, res) => {
    try {
        const { lat, lng, type, description, reportedBy } = req.body;

        const pin = await prisma.ecoAction.create({
            data: {
                userId: reportedBy || 'demo-user-id',
                actionType: ActionType.report,
                description: description,
                locationLat: lat,
                locationLng: lng,
                status: 'pending',
                pointsEarned: 5
            }
        });

        res.status(201).json({
            id: pin.id,
            lat: Number(pin.locationLat),
            lng: Number(pin.locationLng),
            type: type,
            description: pin.description,
            status: 'OPEN',
            reportedBy: 'You',
            timestamp: pin.createdAt.getTime()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
