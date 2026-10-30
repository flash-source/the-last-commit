"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { CabinData } from "@/components/StudyScene";

const StudyScene = dynamic(() => import("@/components/StudyScene"), { ssr: false });

const COLS = 6;
const ROWS = 4;
function randomCabinId() {
  return `cabin-${Math.floor(Math.random() * COLS * ROWS)}`;
}

type Msg = { role: "executor" | "user"; text: string };

export default function Home() {
  const [username, setUsername] = useState("flash-source");
  const [previewRepos, setPreviewRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [activeCabinId, setActiveCabinId] = useState<string | null>(null);
  const [cabinData, setCabinData] = useState<CabinData | null>(null);
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWill, setShowWill] = useState(false);
  const [willMarkdown, setWillMarkdown] = useState("");

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function previewFor(name: string): Promise<string[]> {
    try {
      const res = await fetch(
        `https://api.github.com/users/${name}/repos?sort=updated&per_page=6`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const names = data.map((r: any) => r.name);
        setPreviewRepos(names);
        return names;
      }
      setPreviewRepos([]);
      return [];
    } catch {
      setPreviewRepos([]);
      return [];
    }
  }

  function onUsernameChange(value: string) {
    setUsername(value);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    const name = value.trim();
    if (!name) {
      setPreviewRepos([]);
      return;
    }
    previewTimer.current = setTimeout(() => {
      previewFor(name);
    }, 600);
  }

  async function enterStudy() {
    const name = username.trim();
    if (!name || isProcessing) return;
    setIsProcessing(true);

    try {
      let repos = previewRepos;
      if (!repos.length) {
        repos = await previewFor(name);
      }
      if (!repos.length) {
        alert("No public repositories found for that user.");
        return;
      }

      const repo = repos[Math.floor(Math.random() * repos.length)];

      const facts = await fetch("/api/successors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: name, repo }),
      }).then((r) => r.json());

      const autopsy = await fetch("/api/executor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "autopsy",
          owner: name,
          repo,
          repoMeta: facts.repo,
          lastCommit: facts.lastCommit,
          candidates: facts.candidates,
        }),
      }).then((r) => r.json());

      const cabinId = randomCabinId();

      setCabinData({
        id: cabinId,
        repoName: repo,
        papers: [
          {
            title: "AUTOPSY",
            body: `${autopsy.causeOfDeath ?? "Cause unknown."}\n\n— ${autopsy.epitaph ?? "—"}`,
          },
          {
            title: "LAST COMMIT",
            body: `${(facts.lastCommit?.message ?? "No commits recorded.").split("\n")[0]}\n— ${
              facts.lastCommit?.author ?? "unknown"
            }\n${
              facts.lastCommit?.date
                ? new Date(facts.lastCommit.date).toLocaleDateString()
                : ""
            }`,
          },
          {
            title: "SUCCESSOR CANDIDATE",
            body: `${autopsy.recommendedSuccessor ?? "none"}\n\n${
              autopsy.reasoning ?? ""
            }\n\n"${autopsy.firstQuestion ?? "The executor awaits."}"`,
          },
        ],
      });

      setSelectedRepo(repo);
      setActiveCabinId(cabinId);
      setShowWill(false);
      setWillMarkdown("");
      setChatHistory([{ role: "executor", text: autopsy.firstQuestion ?? "Speak." }]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSendMessage() {
    if (!userInput.trim() || !selectedRepo) return;

    const next: Msg[] = [...chatHistory, { role: "user", text: userInput }];
    setChatHistory(next);
    setUserInput("");
    setIsProcessing(true);

    try {
      const interview = await fetch("/api/executor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "interview",
          owner: username.trim(),
          repo: selectedRepo,
          candidates: [],
          history: next,
        }),
      }).then((r) => r.json());

      if (interview.readyToCompile) {
        const will = await fetch("/api/executor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "compile_will",
            owner: username.trim(),
            repo: selectedRepo,
            history: next,
          }),
        }).then((r) => r.json());

        const md = will.markdown ?? "_(The executor could not compose the will.)_";
        setWillMarkdown(md);
        setChatHistory([
          ...next,
          { role: "executor", text: "The will is sealed.\n\n" + md },
        ]);
        setShowWill(true);
      } else {
        setChatHistory([
          ...next,
          { role: "executor", text: interview.question ?? "Continue." },
        ]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory([...next, { role: "executor", text: "The connection wavers." }]);
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadWill() {
    const blob = new Blob([willMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRepo}-will.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0a0a0c] text-gray-200 font-mono">
      <StudyScene
        activeCabinId={activeCabinId}
        cabinData={cabinData}
        onSelectCabin={(id) => {
          if (id === activeCabinId) return;
          setSelectedRepo(null);
          setActiveCabinId(null);
        }}
      />

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
            Draft the digital will for your open-source legacy. Enter a handle to be led to a
            cabin.
          </p>
        </motion.div>

        {!selectedRepo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto mt-6 flex flex-col items-center gap-3"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="bg-gray-900/80 border border-gray-700 text-white px-4 py-2 rounded text-center w-64 focus:outline-none focus:border-blue-500"
              placeholder="GitHub Username"
            />
            <button
              onClick={enterStudy}
              disabled={isProcessing}
              className="bg-amber-900/50 hover:bg-amber-900/70 text-amber-100 px-6 py-2 rounded transition disabled:opacity-50"
            >
              {isProcessing ? "Summoning the Executor…" : "Enter the Study"}
            </button>
            {previewRepos.length > 0 && (
              <p className="text-gray-500 text-xs">
                {previewRepos.length} repositories found — one will be chosen at random.
              </p>
            )}
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
                    onClick={() => {
                      setSelectedRepo(null);
                      setActiveCabinId(null);
                    }}
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
                      The executor is contemplating…
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
                      placeholder="Answer the executor's question…"
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
                    <p className="text-green-400 text-sm mb-2">
                      The Digital Will has been sealed.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={downloadWill}
                        className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2 rounded"
                      >
                        Download will
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRepo(null);
                          setActiveCabinId(null);
                        }}
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

        {selectedRepo && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-amber-200/40 text-[10px] font-mono pointer-events-none">
            WASD / arrows to walk · ESC to return to the foyer
          </div>
        )}
      </div>
    </main>
  );
}