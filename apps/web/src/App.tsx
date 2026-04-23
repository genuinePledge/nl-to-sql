import { useState } from "react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setMessages([]);

    try {
      console.log("API_URL: ", API_URL);
      const res = await fetch(`${API_URL}generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      console.log("API response:", data);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          NL-to-SQL Chat
        </h1>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question about the data..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {messages.map((msg, idx) => {
            // Skip empty tool responses
            if (!msg.content?.trim()) return null;

            const isHuman = msg.type === "human";
            const isAI = msg.type === "ai";

            return (
              <div
                key={idx}
                className={`flex ${isHuman ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg text-sm ${
                    isHuman
                      ? "bg-blue-600 text-white"
                      : isAI
                        ? "bg-gray-100 text-gray-900 border border-gray-200"
                        : "bg-amber-50 text-gray-900 border border-amber-200"
                  }`}
                >
                  <div className="font-semibold mb-1 text-xs opacity-75">
                    {isHuman ? "You" : isAI ? "AI" : "Tool"}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
