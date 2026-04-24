import { useState, useRef, useEffect, type JSX } from "react";
import "./styles/global.css";
import { Bar } from "react-chartjs-2";
import RightAnalyticsPanel from "./RightAnalyticsPanel";

// app.tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,      // + новый
  PointElement,     // + новый
  ArcElement,       // + новый
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = import.meta.env.VITE_API_URL;

interface Message {
  type: "human" | "ai" | "tool";
  content: string;
  name?: string | null;
}

type Tab = "sql" | "table" | "chart";
type PageName = "home" | "profile" | "tariff" | "upload" | "history" | "notifications" | "settings" | "feedback";
type PageNameExcludingHome = Exclude<PageName, 'home'>;

function App() {
  const [activePage, setActivePage] = useState<PageName>('home');
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

  const sidebarItems: { icon: string; label: string; page: PageName }[] = [
    { icon: "👤", label: "Личный кабинет",      page: "profile" },
    { icon: "💳", label: "Управление тарифом",   page: "tariff" },
    { icon: "📂", label: "Загрузка БД",          page: "upload" },
    { icon: "📋", label: "Управление историей",  page: "history" },
    { icon: "🔔", label: "Настройки оповещений", page: "notifications" },
    { icon: "⚙️", label: "Параметры",            page: "settings" },
    { icon: "💬", label: "Обратная связь",       page: "feedback" },
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

  // ---------- СОДЕРЖИМОЕ СТРАНИЦ ----------
  const pageContent: Record<PageNameExcludingHome, JSX.Element> = {
    profile: (
      <div className="page-container profile-page">
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <h2>Иван Иванов</h2>
          <p className="profile-email">ivan@example.com</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">12</span>
              <span className="stat-label">запросов</span>
            </div>
            <div className="stat">
              <span className="stat-value">Премиум</span>
              <span className="stat-label">тариф</span>
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn-secondary">Редактировать профиль</button>
            <button className="btn-secondary">Сменить пароль</button>
            <button className="btn-secondary btn-danger">Выйти</button>
          </div>
        </div>
      </div>
    ),
    tariff: (
      <div className="page-container tariff-page">
        <div className="tariff-card">
          <h2>💳 Управление тарифом</h2>
          <div className="tariff-current">
            <p>Ваш тариф: <strong>Премиум</strong></p>
            <p>Действует до: 31.12.2026</p>
          </div>
          <div className="tariff-actions">
            <button className="btn-secondary">Сменить тариф</button>
            <button className="btn-secondary">История платежей</button>
          </div>
        </div>
      </div>
    ),
    upload: (
      <div className="page-container upload-page">
        <div className="upload-card">
          <h2>📂 Загрузка базы данных</h2>
          <p>Выберите файл в формате CSV или SQL</p>
          <div className="upload-area">
            <input type="file" accept=".csv,.sql" />
            <button className="btn-secondary">Загрузить</button>
          </div>
          <p className="upload-hint">Максимальный размер: 50 ГБ</p>
        </div>
      </div>
    ),
    history: (
      <div className="page-container history-page">
        <div className="history-card">
          <h2>📋 История запросов</h2>
          <div className="history-list">
            <div className="history-item">
              <span>Сколько поездок в марте?</span>
              <button className="btn-secondary btn-sm">Повторить</button>
            </div>
            <div className="history-item">
              <span>Средняя стоимость поездок по дням</span>
              <button className="btn-secondary btn-sm">Повторить</button>
            </div>
            <div className="history-item">
              <span>Топ-5 водителей по числу поездок</span>
              <button className="btn-secondary btn-sm">Повторить</button>
            </div>
          </div>
          <button className="btn-secondary">Очистить историю</button>
        </div>
      </div>
    ),
    notifications: (
      <div className="page-container notifications-page">
        <div className="notifications-card">
          <h2>🔔 Настройки оповещений</h2>
          <div className="notifications-list">
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span>Email-уведомления о завершении генерации</span>
            </label>
            <label className="switch">
              <input type="checkbox" />
              <span>Push-уведомления в браузере</span>
            </label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span>Еженедельная сводка</span>
            </label>
          </div>
          <button className="btn-secondary">Сохранить настройки</button>
        </div>
      </div>
    ),
    settings: (
      <div className="page-container settings-page">
        <div className="settings-card">
          <h2>⚙️ Параметры</h2>
          <div className="settings-group">
            <label>Язык интерфейса</label>
            <select defaultValue="ru">
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="settings-group">
            <label>Тема оформления</label>
            <select defaultValue="light">
              <option value="light">Светлая</option>
              <option value="dark">Тёмная (скоро)</option>
            </select>
          </div>
          <button className="btn-secondary">Сохранить изменения</button>
        </div>
      </div>
    ),
    feedback: (
      <div className="page-container feedback-page">
        <div className="feedback-card">
          <h2>💬 Обратная связь</h2>
          <form className="feedback-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Ваше имя" />
            <input type="email" placeholder="Email" />
            <textarea placeholder="Опишите проблему или предложение" rows={4}></textarea>
            <button className="btn-secondary" type="submit">Отправить</button>
          </form>
        </div>
      </div>
    )
  };

  return (
    <div className="app-layout">
      <div className="server-bg server-bg-left" ref={leftBgRef} />
      <div className="server-bg server-bg-right" ref={rightBgRef} />

      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => setActivePage('home')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon" style={{ marginRight: '10px' }}>🏛️</span>
          <span className="label">Главная</span>
        </div>

        <ul className="sidebar-nav">
          {sidebarItems.map((item, idx) => (
            <li
              key={idx}
              className={`sidebar-item ${activePage === item.page ? 'active' : ''}`}
              onClick={() => setActivePage(item.page)}
            >
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
        {activePage === 'home' ? (
          <>
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
          </>
        ) : (
          <div className="page-container">{pageContent[activePage]}</div>
        )}
      </main>
<aside className="sidebar-right">
  <RightAnalyticsPanel />
</aside>
    </div>
  );
}

export default App;