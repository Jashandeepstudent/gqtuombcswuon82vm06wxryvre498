export default async function handler(req, res) {

    // 🔥 CORS FIX — ADD THESE LINES
    res.setHeader("Access-Control-Allow-Origin", "*"); // or https://upscalevest.site
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // 🔥 CORS FIX — HANDLE PREFLIGHT
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { productName } = req.query;
    const apiKey = process.env.GEMINI_KEY;

    // 1. Safety Check: If no product name is provided
    if (!productName) {
        return res.status(400).json({ error: "Product name is required" });
    }

const prompt = `
You are an AI supply-chain analyst.

For the product "${productName}", generate:
1) A realistic sourcing origin
2) A short, engaging 2–3 sentence product story (quality, usage, sourcing)
3) A sustainability score from 1–100 based on sourcing, materials, and environmental impact

IMPORTANT:
- Explain the reasoning behind the sustainability score inside the description text
- Keep the tone professional and premium
- Respond ONLY with raw JSON (no markdown, no extra text)

JSON format:
{
  "origin": "Country / Region",
  "description": "2–3 sentence story including why the sustainability score makes sense",
  "score": 75
}
`;


    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();

        // 2. CRITICAL FIX: Check if candidates exist before accessing them
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error("Gemini Blocked/Empty Response:", data);
            return res.status(200).json({
                origin: "Global",
                description: `The ${productName} is a high-quality item sourced from sustainable global partners.`,
                score: 75
            });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonString = rawText.replace(/```json|```/g, "").trim();

        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({
            error: "AI Fetch Failed",
            details: error.message
        });
    }
}
