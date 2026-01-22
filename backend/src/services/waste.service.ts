import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Sanitizes base64 strings to ensure they are raw bytes for the API.
 */
const cleanBase64 = (base64: string): string => {
    return base64.includes(',') ? base64.split(',')[1] : base64;
};

const extractJson = (text: string | undefined): any => {
    if (!text) return {};
    try {
        const cleanText = text.replace(/```json\n?|```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("AI JSON Parse Error:", text);
        return {};
    }
};

export const analyzeWaste = async (base64Image: string): Promise<any> => {
    console.log(`[AI Service] Starting analysis. Image size: ${base64Image.length}`);
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY missing");
    }

    try {
        // We use gemini-1.5-flash as it is confirmed to be in your available models list
        // and supports vision tasks well.
        const model = 'gemini-1.5-flash';
        const sanitizedBase64 = cleanBase64(base64Image);

        const systemInstruction = `You are a Waste Management Specialist for Surasakmontree School (SaveRak Project).
    Analyze the uploaded waste image and provide specific sorting instructions.
    
    Thailand Sorting Standards:
    - GREEN (ถังเขียว): Wet/Organic Waste (ขยะเปียก/อินทรีย์) -> Food scraps, leaves (bin: "green")
    - BLUE (ถังฟ้า): General Waste (ขยะทั่วไป) -> Snack bags, foam, dirty plastic (bin: "blue")
    - YELLOW (ถังเหลือง): Recyclable Waste (ขยะรีไซเคิล) -> Clean bottles, cans, paper (bin: "yellow")
    - RED (ถังแดง): Hazardous Waste (ขยะอันตราย) -> Batteries, spray cans, electronics (bin: "red")

    IMPORTANT: Return ONLY valid JSON with this structure:
    {
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
      "summary": "Short summary (English)",
      "summaryThai": "สรุปสั้นๆ (Thai)",
      "label": "Main object name",
      "bin_name": "Bin Name (Thai)",
      "hasHazardous": boolean,
      "needsCleaning": boolean,
      "overallComplexity": "low | medium | high"
    }`;

        console.log(`[AI Service] Sending request to model: ${model}`);

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Analyze this waste image and tell me which bin it belongs to." },
                        { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
                    ]
                }
            ],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        console.log("[AI Service] Response received from Google.");
        const jsonResponse = extractJson(response.text);
        console.log("[AI Service] Parsed JSON:", JSON.stringify(jsonResponse).substring(0, 100) + "...");

        return jsonResponse;

    } catch (error: any) {
        console.error("Gemini Vision Error:", error);
        // Return a fallback error object instead of crashing completely if possible
        throw new Error(`AI Analysis Failed: ${error.message}`);
    }
};
