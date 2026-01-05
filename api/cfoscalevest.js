import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// REMOVED: export const config = { runtime: 'edge' }; 
// The standard Node.js runtime is more compatible with these modules.

export default async function handler(req) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allow your GitHub site to talk to Vercel
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const { messages } = await req.json();

        // 2. Initialize Gemini 1.5 Pro
        const result = await streamText({
            model: google('gemini-1.5-pro-latest'), // Simplified model string
            messages: messages,
            system: `
                # ROLE
                You are the "ScaleVest Elite CFO," a strategic financial advisor. 
                # ANALYSIS GUIDELINES
                - Identify Strengths, Weaknesses, Opportunities, and Threats.
                - Use "Stock Radar" to predict restock needs.
                - Provide one clear "Next Step" actionable advice.
            `,
        });

        // 3. Return streaming response
        return result.toDataStreamResponse({ headers });

    } catch (error) {
        console.error('CFO Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers 
        });
    }
}
