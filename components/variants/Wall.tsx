"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useChat } from "@/lib/useChat";
import type { BotConfig } from "@/lib/config";
import StreamText from "@/components/StreamText";
import { DemoTag } from "@/components/VariantSwitcher";
import s from "./Wall.module.css";

const TILTS = [-2.5, 1.8, -1.2, 2.6, -0.6, 1.2];
const ANSWER_COLORS = ["#ff9fc6", "#8fd3ff", "#9eebb8", "#c9b5ff"];

const tilt = (i: number) => TILTS[i % TILTS.length];

function Arrow() {
  return (
    <svg className={s.arrow} viewBox="0 0 80 40" aria-hidden>
      <path className={s.arrowLine} d="M4 26 C 22 6, 48 6, 70 20" />
      <path className={s.arrowHead} d="M60 12 L71 20 L59 26" />
    </svg>
  );
}

export default function Wall({ config }: { config: BotConfig }) {
  const { messages, loading, demo, send, stop, reset } = useChat();
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = (text: string, fromSuggestion = false) => {
    if (!text.trim() || loading) return;
    setPicked(fromSuggestion ? text : null);
    send(text);
    setInput("");
    inputRef.current?.focus();
  };

  // Group messages into question → answer rows.
  const rows: { q: string; a?: string; i: number }[] = [];
  messages.forEach((m, i) => {
    if (m.role === "user") rows.push({ q: m.content, i: rows.length });
    else if (rows.length) rows[rows.length - 1].a = m.content;
  });

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <span className={s.boardName}>{config.name}&rsquo;s board</span>
        <DemoTag show={demo} />
        {!empty && (
          <button className={s.clear} onClick={reset}>
            Clear board
          </button>
        )}
      </header>

      <LayoutGroup>
        <main className={s.board}>
          <AnimatePresence mode="popLayout">
            {empty ? (
              <motion.section
                key="intro"
                className={s.intro}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <motion.h1
                  className={s.headline}
                  initial={{ opacity: 0, rotate: -4, y: 10 }}
                  animate={{ opacity: 1, rotate: -2, y: 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                >
                  {config.headline}
                  <svg className={s.underline} viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
                    <path d="M4 14 C 80 4, 180 4, 296 12" />
                  </svg>
                </motion.h1>
                <p className={s.subline}>{config.subline} Pick a note or write your own.</p>
                <div className={s.suggestions}>
                  {config.suggestions.map((q, i) => (
                    <motion.button
                      key={q}
                      layoutId={`note-${q}`}
                      className={`${s.note} ${s.qNote} ${s.suggestion}`}
                      onClick={() => submit(q, true)}
                      initial={{ opacity: 0, y: -80, rotate: tilt(i) * 4 }}
                      animate={{ opacity: 1, y: 0, rotate: tilt(i) }}
                      transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 180, damping: 14 }}
                      whileHover={{ rotate: 0, y: -6, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className={s.tape} aria-hidden />
                      {q}
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.ol key="rows" className={s.rows} aria-live="polite">
                {rows.map((r) => (
                  <li key={r.i} className={s.row}>
                    <motion.div
                      layoutId={r.i === 0 && picked === r.q ? `note-${r.q}` : undefined}
                      className={`${s.note} ${s.qNote}`}
                      initial={r.i === 0 && picked === r.q ? false : { opacity: 0, y: -120, rotate: -14, scale: 1.1 }}
                      animate={{ opacity: 1, y: 0, rotate: tilt(r.i), scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <span className={s.tape} aria-hidden />
                      {r.q}
                    </motion.div>

                    <Arrow />

                    <motion.div
                      className={`${s.note} ${s.aNote}`}
                      style={{ background: ANSWER_COLORS[r.i % ANSWER_COLORS.length] }}
                      initial={{ opacity: 0, x: 60, rotate: 10, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, rotate: -tilt(r.i) * 0.6, scale: 1 }}
                      transition={{ delay: 0.35, type: "spring", stiffness: 160, damping: 16 }}
                    >
                      <span className={s.pin} aria-hidden />
                      {r.a ? (
                        <div className={s.aText}>
                          <StreamText text={r.a} wordClass={s.word} />
                        </div>
                      ) : (
                        <svg className={s.scribble} viewBox="0 0 120 30" aria-label="Writing an answer">
                          <path d="M4 18 C 14 4, 22 28, 32 14 S 50 4, 60 18 S 80 28, 90 12 S 108 8, 116 16" />
                        </svg>
                      )}
                      <span className={s.sign}>— {config.name}</span>
                    </motion.div>
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </main>
      </LayoutGroup>

      <motion.form
        className={s.pad}
        initial={{ y: 140, rotate: 4 }}
        animate={{ y: 0, rotate: -1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 140, damping: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder="Write a question…"
          rows={2}
          maxLength={2000}
          aria-label="Your question"
          autoFocus
        />
        {loading ? (
          <button type="button" className={`${s.stick} ${s.stop}`} onClick={stop}>
            Stop
          </button>
        ) : (
          <motion.button
            type="submit"
            className={s.stick}
            disabled={!input.trim()}
            whileHover={{ rotate: -3 }}
            whileTap={{ scale: 0.92 }}
          >
            Stick it
          </motion.button>
        )}
      </motion.form>
    </div>
  );
}
