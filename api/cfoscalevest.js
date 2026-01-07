import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allows requests from your site
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const { message, userData } = await req.json();

        const result = await generateText({
            model: google('gemini-1.5-pro-latest'),
            system: `You are the ScaleVest CFO. You analyze this data: ${JSON.stringify(userData)}. 
                     Tone: Professional, direct, steel. End with a "CFO COMMAND".`,
            messages: [{ role: 'user', content: message }],
        });

        return new Response(JSON.stringify({ response: result.text }), { 
            status: 200, 
            headers 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers 
        });
    }
}
