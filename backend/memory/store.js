import fs from "fs";

const FILE = "./memory/memory.json";

export function getMemory(userId = "default") {
  const data = JSON.parse(fs.readFileSync(FILE));
  return data[userId] || [];
}

export function saveMemory(userId = "default", text) {
  const data = JSON.parse(fs.readFileSync(FILE));

  if (!data[userId]) data[userId] = [];

  data[userId].push(text);

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}