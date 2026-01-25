import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

export interface ImageFingerprint {
    pHash: string;
    dHash: string;
    aHash: string;
    histogram: number[];
    quality: number;
}

export interface AntiCheatResult {
    isDuplicate: boolean;
    confidence: number;
    reason?: string;
    similarActionId?: string;
    score?: number;
    detectionMethod: string;
    requiresReview: boolean;
}

export class EnhancedAntiCheatService {
    // Configurable thresholds
    private static readonly PHASH_STRICT_THRESHOLD = 5;  // Same user
    private static readonly PHASH_GLOBAL_THRESHOLD = 8;   // Different users
    private static readonly DHASH_THRESHOLD = 10;
    private static readonly AHASH_THRESHOLD = 12;
    private static readonly HISTOGRAM_CORRELATION_MIN = 0.85;
    private static readonly QUALITY_MIN = 0.3;
    private static readonly SUBMISSION_COOLDOWN_MINUTES = 0.5; // 30 seconds for testing
    private static readonly MAX_SUBMISSIONS_PER_HOUR = 30; // Increased for testing

    /**
     * Generate device fingerprint from request headers
     */
    static generateDeviceFingerprint(req: any): string {
        const fingerprint = [
            req.get('User-Agent') || '',
            req.get('Accept-Language') || '',
            req.get('Accept-Encoding') || '',
            req.ip || '',
            req.get('Sec-CH-UA') || '',
            req.get('Sec-CH-UA-Mobile') || '',
        ].join('|');
        
        return createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
    }

    /**
     * Compute comprehensive image fingerprint
     */
    static async computeFingerprint(imageBuffer: Buffer): Promise<ImageFingerprint> {
        try {
            // 1. Perceptual Hashes
            const [pHash, dHash, aHash] = await Promise.all([
                this.computePHash(imageBuffer),
                this.computeDHash(imageBuffer),
                this.computeAHash(imageBuffer)
            ]);

            // 2. Color Histogram
            const histogram = await this.computeColorHistogram(imageBuffer);

            // 3. Image Quality Assessment
            const quality = await this.assessImageQuality(imageBuffer);

            return {
                pHash,
                dHash,
                aHash,
                histogram,
                quality
            };

        } catch (error) {
            console.error("Enhanced AntiCheat Compute Error:", error);
            return { 
                pHash: '0000000000000000', 
                dHash: '0000000000000000', 
                aHash: '0000000000000000',
                histogram: [], 
                quality: 0 
            };
        }
    }

    /**
     * Compute perceptual hash (pHash) - frequency domain
     */
    private static async computePHash(imageBuffer: Buffer): Promise<string> {
        const resized = await sharp(imageBuffer)
            .resize(32, 32, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        // Simplified DCT approximation
        const hash = this.computeDCTHash(resized, 32);
        return hash;
    }

    /**
     * Compute difference hash (dHash) - gradient based
     */
    private static async computeDHash(imageBuffer: Buffer): Promise<string> {
        const resized = await sharp(imageBuffer)
            .resize(9, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const left = resized[row * 9 + col];
                const right = resized[row * 9 + col + 1];
                hash += (left > right ? '1' : '0');
            }
        }

        return BigInt('0b' + hash).toString(16).padStart(16, '0');
    }

    /**
     * Compute average hash (aHash) - intensity based
     */
    private static async computeAHash(imageBuffer: Buffer): Promise<string> {
        const resized = await sharp(imageBuffer)
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        // Calculate average
        const sum = resized.reduce((a, b) => a + b, 0);
        const average = sum / resized.length;

        // Generate hash
        let hash = '';
        for (const pixel of resized) {
            hash += (pixel > average ? '1' : '0');
        }

        return BigInt('0b' + hash).toString(16).padStart(16, '0');
    }

    /**
     * Simplified DCT hash computation
     */
    private static computeDCTHash(pixels: Buffer, size: number): string {
        // This is a simplified version - real DCT would be more complex
        const reducedSize = 8;
        const step = size / reducedSize;
        
        let hash = '';
        for (let i = 0; i < reducedSize; i++) {
            for (let j = 0; j < reducedSize; j++) {
                const idx = Math.floor(i * step) * size + Math.floor(j * step);
                const pixel = pixels[idx];
                const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
                hash += (pixel > avg ? '1' : '0');
            }
        }

        return BigInt('0b' + hash).toString(16).padStart(16, '0');
    }

    /**
     * Compute normalized color histogram
     */
    private static async computeColorHistogram(imageBuffer: Buffer): Promise<number[]> {
        const { data } = await sharp(imageBuffer)
            .resize(16, 16, { fit: 'fill' })
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Convert to normalized array
        const histogram = Array.from(data).map(v => Number((v / 255).toFixed(4)));
        return histogram;
    }

    /**
     * Assess image quality (sharpness, contrast, etc.)
     */
    private static async assessImageQuality(imageBuffer: Buffer): Promise<number> {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            if (!metadata.width || !metadata.height) return 0;

            // Basic quality metrics
            const resolution = metadata.width * metadata.height;
            const aspectRatio = metadata.width / metadata.height;
            
            // Penalize very low resolution or extreme aspect ratios
            let quality = Math.min(resolution / (640 * 480), 1.0); // Normalize to 0-1
            if (aspectRatio < 0.5 || aspectRatio > 2.0) quality *= 0.5;

            // Check for blur (simplified - using edge detection approximation)
            const edges = await sharp(imageBuffer)
                .resize(100, 100, { fit: 'fill' })
                .convolve({
                    width: 3,
                    height: 3,
                    kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
                })
                .raw()
                .toBuffer();

            const edgeStrength = Array.from(edges).reduce((a, b) => a + Math.abs(b - 128), 0) / edges.length;
            quality *= Math.min(edgeStrength / 20, 1.0);

            return Math.max(0, Math.min(1, quality));
        } catch (error) {
            return 0;
        }
    }

    /**
     * Enhanced duplicate detection with multiple algorithms
     */
    static async checkDuplicate(
        fingerprint: ImageFingerprint, 
        userId: string,
        deviceFingerprint?: string
    ): Promise<AntiCheatResult> {
        // 1. Quality check
        if (fingerprint.quality < this.QUALITY_MIN) {
            return {
                isDuplicate: false,
                confidence: 0.1,
                detectionMethod: 'quality',
                requiresReview: true,
                reason: 'Low image quality'
            };
        }

        // 2. Image similarity check
        const candidates = await this.getSimilarityCandidates(userId);
        
        for (const candidate of candidates) {
            if (!candidate.pHash) continue;

            const similarity = await this.calculateSimilarity(fingerprint, candidate, userId);
            
            if (similarity.isSimilar) {
                return {
                    isDuplicate: true,
                    confidence: similarity.confidence,
                    reason: similarity.reason,
                    similarActionId: candidate.id,
                    score: similarity.score,
                    detectionMethod: similarity.method,
                    requiresReview: similarity.confidence < 0.9
                };
            }
        }

        return { 
            isDuplicate: false, 
            confidence: 0.95,
            detectionMethod: 'none',
            requiresReview: false 
        };
    }

    /**
     * Calculate comprehensive similarity between fingerprints
     */
    private static async calculateSimilarity(
        fingerprint: ImageFingerprint,
        candidate: any,
        userId: string
    ): Promise<{
        isSimilar: boolean;
        confidence: number;
        reason: string;
        score: number;
        method: string;
    }> {
        const isSameUser = candidate.userId === userId;
        const pHashThreshold = isSameUser ? this.PHASH_STRICT_THRESHOLD : this.PHASH_GLOBAL_THRESHOLD;

        // Hash comparisons
        const pHashDist = this.hammingDistance(fingerprint.pHash, candidate.pHash);
        const dHashDist = 64; // Not available in DB yet, fallback to max distance
        const aHashDist = 64; // Not available in DB yet, fallback to max distance

        // Histogram correlation
        const histCorrelation = candidate.histogram ? 
            this.histogramCorrelation(fingerprint.histogram, candidate.histogram) : 0;

        // Combined confidence calculation
        let confidence = 0;
        let method = 'hash';
        let reason = '';

        // Primary: pHash match
        if (pHashDist <= pHashThreshold) {
            confidence = 0.9;
            reason = `pHash match (${pHashDist} bits)`;
            method = 'phash';
        }

        // Secondary: Multiple hash agreement
        const hashAgreement = [pHashDist <= pHashThreshold, dHashDist <= this.DHASH_THRESHOLD, aHashDist <= this.AHASH_THRESHOLD]
            .filter(Boolean).length;

        if (hashAgreement >= 2) {
            confidence = Math.max(confidence, 0.85);
            reason = `Multi-hash agreement (${hashAgreement}/3)`;
            method = 'multi-hash';
        }

        // Tertiary: Histogram correlation confirmation
        if (histCorrelation >= this.HISTOGRAM_CORRELATION_MIN && confidence > 0) {
            confidence = Math.min(confidence + 0.1, 1.0);
            reason += ` + Histogram (${(histCorrelation * 100).toFixed(1)}%)`;
            method = 'combined';
        }

        // Quality adjustment
        if (fingerprint.quality < 0.5) {
            confidence *= 0.8; // Reduce confidence for low quality images
        }

        return {
            isSimilar: confidence >= 0.7,
            confidence,
            reason: reason || 'No significant similarity',
            score: pHashDist,
            method
        };
    }

    /**
     * Get candidates for similarity comparison
     */
    private static async getSimilarityCandidates(userId: string): Promise<any[]> {
        return await prisma.ecoAction.findMany({
            where: {
                OR: [
                    { userId }, // User's own submissions
                    { 
                        createdAt: { 
                            gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                        } 
                    } // Recent global submissions
                ]
            },
            select: { 
                id: true, 
                userId: true, 
                pHash: true, 
                histogram: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
    }

    /**
     * Check submission cooldown
     */
    static async checkSubmissionCooldown(userId: string): Promise<{ allowed: boolean; waitTime?: number }> {
        const lastSubmission = await prisma.ecoAction.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        if (!lastSubmission) return { allowed: true };

        const timeSinceSubmission = Date.now() - lastSubmission.createdAt.getTime();
        const cooldownMs = this.SUBMISSION_COOLDOWN_MINUTES * 60 * 1000;

        if (timeSinceSubmission < cooldownMs) {
            return {
                allowed: false,
                waitTime: Math.ceil((cooldownMs - timeSinceSubmission) / 1000)
            };
        }

        return { allowed: true };
    }

    /**
     * Check hourly submission limit
     */
    static async checkHourlyLimit(userId: string): Promise<{ allowed: boolean; remaining?: number }> {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyCount = await prisma.ecoAction.count({
            where: { userId, createdAt: { gt: hourAgo } }
        });

        if (hourlyCount >= this.MAX_SUBMISSIONS_PER_HOUR) {
            return { allowed: false };
        }

        return { 
            allowed: true, 
            remaining: this.MAX_SUBMISSIONS_PER_HOUR - hourlyCount 
        };
    }

    // Helper methods
    private static hammingDistance(hex1: string, hex2: string): number {
        if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64;
        
        try {
            const bin1 = BigInt('0x' + hex1).toString(2).padStart(64, '0');
            const bin2 = BigInt('0x' + hex2).toString(2).padStart(64, '0');

            let distance = 0;
            for (let i = 0; i < bin1.length; i++) {
                if (bin1[i] !== bin2[i]) distance++;
            }
            return distance;
        } catch (e) {
            return 64; // Max difference on error
        }
    }

    private static histogramCorrelation(hist1: number[], hist2: number[]): number {
        if (hist1.length !== hist2.length) return 0;

        const n = hist1.length;
        const mean1 = hist1.reduce((a, b) => a + b, 0) / n;
        const mean2 = hist2.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = hist1[i] - mean1;
            const diff2 = hist2[i] - mean2;
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }

        const correlation = numerator / Math.sqrt(denom1 * denom2);
        return isNaN(correlation) ? 0 : Math.abs(correlation);
    }
}
