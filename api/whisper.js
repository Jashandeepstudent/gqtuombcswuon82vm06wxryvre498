import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    const audioFile = files.file;
    const audioStream = fs.createReadStream(audioFile.filepath);

    try {
      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: (() => {
          const fd = new FormData();
          fd.append("file", audioStream);
          fd.append("model", "whisper-1");
          return fd;
        })()
      });

      const result = await whisperRes.json();
      res.status(200).json({ text: result.text });

    } catch (e) {
      res.status(500).json({ error: "Whisper failed" });
    }
  });
}
