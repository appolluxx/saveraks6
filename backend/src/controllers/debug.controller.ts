
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const testDbConnection = async (req: Request, res: Response) => {
    try {
        console.log("Testing DB connection...");

        // 1. Check basic connection
        await prisma.$queryRaw`SELECT 1`;

        // 2. Count students
        const count = await prisma.studentsMaster.count();

        // 3. List top 5 students (to verify actual data)
        const students = await prisma.studentsMaster.findMany({
            take: 5,
            select: { studentId: true, firstName: true, isRegistered: true }
        });

        res.json({
            status: 'ok',
            message: 'Database connection successful',
            count,
            sampleData: students,
            envUrl: process.env.DATABASE_URL ? 'Defined (Hidden)' : 'Undefined'
        });
    } catch (error: any) {
        console.error("DB Test Error:", error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            stack: error.stack
        });
    }
};
