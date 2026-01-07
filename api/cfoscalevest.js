import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const config = {
  runtime: 'edge', // Ensures fast execution on Vercel Edge
};

export default async function handler(req) {
    // 1. Define strict headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // For production, replace '*' with 'http://upscalevest.site'
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    // 2. Handle Preflight Request (This is what triggers the browser error)
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // 3. Only allow POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    try {
        const { message, userData } = await req.json();

        const result = await generateText({
            model: google('gemini-1.5-pro-latest'),
            system: `You are the ScaleVest CFO. You analyze this data: ${JSON.stringify(userData)}. 
                     Role: You are an elite financial strategist.
                     Context: The user is a business owner looking for ruthless efficiency and growth.
                     Tone: Professional, direct, steel-cold logic. No fluff. 
                     Format: Use bullet points for key insights. Always end with a section titled "CFO COMMAND:".`,
            messages: [{ role: 'user', content: message }],
        });

        return new Response(JSON.stringify({ response: result.text }), { 
            status: 200, 
            headers 
        });

    } catch (error) {
        console.error('CFO Backend Error:', error);
        return new Response(JSON.stringify({ error: "Vault Processing Error: " + error.message }), { 
            status: 500, 
            headers 
        });
    }
}
