"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const GraveyardScene = dynamic(() => import("@/components/GraveyardScene"), {
  ssr: false,
});

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isSummoning, setIsSummoning] = useState(false);
  const [seanceResult, setSeanceResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSummon = async (repo: string) => {
    const targetRepo = repo || repoUrl;
    if (!targetRepo) return;

    setIsSummoning(true);
    setSeanceResult(null);
    setError("");

    try {
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: targetRepo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "The spirit would not answer.");
      } else {
        setSeanceResult(data);
      }
    } catch (err) {
      console.error("Séance failed:", err);
      setError("The séance failed. Try again.");
    } finally {
      setIsSummoning(false);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-gray-200 font-mono">
      <GraveyardScene
        onRepoSelect={(repo) => {
          setRepoUrl(repo);
          handleSummon(repo);
        }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pointer-events-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-600 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            THE LAST COMMIT
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-md mx-auto">
            Channel the spirit of an abandoned open-source project.
            Enter a GitHub repository to begin the séance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg pointer-events-auto"
        >
          <div className="flex gap-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 p-2 rounded-lg shadow-[0_0_30px_rgba(139,0,0,0.2)]">
            <input
              type="text"
              placeholder="e.g., facebook/create-react-app"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 px-3 py-2"
              onKeyDown={(e) => e.key === "Enter" && handleSummon("")}
            />
            <button
              onClick={() => handleSummon("")}
              disabled={isSummoning || !repoUrl}
              className="bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-2 rounded-md font-semibold transition-all duration-300 shadow-lg"
            >
              {isSummoning ? "Summoning..." : "Summon"}
            </button>
          </div>
          {error && <p className="mt-3 text-center text-red-400 text-sm">{error}</p>}
        </motion.div>

        <AnimatePresence>
          {seanceResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
              onClick={() => setSeanceResult(null)}
            >
              <div
                className="bg-gray-900 border border-red-900/50 p-8 rounded-xl max-w-2xl w-full shadow-[0_0_50px_rgba(139,0,0,0.3)]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span>👻</span> The Spirit of {seanceResult.repo} Speaks:
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
                  {seanceResult.seanceResponse}
                </div>
                <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
                  Last known words:{" "}
                  <span className="text-gray-400 italic">"{seanceResult.lastCommit}"</span>
                </div>
                <button
                  onClick={() => setSeanceResult(null)}
                  className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-md transition-colors"
                >
                  Return to the Graveyard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}