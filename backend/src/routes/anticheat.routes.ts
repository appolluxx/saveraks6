import { Router } from 'express';
import { authenticate, AuthRequest } from '../utils/auth.middleware.js';
import { EnhancedAntiCheatService } from '../services/enhanced-anticheat.service.js';
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
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalSubmissions,
            flaggedSubmissions,
            rejectedSubmissions,
            recentSubmissions,
            deviceStats,
            qualityStats
        ] = await Promise.all([
            // Total submissions
            prisma.ecoAction.count(),
            
            // Flagged submissions
            prisma.ecoAction.count({ where: { isFlagged: true } }),
            
            // Rejected submissions
            prisma.ecoAction.count({ where: { status: 'rejected' } }),
            
            // Recent submissions (last 24h)
            prisma.ecoAction.count({ where: { createdAt: { gt: last24h } } }),
            
            // Device fingerprint statistics
            prisma.ecoAction.groupBy({
                by: ['deviceFingerprint'],
                where: { deviceFingerprint: { not: null } },
                _count: { _all: true },
                orderBy: { _count: { _all: 'desc' } },
                take: 10
            }),
            
            // Image quality statistics
            prisma.ecoAction.aggregate({
                where: { imageQuality: { not: null } },
                _avg: { imageQuality: true },
                _min: { imageQuality: true },
                _max: { imageQuality: true }
            })
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
                deviceAnalysis: deviceStats.map(stat => ({
                    fingerprint: stat.deviceFingerprint?.substring(0, 8) + '...',
                    submissionCount: stat._count._all
                })),
                qualityAnalysis: {
                    average: qualityStats._avg.imageQuality,
                    minimum: qualityStats._min.imageQuality,
                    maximum: qualityStats._max.imageQuality
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
            lastSubmission,
            cooldownCheck,
            hourlyCheck
        ] = await Promise.all([
            prisma.ecoAction.count({ where: { userId } }),
            prisma.ecoAction.count({ where: { userId, isFlagged: true } }),
            prisma.ecoAction.count({ where: { userId, createdAt: { gt: last24h } } }),
            prisma.ecoAction.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, status: true, isFlagged: true, flagReason: true }
            }),
            EnhancedAntiCheatService.checkSubmissionCooldown(userId),
            EnhancedAntiCheatService.checkHourlyLimit(userId)
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
                    cooldown: cooldownCheck,
                    hourly: hourlyCheck
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
                    imageQuality: action.imageQuality,
                    deviceFingerprint: action.deviceFingerprint?.substring(0, 8) + '...',
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

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const fingerprint = await EnhancedAntiCheatService.computeFingerprint(buffer);
        const duplicateCheck = await EnhancedAntiCheatService.checkDuplicate(
            fingerprint, 
            req.user?.userId || ''
        );

        res.json({
            success: true,
            data: {
                fingerprint: {
                    pHash: fingerprint.pHash,
                    dHash: fingerprint.dHash,
                    aHash: fingerprint.aHash,
                    quality: fingerprint.quality
                },
                duplicateCheck
            }
        });

    } catch (error: any) {
        console.error('[AntiCheat Test] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
