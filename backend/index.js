import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ================= PATHS =================
const USERS = "./users/users.json";
const CHATS = "./chats/chats.json";

// ================= INIT =================
if (!fs.existsSync("./users")) fs.mkdirSync("./users");
if (!fs.existsSync("./chats")) fs.mkdirSync("./chats");
if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");
if (!fs.existsSync(CHATS)) fs.writeFileSync(CHATS, "{}");

const read = f => JSON.parse(fs.readFileSync(f));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

const cleanName = email =>
  email.split("@")[0].replace(/[0-9]/g, "").replace(/^./, c => c.toUpperCase());

// ================= AI =================
async function askAI(prompt) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt,
      stream: false
    })
  });
  const data = await res.json();
  return data.response;
}

// ================= AUTH =================
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const users = read(USERS);

  if (users[email]) {
    return res.status(400).json({ error: "User already exists" });
  }

  users[email] = {
    name: cleanName(email),
    password,
    credits: 50,
    createdAt: new Date().toISOString()
  };

  write(USERS, users);

  res.json({
    userId: email,
    name: users[email].name,
    credits: users[email].credits
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = read(USERS);

  if (!users[email]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (users[email].password !== password) {
    return res.status(401).json({ error: "Wrong password" });
  }

  res.json({
    userId: email,
    name: users[email].name,
    credits: users[email].credits
  });
});

// ================= CHAT SYSTEM =================
app.post("/new-chat", (req, res) => {
  const { userId } = req.body;
  const chats = read(CHATS);

  if (!chats[userId]) chats[userId] = [];

  const chatId = Date.now().toString();
  chats[userId].push({ chatId, messages: [] });

  write(CHATS, chats);
  res.json({ chatId });
});

app.get("/chats/:userId", (req, res) => {
  const chats = read(CHATS);
  res.json(chats[req.params.userId] || []);
});

app.post("/chat", async (req, res) => {
  const { userId, chatId, prompt } = req.body;

  const users = read(USERS);
  const chats = read(CHATS);

  if (!users[userId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ✅ SOFT CREDIT LIMIT
  if (users[userId].credits <= 0) {
    return res.json({
      type: "credits_exhausted",
      message: "Credits finished"
    });
  }

  // ✅ DEDUCT CREDIT
  users[userId].credits -= 1;
  write(USERS, users);

  const chat = chats[userId]?.find(c => c.chatId === chatId);
  if (!chat) {
    return res.status(400).json({ error: "Chat not found" });
  }

  chat.messages.push({ role: "user", text: prompt });

  const reply = await askAI(prompt);

  chat.messages.push({ role: "ai", text: reply });
  write(CHATS, chats);

  res.json({
    reply,
    creditsLeft: users[userId].credits
  });
});

app.listen(PORT, () => {
  console.log(`✅ V1 backend running at http://localhost:${PORT}`);
});