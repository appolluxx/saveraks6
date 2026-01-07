import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';

config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const analyzeWaste = async (imageBase64: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert waste management AI for Thailand's waste sorting system.

Analyze this image and identify ALL waste items you can see.

Thailand uses 4 colored bins:
🟢 GREEN BIN (ถังเขียว) - Recyclable Waste:
- Clean plastic bottles (PET #1), aluminum cans, glass bottles
- Clean paper, cardboard, newspapers, magazines
- Clean metal cans (food cans, drink cans)
- Tetra packs (clean and dry)

🔵 BLUE BIN (ถังฟ้า) - Wet/Organic Waste:
- Food scraps, fruit peels, vegetable scraps
- Coffee grounds, tea bags
- Leaves, grass clippings, flowers
- Eggshells, bread

🟡 YELLOW BIN (ถังเหลือง) - General/Non-Recyclable Waste:
- Dirty plastic bags, styrofoam
- Used tissues, napkins, paper towels
- Diapers, sanitary products
- Mixed materials (toys, stationery)
- Broken ceramics, mirrors

🔴 RED BIN (ถังแดง) - Hazardous Waste:
- Batteries (all types)
- Light bulbs, fluorescent tubes
- Paint cans, spray cans
- Pesticides, cleaning chemicals
- Electronics, phone batteries
- Medical waste, syringes

IMPORTANT SORTING RULES:
1. Recyclables MUST be clean and dry (rinse food containers)
2. If unsure, default to YELLOW bin
3. Remove caps from bottles before recycling
4. Flatten cardboard boxes to save space
5. Never mix wet food with recyclables

Respond in JSON format ONLY:
{
  "items": [
    {
      "name": "Plastic water bottle",
      "bin": "green",
      "binNameThai": "ถังเขียว (รีไซเคิล)",
      "confidence": 0.95,
      "instructions": "Rinse bottle, remove cap and label, crush to save space",
      "instructionsThai": "ล้างขวด ถอดฝาและฉลาก บีบให้แบนเพื่อประหยัดพื้นที่",
      "category": "Plastic (PET #1)"
    }
  ],
  "summary": "Found 3 items: 2 recyclable (green bin), 1 general waste (yellow bin)",
  "summaryThai": "พบ 3 รายการ: รีไซเคิลได้ 2 ชิ้น (ถังเขียว), ขยะทั่วไป 1 ชิ้น (ถังเหลือง)",
  "hasHazardous": false,
  "needsCleaning": true,
  "overallComplexity": "easy"
}

Guidelines:
- Be specific about bin color (green/blue/yellow/red)
- Provide clear, actionable instructions
- Include both English and Thai
- If multiple items, list all separately
- Mark confidence (0.0-1.0) for each item
- Flag if items need cleaning before disposal`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64.split(',')[1]
                }
            }
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json\n|\n```/g, "").trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        throw new Error("Failed to analyze image");
    }
};
