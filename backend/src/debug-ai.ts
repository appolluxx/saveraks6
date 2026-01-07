import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';
config();

async function listModels() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    if (!process.env.GEMINI_API_KEY) return;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // We'll try to use a model object to list, or just inspect available ones if SDK supports it.
        // Actually the SDK doesn't have a direct 'listModels' on the client instance in some versions?
        // Wait, standard correct way:
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Successfully initialized model object.");

        // Try a simple text generation to verify access
        console.log("Attempting simple text generation...");
        const result = await model.generateContent("Hello?");
        console.log("Success! Response:", result.response.text());
    } catch (error: any) {
        console.error("Error during verification:");
        console.error(error.message);
        if (error.response) {
            console.error("API Response:", JSON.stringify(error.response, null, 2));
        }
    }
}

listModels();
