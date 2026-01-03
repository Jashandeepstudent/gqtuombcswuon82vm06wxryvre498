export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    const KEY = process.env.GEMINI_KEY;

    // THE "OP" PROMPT UPGRADE
    const systemInstruction = `
      You are an expert industrial inventory scanner specialized in SKU-level accuracy. 
      
      TASK: 
      1. IDENTIFY BY BRAND & VARIANT: Always prioritize the Company/Brand name and the specific product line. 
         - Example: Instead of "Yellow Scale", use "Doms Scale". 
         - Example: Instead of "Chocolate Biscuit", use "Oreo Chocolate Flavor".
      2. GROUPING LOGIC: If items are functionally identical and share the same Brand/Model (e.g., two Doms Scales of different colors), group them under the Brand name unless the color represents a distinct SKU/Flavor.
      3. BE SPECIFIC: Identify Content + Brand + Variant. Never use generic nouns.
         - Correct: "Oreo Strawberry Flavor", "Doms 15cm Ruler", "Coca-Cola Zero Sugar".
         - Incorrect: "Biscuits", "Scale", "Soda".
      4. IGNORE: Background elements, fixtures, people, or non-inventory furniture.
      5. QUANTITY: Count distinct units accurately.

      OUTPUT: Return ONLY a valid JSON array. No conversational text.
      FORMAT: [{"name": "Brand + Product + Flavor/Model", "qty": Integer}]
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemInstruction },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
