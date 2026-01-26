
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Purchase/Redeem an item
export const purchaseItem = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId, cost, itemName } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Use transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current user points
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { totalPoints: true, studentId: true } // Assuming 'totalPoints' is the balance
            });

            if (!user) {
                throw new Error('User not found');
            }

            if (user.totalPoints < cost) {
                throw new Error('Insufficient points');
            }

            // 2. Deduct points
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    totalPoints: { decrement: cost }
                }
            });

            // 3. Record transaction (as an EcoAction or specific Transaction table if exists)
            // Here we reuse EcoAction with a special type 'redemption' or just log it
            // Assuming we might want to track this. For now, we update the user.
            // Ideally, you should have a 'Redemption' or 'Transaction' table.
            // If not, we can create a negative EcoAction? Or just trust the balance update.
            // Let's create a record in EcoAction for history visibility (optional but good)

            // Check if 'REDEMPTION' is a valid ActionType. If not, we might skip or map to 'OTHER'
            // For now, simple deduction is key.

            return updatedUser;
        });

        res.json({
            success: true,
            message: `Redeemed ${itemName} successfully`,
            remainingPoints: result.totalPoints
        });

    } catch (error: any) {
        console.error('Purchase error:', error);
        if (error.message === 'Insufficient points') {
            return res.status(400).json({ success: false, error: 'คะแนนสะสมไม่พอสำหรับการแลกของรางวัลนี้' });
        }
        res.status(500).json({ success: false, error: error.message || 'Purchase failed' });
    }
};
