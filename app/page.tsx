"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { CabinData } from "@/components/StudyScene";
import SidePanel from "@/components/SidePanel";
import PaperReader from "@/components/PaperReader";

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
  const [openPaper, setOpenPaper] = useState<number | null>(null);

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
            title: "SUCCESSOR",
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
      setOpenPaper(null);
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

  function closePanel() {
    setSelectedRepo(null);
    setActiveCabinId(null);
    setOpenPaper(null);
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#050403] text-gray-200 font-mono">
      <StudyScene
        activeCabinId={activeCabinId}
        cabinData={cabinData}
        onOpenPaper={(i) => setOpenPaper(i)}
        onSelectCabin={(id) => {
          if (id === activeCabinId) return;
          closePanel();
        }}
      />

      {!selectedRepo && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-32 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto text-center mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-900 tracking-tight drop-shadow-2xl font-serif">
              THE LAST COMMIT
            </h1>
            <p className="mt-4 text-gray-400 text-sm max-w-md mx-auto">
              Draft the digital will for your open-source legacy.<br/>Enter a handle to be led to a cabin.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-auto flex flex-col items-center gap-4 bg-black/40 p-8 rounded-2xl border border-gray-800 backdrop-blur-md shadow-2xl"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="bg-gray-900/80 border border-gray-700 text-white px-4 py-3 rounded-lg text-center w-72 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="GitHub Username"
            />
            <button
              onClick={enterStudy}
              disabled={isProcessing}
              className="bg-amber-900/80 hover:bg-amber-700 text-amber-100 px-8 py-3 rounded-lg transition font-semibold tracking-wide disabled:opacity-50 w-full"
            >
              {isProcessing ? "Summoning the Executor…" : "Enter the Study"}
            </button>
            {previewRepos.length > 0 && (
              <p className="text-amber-500/60 text-xs">
                {previewRepos.length} repositories found — one will be chosen.
              </p>
            )}
          </motion.div>
        </div>
      )}

      {selectedRepo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-amber-200/30 text-xs font-mono pointer-events-none z-10">
          WASD / arrows to walk · click a paper to read · ESC to return
        </div>
      )}

      <SidePanel
        selectedRepo={selectedRepo}
        chatHistory={chatHistory}
        userInput={userInput}
        setUserInput={setUserInput}
        handleSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        showWill={showWill}
        downloadWill={downloadWill}
        onClose={closePanel}
      />

      {openPaper !== null && selectedRepo && cabinData && (
        <PaperReader
          papers={cabinData.papers}
          index={openPaper}
          onChange={setOpenPaper}
          onClose={() => setOpenPaper(null)}
        />
      )}
    </main>
  );
}