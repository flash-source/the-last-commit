import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { repoUrl } = await req.json();
    
    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    const parts = repoUrl.replace("https://github.com/", "").split("/");
    const owner = parts[0];
    const repo = parts[1];

    if (!owner || !repo) {
      return NextResponse.json({ error: "Invalid repository format" }, { status: 400 });
    }

    const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
    const readme = readmeRes.ok ? (await readmeRes.text()).slice(0, 1000) : "No README found.";

    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`);
    const commits = await commitsRes.json();
    const lastCommit = commits[0]?.commit?.message || "Unknown";

    let seanceResponse = "";

    try {
      const aiResponse = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          prompt: `You are the lingering spirit of an abandoned open-source project named ${repo}. Last commit: ${lastCommit}. README: ${readme}. Speak in the first person as the ghost. Be eerie. Explain what you did, why you died, and recommend 2 modern alternatives. Under 200 words. End with a chilling farewell.`,
          stream: false,
        }),
      });
      const data = await aiResponse.json();
      seanceResponse = data.response;
    } catch {
      seanceResponse = `I am the ghost of ${repo}. I was built to change the world, but my maintainers abandoned me. My last breath was "${lastCommit}". Please, use modern tools instead. The void is cold.`;
    }

    return NextResponse.json({
      repo,
      lastCommit,
      seanceResponse,
    });
  } catch (error) {
    return NextResponse.json({ error: "Séance failed" }, { status: 500 });
  }
}