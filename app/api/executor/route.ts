import { NextResponse } from "next/server";

const MODEL = "llama3";

export async function POST(req: Request) {
  try {
    const { owner, repo, mode, userAnswer } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json({ error: "Owner and repo are required" }, { status: 400 });
    }

    let recentActivity = "No recent commits found.";
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=3`
      );
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        recentActivity = commits
          .map((c: any) => c.commit.message.split("\n")[0])
          .join("; ");
      }
    } catch {}

    let prompt = "";

    if (mode === "interview") {
      prompt = `You are the Digital Executor for the open-source project "${repo}".
Recent commit activity: "${recentActivity}".
Your role is to help the maintainer draft a "Digital Will" for this repository.
Ask ONE thoughtful, slightly eerie, but highly practical question about the future of this code.
Examples: "If you vanish tomorrow, who holds the keys to merge the next PR?", "Is there a hidden technical debt in recent commits that your successor must know about?", or "What final message should be pinned to the README if this project goes dormant?"
Keep it under 60 words. End with a direct question to the user.`;
    } else if (mode === "compile_will") {
      prompt = `You are the Digital Executor. The maintainer has answered your questions about "${repo}".
Conversation so far:
${userAnswer}
Compile this into a formal, beautifully written "Digital Will & Testament" for this repository.
Include sections for: 1. Succession Plan (Maintainership), 2. Final Directives (Branches/Issues), 3. A Closing Message to the Community.
Use markdown. Keep the tone solemn, respectful, and forward-looking. Under 300 words.`;
    } else {
      return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }

    const aiResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    });

    const data = await aiResponse.json();

    return NextResponse.json({
      response:
        data.response || "The executor is currently meditating on your code's legacy...",
    });
  } catch (error) {
    console.error("Executor error:", error);
    return NextResponse.json({
      response:
        "The connection to the executor's study is faint. Make sure Ollama is running and the model is pulled.",
    });
  }
}