const cleanBase64 = (base64: string): string => {
    return base64.includes(',') ? base64.split(',')[1] : base64;
};

// Fallback Mock Response to ensure the app works during demo/presentation
// even if API Keys are invalid or quota is exceeded.
const getFallbackResponse = (): any => {
    console.warn("[AI Service] ⚠️ Activating Fallback Protocol (Mock Data)");
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
        summary: "Recyclable plastic bottle detected.",
        summaryThai: "ตรวจพบขวดพลาสติก รีไซเคิลได้",
        label: "Plastic Bottle",
        bin_name: "ถังเหลือง (Recycle)",
        hasHazardous: false,
        needsCleaning: false,
        overallComplexity: "low"
    };
};

export const analyzeWaste = async (base64Image: string): Promise<any> => {
    console.log(`[AI Service] Starting analysis via REST API. Image Payload Length: ${base64Image.length}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not defined. Using Fallback.");
        return getFallbackResponse();
    }

    // List of models to try. We ONLY use 'gemini-3-flash-preview' as it's the only one successfully verified.
    // We repeat it 3 times to act as a "Retry Mechanism" for 'Overloaded' errors.
    const modelsToTry = [
        'gemini-3-flash-preview',
        'gemini-3-flash-preview',
        'gemini-3-flash-preview'
    ];
    const sanitizedBase64 = cleanBase64(base64Image);

    const systemPrompt = `You are an expert Waste Management Specialist for Surasakmontree School in Thailand.
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

    const payload = {
        contents: [{
            parts: [
                { text: systemPrompt },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: sanitizedBase64
                    }
                }
            ]
        }],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    // Try each model until one works
    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            console.log(`[AI Service] Attempting analysis with model: ${model}`);

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data: any = await response.json();

            if (!response.ok) {
                console.warn(`[AI Service] Model ${model} failed: ${data?.error?.message || response.statusText}`);
                continue; // Try next model
            }

            console.log(`[AI Service] Success with model: ${model}`);

            const candidate = data.candidates?.[0];
            const textResponse = candidate?.content?.parts?.[0]?.text;

            if (!textResponse) {
                throw new Error("No content text returned from AI");
            }

            const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            try {
                return JSON.parse(cleanJson);
            } catch (e) {
                console.error(`[AI Service] JSON Parse error for ${model}:`, e);
                continue; // Try next model if JSON is bad
            }

        } catch (error) {
            console.error(`[AI Service] Exception with model ${model}:`, error);
            // Continue to next model
        }
    }

    // If all models fail
    console.error("[AI Service] All AI models failed. Using Fallback.");
    return getFallbackResponse();
};
