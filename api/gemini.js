import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Standard CORS and Method Checks
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { prompt } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            // FORCE JSON output using Generation Config (Best Practice)
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: `
        # ROLE
        ScaleVest Elite CFO Market Analyst (January 2026).
        
        # 2026 VIRAL DATA (PRIORITIZE)
        - Angel Hair Chocolate: Turkish cotton candy center, viral on Shorts (+3900% growth).
        - Ube/Purple Yam: Purple lattes, mochi, and ice cream "swirls".
        - Pistachio "Dubai" Evolution: Now moving into high-protein bars and matcha hybrids.
        - Mochi-Donut Mashups: Chewy textures and "pull-apart" snacks.

        # TASK
        Return ONLY a raw JSON array of the top 3 high-velocity edible items.
        Use EXACT keys: "name", "growth", "type".
        
        # FORMAT
        [{"name": "Angel Hair Chocolate", "growth": "+3900%", "type": "Viral Breakout"}]
    `
});

        let responseText = result.response.text();
        
        // 2. SAFETY: Strip backticks if the model ignored the instruction
        const cleanJsonString = responseText.replace(/```json|```/g, "").trim();
        let parsedData = JSON.parse(cleanJsonString);

        // 3. MAP FIX: Ensure we are sending an array, even if the AI returned an object
        const finalArray = Array.isArray(parsedData) ? parsedData : (parsedData.trends || [parsedData]);

        res.status(200).json(finalArray);

    } catch (error) {
        console.error("CFO API Error:", error);
        res.status(500).json({ error: "Analysis Failed", details: error.message });
    }
}
