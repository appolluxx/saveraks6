
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



export const testGeminiConnection = async (req: Request, res: Response) => {
    try {
        console.log("Testing Gemini API connection (REST - List Models)...");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.startsWith("YOUR_")) {
            throw new Error("GEMINI_API_KEY is missing or invalid in .env");
        }

        // 1. LIST MODELS
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url, { headers: { "Content-Type": "application/json" } });
        const data = await response.json();

        if (!response.ok) throw new Error(JSON.stringify((data as any).error || data));

        const models = (data as any).models || [];
        const availableModels = models.map((m: any) => m.name.replace('models/', ''));

        // 2. TEST GENERATION (with first valid model)
        const targetModel = availableModels.find((m: string) => m.includes('flash') || m.includes('pro')) || 'gemini-1.5-flash';

        console.log(`Attempting test generation with: ${targetModel}`);
        const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const genRes = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Ping" }] }] })
        });
        const genData = await genRes.json();

        res.json({
            status: 'ok',
            message: 'Gemini Verification Complete',
            models: availableModels,
            testTarget: targetModel,
            generationResult: genRes.ok ? 'SUCCESS' : 'FAILED',
            generationError: genRes.ok ? null : genData
        });

    } catch (error: any) {
        console.error("Gemini Test Error:", error);
        res.status(500).json({ status: 'error', error: error.message, stack: error.stack });
    }
};
