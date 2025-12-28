import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Log incoming request to Vercel Dashboard
  console.log("Method:", req.method, "Body:", req.body);

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 2. Force-parse body if Vercel sends it as a string
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const prompt = body?.prompt;

  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "You are an inventory manager. Return ONLY raw JSON. { \"action\": \"add\"|\"decrease\"|\"delete\", \"item\": \"string\", \"qty\": number, \"unit\": \"string\", \"reply\": \"friendly message\" }"
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean AI output (removes markdown code blocks if present)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
}
