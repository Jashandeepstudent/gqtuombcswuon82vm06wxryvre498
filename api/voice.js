import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. ADD CORS HEADERS (Crucial for GitHub to Vercel communication)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows requests from any site
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle the "preflight" request (sent by browsers before the actual POST)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Parse the body
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const prompt = body?.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "You are an inventory manager. Return ONLY raw JSON. Format: { \"action\": \"add\"|\"decrease\"|\"delete\", \"item\": \"string\", \"qty\": number, \"unit\": \"string\", \"reply\": \"friendly message\" }"
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 4. Clean the AI response (Gemini sometimes adds ```json ... ```)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    // 5. Send the JSON back to your GitHub site
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
}
