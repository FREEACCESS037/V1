import { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage() {
    if (!input) return;

    setMessages([...messages, { role: "user", text: input }]);

    const res = await axios.post("http://localhost:3001/chat", {
      prompt: input
    });

    setMessages(prev => [
      ...prev,
      { role: "ai", text: res.data.reply }
    ]);

    setInput("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>V1 AI</h2>

      <div style={{ minHeight: 300 }}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.role === "user" ? "You" : "V1"}:</b> {m.text}
          </p>
        ))}
      </div>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;