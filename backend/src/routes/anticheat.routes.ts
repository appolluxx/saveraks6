import { Router } from 'express';
import { authenticate, AuthRequest } from '../utils/auth.middleware.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get anti-cheat statistics and monitoring data
 * Requires admin privileges
 */
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
    try {
        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: { role: true }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalSubmissions,
            flaggedSubmissions,
            rejectedSubmissions,
            recentSubmissions
        ] = await Promise.all([
            // Total submissions
            prisma.ecoAction.count(),
            
            // Flagged submissions
            prisma.ecoAction.count({ where: { isFlagged: true } }),
            
            // Rejected submissions
            prisma.ecoAction.count({ where: { status: 'rejected' } }),
            
            // Recent submissions (last 24h)
            prisma.ecoAction.count({ where: { createdAt: { gt: last24h } } })
        ]);

        // Calculate flag rate
        const flagRate = totalSubmissions > 0 ? (flaggedSubmissions / totalSubmissions * 100).toFixed(2) : '0';

        res.json({
            success: true,
            data: {
                overview: {
                    totalSubmissions,
                    flaggedSubmissions,
                    rejectedSubmissions,
                    recentSubmissions,
                    flagRate: `${flagRate}%`
                },
                deviceAnalysis: [], // Placeholder - requires schema update
                qualityAnalysis: { // Placeholder - requires schema update
                    average: 0.75,
                    minimum: 0.3,
                    maximum: 0.95
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat Stats] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get user's anti-cheat status and submission history
 */
router.get('/user-status', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalSubmissions,
            flaggedSubmissions,
            recentSubmissions,
            lastSubmission
        ] = await Promise.all([
            prisma.ecoAction.count({ where: { userId } }),
            prisma.ecoAction.count({ where: { userId, isFlagged: true } }),
            prisma.ecoAction.count({ where: { userId, createdAt: { gt: last24h } } }),
            prisma.ecoAction.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, status: true, isFlagged: true, flagReason: true }
            })
        ]);

        // Calculate user's flag rate
        const flagRate = totalSubmissions > 0 ? (flaggedSubmissions / totalSubmissions * 100).toFixed(2) : '0';

        res.json({
            success: true,
            data: {
                userId,
                stats: {
                    totalSubmissions,
                    flaggedSubmissions,
                    recentSubmissions,
                    flagRate: `${flagRate}%`
                },
                lastSubmission,
                limits: {
                    cooldown: { allowed: true }, // Placeholder - requires enhanced service
                    hourly: { allowed: true, remaining: 10 } // Placeholder
                },
                reputation: flaggedSubmissions === 0 ? 'good' : 
                          flaggedSubmissions / totalSubmissions > 0.3 ? 'poor' : 'fair'
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat User Status] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Review flagged submissions (admin only)
 */
router.get('/flagged', authenticate, async (req: AuthRequest, res) => {
    try {
        // Check admin privileges
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: { role: true }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [flaggedActions, total] = await Promise.all([
            prisma.ecoAction.findMany({
                where: { isFlagged: true },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            studentId: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.ecoAction.count({ where: { isFlagged: true } })
        ]);

        res.json({
            success: true,
            data: {
                submissions: flaggedActions.map(action => ({
                    id: action.id,
                    userId: action.userId,
                    userName: action.user?.fullName || action.user?.studentId || 'Unknown',
                    actionType: action.actionType,
                    status: action.status,
                    flagReason: action.flagReason,
                    imageQuality: 0.75, // Placeholder - requires schema update
                    deviceFingerprint: 'device-****', // Placeholder - requires schema update
                    createdAt: action.createdAt,
                    imageUrl: action.imageUrl
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat Flagged] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update submission status (admin review)
 */
router.patch('/:actionId/review', authenticate, async (req: AuthRequest, res) => {
    try {
        // Check admin privileges
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: { role: true }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { actionId } = req.params;
        const { status, pointsAdjustment, reviewNotes } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const action = await prisma.ecoAction.findUnique({
            where: { id: actionId },
            select: { userId: true, pointsEarned: true, status: true }
        });

        if (!action) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        // Update the action
        const updatedAction = await prisma.ecoAction.update({
            where: { id: actionId },
            data: {
                status,
                reviewedBy: req.user?.userId,
                reviewedAt: new Date(),
                flagReason: reviewNotes || null
            }
        });

        // Adjust user points if needed
        if (pointsAdjustment && action.status !== status) {
            const pointsDiff = (pointsAdjustment || 0) - (action.pointsEarned || 0);
            await prisma.user.update({
                where: { id: action.userId },
                data: { totalPoints: { increment: pointsDiff } }
            });
        }

        res.json({
            success: true,
            data: {
                id: updatedAction.id,
                status: updatedAction.status,
                reviewedAt: updatedAction.reviewedAt
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat Review] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Test endpoint for anti-cheat system (development only)
 */
router.post('/test', authenticate, async (req: AuthRequest, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(404).json({ success: false, error: 'Not available in production' });
        }

        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ success: false, error: 'Image required' });
        }

        // Placeholder test response
        res.json({
            success: true,
            data: {
                fingerprint: {
                    pHash: '1234567890abcdef',
                    dHash: 'abcdef1234567890',
                    aHash: 'fedcba0987654321',
                    quality: 0.85
                },
                duplicateCheck: {
                    isDuplicate: false,
                    confidence: 0.95,
                    detectionMethod: 'none'
                }
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat Test] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
