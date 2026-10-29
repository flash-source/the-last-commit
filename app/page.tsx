"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const StudyScene = dynamic(() => import("@/components/StudyScene"), {
  ssr: false,
});

export default function Home() {
  const [username, setUsername] = useState("flash-source");
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWill, setShowWill] = useState(false);

  useEffect(() => {
    const name = username.trim();
    if (!name) return;

    const timer = setTimeout(() => {
      fetch(`https://api.github.com/users/${name}/repos?sort=updated&per_page=3`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRepos(data.map((r: any) => r.name));
          }
        })
        .catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  const handleInteract = async (repo: string) => {
    setSelectedRepo(repo);
    setChatHistory([]);
    setShowWill(false);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/executor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: username.trim(), repo, mode: "interview" }),
      });
      const data = await res.json();
      setChatHistory([{ role: "executor", text: data.response }]);
    } catch (e) {
      setChatHistory([{ role: "executor", text: "The executor awaits your command." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !selectedRepo) return;

    const newHistory = [...chatHistory, { role: "user", text: userInput }];
    setChatHistory(newHistory);
    setUserInput("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/executor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: username.trim(),
          repo: selectedRepo,
          mode: "compile_will",
          userAnswer: newHistory.map((m) => `${m.role}: ${m.text}`).join("\n"),
        }),
      });
      const data = await res.json();
      setChatHistory([...newHistory, { role: "executor", text: data.response }]);
      setShowWill(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadWill = () => {
    const will = chatHistory[chatHistory.length - 1]?.text ?? "";
    const blob = new Blob([will], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRepo}-will.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0a0a0c] text-gray-200 font-mono">
      <StudyScene repos={repos} onInteract={handleInteract} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-start p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto text-center mb-4"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-500 tracking-tight">
            THE LAST COMMIT
          </h1>
          <p className="mt-2 text-gray-400 text-sm max-w-md mx-auto">
            Draft the digital will for your open-source legacy. Select a reliquary to begin.
          </p>
        </motion.div>

        {!selectedRepo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto mt-8"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-900/80 border border-gray-700 text-white px-4 py-2 rounded text-center w-64 focus:outline-none focus:border-blue-500"
              placeholder="GitHub Username"
            />
          </motion.div>
        )}

        <AnimatePresence>
          {selectedRepo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-auto"
            >
              <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                  <span className="text-blue-400 font-bold">Executor: {selectedRepo}</span>
                  <button
                    onClick={() => setSelectedRepo(null)}
                    className="text-gray-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="h-48 overflow-y-auto mb-3 space-y-3 pr-2">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                        msg.role === "executor"
                          ? "bg-gray-800 text-gray-200 border-l-2 border-blue-500"
                          : "bg-blue-900/30 text-blue-100 border-r-2 border-blue-400 text-right"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="text-gray-500 text-sm italic animate-pulse">
                      The executor is contemplating...
                    </div>
                  )}
                </div>

                {!showWill ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Answer the executor's question..."
                      className="flex-1 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isProcessing}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-green-400 text-sm mb-2">The Digital Will has been sealed.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={downloadWill}
                        className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2 rounded"
                      >
                        Download will
                      </button>
                      <button
                        onClick={() => setSelectedRepo(null)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
                      >
                        Return to the Study
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}