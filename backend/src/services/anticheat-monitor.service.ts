import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface AlertConfig {
    flagRateThreshold: number; // percentage
    hourlySubmissionThreshold: number;
    deviceSuspicionThreshold: number;
    qualityThreshold: number;
    enabled: boolean;
}

export interface AntiCheatAlert {
    id: string;
    type: 'HIGH_FLAG_RATE' | 'SUSPICIOUS_DEVICE' | 'LOW_QUALITY' | 'FREQUENT_SUBMISSIONS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    userId?: string;
    deviceFingerprint?: string;
    metadata: any;
    createdAt: Date;
    resolved: boolean;
}

export class AntiCheatMonitor {
    private static config: AlertConfig = {
        flagRateThreshold: 15, // 15% flag rate triggers alert
        hourlySubmissionThreshold: 20, // 20+ submissions per hour
        deviceSuspicionThreshold: 10, // 10+ submissions from same device
        qualityThreshold: 0.2, // Average quality below 0.2
        enabled: process.env.NODE_ENV !== 'development'
    };

    /**
     * Run comprehensive anti-cheat monitoring
     * Should be called periodically (e.g., every hour)
     */
    static async runMonitoring(): Promise<AntiCheatAlert[]> {
        if (!this.config.enabled) {
            logger.info('[AntiCheat Monitor] Monitoring disabled in development');
            return [];
        }

        const alerts: AntiCheatAlert[] = [];
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last1h = new Date(now.getTime() - 60 * 60 * 1000);

        try {
            // 1. Check overall flag rate
            const flagRateAlert = await this.checkFlagRate(last24h);
            if (flagRateAlert) alerts.push(flagRateAlert);

            // 2. Check suspicious devices
            const deviceAlerts = await this.checkSuspiciousDevices(last24h);
            alerts.push(...deviceAlerts);

            // 3. Check high-frequency submitters
            const frequencyAlerts = await this.checkSubmissionFrequency(last1h);
            alerts.push(...frequencyAlerts);

            // 4. Check image quality trends
            const qualityAlert = await this.checkImageQuality(last24h);
            if (qualityAlert) alerts.push(qualityAlert);

            // 5. Store alerts and notify
            if (alerts.length > 0) {
                await this.storeAlerts(alerts);
                await this.notifyAdmins(alerts);
            }

            logger.info(`[AntiCheat Monitor] Completed: ${alerts.length} alerts generated`);
            return alerts;

        } catch (error) {
            logger.error('[AntiCheat Monitor] Error during monitoring:', error);
            return [];
        }
    }

    /**
     * Check if overall flag rate exceeds threshold
     */
    private static async checkFlagRate(timeframe: Date): Promise<AntiCheatAlert | null> {
        const [total, flagged] = await Promise.all([
            prisma.ecoAction.count({ where: { createdAt: { gt: timeframe } } }),
            prisma.ecoAction.count({ 
                where: { 
                    createdAt: { gt: timeframe },
                    isFlagged: true 
                } 
            })
        ]);

        if (total === 0) return null;

        const flagRate = (flagged / total) * 100;
        
        if (flagRate > this.config.flagRateThreshold) {
            return {
                id: `flag-rate-${Date.now()}`,
                type: 'HIGH_FLAG_RATE',
                severity: flagRate > 30 ? 'CRITICAL' : flagRate > 20 ? 'HIGH' : 'MEDIUM',
                message: `High flag rate detected: ${flagRate.toFixed(1)}% (${flagged}/${total} submissions)`,
                metadata: { total, flagged, flagRate, timeframe },
                createdAt: new Date(),
                resolved: false
            };
        }

        return null;
    }

    /**
     * Check for devices with suspicious activity
     */
    private static async checkSuspiciousDevices(timeframe: Date): Promise<AntiCheatAlert[]> {
        const alerts: AntiCheatAlert[] = [];

        // Group by device fingerprint
        const deviceStats = await prisma.ecoAction.groupBy({
            by: ['deviceFingerprint'],
            where: { 
                deviceFingerprint: { not: null },
                createdAt: { gt: timeframe }
            },
            _count: { id: true },
            having: {
                id: {
                    _count: {
                        gt: this.config.deviceSuspicionThreshold
                    }
                }
            }
        });

        for (const stat of deviceStats) {
            if (stat.deviceFingerprint) {
                alerts.push({
                    id: `device-${stat.deviceFingerprint}-${Date.now()}`,
                    type: 'SUSPICIOUS_DEVICE',
                    severity: stat._count.id > 25 ? 'HIGH' : 'MEDIUM',
                    message: `Suspicious device activity: ${stat._count.id} submissions`,
                    deviceFingerprint: stat.deviceFingerprint,
                    metadata: { submissionCount: stat._count.id, timeframe },
                    createdAt: new Date(),
                    resolved: false
                });
            }
        }

        return alerts;
    }

    /**
     * Check users with abnormally high submission frequency
     */
    private static async checkSubmissionFrequency(timeframe: Date): Promise<AntiCheatAlert[]> {
        const alerts: AntiCheatAlert[] = [];

        // Find users with high submission frequency
        const userStats = await prisma.ecoAction.groupBy({
            by: ['userId'],
            where: { createdAt: { gt: timeframe } },
            _count: { id: true },
            having: {
                id: {
                    _count: {
                        gt: this.config.hourlySubmissionThreshold
                    }
                }
            }
        });

        for (const stat of userStats) {
            alerts.push({
                id: `frequency-${stat.userId}-${Date.now()}`,
                type: 'FREQUENT_SUBMISSIONS',
                severity: stat._count.id > 50 ? 'CRITICAL' : stat._count.id > 30 ? 'HIGH' : 'MEDIUM',
                message: `High submission frequency: ${stat._count.id} submissions in 1 hour`,
                userId: stat.userId,
                metadata: { submissionCount: stat._count.id, timeframe },
                createdAt: new Date(),
                resolved: false
            });
        }

        return alerts;
    }

    /**
     * Check overall image quality trends
     */
    private static async checkImageQuality(timeframe: Date): Promise<AntiCheatAlert | null> {
        const qualityStats = await prisma.ecoAction.aggregate({
            where: { 
                createdAt: { gt: timeframe },
                imageQuality: { not: null }
            },
            _avg: { imageQuality: true },
            _count: { id: true }
        });

        if (!qualityStats._avg.imageQuality || qualityStats._count.id === 0) return null;

        const avgQuality = Number(qualityStats._avg.imageQuality);
        
        if (avgQuality < this.config.qualityThreshold) {
            return {
                id: `quality-${Date.now()}`,
                type: 'LOW_QUALITY',
                severity: avgQuality < 0.1 ? 'HIGH' : 'MEDIUM',
                message: `Low average image quality: ${avgQuality.toFixed(3)}`,
                metadata: { avgQuality, sampleCount: qualityStats._count.id, timeframe },
                createdAt: new Date(),
                resolved: false
            };
        }

        return null;
    }

    /**
     * Store alerts in database (could be in-memory for now)
     */
    private static async storeAlerts(alerts: AntiCheatAlert[]): Promise<void> {
        // For now, just log them. In production, store in database or alert system
        for (const alert of alerts) {
            logger.warn('[AntiCheat Alert]', {
                id: alert.id,
                type: alert.type,
                severity: alert.severity,
                message: alert.message,
                userId: alert.userId,
                deviceFingerprint: alert.deviceFingerprint
            });
        }
    }

    /**
     * Notify administrators of alerts
     */
    private static async notifyAdmins(alerts: AntiCheatAlert[]): Promise<void> {
        // In production, this could send emails, Slack notifications, etc.
        const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
        
        if (criticalAlerts.length > 0) {
            logger.error('[AntiCheat CRITICAL]', {
                message: `${criticalAlerts.length} critical anti-cheat alerts detected`,
                alerts: criticalAlerts.map(a => ({
                    type: a.type,
                    message: a.message,
                    userId: a.userId
                }))
            });
        }
    }

    /**
     * Get real-time statistics for dashboard
     */
    static async getRealTimeStats(): Promise<any> {
        const now = new Date();
        const last1h = new Date(now.getTime() - 60 * 60 * 1000);
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalSubmissions,
            flaggedSubmissions,
            recentSubmissions,
            activeDevices,
            avgQuality
        ] = await Promise.all([
            prisma.ecoAction.count({ where: { createdAt: { gt: last24h } } }),
            prisma.ecoAction.count({ 
                where: { 
                    createdAt: { gt: last24h },
                    isFlagged: true 
                } 
            }),
            prisma.ecoAction.count({ where: { createdAt: { gt: last1h } } }),
            prisma.ecoAction.groupBy({
                by: ['deviceFingerprint'],
                where: { 
                    deviceFingerprint: { not: null },
                    createdAt: { gt: last24h }
                }
            }),
            prisma.ecoAction.aggregate({
                where: { 
                    createdAt: { gt: last24h },
                    imageQuality: { not: null }
                },
                _avg: { imageQuality: true }
            })
        ]);

        return {
            overview: {
                totalSubmissions,
                flaggedSubmissions,
                recentSubmissions,
                flagRate: totalSubmissions > 0 ? (flaggedSubmissions / totalSubmissions * 100).toFixed(1) : '0',
                activeDevices: activeDevices.length,
                avgQuality: avgQuality._avg.imageQuality ? Number(avgQuality._avg.imageQuality).toFixed(3) : 'N/A'
            },
            health: {
                status: this.getSystemHealth(flaggedSubmissions, totalSubmissions, recentSubmissions),
                lastCheck: new Date().toISOString()
            }
        };
    }

    /**
     * Determine overall system health
     */
    private static getSystemHealth(flagged: number, total: number, recent: number): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
        const flagRate = total > 0 ? flagged / total : 0;
        
        if (flagRate > 0.3 || recent > 100) return 'CRITICAL';
        if (flagRate > 0.15 || recent > 50) return 'WARNING';
        return 'HEALTHY';
    }

    /**
     * Update monitoring configuration
     */
    static updateConfig(newConfig: Partial<AlertConfig>): void {
        this.config = { ...this.config, ...newConfig };
        logger.info('[AntiCheat Monitor] Configuration updated', this.config);
    }

    /**
     * Get current configuration
     */
    static getConfig(): AlertConfig {
        return { ...this.config };
    }
}
