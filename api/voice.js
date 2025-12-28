import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Handle CORS and Options (Prevents "Brain Freeze" on some browsers)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Security Check
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key missing in Vercel Settings" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "You are an inventory manager. Return ONLY raw JSON. No markdown, no backticks. { \"action\": \"add\"|\"decrease\"|\"delete\", \"item\": \"string\", \"qty\": number, \"unit\": \"string\", \"reply\": \"string\" }"
    });

    const { prompt } = req.body;
    if (!prompt) throw new Error("No prompt provided");

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    // 3. Robust JSON Extraction (Removes backticks if AI adds them)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Gemini Error:", error);
    // Return a 200 with an error flag so your frontend doesn't "Brain Freeze"
    return res.status(200).json({ 
      error: true, 
      reply: "I had a tiny glitch. Can you try again?",
      originalError: error.message 
    });
  }
}
