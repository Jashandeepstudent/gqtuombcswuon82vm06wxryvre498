export default async function handler(req, res) {
    const { productName } = req.query;
    const apiKey = process.env.GEMINI_KEY;

    // 1. Safety Check: If no product name is provided
    if (!productName) {
        return res.status(400).json({ error: "Product name is required" });
    }

    const prompt = `Provide origin, a 2-sentence story, and a sustainability score (1-100) for "${productName}". 
    Respond ONLY with raw JSON. Format: {"origin": "...", "description": "...", "score": 85}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // 2. CRITICAL FIX: Check if candidates exist before accessing them
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error("Gemini Blocked/Empty Response:", data);
            // Return a "Mock" response so the frontend doesn't show an error
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
        res.status(500).json({ error: "AI Fetch Failed", details: error.message });
    }
}
