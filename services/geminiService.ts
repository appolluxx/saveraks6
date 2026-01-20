
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client with environment variable (fallback for compatibility)
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') });

/**
 * Sanitizes base64 strings to ensure they are raw bytes for the API.
 */
const cleanBase64 = (base64: string): string => {
  return base64.includes(',') ? base64.split(',')[1] : base64;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(cleanBase64(reader.result as string));
    reader.onerror = reject;
  });
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

export interface DetailedWasteResult {
  // Added category to satisfy ScanResult interface requirements in components/RecycleScanner.tsx
  category: string;
  items: Array<{
    name: string;
    bin: 'green' | 'blue' | 'yellow' | 'red';
    binNameThai: string;
    confidence: number;
    instructions: string;
    instructionsThai: string;
    category: string;
  }>;
  summary: string;
  summaryThai: string;
  hasHazardous: boolean;
  needsCleaning: boolean;
  overallComplexity: string;
  label: string;
  bin_color: string;
  bin_name: string;
  upcycling_tip: string;
  points: number;
  isValid: boolean;
  isFraud: boolean;
  confidence: number;
  reason: string;
}

export const analyzeEnvironmentImage = async (base64Image: string, mode: string): Promise<DetailedWasteResult> => {
  try {
    const model = 'gemini-3-flash-preview';
    const sanitizedBase64 = cleanBase64(base64Image);
    
    // Updated system instruction to include 'category' in the top-level JSON to match expected ScanResult structure
    let systemInstruction = `You are a Waste Management Specialist for Surasakmontree School.
    Analyze the image and provide a sorting guide. 
    
    Thailand Sorting Standards (FOR THIS APP):
    - GREEN (ถังเขียว): Recyclable Waste (รีไซเคิล)
    - BLUE (ถังฟ้า): Wet/Organic Waste (ขยะเปียก/อินทรีย์)
    - YELLOW (ถังเหลือง): General Waste (ขยะทั่วไป)
    - RED (ถังแดง): Hazardous Waste (ขยะอันตราย)

    Return JSON:
    {
      "category": "recycle | grease_trap | hazard",
      "label": "Main object identified (Thai)",
      "bin_color": "GREEN | BLUE | YELLOW | RED",
      "bin_name": "ชื่อถังขยะ (Thai)",
      "upcycling_tip": "Disposal instruction (Thai)",
      "points": 50,
      "isValid": true,
      "isFraud": false,
      "confidence": 0.9,
      "reason": "Explain if the image is valid or potentially fraudulent",
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
      "summary": "Overall summary (English)",
      "summaryThai": "สรุปผล (Thai)",
      "hasHazardous": boolean,
      "needsCleaning": boolean,
      "overallComplexity": "low | medium | high"
    }`;

    // Call generateContent with model name and multi-part content (text prompt + image data)
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: `Analyze items in this photo for ${mode} sorting. Set the top-level 'category' field to '${mode}'.` },
          { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return extractJson(response.text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const analyzeUtilityBill = async (base64Image: string): Promise<any> => {
  try {
    const model = 'gemini-3-flash-preview';
    const sanitizedBase64 = cleanBase64(base64Image);
    const systemInstruction = `Extract energy units (kWh) and month from the utility bill. Return JSON.`;

    // Call generateContent with prompt and image.
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: "Extract units and month from this bill image." },
          { inlineData: { mimeType: 'image/jpeg', data: sanitizedBase64 } }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });
    return extractJson(response.text);
  } catch (error) {
    console.error("Gemini Bill Error:", error);
    throw error;
  }
};
