import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
// import { hammingDistance } from 'hamming-distance'; // Custom implementation below to avoid import issues

const prisma = new PrismaClient();

export interface ImageFingerprint {
    pHash: string;
    histogram: number[];
}

export interface AntiCheatResult {
    isDuplicate: boolean;
    reason?: string;
    similarActionId?: string;
    score?: number;
}

// ----------------------
// Core Algorithms
// ----------------------

// 1. Hamming Distance for Hex Strings
function hammingDistance(hex1: string, hex2: string): number {
    let distance = 0;
    try {
        const bin1 = BigInt('0x' + hex1).toString(2).padStart(64, '0');
        const bin2 = BigInt('0x' + hex2).toString(2).padStart(64, '0');

        // Compare lengths (should be 64 for dHash)
        const len = Math.max(bin1.length, bin2.length);
        const p1 = bin1.padStart(len, '0');
        const p2 = bin2.padStart(len, '0');

        for (let i = 0; i < len; i++) {
            if (p1[i] !== p2[i]) distance++;
        }
    } catch (e) {
        // Fallback for non-hex or large string issues
        return 64; // Max difference
    }
    return distance;
}

// 2. Histogram Similarity (Intersection / Euclidean)
// Returns 0.0 (identical) to 1.0 (completely different)
function histogramDistance(hist1: number[], hist2: number[]): number {
    if (hist1.length !== hist2.length) return 1.0;

    let sumSqDiff = 0;
    for (let i = 0; i < hist1.length; i++) {
        const diff = hist1[i] - hist2[i];
        sumSqDiff += diff * diff;
    }
    return Math.sqrt(sumSqDiff);
}

export class AntiCheatService {

    // Config
    private static PHASH_THRESHOLD = 10; // Bits different (out of 64). < 5 is strong, < 10 is similar.
    private static HIST_THRESHOLD = 0.2; // Euclidean distance. Lower is more similar.

    /**
     * Compute Fingerprints (pHash + Color Histogram)
     * Uses dHash algorithm: 9x8 resize, compare adjacent pixels.
     */
    static async computeFingerprint(imageBuffer: Buffer): Promise<ImageFingerprint> {
        try {
            // -- dHash Implementation --
            // 1. Resize to 9x8 (9 columns, 8 rows) to get 8 differences per row
            const resized = await sharp(imageBuffer)
                .resize(9, 8, { fit: 'fill' })
                .grayscale()
                .raw()
                .toBuffer();

            let hash = '';
            // resized is 72 bytes (9 * 8)
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const left = resized[row * 9 + col];
                    const right = resized[row * 9 + col + 1];
                    hash += (left > right ? '1' : '0');
                }
            }

            // Convert Binary string to Hex for storage
            const pHash = BigInt('0b' + hash).toString(16).padStart(16, '0');

            // -- Color Histogram Implementation --
            // Resize to 32x32 for speed, count RGB bins
            const { data: pixels, info } = await sharp(imageBuffer)
                .resize(32, 32, { fit: 'fill' })
                .extractChannel(0) // Just Red? No, need all.
                // Re-read for color
                //                .removeAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Re-process for RGB. Sharp pipeline is immutable-ish but chain differs.
            // Simplified: Use a separate pipeline for stats
            const stats = await sharp(imageBuffer)
                .resize(32, 32, { fit: 'fill' })
                .stats();

            // Sharp 'stats' gives mean, min, max, histogram per channel.
            // But stats.channels[0].histogram is array of 256. Too big?
            // Let's use specific binning.

            // Manual binning from tiny resize (8x8)
            const tinyColor = await sharp(imageBuffer)
                .resize(8, 8, { fit: 'fill' })
                .raw()
                .toBuffer();

            // 8x8 = 64 pixels. * 3 channels = 192 bytes.
            // We can treat this raw vector as a feature signature directly
            // Normalize values 0-1
            const histogram = Array.from(tinyColor).map(v => Number((v / 255).toFixed(4)));

            return { pHash, histogram };

        } catch (error) {
            console.error("AntiCheat Compute Error:", error);
            // Return dummy if fail, to allow process to continue (safe fail)
            return { pHash: '0000000000000000', histogram: [] };
        }
    }

    /**
     * Check for duplicates in the database
     */
    static async checkDuplicate(fingerprint: ImageFingerprint, userId: string): Promise<AntiCheatResult> {
        if (!fingerprint.pHash || fingerprint.pHash === '0000000000000000') {
            return { isDuplicate: false };
        }

        // 1. Fetch Candidates
        // Query recent actions (e.g., last 30 days) to optimize
        // OR fetch matches that match a rough substring of the hash?
        // SQL does not support hamming distance easily without extensions.
        // We fetch ALL valid hashes from recent history (last 1000?) and compare in memory.
        // For Scale: Add a specialized vector DB or PGVector later. 
        // For now: Fetch last 200 items + User's own history.

        const recentActions = await prisma.ecoAction.findMany({
            where: {
                // pHash: { not: null }, // Optimization
                // Limit to last 7 days for global check, or all time for user?
                createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            select: { id: true, userId: true, pHash: true, histogram: true, isFlagged: true },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit memory usage
        });

        for (const action of recentActions) {
            // Skip if no pHash
            if (!action.pHash) continue;

            const dist = hammingDistance(fingerprint.pHash, action.pHash);

            let isMatch = false;
            let reason = '';

            // Strict check for SAME user (prevent farming)
            if (action.userId === userId) {
                if (dist <= 10) { // Very similar
                    isMatch = true;
                    reason = `Self-Duplicate detected (Hamming Dist: ${dist})`;
                }
            } else {
                // Global check (looser to avoid false positives on similar common trash)
                if (dist <= 5) { // Extremely similar (Near identical image)
                    isMatch = true;
                    reason = `Global Duplicate detected (Hamming Dist: ${dist})`;
                }
            }

            // If pHash matched, check Histogram for confirmation (Color check)
            // This prevents "Shape match but different object" errors? 
            // Actually, dHash is structural. Color histogram confirms "same scene".
            if (isMatch && action.histogram) {
                const histDist = histogramDistance(fingerprint.histogram, action.histogram as number[]);
                // If colors are very different, maybe not a dupe? 
                // e.g. same bottle shape but green vs red tag.
                if (histDist > 0.4) {
                    isMatch = false; // Revoke match if colors vastly differ
                }
            }

            if (isMatch) {
                return {
                    isDuplicate: true,
                    similarActionId: action.id,
                    score: dist,
                    reason: reason || 'Duplicate Image Detected'
                };
            }
        }

        return { isDuplicate: false };
    }
}
