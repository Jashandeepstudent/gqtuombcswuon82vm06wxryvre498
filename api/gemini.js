import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// 1. Initialize the Google Provider with your environment variable
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Accel-Buffering': 'no', 
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // 2. SAFETY CHECK: Immediate error if Key is missing (prevents infinite loading)
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(JSON.stringify({ error: 'MISSING_API_KEY_IN_VERCEL' }), { 
            status: 500, 
            headers 
        });
    }

    try {
        const { messages } = await req.json();

        // 3. Use the initialized 'google' instance
        const result = await streamText({
            model: google('gemini-1.5-flash-latest'), 
            messages: messages,
            system: `You are the ScaleVest Elite CFO. Analyze inventory (Chocolates, Biscuits, Ice Cream). Use professional, data-driven tone.`,
        });

        return result.toDataStreamResponse({ headers });

    } catch (error) {
        console.error('Gemini Stream Error:', error);
        return new Response(JSON.stringify({ error: 'AI_STREAM_FAILED', details: error.message }), { 
            status: 500, 
            headers 
        });
    }
}
