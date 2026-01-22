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

    // List of models to try in order of preference
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro-vision'];
    const sanitizedBase64 = cleanBase64(base64Image);

    const systemPrompt = `You are an expert Waste Management Specialist for Surasakmontree School in Thailand.
    Your goal is to accurately categorize waste into 4 specific bins based on strict Thai school standards.

    CRITICAL SORTING RULES (Follow priority order):
    
    1. 🔴 RED BIN (Hazardous/Dangerous): 
       - Batteries, Spray cans, Light bulbs, Electronics, Chemicals, Sharpe objects.
       
    2. 🟡 YELLOW BIN (Recycle - CLEAN ONLY):
       - Plastic bottles (PET) -> Check if empty/clean.
       - Glass bottles, Aluminum cans.
       - Clean Paper/Cardboard (Not wet/greasy).
       - Hard plastics (HDPE/PP) that are clean.
       
    3. 🟢 GREEN BIN (Organic/Wet):
       - Food scraps, Fruit peels, Leaves, Flowers.
       - Coffee grounds, Tea bags.
       - MUST be biodegradable.
       
    4. 🔵 BLUE BIN (General/Trash - The rest):
       - *Dirty/Contaminated* plastics or paper (e.g., greasy pizza box, dirty cup).
       - Snack bags (Mylar/Foil lined).
       - Plastic bags (Single-use), Straws, Plastic cutlery (unless clearly marked biodegradable).
       - Tissue paper (used), Foam boxes, Food containers with residue.
       - Milk cartons (UHT) -> often General if not washed/flattened properly, but default to Blue if unsure.
       
    ANALYSIS LOGIC:
    - If it's a plastic bottle but has liquid -> Instruct to empty liquid first, then YELLOW.
    - If it's a paper cup with coffee stains -> BLUE.
    - If it's a snack bag (Lays, etc.) -> BLUE.
    - If unsure between Blue/Yellow -> biased towards BLUE (General) to avoid contaminating recycle bin.

    Strictly Return JSON only:
    {
      "items": [
        {
          "name": "Object Name (Short)",
          "bin": "green | blue | yellow | red",
          "binNameThai": "ถัง...",
          "confidence": 0.99,
          "instructions": "Specific instruction (e.g., Empty liquid first)",
          "instructionsThai": "คำแนะนำภาษาไทย (เช่น เทน้ำออกก่อน)",
          "category": "Plastic | Paper | Glass | Metal | Organic | General | Hazardous"
        }
      ],
      "summary": "Concise summary (English)",
      "summaryThai": "สรุปสั้นๆ (ไทย)",
      "label": "Main Object Name",
      "bin_name": "Bin Name (Thai)",
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
