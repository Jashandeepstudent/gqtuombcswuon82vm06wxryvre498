export default async function handler(req, res) {
  // 1. Handle pre-flight requests (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    const KEY = process.env.GEMINI_KEY;

    // Use Gemini 1.5 Flash (it is the most stable version right now)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Identify items in image. Return ONLY a JSON array: [{\"name\": \"item\", \"qty\": 5}]" },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Crash details:", error);
    return res.status(500).json({ error: "Server crashed", details: error.message });
  }
}
