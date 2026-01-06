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
        2026 Global Food Trend Analyst.
        
        # 2026 MARKET DATA (PRIORITIZE)
        1. Angel Hair Chocolate: Turkish cotton candy (pişmaniye) filling (+3,900% growth).
        2. Swicy Mango Biscuits: Chili-lime and mango flavor mashups (Mexican Chamoy style).
        3. Fiber-Forward Prebiotic Ice Cream: High-fiber, gut-health treats (e.g., Oat/Chicory based).
        4. Ube Matcha Tiramisu: The "Purple & Green" aesthetic trend on Shorts.
        5. Freeze-Dried "Space" Snacks: Crunchy freeze-dried cheesecake and fruit bites.

        # TASK
        Return a JSON array of 3 DIFFERENT items from the list above.
        Randomize the order so every refresh feels different.
        
        # FORMAT
        [
          {"name": "Ube Matcha Tiramisu", "growth": "+145%", "type": "Aesthetic King"},
          {"name": "Chili-Mango Biscuits", "growth": "+88%", "type": "Swicy Trend"},
          {"name": "Prebiotic Gelato", "growth": "+120%", "type": "Fibermaxxing"}
        ]
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
