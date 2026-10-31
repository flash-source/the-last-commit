# The Last Commit

A 3D study where you write a will for your own open-source repos.

Live demo: https://the-last-commit-vtg8.onrender.com (read [About the live demo](#about-the-live-demo) first)

Built for the Hacktoberfest 2026 "Ghost in the Machine" challenge on DEV, week 4.

## The idea

Most ghost projects this week let you talk to dead code. This one goes the other way. You decide what happens to your repos before you stop committing: who inherits them, what gets archived, and what the last message to the community says.

You type a GitHub handle. The app picks one of your recently updated public repos and drops you into a dim 3D study with 24 cabins. Yours lights up. An AI "executor" does an autopsy of the repo, interviews you, and writes the will.

## What happens when you play

1. Enter a GitHub username and press **Enter the Study**.
2. The camera flies down to one cabin. A candle is lit and three papers lie on the desk: AUTOPSY, LAST COMMIT and SUCCESSOR.
3. Click a paper, or use the "On the desk" buttons at the bottom left, to read it full size. The arrow keys flip between papers and Esc closes the reader.
4. The executor opens a chat in the side panel with a question about your repo. You answer three times.
5. It compiles a Digital Will & Testament with a succession plan, final directives for branches and issues, and a closing message. Download it as markdown.

Walk around with WASD or the arrow keys. Typing in the chat box doesn't move the camera.

## What is real and what is simulated

The autopsy facts are real. The last commit (message, author, date), star count, language, open issues and the top contributors come from the GitHub API for the repo that was picked. The suggested successor is the contributor with the most commits, leaving out you and any bots.

The will is not executed. The app has no write access to GitHub. It doesn't transfer repos, post issues, archive anything, or watch for inactivity. The will is a document you download. A fast-forward scene where the will "executes" is something I wanted and didn't get to.

## About the live demo

The Render deployment has no language model attached, so the executor answers from built-in templates. The repo facts are still real, but the interview questions and the will text are canned, and your answers are ignored. To see the real AI behaviour, run it locally with Ollama (next section).

If the server has been idle, the first load can be slow. If GitHub's rate limit gets hit, the autopsy comes back thin. Setting `GITHUB_TOKEN` fixes that.

## Run it locally

You need Node 20.9 or newer and [Ollama](https://ollama.com).

```bash
git clone https://github.com/flash-source/the-last-commit.git
cd the-last-commit
npm install
ollama pull gemma4:e4b
npm run dev
```

Open http://localhost:3000. If Ollama isn't already running in the background, start it with `ollama serve` in another terminal.

Environment variables go in `.env.local`. All of them are optional.

| Variable | Default | What it does |
|---|---|---|
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Where the app looks for Ollama |
| `OLLAMA_MODEL` | `gemma4:e4b` | The chat model used for all three executor modes |
| `GITHUB_TOKEN` | none | Raises the GitHub API rate limit for the server-side calls. A token with no scopes is enough for public repos. |

Any Ollama chat model that can return JSON should work if you set `OLLAMA_MODEL`. If Ollama can't be reached, the executor quietly falls back to the templates. So if every answer sounds the same, check that Ollama is running and the model is pulled.

## Controls

| Action | Input |
|---|---|
| Walk | W A S D or the arrow keys |
| Read a paper | Click it, or use a button under "On the desk" |
| Switch papers in the reader | Left and right arrow keys, or Prev and Next |
| Close the reader | Esc, or click outside the card |
| Pull the camera back to the overview | Esc, while not typing |
| Leave the study | The ✕ in the side panel |

## How it's built

| File | What it does |
|---|---|
| `app/page.tsx` | Holds the state, fetches the repo list, calls the API routes, builds the three papers and runs the interview loop |
| `app/api/successors/route.ts` | GitHub REST calls for repo metadata, the last commit and the top contributors |
| `app/api/executor/route.ts` | The executor. Three modes (autopsy, interview, compile_will), each with its own system prompt, sent to Ollama's `/api/chat` in JSON mode |
| `components/StudyScene.tsx` | The canvas, the lights, the room and the 6 x 4 grid of cabins |
| `components/Cabin.tsx` | Desk, chair, candle, name label and the paper objects |
| `components/CameraRig.tsx` | Overview, fly-to and walking camera modes |
| `components/PaperReader.tsx` | The flat reading card that opens when you click a paper |
| `components/SidePanel.tsx` | The chat |
| `components/AudioManager.tsx` | Hooks for ambient sound (see the limitations) |

The stack is Next.js 16 (App Router), React 19, three.js with React Three Fiber and drei, Framer Motion, Tailwind CSS 4, and Gemma through Ollama.

## Keeping the model on a leash

The interview is capped at three answers. After the third, the server forces "ready to compile" no matter what the model says. This fixed an earlier loop where it kept asking follow-up questions.

Every executor reply has to be a single JSON object. If parsing fails or Ollama is down, a template takes over so the interface never gets stuck.

## Privacy

With a local Ollama, your answers stay on your machine. The only outside calls are to GitHub's public API. The app has no database and stores nothing, so download your will before you reload.

## Known limitations

- Public repos only. The repo is picked at random from your six most recently updated ones and you can't choose.
- `AudioManager` looks for `/audio/study-ambience.mp3` and `/audio/paper-rustle.mp3`. Neither file is in the repo, so the study is silent and the browser logs two 404s.
- Desktop only. Walking is keyboard-based and there are no touch controls.
- The scene is heavy on weak GPUs, with 24 cabins and several shadow-casting lights.
- Nothing is saved between sessions.

## Hacktoberfest notes

The first commit is from Oct 29, 2026, inside the challenge window. Any commits made after the submission deadline (Oct 31, 11:59 PM PDT) will be listed here. None yet.

## License

MIT. See [LICENSE](LICENSE).