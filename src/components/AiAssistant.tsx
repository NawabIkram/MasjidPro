import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, Loader2 } from "lucide-react";
import { askAssistant } from "../services/api";
import "./AiAssistant.css";

const prompts = [
  "Generate Ramadan fundraising message",
  "Show donation summary for this month",
  "Why did donations decrease this week?",
  "Create Jumuah announcement",
  "Suggest best time to send donation reminder",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesContainer = messagesScrollRef.current;
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, [messages, isGenerating]);

  async function handleSend(promptText: string) {
    const text = promptText.trim();
    if (!text) return;

    setInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      // Pass previous chat history context to the backend assistant.
      const chatContext = messages.map(m => `${m.role === 'user' ? 'Admin' : 'Assistant'}: ${m.text}`).join('\n');
      const fullPrompt = `${chatContext ? `Previous Chat:\n${chatContext}\n\n` : ''}Admin: ${text}\nAssistant:`;

      const responseText = await askAssistant(fullPrompt);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", text: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: `Error: ${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      {!open ? (
        <button className="ai-fab" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <Bot size={20} />
          Ask Masjid AI
        </button>
      ) : null}
      {open ? (
        <div className="ai-panel" id="masjid-ai-panel" role="dialog" aria-labelledby="masjid-ai-title">
          <div className="ai-panel-header">
            <div>
              <span className="eyebrow">MasjidPro Assistant</span>
              <h3 id="masjid-ai-title">Live AI Chat</h3>
            </div>
            <button type="button" className="icon-button" aria-label="Close AI chat" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="ai-messages-scroll" ref={messagesScrollRef}>
            {messages.length === 0 ? (
              <>
                <div className="ai-message">
                  <Sparkles size={16} />
                  <p>
                    I can use backend dashboard data to help with donations, announcements, and giving trends.
                  </p>
                </div>
                <div className="prompt-grid">
                  {prompts.map((prompt) => (
                    <button
                      className="prompt"
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              messages.map(msg => (
                <div className={`ai-chat-message ${msg.role}`} key={msg.id}>
                  {msg.role === 'assistant' ? <Bot size={14} /> : null}
                  <div>{msg.text}</div>
                </div>
              ))
            )}

            {isGenerating && (
              <div className="ai-thinking">
                <Loader2 size={16} className="spin" /> AI is thinking...
              </div>
            )}
          </div>

          <div className="ai-input">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask me anything..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              disabled={isGenerating}
            />
            <button type="button" aria-label="Send prompt" onClick={() => handleSend(input)} disabled={isGenerating || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
