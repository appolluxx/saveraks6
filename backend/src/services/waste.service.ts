const cleanBase64 = (base64: string): string => {
    return base64.includes(',') ? base64.split(',')[1] : base64;
};

export const analyzeWaste = async (base64Image: string): Promise<any> => {
    console.log(`[AI Service] Starting analysis via REST API. Image Payload Length: ${base64Image.length}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not defined.");
        throw new Error("AI service configuration missing");
    }

    // Use gemini-1.5-flash as it is reliable and fast
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const sanitizedBase64 = cleanBase64(base64Image);

    const systemPrompt = `You are a Waste Management Specialist. Analyze the image and output valid JSON only.
    Strictly follow this JSON structure:
    {
      "items": [
        {
          "name": "Object Name",
          "bin": "green (wet/organic) | blue (general) | yellow (recycle) | red (hazardous)",
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
            throw new Error(data.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        console.log("[AI Service] Response OK. Parsing content...");

        // Extract text from response structure
        const candidate = data.candidates?.[0];
        const textResponse = candidate?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("No content text returned from AI");
        }

        // Clean any markdown code blocks if the API adds them despite mimetype
        const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

        const parsedAnalysis = JSON.parse(cleanJson);
        console.log("[AI Service] Analysis success:", JSON.stringify(parsedAnalysis).substring(0, 100) + "...");

        return parsedAnalysis;

    } catch (error: any) {
        console.error("AI Analysis Failed:", error);
        throw new Error(`AI Analysis Failed: ${error.message}`);
    }
};
