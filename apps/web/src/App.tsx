import { useState, useRef, useEffect } from "react";
import "./styles/global.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Message {
  type: "human" | "ai" | "tool";
  content: string;
  name?: string | null;
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDb, setSelectedDb] = useState<string>("Данные по поездкам");

  const examples = [
    "Сколько было поездок в прошлом месяце?",
    "Общая итоговая стоимость по месяцам этого года",
    "Количество отказов по времени суток за прошлый месяц",
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setMessages([]);

    try {
      const res = await fetch(`${API_URL}generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleHistory = () => alert("История пока не реализована");
  const handleVisualization = () => alert("Визуализация пока не реализована");
  const handleAlerts = () => alert("Оповещения пока не реализована");

  return (
    <div className="relative min-h-screen flex flex-col h-screen">
      {/* Фоновые пятна */}
      <div className="bg-blur-spot-left"></div>
      <div className="bg-blur-spot-right"></div>

      {/* Верхняя панель (оставлена для навигации) */}
      <header className="relative z-10 px-4 py-3 flex items-center justify-between max-w-4xl mx-auto w-full">
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
          className="text-xl font-bold"
        >
          ИПАВБД
        </h1>
        <div className="top-actions">
          <button onClick={handleHistory} className="btn-secondary">
            Посмотреть историю
          </button>
          <button onClick={handleVisualization} className="btn-secondary">
            Настроить визуализацию
          </button>
          <button onClick={handleAlerts} className="btn-secondary">
            Настроить оповещения
          </button>
        </div>
      </header>

      {/* Область сообщений – растягивается, прокручивается */}
      <div className="messages-container flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto w-full">
          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Вывод сообщений если есть */}
          {messages.length > 0 && (
            <div className="results-panel">
              <div className="tab-header">
                <button className="btn-secondary active">📝 SQL</button>
                <button className="btn-secondary">📊 Таблица</button>
                <button className="btn-secondary">📈 Визуализация</button>
              </div>

              <div className="space-y-4">
                {messages.map((msg, idx) => {
                  if (!msg.content?.trim()) return null;
                  const isHuman = msg.type === "human";
                  const isAI = msg.type === "ai";
                  const isCode = isAI && msg.content.includes("SELECT");

                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isHuman ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-lg text-sm ${
                          isHuman
                            ? "bg-blue-600 text-white"
                            : isAI
                            ? isCode
                              ? "code-block w-full"
                              : "bg-gray-800 text-gray-100 border border-gray-700"
                            : "bg-amber-900/20 text-amber-200 border border-amber-500/30"
                        }`}
                      >
                        <div className="font-semibold mb-1 text-xs opacity-75">
                          {isHuman ? "You" : isAI ? "AI" : "Tool"}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {isCode ? (
                            <code>{msg.content}</code>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Якорь для автопрокрутки */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Панель ввода – прижата к низу */}
      <div className="input-area relative z-10 px-4 pb-6 pt-2 bg-gradient-to-t from-bg-deep via-bg-deep/80 to-transparent">
        <div className="nlp-input-container">
          <div className="input-field">
            <div className="data-source-chip">
              <span>🗄️</span>
              <select
                value={selectedDb}
                onChange={(e) => setSelectedDb(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  fontSize: "0.875rem",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                }}
              >
                <option>Данные по поездкам</option>
                <option>Данные по сессиям</option>
                <option>Данные по автомобилям</option>
              </select>
            </div>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="✦ Опишите, какие данные вам нужны…"
              disabled={loading}
            />

            <button
              onClick={handleSubmit}
              className="send-button"
              disabled={loading || !prompt.trim()}
              aria-label="Отправить запрос"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          <div className="hint-examples">
            {examples.map((example, idx) => (
              <button key={idx} onClick={() => handleExampleClick(example)}>
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Загрузочный оверлей */}
      {loading && (
        <div className="loading-overlay">
          <div className="cube-loader"></div>
          <p style={{ color: "var(--text-secondary)" }}>
            AI обрабатывает запрос…
          </p>
        </div>
      )}
    </div>
  );
}

export default App;