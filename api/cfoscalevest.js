import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req) {
    // 1. Define Headers
    const headers = {
        'Access-Control-Allow-Origin': 'http://upscalevest.site', // Allow your specific site
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // 2. Handle Browser "Preflight" (OPTIONS) request
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const { message, userData } = await req.json();

        const result = await generateText({
            model: google('gemini-1.5-pro-latest'),
            system: `You are the ScaleVest CFO. Use this data: ${JSON.stringify(userData)}`,
            messages: [{ role: 'user', content: message }],
        });

        // 3. Return response WITH headers
        return new Response(JSON.stringify({ response: result.text }), { 
            status: 200, 
            headers 
        });

    } catch (error) {
        console.error('CFO Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers 
        });
    }
}
