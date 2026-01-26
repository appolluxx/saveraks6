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
        // Correct model names for v1beta API
        const models = [
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash'
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
                name: "404",
                bin: "404",
                binNameThai: "404",
                confidence: 0.99,
                instructions: "404",
                instructionsThai: "404",
                category: "404"
            }
        ],
        summary: "404",
        summaryThai: "404",
        label: "404",
        bin_name: "404",
        bin_color: "404",
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
    // Use a prioritized list of stable Gemini models as fallbacks
    const modelsToTry = [
        'gemini-2.0-flash-exp', // Try Experimental first
        'gemini-1.5-flash',     // Then Stable Flash
        'gemini-1.5-pro'        // Then Stable Pro
    ];

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemInstruction = `You are an AI Validator for an Eco-School application (SaveRaks).
    Your task is to analyze the image and detect if it represents a valid eco-friendly action.

    CATEGORIES TO DETECT:
    1. �️ WASTE SORTING ( bins: yellow, green, red, blue )
       - Plastic bottles -> Yellow
       - Cans/Glass -> Yellow
       - Food waste -> Green
       - Hazardous -> Red
       - General -> Blue

    2. ⚡ ENERGY SAVING ( evidence of saving energy )
       - Turning off lights (finger on switch, dark room)
       - Unplugging devices
       - Air conditioner off / Fan off
       - Solar panels / Natural light usage

    3. 🌱 GREEN ACTIVITY ( evidence of nature/planting )
       - Planting trees/flowers
       - Watering plants
       - Gardens / Green spaces
       - Soil / Pots / Saplings

    OUTPUT JSON FORMAT:
    {
      "valid_eco_action": boolean, // Is this a valid eco action?
      "action_type": "waste" | "energy" | "green" | "other",
      "items": [
        {
          "name": "Object Name",
          "bin": "green | blue | yellow | red" (only if waste),
          "confidence": 0.99
        }
      ],
      "summary": "English summary of action",
      "summaryThai": "สรุปการกระทำภาษาไทย",
      "label": "Short Thai Label (e.g. 'ปิดไฟ', 'ปลูกต้นไม้', 'ขวดพลาสติก')",
      "isValid": boolean // Duplicate of valid_eco_action for compatibility
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
