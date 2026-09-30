"use client";

import { useCallback, useRef, useState } from "react";

export type Message = { role: "user" | "assistant"; content: string };

/** Shared chat state + streaming logic used by every UI variation. */
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || abortRef.current) return;

    const history: Message[] = [...messagesRef.current, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "The request failed.");
      setDemo(res.headers.get("X-Demo") === "1");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setMessages([...history, { role: "assistant", content: reply || "_Stopped._" }]);
      } else {
        const msg = err instanceof Error && err.message ? err.message : "The request failed.";
        setMessages([...history, { role: "assistant", content: `_${msg} Try sending it again._` }]);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, loading, demo, send, stop, reset };
}
