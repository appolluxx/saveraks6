
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get leaderboard (top 50 users by totalPoints)
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { totalPoints: 'desc' },
            take: 50,
            select: {
                id: true,
                fullName: true,
                studentId: true,
                totalPoints: true,
                badges: {
                    select: {
                        badge: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Transform if necessary to match frontend User interface
        // Frontend expects: id, name, totalSRT, badges, etc.
        const transformedUsers = users.map(user => ({
            id: user.id,
            name: user.fullName || `Student ${user.studentId}`,
            totalSRT: user.totalPoints,
            badges: user.badges.map((b: any) => b.badge.name),
            level: Math.floor(user.totalPoints / 100) + 1,
            // Add other fields to satisfy strict TS if needed, or rely on partial matching
            role: 'STUDENT',
            history: []
        }));

        res.json(transformedUsers);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
