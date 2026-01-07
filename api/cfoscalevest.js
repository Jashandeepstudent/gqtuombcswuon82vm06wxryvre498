import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// CRITICAL: This tells Vercel to handle the Response object correctly
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
    const origin = req.headers.get('origin');
    
    // Define headers dynamically
    const headers = {
        'Access-Control-Allow-Origin': origin || '*', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };

    // 1. Handle Preflight (The browser's 'test' request)
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // 2. Only allow POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, 
            headers: { ...headers, 'Content-Type': 'application/json' } 
        });
    }

    try {
        const { message, userData } = await req.json();

        const result = await generateText({
            model: google('gemini-1.5-pro-latest'),
            system: `You are the ScaleVest CFO. Analyze: ${JSON.stringify(userData)}. Tone: Professional, direct, steel. End with "CFO COMMAND:".`,
            messages: [{ role: 'user', content: message }],
        });

        return new Response(JSON.stringify({ response: result.text }), { 
            status: 200, 
            headers: { ...headers, 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { ...headers, 'Content-Type': 'application/json' } 
        });
    }
}
