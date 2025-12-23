import express from "express";
import dotenv from "dotenv";
import { parseCommand } from "./openai.js";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/ai", async (req, res) => {
  const result = await parseCommand(req.body.text);
  res.json(result);
});

app.listen(3000);
