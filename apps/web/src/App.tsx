import { useState, useRef, useEffect } from "react";
import "./styles/global.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL;

interface Message {
  type: "human" | "ai" | "tool";
  content: string;
  name?: string | null;
}

type Tab = "sql" | "table" | "chart";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string>("Данные по поездкам");
  const [activeTab, setActiveTab] = useState<Tab>("sql");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const leftBgRef = useRef<HTMLDivElement>(null);
  const rightBgRef = useRef<HTMLDivElement>(null);

  // Параллакс-эффект
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const translateY = -scrollTop * 0.25;
      if (leftBgRef.current) leftBgRef.current.style.transform = `translateY(${translateY}px)`;
      if (rightBgRef.current) rightBgRef.current.style.transform = `translateY(${translateY}px)`;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const examples = [
    "Сколько было поездок в прошлом месяце?",
    "Общая стоимость поездок по месяцам года",
    "Количество отказов по времени суток за прошлый месяц",
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleExampleClick = (example: string) => setPrompt(example);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setMessages([]);
    setActiveTab("sql");
    try {
      const res = await fetch(`${API_URL}generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { icon: "👤", label: "Личный кабинет", action: () => alert("Личный кабинет") },
    { icon: "💳", label: "Управление тарифом", action: () => alert("Тарифы") },
    { icon: "📂", label: "Загрузка БД", action: () => alert("Загрузка БД") },
    { icon: "📋", label: "Управление историей", action: () => alert("История запросов") },
    { icon: "🔔", label: "Настройки оповещений", action: () => alert("Оповещения") },
    { icon: "⚙️", label: "Параметры", action: () => alert("Параметры") },
    { icon: "💬", label: "Обратная связь", action: () => alert("Обратная связь") },
  ];

  // -------- Извлечение данных из сообщений --------
  const getLastAiMessage = (): Message | undefined => {
    return [...messages].reverse().find((m) => m.type === "ai");
  };

  const extractSQL = (content: string): string | null => {
    const match = content.match(/```sql\s*([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const extractMarkdownTable = (content: string): { headers: string[]; rows: string[][] } | null => {
    const lines = content.split("\n");
    let tableStart = -1;
    let tableEnd = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\|.*\|$/.test(lines[i].trim())) {
        if (tableStart === -1) tableStart = i;
        tableEnd = i;
      } else if (tableStart !== -1) {
        break;
      }
    }
    if (tableStart === -1) return null;

    const tableLines = lines.slice(tableStart, tableEnd + 1).filter((l) => l.includes("|"));
    if (tableLines.length < 2) return null;

    const headers = tableLines[0]
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);
    const separatorIdx = tableLines.findIndex((l) => /^\|[\s\-:]+\|$/.test(l));
    const dataLines = separatorIdx !== -1 ? tableLines.slice(separatorIdx + 1) : tableLines.slice(1);
    const rows = dataLines.map((line) =>
      line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
    );
    return { headers, rows };
  };

  const sqlQuery = getLastAiMessage() ? extractSQL(getLastAiMessage()!.content) : null;
  const tableData = getLastAiMessage() ? extractMarkdownTable(getLastAiMessage()!.content) : null;

  // Данные для графика (первый столбец – labels, второй – значения)
  const chartData = tableData && tableData.rows.length > 0 && tableData.headers.length >= 2
    ? {
        labels: tableData.rows.map((row) => row[0]),
        datasets: [
          {
            label: tableData.headers[1],
            data: tableData.rows.map((row) => parseFloat(row[1]) || 0),
            backgroundColor: "#2563EB",
            borderRadius: 6,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#64748B" },
        grid: { color: "#E2E8F0" },
      },
      x: {
        ticks: { color: "#64748B" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="app-layout">
      <div className="server-bg server-bg-left" ref={leftBgRef} />
      <div className="server-bg server-bg-right" ref={rightBgRef} />

      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏛️</span>
          <span className="label" style={{ opacity: 0 }}></span>
        </div>
        <ul className="sidebar-nav">
          {sidebarItems.map((item, idx) => (
            <li key={idx} className="sidebar-item" onClick={item.action}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <h1>ИПАВБД</h1>
        </header>

        <div className="messages-container" ref={messagesContainerRef}>
          <div className="messages-wrapper">
            {error && <div className="error-message">{error}</div>}

            {messages.length > 0 && (
              <div className="results-panel">
                <div className="tab-header">
                  <button
                    className={`btn-secondary ${activeTab === "sql" ? "active" : ""}`}
                    onClick={() => setActiveTab("sql")}
                  >
                    📝 SQL
                  </button>
                  <button
                    className={`btn-secondary ${activeTab === "table" ? "active" : ""}`}
                    onClick={() => setActiveTab("table")}
                  >
                    📊 Таблица
                  </button>
                  <button
                    className={`btn-secondary ${activeTab === "chart" ? "active" : ""}`}
                    onClick={() => setActiveTab("chart")}
                  >
                    📈 Визуализация
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === "sql" && sqlQuery && (
                    <div className="code-block">{sqlQuery}</div>
                  )}
                  {activeTab === "sql" && !sqlQuery && (
                    <p style={{ color: "var(--text-secondary)" }}>SQL‑запрос не найден в ответе</p>
                  )}
                  {activeTab === "table" && tableData && (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {tableData.headers.map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {activeTab === "table" && !tableData && (
                    <p style={{ color: "var(--text-secondary)" }}>Таблица не обнаружена в ответе</p>
                  )}
                  {activeTab === "chart" && chartData && (
                    <div className="chart-container">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  )}
                  {activeTab === "chart" && !chartData && (
                    <p style={{ color: "var(--text-secondary)" }}>
                      Недостаточно данных для построения графика
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Исходные сообщения чата для полного контекста */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((msg, idx) => {
                if (!msg.content?.trim()) return null;
                const isHuman = msg.type === "human";
                const isAI = msg.type === "ai";
                const isCode = isAI && msg.content.includes("```sql");
                return (
                  <div key={idx} className={`message-row ${msg.type}`}>
                    <div className={`message-bubble ${isCode ? "code-block" : ""}`}>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.8rem", opacity: 0.7 }}>
                        {isHuman ? "Вы" : isAI ? "AI" : "Инструмент"}
                      </div>
                      <div className="whitespace-pre-wrap">
                        {isCode ? <code>{msg.content}</code> : msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="input-area">
          <div className="nlp-input-container">
            <div className="input-field">
              <div className="data-source-chip">
                <span>🗄️</span>
                <select value={selectedDb} onChange={(e) => setSelectedDb(e.target.value)}>
                  <option>Данные по поездкам</option>
                  <option>Данные по сессиям</option>
                  <option>Данные по автомобилям</option>
                </select>
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Опишите, какие данные вам нужны…"
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
              />
              <button
                onClick={handleSubmit}
                className="send-button"
                disabled={loading || !prompt.trim()}
                aria-label="Отправить"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
            <div className="hint-examples">
              {examples.map((ex, idx) => (
                <button key={idx} onClick={() => handleExampleClick(ex)}>{ex}</button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="cube-loader"></div>
            <p style={{ color: "var(--text-secondary)" }}>AI обрабатывает запрос…</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;