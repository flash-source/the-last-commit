"use client";

import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "executor" | "user"; text: string };

interface SidePanelProps {
  selectedRepo: string | null;
  chatHistory: Msg[];
  userInput: string;
  setUserInput: (value: string) => void;
  handleSendMessage: () => void;
  isProcessing: boolean;
  showWill: boolean;
  downloadWill: () => void;
  onClose: () => void;
}

export default function SidePanel({
  selectedRepo,
  chatHistory,
  userInput,
  setUserInput,
  handleSendMessage,
  isProcessing,
  showWill,
  downloadWill,
  onClose,
}: SidePanelProps) {
  return (
    <AnimatePresence>
      {selectedRepo && (
        <motion.div
          key="sidepanel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-md z-50 pointer-events-auto flex flex-col p-4"
        >
          <div className="flex-1 bg-[#0c0a09]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#0c0a09]/80">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Séance for
                </span>
                <h2 className="text-xl text-amber-200 font-serif">{selectedRepo}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "executor"
                      ? "bg-gray-800/80 text-gray-200 border border-gray-700"
                      : "bg-amber-900/30 text-amber-50 border border-amber-700/50 ml-6"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isProcessing && (
                <div className="text-amber-200/60 text-sm italic animate-pulse p-2">
                  The Executor is contemplating…
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-800 bg-[#0c0a09]/80">
              {!showWill ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Answer the Executor…"
                    className="flex-1 bg-black/50 border border-gray-700 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isProcessing}
                    className="bg-amber-600/80 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-amber-200 text-sm">The Digital Will has been sealed.</p>
                  <button
                    onClick={downloadWill}
                    className="bg-amber-600/80 hover:bg-amber-500 text-white px-6 py-3 rounded-lg text-sm font-medium w-full transition-colors"
                  >
                    Download Will
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}