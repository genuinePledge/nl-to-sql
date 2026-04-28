import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { type ReactNode } from "react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const RuntimeAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const result = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal,
    });

    if (!result.ok) {
      throw new Error("Failed to fetch response");
    }

    const data = await result.json();
    return {
      content: [
        {
          type: "text",
          text: data.text,
        },
      ],
    };
  },
};

export const RuntimeProvider = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  const runtime = useLocalRuntime(RuntimeAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
