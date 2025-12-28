// api/voice.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "You are a smart inventory manager. Extract actions from the user's speech. Return ONLY JSON: {action: 'add'|'remove'|'delete', item: string, qty: number, reply: 'friendly message'}"
  });

  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from AI text
    const jsonMatch = responseText.match(/\{.*\}/s);
    res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ error: "Failed to process voice command" });
  }
}
