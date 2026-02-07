import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://v1-6kg2.onrender.com";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("v1_user"))
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const [chats, setChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(0);

  // ================= LOAD CHATS =================
  useEffect(() => {
    if (user) {
      setCredits(user.credits);
      loadChats();
    }
  }, [user]);

  async function loadChats() {
    const res = await axios.get(`${API}/chats/${user.userId}`);
    setChats(res.data);
  }

  // ================= AUTH =================
  async function submitAuth() {
    setError("");
    try {
      if (isRegister) {
        await axios.post(`${API}/register`, { email, password });
      }

      const res = await axios.post(`${API}/login`, { email, password });
      localStorage.setItem("v1_user", JSON.stringify(res.data));
      setUser(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Error");
    }
  }

  function logout() {
    localStorage.removeItem("v1_user");
    setUser(null);
    setMessages([]);
    setChatId(null);
  }

  // ================= CHAT =================
  async function newChat() {
    const res = await axios.post(`${API}/new-chat`, {
      userId: user.userId
    });

    setChatId(res.data.chatId);
    setMessages([]);
    loadChats();
  }

  async function send() {
    if (!input || !chatId) return;

    const userText = input;
    setMessages(m => [...m, { role: "user", text: userText }]);
    setInput("");

    const res = await axios.post(`${API}/chat`, {
      userId: user.userId,
      chatId,
      prompt: userText
    });

    if (res.data.type === "credits_exhausted") {
      alert(
        "🚫 Credits finished.\n\n👉 Buy credits or share V1 to earn more."
      );
      return;
    }

    setMessages(m => [...m, { role: "ai", text: res.data.reply }]);
    setCredits(res.data.creditsLeft);
  }

  // ================= LOGIN UI =================
  if (!user) {
    return (
      <div className="center">
        <div className="card">
          <h2>{isRegister ? "Register" : "Login"} to V1</h2>

          {error && <div className="error">{error}</div>}

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button onClick={submitAuth}>
            {isRegister ? "Register" : "Login"}
          </button>

          <div className="toggle" onClick={() => setIsRegister(!isRegister)}>
            {isRegister
              ? "Already have an account? Login"
              : "New user? Register"}
          </div>
        </div>
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div className="app">
      <aside>
        <h3>Chats</h3>
        <button onClick={newChat}>+ New Chat</button>

        {chats.map(c => (
          <div
            key={c.chatId}
            onClick={() => {
              setChatId(c.chatId);
              setMessages(c.messages);
            }}
          >
            Chat {c.chatId.slice(-4)}
          </div>
        ))}

        <p>Credits: {credits}</p>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main>
        <div className="chat-box">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <b>{m.role === "user" ? "You" : "V1"}:</b> {m.text}
            </div>
          ))}
        </div>

        <input
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </main>
    </div>
  );
}

export default App;