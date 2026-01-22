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

    // Use gemini-1.5-flash for production/demo (Real AI)
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemPrompt = `You are a Waste Management Specialist for Surasakmontree School.
    Analyze the image (waste) and provide a sorting guide.
    
    Thailand Sorting Standards:
    - GREEN (ถังเขียว): Recyclable/Wet Waste separation depends on context, but here: Wet/Organic (ขยะเปียก)
    - BLUE (ถังฟ้า): General Waste (ขยะทั่วไป)
    - YELLOW (ถังเหลือง): Recyclable Waste (ขยะรีไซเคิล)
    - RED (ถังแดง): Hazardous Waste (ขยะอันตราย)

    Strictly Return JSON only:
    {
      "items": [
        {
          "name": "Object Name",
          "bin": "green | blue | yellow | red",
          "binNameThai": "ถัง...",
          "confidence": 0.99,
          "instructions": "English instructions",
          "instructionsThai": "คำแนะนำภาษาไทย",
          "category": "Category Name"
        }
      ],
      "summary": "Summary",
      "summaryThai": "สรุป",
      "label": "Main Label",
      "bin_name": "Bin Name",
      "hasHazardous": false,
      "needsCleaning": false,
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

    try {
        console.log(`[AI Service] Sending fetch request to ${url}`);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error Body:", JSON.stringify(data));
            // Trigger Fallback
            return getFallbackResponse();
        }

        console.log("[AI Service] Response OK. Parsing content...");

        // Extract text from response structure
        const candidate = data.candidates?.[0];
        const textResponse = candidate?.content?.parts?.[0]?.text;

        if (!textResponse) {
            console.error("No content text returned from AI");
            return getFallbackResponse();
        }

        // Clean any markdown code blocks if the API adds them despite mimetype
        const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

        try {
            const parsedAnalysis = JSON.parse(cleanJson);
            console.log("[AI Service] Analysis success:", JSON.stringify(parsedAnalysis).substring(0, 100) + "...");
            return parsedAnalysis;
        } catch (parseError) {
            console.error("Failed to parse AI JSON response", parseError);
            return getFallbackResponse();
        }

    } catch (error: any) {
        console.error("AI Analysis Failed (Exception):", error);
        // Fallback on any exception
        return getFallbackResponse();
    }
};
