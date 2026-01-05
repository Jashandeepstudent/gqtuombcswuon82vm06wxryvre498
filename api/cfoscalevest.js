import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Optimized for Vercel Edge Runtime
export const config = { runtime: 'edge' };

export default async function handler(req) {
  // 1. Extract the conversation history from the request
  const { messages } = await req.json();

  // 2. Initialize the Gemini 1.5 Pro model
  // Note: Requires GOOGLE_GENERATIVE_AI_API_KEY in your Vercel Env Variables
  const result = await streamText({
    model: google('models/gemini-1.5-pro-latest'),
    messages: messages,
    system: "You are the ScaleVest Virtual CFO. Use the user's profit, burn rate, " +
            "and product data to provide professional financial insights.",
  });

  // 3. Return a streaming response for a "typing" effect in the UI
  return result.toDataStreamResponse();
}
