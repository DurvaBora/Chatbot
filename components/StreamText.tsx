"use client";

import { Fragment } from "react";

/**
 * Renders streamed text word by word. Each word keeps a stable key, so only
 * newly-arrived words play the entrance animation (`.word` in each variant's CSS).
 * Supports paragraphs, "- " bullets, and strips **bold** / _italic_ markers.
 */
export default function StreamText({ text, wordClass }: { text: string; wordClass: string }) {
  const clean = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/(^|\s)_([^_]+)_(?=\s|$|[.,!?])/g, "$1$2");

  let wordIndex = 0;
  const words = (line: string) =>
    clean(line)
      .split(/(\s+)/)
      .map((w, i) =>
        /^\s+$/.test(w) ? (
          <Fragment key={`s${i}`}>{w}</Fragment>
        ) : w ? (
          <span key={wordIndex} className={wordClass} data-i={wordIndex++}>
            {w}
          </span>
        ) : null,
      );

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`u${blocks.length}`}>
        {bullets.map((b, i) => (
          <li key={i}>{words(b)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-•*]\s+(.*)/);
    if (m) bullets.push(m[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{words(line)}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}
