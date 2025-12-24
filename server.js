import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// Voice Command Parsing Endpoint
// ============================
app.post("/api/parse-voice", async (req, res) => {
  const { command } = req.body;

  if (!command || command.trim().length === 0) {
    return res.status(400).json({ error: "No command provided" });
  }

  try {
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an assistant that converts any spoken language command (English/Hindi/Hinglish) into a structured inventory action."
          },
          {
            role: "user",
            content: `Command: "${command}". Return JSON like {"action":"add|increase|decrease|remove","name":"product name","quantity":number}. Only JSON. No extra text.`
          }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
   const choices = data.choices;
if (!choices || choices.length === 0 || !choices[0].message) {
  return res.status(500).json({ error: "No valid response from OpenAI" });
}
const text = choices[0].message.content;


    let parsed = { action: null, name: null, quantity: 1 };

    try {
      // Clean up response and parse
      const cleaned = text.trim().replace(/\n/g, "");
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback regex parsing if JSON is slightly malformed
      const actionMatch = text.match(/"action"\s*:\s*"(\w+)"/);
      const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
      const qtyMatch = text.match(/"quantity"\s*:\s*(\d+)/);

      parsed = {
        action: actionMatch ? actionMatch[1] : null,
        name: nameMatch ? nameMatch[1] : null,
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1
      };
    }

    return res.json(parsed);

  } catch (err) {
    console.error("Error parsing voice command:", err);
    return res.status(500).json({ error: "OpenAI API error" });
  }
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
