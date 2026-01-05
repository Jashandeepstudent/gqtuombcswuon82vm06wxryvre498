import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// IMPORTANT: Do NOT use "export const config = { runtime: 'edge' };" 
// The AI SDK requires the standard Node.js runtime to function correctly.

export default async function handler(req) {
  // 1. Handle CORS (so your GitHub site can talk to Vercel)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { messages } = await req.json();

    // 2. Start the AI stream
    const result = await streamText({
      model: google('gemini-1.5-pro-latest'), // Use standard model name
      messages,
      system: `You are the ScaleVest Elite CFO. Analyze inventory and sales data 
               to provide strategic financial growth advice.`,
    });

    // 3. Return the stream with correct headers
    return result.toDataStreamResponse({ headers });

  } catch (error) {
    console.error('Build-time error resolved:', error);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { 
      status: 500, 
      headers 
    });
  }
}
