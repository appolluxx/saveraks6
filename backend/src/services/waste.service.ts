import { GoogleGenerativeAI } from "@google/generative-ai";
// No top-level initialization for more robustness with env variables
let genAI: GoogleGenerativeAI | null = null;

export const analyzeWaste = async (imageBase64: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not defined in environment variables.");
        throw new Error("AI service configuration missing");
    }

    const modelName = "gemini-1.5-flash-001";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const parts = imageBase64.split(',');
    const base64Data = parts.length > 1 ? parts[1] : parts[0];

    const payload = {
        contents: [{
            parts: [
                { text: "นี่คือรูปขยะ ช่วยบอกหน่อยว่าเป็นขยะประเภทไหน (ขยะเปียก, รีไซเคิล, ทั่วไป, อันตราย) ตอบแค่ชื่อประเภท" },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Data
                    }
                }
            ]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error Response:", JSON.stringify(data));
            throw new Error(data.error?.message || "Unknown API Error");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Unknown";
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
