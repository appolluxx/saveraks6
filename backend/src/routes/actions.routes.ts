
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

import { AntiCheatService } from '../services/anticheat.service.js';
import { EnhancedAntiCheatService } from '../services/enhanced-anticheat.service.js';

// ... (existing imports)

// Submit new action (authenticated) - with duplicate image detection and validation
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const {
            type,
            description,
            imageBase64,
            // imageHash, // Deprecated: Client-side hash is unreliable
            locationLat,
            locationLng,
            ticketType,
            distanceKm
        } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. 🕒 Time Restriction & Frequency Limit (Commute Only)
        // STRICTLY enforces Thailand Time (UTC+7)
        if (type === 'commute') {
            const now = new Date();

            // Convert to Thailand Time components for validation
            const thaiTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
            const thaiDate = new Date(thaiTimeStr); // Note: This date object's 'local' times reflect Thai time

            const thHour = thaiDate.getHours();
            const thMin = thaiDate.getMinutes();
            const thYear = thaiDate.getFullYear();
            const thMonth = thaiDate.getMonth();
            const thDay = thaiDate.getDate();

            console.log(`[Commute Check] Server: ${now.toISOString()} | Thai: ${thaiDate.toString()}`);

            // Morning: 05:00 - 08:30
            const isMorning = (thHour > 5 || (thHour === 5 && thMin >= 0)) && (thHour < 8 || (thHour === 8 && thMin <= 30));
            // Evening: 15:00 - 19:00
            const isEvening = (thHour >= 15 && thHour < 19) || (thHour === 19 && thMin === 0);

            let currentSlot = '';
            let slotStartUtc: Date | null = null;
            let slotEndUtc: Date | null = null;

            // Note: Date.UTC arguments: year, month, day, hour (UTC), minute...
            // Thai Time is UTC+7, so UTC = Thai - 7
            if (isMorning) {
                currentSlot = 'MORNING';
                slotStartUtc = new Date(Date.UTC(thYear, thMonth, thDay, 5 - 7, 0, 0));
                slotEndUtc = new Date(Date.UTC(thYear, thMonth, thDay, 8 - 7, 30, 0));
            } else if (isEvening) {
                currentSlot = 'EVENING';
                slotStartUtc = new Date(Date.UTC(thYear, thMonth, thDay, 15 - 7, 0, 0));
                slotEndUtc = new Date(Date.UTC(thYear, thMonth, thDay, 19 - 7, 0, 0));
            }

            if (!currentSlot || !slotStartUtc || !slotEndUtc) {
                // Construct readable error
                return res.status(400).json({
                    success: false,
                    error: `ตรวจสอบการเดินทางได้เฉพาะช่วงเวลา 05:00-08:30 และ 15:00-19:00 (เวลาไทย) เท่านั้น. ขณะนี้เวลา ${thHour}:${thMin < 10 ? '0' + thMin : thMin}`
                });
            }

            // Check specific slot usage
            const slotUsage = await prisma.ecoAction.findFirst({
                where: {
                    userId,
                    actionType: 'commute',
                    createdAt: {
                        gte: slotStartUtc,
                        lte: slotEndUtc
                    }
                }
            });

            if (slotUsage) {
                return res.status(400).json({
                    success: false,
                    error: `คุณได้บันทึกการเดินทางรอบ ${currentSlot} ไปแล้ว (จำกัด 1 ครั้ง/รอบ)`
                });
            }
        }

        // 2. 📸 Evidence Validation & Enhanced Anti-Cheat
        const actionsRequiringImage = ['recycling', 'zero_waste', 'eco_product', 'tree_planting', 'energy_saving', 'waste_sorting'];
        const requiresImage = actionsRequiringImage.includes(type);

        if (requiresImage && !imageBase64) {
            return res.status(400).json({ success: false, error: 'กรุณาแนบรูปถ่ายเป็นหลักฐาน (Evidence Required)' });
        }

        // Generate device fingerprint
        const deviceFingerprint = EnhancedAntiCheatService.generateDeviceFingerprint(req);

        // Check submission cooldown
        const cooldownCheck = await EnhancedAntiCheatService.checkSubmissionCooldown(userId);
        if (!cooldownCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: `Please wait ${cooldownCheck.waitTime} seconds before submitting again`,
                waitTime: cooldownCheck.waitTime
            });
        }

        // Check hourly limit
        const hourlyCheck = await EnhancedAntiCheatService.checkHourlyLimit(userId);
        if (!hourlyCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: 'Hourly submission limit exceeded. Please try again later.'
            });
        }

        let pHash: string | null = null;
        let histogram: any = null;
        let isFlagged = false;
        let flagReason: string | null = null;
        let status: any = 'approved';
        let imageQuality = 0;

        // 3. 💰 Point Calculation (Default)
        const pointsMap: Record<string, number> = {
            'recycling': 10,
            'zero_waste': 10,
            'eco_product': 5,
            'walk': 10,
            'bicycle': 10,
            'commute': 15,
            'tree_planting': 20,
            'energy_saving': 5,
            'waste_sorting': 10
        };
        let points = pointsMap[type] || 5;

        // processing...
        if (imageBase64) {
            try {
                // 1. Anti-Cheat Fingerprinting & Deduplication
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');

                // Compute Enhanced Fingerprint
                const fingerprint = await EnhancedAntiCheatService.computeFingerprint(buffer);
                pHash = fingerprint.pHash;
                histogram = fingerprint.histogram;
                imageQuality = fingerprint.quality;

                console.log(`[Enhanced AntiCheat] Computed hashes for user ${userId}: pHash=${pHash}, quality=${imageQuality}`);

                // Enhanced Duplicate Check
                const check = await EnhancedAntiCheatService.checkDuplicate(fingerprint, userId, deviceFingerprint);

                if (check.isDuplicate) {
                    console.warn(`[Enhanced AntiCheat] Duplicate detected for User ${userId}: ${check.reason} (confidence: ${check.confidence})`);
                    isFlagged = true;
                    flagReason = check.reason || "Duplicate Image Detected";

                    if (check.confidence >= 0.9) {
                        status = 'rejected';
                        points = 0;
                    } else {
                        status = 'pending'; // Requires manual review
                    }
                }

                // 2. AI Content Validation (New Step)
                // Only run if not already rejected by duplicate check
                if (status !== 'rejected') {
                    console.log(`[AI Validation] Analyzing image content for type: ${type}`);
                    const analysis = await analyzeWaste(imageBase64);

                    // console.log(`[AI Validation] Result:`, JSON.stringify(analysis)); // Optional debug

                    // Check if AI considers it a valid eco action
                    // Note: valid_eco_action is from newer prompt, isValid is backward compat
                    const isContentValid = analysis.valid_eco_action ?? analysis.isValid ?? false;

                    if (!isContentValid) {
                        console.warn(`[AI Validation] Rejected invalid content: ${analysis.label || 'Unknown'}`);
                        status = 'rejected';
                        points = 0;
                        isFlagged = true;
                        flagReason = `AI Rejected: ${analysis.label || analysis.summary || "Content not relevant"}`;
                    } else {
                        // Optional: Verify if action type matches AI detection
                        // e.g. User selects "Energy" but AI detects "Waste" -> Flag it
                        const aiType = analysis.action_type || 'other';
                        // Simple mapping check could go here if needed
                        console.log(`[AI Validation] Content Validated. Type: ${aiType}`);
                    }
                }

            } catch (err) {
                console.error("[Enhanced AntiCheat/AI] Error processing image:", err);
                // Fail open to not block users, but flag it.
                isFlagged = true;
                flagReason = "Processing Error (AntiCheat/AI)";
                status = 'pending'; // Requires review
            }
        }

        const imageUrl = imageBase64 ? "https://placehold.co/600x400" : null;

        const action = await prisma.ecoAction.create({
            data: {
                userId,
                actionType: type,
                description,
                imageUrl,
                imageHash: null, // Legacy field
                pHash,
                histogram,
                isFlagged,
                flagReason,
                locationLat: locationLat ? parseFloat(locationLat) : null,
                locationLng: locationLng ? parseFloat(locationLng) : null,
                ticketType: ticketType || null,
                distanceKm: distanceKm ? parseFloat(distanceKm) : null,
                pointsEarned: points,
                status: status,
                verifiedAt: locationLat && locationLng ? new Date() : null
                // Note: Enhanced anti-cheat fields (dHash, aHash) will be added after schema migration
            },
            include: { user: true }
        });

        // Only increment user points if NOT rejected
        if (status === 'approved' && points > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: { totalPoints: { increment: points } }
            });
        }

        res.json({
            id: action.id,
            userId: action.userId,
            userName: action.user?.fullName || 'User',
            type: action.actionType,
            srtEarned: action.pointsEarned,
            description: action.description,
            timestamp: action.createdAt.getTime(),
            status: action.status,
            imageUrl: action.imageUrl,
            locationVerified: !!(locationLat && locationLng),
            isFlagged: action.isFlagged // Debug info
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(401).json({ success: false, error: 'User session invalid. Please log in again.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analyze waste image
router.post('/analyze', async (req, res) => {
    try {
        // Check for both keys to support legacy and new implementations
        const { imageBase64, image } = req.body;
        const payload = imageBase64 || image;

        if (!payload) return res.status(400).json({ success: false, error: 'Image required' });
        const analysis = await analyzeWaste(payload);
        res.json({ success: true, wasteSorting: analysis });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Research Stats Endpoint
router.get('/stats', async (req, res) => {
    try {
        // 1. Group by Action Type (Usage Frequency)
        const typeStats = await prisma.ecoAction.groupBy({
            by: ['actionType'],
            _count: { _all: true }
        });

        // 2. Group by User (Active Users)
        const userStats = await prisma.ecoAction.groupBy({
            by: ['userId'],
            _count: { _all: true },
            _sum: { pointsEarned: true }
        });

        // 3. Get Total System Stats
        const total = await prisma.ecoAction.aggregate({
            _sum: { pointsEarned: true },
            _count: { _all: true }
        });

        // 4. Daily Activity (Simple Breakdown)
        // Note: For advanced date truncation, raw query is often better, but keeping it simple here
        const recentActions = await prisma.ecoAction.findMany({
            take: 1000,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, actionType: true }
        });

        const dailyStats = recentActions.reduce((acc: any, action) => {
            const date = action.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!acc[date]) acc[date] = 0;
            acc[date]++;
            return acc;
        }, {});

        res.json({
            meta: {
                title: "SaveRaks Usage Statistics",
                generatedAt: new Date(),
                purpose: "Research Data Collection"
            },
            summary: {
                totalActions: total._count._all,
                totalPointsGenerated: total._sum.pointsEarned || 0,
                totalActiveUsers: userStats.length
            },
            usageByType: typeStats.map(stat => ({
                action: stat.actionType,
                count: stat._count._all
            })),
            activityTimeline: dailyStats
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
