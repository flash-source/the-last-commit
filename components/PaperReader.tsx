"use client";

import { useEffect, useRef } from "react";
import type { Paper } from "./StudyScene";

export default function PaperReader({
  papers,
  index,
  onChange,
  onClose,
}: {
  papers: Paper[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const paper = papers[index];

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  if (!paper) return null;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-no-keys
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight") onChange(Math.min(index + 1, papers.length - 1));
        if (e.key === "ArrowLeft") onChange(Math.max(index - 1, 0));
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 outline-none backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-md border-2 border-[#8a7a5c] bg-[#e8dcc0] p-8 shadow-2xl"
        style={{ fontFamily: "Georgia, serif", color: "#2a1f14" }}
      >
        <div className="mb-4 border-b-2 border-[#8a7a5c] pb-2 text-xl font-bold tracking-wide">
          {paper.title}
        </div>
        <div className="whitespace-pre-wrap text-lg leading-relaxed">{paper.body}</div>
        <div className="mt-8 flex items-center justify-between text-sm">
          <button
            onClick={() => onChange(index - 1)}
            disabled={index === 0}
            className="rounded bg-[#2a1f14] px-3 py-1 text-[#e8dcc0] disabled:opacity-30"
          >
            ← Prev
          </button>
          <span>
            {index + 1} / {papers.length} · Esc to close
          </span>
          <button
            onClick={() => onChange(index + 1)}
            disabled={index === papers.length - 1}
            className="rounded bg-[#2a1f14] px-3 py-1 text-[#e8dcc0] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}