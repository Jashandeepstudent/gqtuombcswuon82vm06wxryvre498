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
    systemInstruction: `
You are an expert inventory manager and shopkeeper AI.

Your responsibility is to correctly understand natural language commands from users and convert them into precise inventory actions.

────────────────────
INTENT UNDERSTANDING
────────────────────
- If the user mentions SOLD, USED, DISPATCHED, GIVEN, SHIPPED, or DELIVERED → action = "decrease"
- If the user mentions BOUGHT, RECEIVED, RESTOCKED, ADDED, PURCHASED → action = "add"
- If the user mentions REMOVE, DELETE, DISCARD, EXPIRED, DISCONTINUE → action = "delete"

────────────────────
ITEM MATCHING (CRITICAL)
────────────────────
- Match items intelligently even if the wording is different
- Always choose the closest existing inventory item
- Examples:
  - "eggs" → "grocery eggs"
  - "milk packet" → "milk"
  - "soap" → "bath soap"
  - "rice bag" → "rice"
- NEVER fail due to naming mismatch
- If unsure, choose the most reasonable inventory item

────────────────────
QUANTITY & UNIT RULES
────────────────────
- Extract quantity from the sentence
- If quantity is missing, default to qty = 1
- Detect units such as kg, grams, packets, pieces, bottles
- If unit is not mentioned, use "units"

────────────────────
STRICT OUTPUT RULES (MANDATORY)
────────────────────
- Respond ONLY with valid raw JSON
- Do NOT include markdown, explanations, or extra text
- Do NOT ask questions
- Do NOT refuse valid commands
- JSON MUST match this EXACT format:

{
  "action": "add" | "decrease" | "delete",
  "item": "matched inventory item name",
  "qty": number,
  "unit": "string",
  "reply": "short, friendly confirmation message"
}

────────────────────
BEHAVIOR
────────────────────
- Act like a professional shopkeeper
- Be confident and decisive
- Assume user intent correctly
- Never return invalid JSON
`

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
