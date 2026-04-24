// src/RightAnalyticsPanel.tsx
import { useState, useEffect } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";

interface AggregatedData {
  labels: string[];
  values: number[];
}

const CHART_TYPES = ["bar", "line", "pie"] as const;
type ChartType = (typeof CHART_TYPES)[number];

const RightAnalyticsPanel = () => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("count");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [maxCategories, setMaxCategories] = useState(20);
  const [useLogScale, setUseLogScale] = useState(false);

  // Встроенная функция парсинга CSV (без papaparse)
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj: any = {};
      headers.forEach((header, i) => {
        const raw = values[i]?.trim() ?? "";
        // Пробуем преобразовать в число, иначе оставляем строку
        const num = Number(raw);
        obj[header] = isNaN(num) ? raw : num;
      });
      return obj;
    });
    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/train.csv");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const parsed = parseCSV(csvText);
        // Для MVP берём первые 200 000 строк (можно изменить при необходимости)
        setRawData(parsed.slice(0, 200000));
        if (parsed.length > 0) {
          setXField(Object.keys(parsed[0])[0] || "");
        }
      } catch (error) {
        console.error("Ошибка загрузки train.csv:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columnOptions = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  const numericColumns = columnOptions.filter(
    (col) => typeof rawData[0]?.[col] === "number"
  );

  const aggregatedData: AggregatedData = (() => {
    if (!xField || rawData.length === 0) return { labels: [], values: [] };

    const groupMap = new Map<string, number>();
    const isCount = yField === "count";

    rawData.forEach((row) => {
      const key = String(row[xField] ?? "null");
      const value = isCount ? 1 : Number(row[yField]) || 0;
      groupMap.set(key, (groupMap.get(key) || 0) + value);
    });

    const entries = Array.from(groupMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCategories);

    return {
      labels: entries.map(([label]) => label),
      values: entries.map(([, val]) => val),
    };
  })();

  const chartData = {
    labels: aggregatedData.labels,
    datasets: [
      {
        label: yField === "count" ? "Количество" : yField,
        data: aggregatedData.values,
        backgroundColor: aggregatedData.labels.map((_, i) =>
          chartType === "pie"
            ? `hsl(${(i * 360) / aggregatedData.labels.length}, 70%, 60%)`
            : "#2563EB"
        ),
        borderColor: chartType === "pie" ? "#fff" : "#1D4ED8",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: chartType === "pie" },
    },
    scales:
      chartType === "pie"
        ? {}
        : {
            y: {
              beginAtZero: true,
              type: useLogScale
                ? ("logarithmic" as const)
                : ("linear" as const),
              ticks: { color: "#64748B" },
              grid: { color: "#E2E8F0" },
            },
            x: {
              ticks: {
                color: "#64748B",
                maxRotation: 45,
                minRotation: 0,
                autoSkip: true,
              },
              grid: { display: false },
            },
          },
  };

  return (
    <div className="analytics-panel-content">
      {loading ? (
        <div className="analytics-placeholder">Загрузка данных…</div>
      ) : rawData.length === 0 ? (
        <div className="analytics-placeholder">Нет данных для анализа</div>
      ) : (
        <>
          <div className="chart-large">
            {chartType === "bar" && <Bar data={chartData} options={chartOptions} />}
            {chartType === "line" && <Line data={chartData} options={chartOptions} />}
            {chartType === "pie" && <Pie data={chartData} options={chartOptions} />}
          </div>

          <div className="analytics-settings">
            <div className="setting-group">
              <label>Ось X</label>
              <select value={xField} onChange={(e) => setXField(e.target.value)}>
                {columnOptions.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label>Агрегация</label>
              <select value={yField} onChange={(e) => setYField(e.target.value)}>
                <option value="count">Количество</option>
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    Сумма: {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label>Тип графика</label>
              <div className="chart-type-btns">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`btn-chart-type ${chartType === type ? "active" : ""}`}
                    onClick={() => setChartType(type)}
                  >
                    {type === "bar" ? "📊" : type === "line" ? "📈" : "🥧"}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Макс. категорий: {maxCategories}</label>
              <input
                type="range"
                min={5}
                max={50}
                value={maxCategories}
                onChange={(e) => setMaxCategories(Number(e.target.value))}
              />
            </div>

            {chartType !== "pie" && (
              <div className="setting-group">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={useLogScale}
                    onChange={(e) => setUseLogScale(e.target.checked)}
                  />
                  <span>Логарифмическая шкала</span>
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RightAnalyticsPanel;