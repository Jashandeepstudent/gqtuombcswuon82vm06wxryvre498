export default async function handler(req, res) {
    // 🔥 CORS FIX
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const apiKey = process.env.GEMINI_KEY;
    
    // Support both GET (for Story Card) and POST (for Time Travel)
    const body = req.body || {};
    const query = req.query || {};
    const task = body.task || query.task;
    const productName = body.productName || query.productName;
    const salesData = body.salesData || [];

    // --- TASK 1: INDIVIDUAL PRODUCT STORY ---
    if (task === "product_story" || (productName && !task)) {
        const storyPrompt = `
            You are an expert Global Supply-Chain & Terroir Specialist.
            For the product "${productName}", generate a high-fidelity data profile:
            1) Origin: Specify a realistic, high-quality geographical sub-region (e.g., "Oaxaca, Mexico" instead of just "Mexico").
            2) Story: Write 2-3 sentences. Do NOT use generic marketing fluff like "global brand" or "finest quality." Focus on specific regional craftsmanship.
            3) Sustainability: A score (1-100).
            Reasoning: Embed the specific environmental impact (carbon footprint of transport + packaging type) within the description.
            Respond ONLY with raw JSON:
            {
              "origin": "Specific Region, Country",
              "description": "The story focusing on regional specificity and a technical justification for the sustainability score.",
              "score": 85
            }`;

        return await callGemini(storyPrompt, apiKey, res, productName);
    }

    // --- TASK 2: TIME TRAVEL PREDICTION ---
    // Matches the "time_travel_prediction" task sent by salarypayer.html
    if (task === "time_travel_prediction" || task === "peak_analytical_prediction") {
        const predictionPrompt = `
            You are the world's most sophisticated Predictive Supply-Chain Analyst.
            DATASET: ${JSON.stringify(salesData)}
            
            TASK: Analyze this shop inventory for a 24-hour cycle.
            1) Calculate expected depletion based on the current stock and sales velocity provided.
            2) For each item, provide a "deepReason" (technical explanation of why it will sell out or stay stable).
            
            Respond ONLY with raw JSON in this format:
            {
              "meta": { "confidence": 0.98 },
              "insights": {
                "PRODUCT_ID": {
                  "predictionFactor": 0.8,
                  "deepReason": "High velocity exceeds current buffer; exhaustion expected at T+18h."
                }
              }
            }`;

        return await callGemini(predictionPrompt, apiKey, res);
    }

    return res.status(400).json({ error: "No valid task or product name provided" });
}

// Helper function to handle the Google API Call
async function callGemini(prompt, apiKey, res, productName = "Item") {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();

        // Safety check for blocked or empty responses
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error("Gemini API Error:", data);
            return res.status(200).json({
                origin: "Global",
                description: `The ${productName} is managed via our global logistics network.`,
                score: 75,
                insights: {}
            });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        // Clean markdown backticks if the AI includes them
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
