import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google GenAI client
// Ensure API key is present, otherwise log warning (though it will fail later if missing)
if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is missing from environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to list available models (for debugging)
const listAvailableModels = async (): Promise<string[]> => {
    try {
        // Working models from Google AI Studio
        const models = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
        console.log('[AI Service] Available models to try:', models);
        return models;
    } catch (error) {
        console.error('[AI Service] Could not list models:', error);
        return [];
    }
};

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

// Original Fallback Mock Response (Restored for reliable demos)
const getFallbackResponse = (): any => {
    console.warn("[AI Service] ⚠️ Activating Fallback Protocol (Mock Data) - API Failed");
    return {
        items: [
            {
                name: "Plastic Bottle (Simulation)",
                bin: "yellow",
                binNameThai: "ถังเหลือง (รีไซเคิล)",
                confidence: 0.99,
                instructions: "Empty liquid, crush, and place in yellow bin.",
                instructionsThai: "เทน้ำออก บีบให้แบน และทิ้งลงถังเหลือง",
                category: "Plastic"
            }
        ],
        summary: "Recyclable plastic bottle detected (Simulated).",
        summaryThai: "ตรวจพบขวดพลาสติก รีไซเคิลได้ (จำลอง)",
        label: "Plastic Bottle",
        bin_name: "ถังเหลือง (Recycle)",
        bin_color: "yellow",
        hasHazardous: false,
        needsCleaning: false,
        overallComplexity: "low",
        // Additional fields for compatibility
        points: 10,
        isValid: true,
        isFraud: false
    };
};

export const analyzeWaste = async (base64Image: string): Promise<any> => {
    // Use working models from Google AI Studio
    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemInstruction = `You are a Waste Management Specialist for Surasakmontree School in Thailand.
    Your goal is to accurately categorize waste into 4 specific bins.

    CRITICAL RULES FOR RECYCLING (Prioritize Yellow for Bottles):
    
    1. 🟡 YELLOW BIN (Recycle):
       - **PLASTIC BOTTLES (PET)** -> ALWAYS Yellow if it's a bottle. If it has water, instruct to empty it.
       - Aluminum Cans, Glass Bottles.
       - Paper/Cardboard (unless heavily soaked/greasy).
       
    2. 🟢 GREEN BIN (Organic):
       - Food waste, Fruit peels, Flowers.
       
    3. 🔴 RED BIN (Hazardous):
       - Batteries, Spray cans, Electronics.
       
    4. 🔵 BLUE BIN (General):
       - Plastic bags, Snack bags (Foil lined), Straws.
       - Tissue, Foam, Dirty food containers.
       
    DECISION LOGIC:
    - **Is it a Plastic Bottle?** -> **YELLOW**. (Instruct: "Empty liquid first")
    - **Is it a Can?** -> **YELLOW**.
    - **Is it a Snack Bag?** -> **BLUE**.
    - **Is it a Food Container?** -> If clean=Yellow, If dirty=Blue.

    Strictly Return JSON only:
    {
      "items": [
        {
          "name": "Object Name (Short, e.g. Plastic Bottle)",
          "bin": "green | blue | yellow | red",
          "binNameThai": "ถัง...",
          "confidence": 0.99,
          "instructions": "Specific instruction",
          "instructionsThai": "คำแนะนำภาษาไทย",
          "category": "Plastic | Paper | Glass | Metal | Organic | General | Hazardous"
        }
      ],
      "summary": "Concise summary",
      "summaryThai": "สรุปสั้นๆ",
      "label": "Main Object Name (THAI Language, e.g. 'ขวดพลาสติก')",
      "bin_name": "Bin Name (Thai)",
      "upcycling_tip": "Short disposal instruction in Thai",
      "hasHazardous": boolean,
      "needsCleaning": boolean,
      "overallComplexity": "low"
    }`;

    // Try each model until one works
    await listAvailableModels(); // Log available models for debugging

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI Service] Attempting analysis with model: ${modelName}`);

            // Check if API key is valid
            if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-api-key-here') {
                throw new Error('Invalid or missing GEMINI_API_KEY');
            }

            // Note: systemInstruction is available in newer versions of @google/generative-ai
            // If it fails with older versions, we might need to prepend it to the prompt.
            // Assuming ^0.24.1 is used which supports it.
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction
            });

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: sanitizedBase64
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();

            if (!text) {
                console.warn(`[AI Service] Model ${modelName} returned empty response.`);
                continue;
            }

            console.log(`[AI Service] Success with model: ${modelName}`);
            return extractJson(text);

        } catch (error: any) {
            console.warn(`[AI Service] Model ${modelName} failed: ${error.message}`);

            // Log more details for debugging
            if (error.message.includes('404')) {
                console.error(`[AI Service] Model ${modelName} not found (404). Check model name availability.`);
            } else if (error.message.includes('403') || error.message.includes('permission')) {
                console.error(`[AI Service] Permission denied. Check API key and quotas.`);
            } else if (error.message.includes('API key')) {
                console.error(`[AI Service] API key issue. Verify GEMINI_API_KEY environment variable.`);
            }
            // 503 is Overloaded
            else if (error.message.includes('503')) {
                console.warn(`[AI Service] Model ${modelName} overloaded. Retrying next model.`);
            }

            // Continue to next model
        }
    }

    // If all models fail, return the Mock Response (Plastic Bottle) 
    // This allows the user to continue usage/demo even if API is down/quota exceeded.
    console.error("[AI Service] All AI models failed. Using Fallback.");
    return getFallbackResponse();
};
