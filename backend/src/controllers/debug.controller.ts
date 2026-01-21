
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

import { GoogleGenerativeAI } from '@google/generative-ai';

export const testGeminiConnection = async (req: Request, res: Response) => {
    try {
        console.log("Testing Gemini API connection...");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.startsWith("YOUR_")) {
            throw new Error("GEMINI_API_KEY is missing or invalid in .env");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Updated package, using 1.5-flash (Vision capable)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Please reply with just the word 'ONLINE' if you receive this.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            status: 'ok',
            message: 'Gemini API is working correctly',
            params: {
                model: "gemini-1.5-flash",
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
