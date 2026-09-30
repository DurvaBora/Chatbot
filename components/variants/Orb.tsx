"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useChat } from "@/lib/useChat";
import type { BotConfig } from "@/lib/config";
import StreamText from "@/components/StreamText";
import { DemoTag } from "@/components/VariantSwitcher";
import s from "./Orb.module.css";

type OrbState = "idle" | "thinking" | "speaking";

function LivingOrb({ state, size }: { state: OrbState; size: "lg" | "sm" }) {
  return (
    <div className={`${s.orb} ${s[state]} ${size === "sm" ? s.orbSm : ""}`} aria-hidden>
      <span className={s.ring} />
      <span className={s.ring} />
      <span className={s.blobA} />
      <span className={s.blobB} />
      <span className={s.blobC} />
      <span className={s.core} />
    </div>
  );
}

export default function Orb({ config }: { config: BotConfig }) {
  const { messages, loading, demo, send, stop, reset } = useChat();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const empty = messages.length === 0;
  const lastQ = [...messages].reverse().find((m) => m.role === "user");
  const lastA = messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1] : undefined;
  const state: OrbState = loading ? (lastA?.content ? "speaking" : "thinking") : "idle";
  const pairs = Math.floor(messages.length / 2);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHistoryOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    send(text);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className={s.page}>
      <div className={s.stars} aria-hidden />

      <header className={s.topbar}>
        <span className={s.brand}>
          <span className={s.dot} data-state={state} />
          {config.name}
          <span className={s.status}>
            {state === "thinking" ? "is thinking" : state === "speaking" ? "is answering" : "is here"}
          </span>
        </span>
        <DemoTag show={demo} />
        {pairs > 1 && (
          <button className={s.chipBtn} onClick={() => setHistoryOpen(true)}>
            Earlier ({pairs - 1})
          </button>
        )}
        {!empty && (
          <button className={s.chipBtn} onClick={reset}>
            New chat
          </button>
        )}
      </header>

      <main className={`${s.stage} ${empty ? s.stageEmpty : ""}`}>
        <LivingOrb state={state} size={empty ? "lg" : "sm"} />

        <AnimatePresence mode="wait">
          {empty ? (
            <motion.section
              key="intro"
              className={s.intro}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h1 className={s.headline}>{config.headline}</h1>
              <p className={s.subline}>{config.subline}</p>
              <div className={s.prompts}>
                {config.suggestions.map((q, i) => (
                  <motion.button
                    key={q}
                    className={s.prompt}
                    onClick={() => submit(q)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key={`turn-${messages.length}`}
              className={s.turn}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              aria-live="polite"
            >
              <p className={s.askedLabel}>You asked</p>
              <p className={s.asked}>{lastQ?.content}</p>
              <div className={s.answer}>
                {lastA?.content ? (
                  <StreamText text={lastA.content} wordClass={s.word} />
                ) : (
                  <span className={s.shimmer}>Thinking it through</span>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <form
        className={s.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={empty ? `Ask ${config.name} anything` : "Ask a follow-up"}
          maxLength={2000}
          aria-label="Your question"
          autoFocus
        />
        {loading ? (
          <button type="button" className={`${s.send} ${s.stop}`} onClick={stop} aria-label="Stop answering">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect width="12" height="12" rx="3" fill="currentColor" /></svg>
          </button>
        ) : (
          <button type="submit" className={s.send} disabled={!input.trim()} aria-label="Send question">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M3 9h11M10 4.5L14.5 9 10 13.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </form>

      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              className={s.scrim}
              onClick={() => setHistoryOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className={s.drawer}
              role="dialog"
              aria-label="Earlier in this chat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
            >
              <div className={s.drawerHead}>
                <h2>Earlier in this chat</h2>
                <button className={s.chipBtn} onClick={() => setHistoryOpen(false)} autoFocus>
                  Close
                </button>
              </div>
              <ol className={s.history}>
                {messages.slice(0, -2).map((m, i) => (
                  <li key={i} className={m.role === "user" ? s.hQ : s.hA}>
                    {m.content}
                  </li>
                ))}
              </ol>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
