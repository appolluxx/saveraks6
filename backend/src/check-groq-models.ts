
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import Groq from "groq-sdk";

// Initialize Groq client
if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing.");
    process.exit(1);
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function main() {
    try {
        console.log("Testing Vision on meta-llama/llama-4-scout-17b-16e-instruct...");

        // 5x5 Red Dot PNG
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": "What is in this image?" },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/png;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "temperature": 0.1
        });

        console.log("Success! Response:", chatCompletion.choices[0]?.message?.content);
    } catch (error: any) {
        console.error("Error testing vision:", JSON.stringify(error, null, 2));
    }
}

main();
