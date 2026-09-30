"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useChat } from "@/lib/useChat";
import type { BotConfig } from "@/lib/config";
import StreamText from "@/components/StreamText";
import { DemoTag } from "@/components/VariantSwitcher";
import s from "./Canvas.module.css";

function CursorIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden>
      <path d="M1 1l15 7.2-6.6 1.7L6.6 17z" fill="currentColor" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Cursor({ label }: { label: string }) {
  return (
    <span className={s.cursor} aria-hidden>
      <CursorIcon />
      <span className={s.tag}>{label}</span>
    </span>
  );
}

/** A second "multiplayer" cursor that trails the visitor's pointer. */
function PresenceCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 260, damping: 28 });
  const sy = useSpring(y, { stiffness: 260, damping: 28 });
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX + 14);
      y.set(e.clientY + 16);
      setOn(true);
    };
    const leave = () => setOn(false);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div className={s.presence} style={{ x: sx, y: sy }} animate={{ opacity: on ? 1 : 0 }}>
      <span className={s.youTag}>You</span>
    </motion.div>
  );
}

export default function Canvas({ config }: { config: BotConfig }) {
  const { messages, loading, demo, send, stop, reset } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length === 0;
  const lastAnswer = messages.length - 1;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    send(text);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className={s.page}>
      <PresenceCursor />

      <header className={s.topbar}>
        <span className={s.frameName}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 0v12M9 0v12M0 3h12M0 9h12" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {config.name} / Ask me
        </span>
        <DemoTag show={demo} />
        {!empty && (
          <button className={s.ghost} onClick={reset}>
            New chat
          </button>
        )}
      </header>

      <main className={`${s.frame} ${empty ? s.isEmpty : ""}`}>
        <AnimatePresence mode="wait">
          {empty ? (
            <motion.section
              key="intro"
              className={s.intro}
              exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
              transition={{ duration: 0.35 }}
            >
              <div className={s.introMark}>
                <span className={s.heroCursor}>
                  <Cursor label={config.name} />
                </span>
              </div>
              <h1 className={s.headline}>
                {config.headline.split(" ").map((w, i) => (
                  <Fragment key={i}>
                    <span className={s.hWord} style={{ animationDelay: `${0.55 + i * 0.07}s` }}>
                      {w}
                    </span>{" "}
                  </Fragment>
                ))}
              </h1>
              <p className={s.subline}>{config.subline}</p>
              <div className={s.prompts}>
                {config.suggestions.map((q, i) => (
                  <motion.button
                    key={q}
                    className={s.prompt}
                    onClick={() => submit(q)}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.08, type: "spring", stiffness: 380, damping: 26 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className={s.promptIcon} aria-hidden>◇</span>
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.ol key="thread" className={s.thread} aria-live="polite">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <motion.li
                    key={i}
                    className={s.q}
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  >
                    {m.content}
                  </motion.li>
                ) : (
                  <li key={i} className={`${s.a} ${i === lastAnswer ? s.isLatest : ""}`}>
                    <motion.span
                      className={s.aCursor}
                      initial={{ x: 260, y: 120, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: i === lastAnswer ? 1 : 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
                    >
                      <Cursor label={config.name} />
                    </motion.span>
                    <div className={s.selection}>
                      <span className={`${s.handle} ${s.tl}`} />
                      <span className={`${s.handle} ${s.tr}`} />
                      <span className={`${s.handle} ${s.bl}`} />
                      <span className={`${s.handle} ${s.br}`} />
                      <div className={s.aBody}>
                        {m.content ? (
                          <StreamText text={m.content} wordClass={s.word} />
                        ) : (
                          <span className={s.thinking} aria-label="Thinking">
                            <i /><i /><i />
                          </span>
                        )}
                      </div>
                      {i === lastAnswer && (
                        <span className={s.dims}>{loading ? "Drafting…" : "Answer · Hug × Auto"}</span>
                      )}
                    </div>
                  </li>
                ),
              )}
            </motion.ol>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </main>

      <motion.form
        className={s.toolbar}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 26 }}
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
          placeholder={`Ask ${config.name} anything about UX`}
          rows={1}
          maxLength={2000}
          aria-label="Your question"
          autoFocus
        />
        {loading ? (
          <button type="button" className={`${s.send} ${s.stop}`} onClick={stop} aria-label="Stop answering">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect width="12" height="12" rx="2" fill="currentColor" /></svg>
          </button>
        ) : (
          <motion.button
            type="submit"
            className={s.send}
            disabled={!input.trim()}
            aria-label="Send question"
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        )}
      </motion.form>
    </div>
  );
}
