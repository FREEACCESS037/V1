import express from "express";
import cors from "cors";
import { askAI } from "./llm/ollama.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt missing" });

  const reply = await askAI(prompt);
  res.json({ reply });
});

app.listen(3001, () => {
  console.log("V1 backend running on http://localhost:3001");
});