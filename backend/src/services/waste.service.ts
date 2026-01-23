import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Sanitizes base64 strings to ensure they are raw bytes for the API.
 */
const cleanBase64 = (base64: string): string => {
    return base64.includes(',') ? base64.split(',')[1] : base64;
};

// Removed browser-only fileToBase64 function as this is a backend service.

const extractJson = (text: string | undefined): any => {
    if (!text) return {};
    try {
        const cleanText = text.replace(/```json\n?|```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("AI JSON Parse Error:", text);
        return {}; // Return empty object instead of falling back to mock to avoid confusion
    }
};

export interface DetailedWasteResult {
    category: string;
    items: Array<{
        name: string;
        bin: 'green' | 'blue' | 'yellow' | 'red';
        binNameThai: string;
        confidence: number;
        instructions: string;
        instructionsThai: string;
        category: string;
    }>;
    summary: string;
    summaryThai: string;
    hasHazardous: boolean;
    needsCleaning: boolean;
    overallComplexity: string;
    label: string;
    bin_color: string;
    bin_name: string;
    upcycling_tip: string;
    points: number;
    isValid: boolean;
    isFraud: boolean;
    confidence: number;
    reason: string;
}

// Adapter: actions.routes.ts calls analyzeWaste(payload)
export const analyzeWaste = async (base64Image: string): Promise<DetailedWasteResult> => {
    // We map 'analyzeWaste' to the 'general' mode of our new function
    return analyzeEnvironmentImage(base64Image, 'general');
};

export const analyzeEnvironmentImage = async (base64Image: string, mode: string = 'general'): Promise<DetailedWasteResult> => {
    try {
        // Using gemini-1.5-flash as the most stable model for this use case.
        // The user requested 'gemini-3-flash-preview', but it is causing errors.
        const model = 'gemini-1.5-flash';

        const sanitizedBase64 = cleanBase64(base64Image);

        let systemInstruction = `You are a Waste Management Specialist for Surasakmontree School.
    Analyze the image and provide a sorting guide. 
    
    Thailand Sorting Standards (FOR THIS APP):
    - YELLOW (ถังเหลือง): Recyclable Waste (รีไซเคิล) - Plastic Bottles, Glass, Cans.
    - GREEN (ถังเขียว): Wet/Organic Waste (ขยะเปียก/อินทรีย์) - Food, Peels.
    - BLUE (ถังฟ้า): General Waste (ขยะทั่วไป) - Snack bags, dirty plastics.
    - RED (ถังแดง): Hazardous Waste (ขยะอันตราย) - Batteries, sprays.

    Return JSON:
    {
      "category": "recycle | grease_trap | hazard",
      "label": "Main object identified (Thai)",
      "bin_color": "green | blue | yellow | red",
      "bin_name": "ชื่อถังขยะ (Thai)",
      "upcycling_tip": "Disposal instruction (Thai)",
      "points": 50,
      "isValid": true,
      "isFraud": false,
      "confidence": 0.9,
      "reason": "Explain if the image is valid or potentially fraudulent",
      "items": [
        {
          "name": "Object name (English)",
          "bin": "green | blue | yellow | red",
          "binNameThai": "ถัง... (Thai)",
          "confidence": 0.95,
          "instructions": "Instruction (English)",
          "instructionsThai": "คำแนะนำ (Thai)",
          "category": "Material type"
        }
      ],
      "summary": "Overall summary (English)",
      "summaryThai": "สรุปผล (Thai)",
      "hasHazardous": boolean,
      "needsCleaning": boolean,
      "overallComplexity": "low | medium | high"
    }`;

        // Call generateContent with model name and multi-part content (text prompt + image data)
        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `Analyze items in this photo for ${mode} sorting. Set the top-level 'category' field to '${mode}'.` },
                        { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
                    ]
                }
            ],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: "application/json",
            }
        });

        // Logging for debug
        // console.log("[AI Service] Response:", JSON.stringify(response, null, 2));

        if (!response.text) {
            throw new Error("No text response from AI");
        }

        return extractJson(response.text);
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        // Return safe fallback error object
        return {
            category: "error",
            items: [],
            summary: "AI Error",
            summaryThai: "เกิดข้อผิดพลาดในการวิเคราะห์",
            hasHazardous: false,
            needsCleaning: false,
            overallComplexity: "low",
            label: "AI Error",
            bin_color: "blue",
            bin_name: "General",
            upcycling_tip: "Please try again",
            points: 0,
            isValid: false,
            isFraud: false,
            confidence: 0,
            reason: "System Error"
        };
    }
};

export const analyzeUtilityBill = async (base64Image: string): Promise<any> => {
    try {
        const model = 'gemini-1.5-flash';
        const sanitizedBase64 = cleanBase64(base64Image);
        const systemInstruction = `Extract energy units (kWh) and month from the utility bill. Return JSON.`;

        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Extract units and month from this bill image." },
                        { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
                    ]
                }
            ],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: "application/json",
            }
        });
        return extractJson(response.text);
    } catch (error) {
        console.error("Gemini Bill Error:", error);
        throw error;
    }
};
