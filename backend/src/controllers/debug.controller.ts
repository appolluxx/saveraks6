
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
        console.log("Testing Gemini API connection (REST)...");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.startsWith("YOUR_")) {
            throw new Error("GEMINI_API_KEY is missing or invalid in .env");
        }

        const modelName = "gemini-1.5-flash-latest"; // Or gemini-pro
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{ text: "Please reply with just the word 'ONLINE' if you receive this." }]
            }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify((data as any).error || data));
        }

        const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text || "No text response";

        res.json({
            status: 'ok',
            message: 'Gemini API is working correctly (REST)',
            params: {
                model: modelName,
                keyConfigured: true,
                keyPrefix: apiKey.substring(0, 5) + "..."
            },
            aiResponse: text
        });

    } catch (error: any) {
        console.error("Gemini Test Error:", error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            stack: error.stack,
            keyConfigured: !!process.env.GEMINI_API_KEY
        });
    }
};
