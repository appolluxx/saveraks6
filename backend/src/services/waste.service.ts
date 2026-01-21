import { GoogleGenerativeAI } from "@google/generative-ai";
// No top-level initialization for more robustness with env variables
let genAI: GoogleGenerativeAI | null = null;

export const analyzeWaste = async (imageBase64: string) => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is not defined in environment variables.");
            throw new Error("AI service configuration missing");
        }
        console.log("Initializing AI Service...");
        genAI = new GoogleGenerativeAI(apiKey);
    }
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Use 1.5-flash for vision capabilities
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT" as any,
                threshold: "BLOCK_NONE" as any,
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH" as any,
                threshold: "BLOCK_NONE" as any,
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
                threshold: "BLOCK_NONE" as any,
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
                threshold: "BLOCK_NONE" as any,
            },
        ],
    });

    const prompt = "นี่คือรูปขยะ ช่วยบอกหน่อยว่าเป็นขยะประเภทไหน (ขยะเปียก, รีไซเคิล, ทั่วไป, อันตราย) ตอบแค่ชื่อประเภท";

    try {
        const parts = imageBase64.split(',');
        const base64Data = parts.length > 1 ? parts[1] : parts[0];

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log("Gemini Response:", text);

        // Map simple response to the JSON structure expected by Frontend
        // Logic requested:
        // Wet (ขยะเปียก) -> Green Bin
        // Recycle (รีไซเคิล) -> Yellow Bin
        // Hazardous (อันตราย) -> Red Bin
        // General (ทั่วไป) -> Blue Bin
        let bin = 'blue';
        let binNameThai = 'ขยะทั่วไป';

        if (text.includes('ขยะเปียก')) {
            bin = 'green';
            binNameThai = 'ขยะเปียก';
        } else if (text.includes('รีไซเคิล')) {
            bin = 'yellow';
            binNameThai = 'ขยะรีไซเคิล';
        } else if (text.includes('อันตราย')) {
            bin = 'red';
            binNameThai = 'ขยะอันตราย';
        }

        return {
            items: [{
                name: "Detected Item",
                bin: bin,
                binNameThai: binNameThai,
                confidence: 1.0,
                instructions: "Dispose in the indicated bin.",
                instructionsThai: "ทิ้งลงถังตามที่ระบุ",
                category: text
            }],
            summary: `Identified as ${text}`,
            summaryThai: `ผลการวิเคราะห์: ${text}`,
            hasHazardous: bin === 'red',
            needsCleaning: bin === 'green',
            overallComplexity: "easy"
        };

    } catch (error: any) {
        console.error("AI Analysis Detailed Error:", {
            error: error.message,
            stack: error.stack,
            responseTime: new Date().toISOString()
        });
        throw new Error(`AI Analysis Failed: ${error.message}`);
    }
};
