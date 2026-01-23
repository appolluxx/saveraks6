import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp'
    ];

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemInstruction = `You are a Waste Management Specialist for Surasakmontree School in Thailand.
    Your goal is to accurately categorize waste into 4 specific bins.

    CRITICAL RULES FOR RECYCLING (Prioritize Yellow for Bottles):
    
    1. 🟡 YELLOW BIN (Recycle):
       - **PLASTIC BOTTLES (PET)** -> ALWAYS Yellow if it's a bottle. If it has water, instruct to empty it.
       - Aluminum Csns, Glass Bottles.
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
    for (const model of modelsToTry) {
        try {
            console.log(`[AI Service] Attempting analysis with model: ${model}`);

            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: systemInstruction }, // Pass prompt as text part
                            { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                }
            });

            if (!response.text) {
                console.warn(`[AI Service] Model ${model} returned empty response.`);
                continue;
            }

            console.log(`[AI Service] Success with model: ${model}`);
            return extractJson(response.text);

        } catch (error: any) {
            console.warn(`[AI Service] Model ${model} failed: ${error.message}`);
            // Continue to next model
        }
    }

    // If all models fail, return the Mock Response (Plastic Bottle) 
    // This allows the user to continue usage/demo even if API is down/quota exceeded.
    console.error("[AI Service] All AI models failed. Using Fallback.");
    return getFallbackResponse();
};
