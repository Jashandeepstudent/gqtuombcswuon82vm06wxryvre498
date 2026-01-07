import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const config = { 
  runtime: 'edge' 
};

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://upscalevest.site',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req) {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const { message, userData } = await req.json();

    const result = await generateText({
      model: google('gemini-1.5-pro-latest'),
      system: `You are the ScaleVest CFO. Analyze: ${JSON.stringify(userData)}. End with CFO COMMAND.`,
      messages: [{ role: 'user', content: message }],
    });

    return new Response(JSON.stringify({ response: result.text }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('CFO API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred processing your request' 
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
