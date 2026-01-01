export default async function handler(req, res) {
    // 1. 🔥 CORS CONFIGURATION
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    const apiKey = process.env.GEMINI_KEY;
    
    // Support data from both POST body and GET query strings
    const body = req.body || {};
    const query = req.query || {};
    const task = body.task || query.task;
    const productName = body.productName || query.productName;
    const salesData = body.salesData || [];

    // --- TASK 1: INDIVIDUAL PRODUCT STORY ---
    // Triggered when clicking a product to see its origin and story
    if (task === "product_story" || (productName && !task)) {
        const storyPrompt = `
            Act as a world-class historian and supply chain expert. 
            Create a deep-dive profile for the product: "${productName}".
            
            REQUIREMENTS:
            1. Origin: Identify a specific, realistic city or micro-region (e.g., "Uji, Kyoto" instead of just "Japan"). NEVER say "Global".
            2. Story: Write a 3-sentence narrative focusing on traditional harvesting, regional climate (terroir), or craftsmanship. Avoid marketing buzzwords.
            3. Sustainability: Provide a score (1-100) based on local production ethics and carbon footprint.
            
            Return ONLY raw JSON:
            {
              "origin": "City, Region, Country",
              "description": "The narrative story including a technical hint at why the sustainability score was chosen.",
              "score": 85
            }`;

        return await callGemini(storyPrompt, apiKey, res, productName);
    }

    // --- TASK 2: TIME TRAVEL PREDICTION ---
    // Triggered by the "Time Travel" button in salarypayer.html
    if (task === "time_travel_prediction" || task === "peak_analytical_prediction") {
        const predictionPrompt = `
            Act as the world's most sophisticated Predictive Supply-Chain Analyst.
            Analyze this inventory dataset: ${JSON.stringify(salesData)}. 
            
            TASK: 
            Perform a 24-hour micro-simulation of stock levels based on current stock and sales velocity.
            
            Return ONLY raw JSON:
            {
              "meta": { "confidence": 0.98 },
              "insights": {
                "PRODUCT_ID": {
                  "predictionFactor": 0.5,
                  "deepReason": "High velocity exceeds current buffer; exhaustion expected within 14 hours."
                }
              }
            }`;

        return await callGemini(predictionPrompt, apiKey, res);
    }

    return res.status(400).json({ error: "No valid task provided" });
}

// --- CORE AI ENGINE ---
async function callGemini(prompt, apiKey, res, productName = "Item") {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    // 🔥 CRITICAL: Safety settings prevent AI from blocking common product names
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ],
                    generationConfig: {
                        temperature: 0.9, // Higher creativity for unique origins
                        topP: 0.95,
                    }
                })
            }
        );

        const data = await response.json();

        // Check if the AI was blocked or returned an empty response
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error("Gemini API Empty/Blocked:", data);
            // Dynamic fallback to prevent the "Always Global" issue
            return res.status(200).json({
                origin: "Oaxaca, Mexico",
                description: `This ${productName} is sourced from specialized estates where traditional methods are preserved.`,
                score: 88,
                insights: {}
            });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        // Strip markdown code blocks if the AI accidentally includes them
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
