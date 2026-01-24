import { GoogleGenerativeAI } from "@google/generative-ai";

// Test script to debug Gemini API issues
async function testGeminiAPI() {
    console.log('=== Gemini API Debug Test ===');
    
    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey || apiKey === 'your-api-key-here') {
        console.error('❌ Invalid or missing API key');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Test different model names
        const models = [
            'gemini-3-flash-preview',  // Official model from docs
            'gemini-2.0-flash-exp',    // Previous experimental
            'gemini-1.5-flash-latest', // Previous version
            'gemini-1.5-pro-latest',   // Previous version
            'gemini-1.0-pro-latest',   // Previous version
            'gemini-pro'               // Original model
        ];
        
        for (const modelName of models) {
            try {
                console.log(`\n🧪 Testing model: ${modelName}`);
                
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Simple text test
                const result = await model.generateContent('Hello, respond with "Model working"');
                const response = await result.response;
                const text = response.text();
                
                console.log(`✅ ${modelName}: ${text}`);
                
            } catch (error: any) {
                console.log(`❌ ${modelName}: ${error.message}`);
                
                if (error.message.includes('404')) {
                    console.log(`   → Model not found, trying next...`);
                } else if (error.message.includes('403')) {
                    console.log(`   → Permission denied - check API key/quota`);
                } else if (error.message.includes('API key')) {
                    console.log(`   → API key issue`);
                }
            }
        }
        
    } catch (error: any) {
        console.error('❌ Client initialization failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testGeminiAPI().catch(console.error);
}

export { testGeminiAPI };
