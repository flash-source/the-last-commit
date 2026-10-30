import { NextResponse } from "next/server";

const GH = "https://api.github.com";
const ghHeaders = {
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

export async function POST(req: Request) {
  const { owner, repo } = await req.json();
  if (!owner || !repo)
    return NextResponse.json({ error: "owner and repo required" }, { status: 400 });

  const [contribRes, repoRes, commitsRes] = await Promise.all([
    fetch(`${GH}/repos/${owner}/${repo}/contributors?per_page=20`, { headers: ghHeaders }),
    fetch(`${GH}/repos/${owner}/${repo}`, { headers: ghHeaders }),
    fetch(`${GH}/repos/${owner}/${repo}/commits?per_page=1`, { headers: ghHeaders }),
  ]);

  const contributors = contribRes.ok ? await contribRes.json() : [];
  const repoData = repoRes.ok ? await repoRes.json() : null;
  const commits = commitsRes.ok ? await commitsRes.json() : [];

  const candidates = (Array.isArray(contributors) ? contributors : [])
    .filter((c: any) => c.type !== "Bot" && c.login !== owner)
    .slice(0, 5)
    .map((c: any) => ({ login: c.login, contributions: c.contributions }));

  return NextResponse.json({
    candidates,
    repo: repoData && {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      language: repoData.language,
      pushedAt: repoData.pushed_at,
      archived: repoData.archived,
      license: repoData.license?.spdx_id ?? null,
    },
    lastCommit: commits[0] && {
      sha: commits[0].sha,
      message: commits[0].commit.message,
      author: commits[0].commit.author?.name,
      date: commits[0].commit.author?.date,
    },
  });
}