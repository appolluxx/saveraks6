import Groq from "groq-sdk";

// Initialize Groq client
if (!process.env.GROQ_API_KEY) {
    console.warn("WARNING: GROQ_API_KEY is missing from environment variables.");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

// Helper function to list available models (for debugging) - Simplified for Groq
const listAvailableModels = async (): Promise<string[]> => {
    return ['llama-3.2-90b-vision-preview'];
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
        summary: "AI Service Unavailable",
        summaryThai: "ระบบ AI ไม่พร้อมใช้งาน",
        label: "AI Failed",
        bin_name: "Check Connection",
        bin_color: "gray",
        hasHazardous: false,
        needsCleaning: false,
        overallComplexity: "low",
        points: 0,
        isValid: false,
        isFraud: false
    };
};

const analyzeWithGroq = async (base64Image: string, systemInstruction: string): Promise<any> => {
    try {
        console.log('[AI Service] Attempting analysis with GROQ (Llama 3.2 Vision)...');
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": systemInstruction },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            "model": "llama-3.2-90b-vision-preview",
            "temperature": 0.5,
            "max_completion_tokens": 1024,
            "top_p": 1,
            "stream": false,
            "response_format": { "type": "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) throw new Error("Groq returned empty content");

        console.log('[AI Service] Groq Analysis Success');
        return JSON.parse(content);
    } catch (error: any) {
        console.error(`[AI Service] Groq Failed: ${error.message}`);
        throw error; // Rethrow to let main function handle fallback
    }
};

export const analyzeWaste = async (base64Image: string): Promise<any> => {
    console.log("[AI Service] v3.0 (Groq ONLY) Initialized");

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemInstruction = `You are an AI Validator for an Eco-School application (SaveRaks).
    Your task is to analyze the image and detect if it represents a valid eco-friendly action.

    CATEGORIES TO DETECT:
    1. 🗑️ WASTE SORTING ( bins: yellow, green, red, blue )
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

    OUTPUT JSON FORMAT (Strictly match this):
    {
      "valid_eco_action": boolean,
      "action_type": "waste" | "energy" | "green" | "other",
      "items": [
        {
          "name": "Object Name",
          "bin": "green | blue | yellow | red", // Only for waste
          "confidence": 0.99
        }
      ],
      "summary": "Short English summary",
      "summaryThai": "สรุปภาษาไทยสั้นๆ",
      "label": "Thai Label (e.g. 'ปิดไฟ', 'ขวดน้ำ')",
      "isValid": boolean
    }`;

    // Try GROQ
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
        try {
            return await analyzeWithGroq(sanitizedBase64, systemInstruction);
        } catch (e) {
            console.warn("[AI Service] Groq failed. Fallback to Mock Data.");
        }
    } else {
        console.error("[AI Service] GROQ_API_KEY is missing or invalid.");
    }

    // Final Fallback (No Gemini anymore)
    console.error("[AI Service] All AI models failed. Using Fallback.");
    return getFallbackResponse();
};
