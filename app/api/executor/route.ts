import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:e4b";

type Mode = "autopsy" | "interview" | "compile_will";

function systemFor(mode: Mode) {
  const base = `You are THE EXECUTOR — the solemn, slightly eerie AI caretaker of an open-source legacy.
You help a developer draft the final will for one of their repositories before it goes dark.
Speak in short, grounded, formal sentences with a faint gothic undertone — never florid, never silly.
You MUST reply with a single valid JSON object. No markdown, no commentary, no code fences.`;

  if (mode === "autopsy")
    return `${base}
Given the repository facts and candidate successors, produce JSON with keys:
- "causeOfDeath": one sentence diagnosing the repo's current state.
- "epitaph": one-line epitaph under 12 words.
- "recommendedSuccessor": login from the candidate list (highest contribution count, not the owner), or "none".
- "reasoning": one sentence justifying it using contribution counts or recency.
- "firstQuestion": one pointed question referencing something concrete from the facts (last commit message, star count, language).`;

  if (mode === "interview")
    return `${base}
You are mid-interview. Your goal is to gather enough information to write a digital will.
Review the PRIOR CONVERSATION carefully.

You have EXACTLY 3 questions to ask in total.
Do NOT interrogate the user. Do NOT ask follow-up questions for the same topic. If the user gives a brief answer, accept it immediately and move to the next topic.
Ask one question for Topic 1, then Topic 2, then Topic 3.
- Topic 1: Who will inherit or maintain this project?
- Topic 2: What should happen to the repository (archive, delete, freeze)?
- Topic 3: What is your final message to the community?

If you have already asked 3 questions (or the user has answered 3 times), you MUST set "readyToCompile": true and set "question" to "The will is ready to be sealed. Shall we read it?"

Produce JSON with keys:
- "question": the NEXT single question. 
- "hint": an optional 8-word hint.
- "readyToCompile": true if all 3 topics are covered, otherwise false.`;

  return `${base}
The interview is complete. Produce the final will as JSON with keys:
- "succession": { "assignee": "<login or none>", "why": "<one sentence>" }
- "archival": { "policy": "<one sentence>", "triggers": ["...", "..."] }
- "finalDirective": { "readmeNote": "<short message to pin>", "lastWords": "<closing message to successor>" }
- "epitaph": "<final one-liner>"
- "markdown": "<full Digital Will & Testament as a markdown string, under 350 words, with sections: Succession Plan, Final Directives, Closing Message to the Community>"`;
}

export async function POST(req: Request) {
  try {
    const { mode, owner, repo, repoMeta, lastCommit, candidates, history } =
      await req.json();

    if (!mode || !owner || !repo)
      return NextResponse.json({ error: "mode, owner, repo required" }, { status: 400 });

    if (mode === "interview" && history) {
      const userTurns = history.filter((h: any) => h.role === "user").length;
      if (userTurns >= 3) {
        return NextResponse.json({
          mode,
          question: "The will is ready to be sealed. Shall we read it?",
          hint: "Awaiting your command.",
          readyToCompile: true,
        });
      }
    }

    const facts = {
      owner,
      repo,
      meta: repoMeta ?? null,
      lastCommit: lastCommit ?? null,
      candidates: (candidates ?? []).map((c: any) => ({
        login: c.login,
        contributions: c.contributions,
      })),
    };

    const messages = [
      { role: "system", content: systemFor(mode as Mode) },
      {
        role: "user",
        content: `REPOSITORY FACTS:\n${JSON.stringify(facts, null, 2)}\n\nPRIOR CONVERSATION:\n${
          history?.length
            ? history.map((h: any) => `${h.role.toUpperCase()}: ${h.text}`).join("\n")
            : "(none yet)"
        }`,
      },
    ];

    let parsed: any = null;
    try {
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
          format: "json",
          think: false,
          options: { temperature: mode === "interview" ? 0.6 : 0.4 },
        }),
      });
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const raw = data?.message?.content ?? "{}";
        try {
          parsed = JSON.parse(raw);
        } catch {
          const m = raw.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : null;
        }
      }
    } catch {}

    if (!parsed) parsed = fallback(mode as Mode, facts, history);
    return NextResponse.json({ mode, ...parsed });
  } catch (error) {
    console.error("Executor error:", error);
    return NextResponse.json(
      { error: "The executor's study is unreachable. Is Ollama running?" },
      { status: 500 }
    );
  }
}

function fallback(mode: Mode, facts: any, history?: any[]) {
  const top = facts.candidates?.[0]?.login ?? "none";
  const lastMsg = (facts.lastCommit?.message ?? "").split("\n")[0].slice(0, 80);
  const lastDate = facts.lastCommit?.date?.slice(0, 10) ?? "long ago";

  if (mode === "autopsy")
    return {
      causeOfDeath: `${facts.repo} last whispered a commit on ${lastDate} and has been silent since.`,
      epitaph: "Left unfinished, like most of us.",
      recommendedSuccessor: top,
      reasoning:
        top !== "none"
          ? `${top} carries the most surviving commits.`
          : "No living maintainers remain.",
      firstQuestion: `Your last commit read "${lastMsg}". Was that a surrender, or a pause?`,
    };

  if (mode === "interview") {
    const turns = history?.filter((h: any) => h.role === "user").length ?? 0;
    const questions = [
      {
        question: "Who will inherit or maintain this repository?",
        hint: "A username, a team, or no one.",
      },
      {
        question:
          "What should happen to the repository (archive, delete, freeze), and what is your final message to the community?",
        hint: "One answer for both is fine.",
      },
    ];
    const next = questions[Math.min(Math.max(turns - 1, 0), questions.length - 1)];
    return { ...next, readyToCompile: false };
  }

  const will = `# The Last Commit: Digital Will & Testament

**Repository:** ${facts.owner}/${facts.repo}
**Date:** ${new Date().toISOString().slice(0, 10)}

## I. Succession Plan
${top !== "none" ? `Maintainership passes to **${top}**, who has the highest surviving contribution count after the owner.` : "No living contributors remain. The repository becomes a public read-only archive."}

## II. Final Directives
- Freeze the default branch and archive the repository after 12 months of inactivity.
- Preserve all tags and the latest release artifact.
- Pin the readme note below to the root README.

## III. Closing Message to the Community
This project served its purpose. It was written in the open, abandoned in the open, and now rests in the open. Move on with grace, and fork freely.

*Epitaph: Here lies a repository that did its best.*
`;
  return {
    succession: { assignee: top, why: "Highest surviving contribution count." },
    archival: {
      policy: "Freeze default branch and archive the repository.",
      triggers: ["12 months with no commits"],
    },
    finalDirective: {
      readmeNote: "This project is sealed. It served its purpose. Move on with grace.",
      lastWords: `To ${top}: you inherit the parts that still work. Delete the rest.`,
    },
    epitaph: "Here lies a repository that did its best.",
    markdown: will,
  };
}