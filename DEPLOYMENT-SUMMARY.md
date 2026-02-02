# ClearPolicy UI — Deployment Summary

## Brief Summary of Deployment Steps

### 1. Local development
- **Setup:** `npm install` (or `npm.cmd install` on Windows if scripts are restricted), then `npm run dev`.
- **Run:** Open http://localhost:3000. Uses mock mode by default (`NEXT_PUBLIC_MOCK_MODE=true`).

### 2. Production build (local)
- **Build:** `npm run build`
- **Run:** `npm run start` (serves on port 3000).

### 3. Docker
- **Build image:** `docker build -t clearpolicy-ui .`
- **Run container:** `docker run -p 3000:3000 clearpolicy-ui`
- Multi-stage Dockerfile (Node 18, standalone output), port 3000.

### 4. GitHub
- Repo created and code pushed: **https://github.com/nadeemjamadar/clearpolicy-ui**
- Branch: `main`. Automatic deployments can trigger on push.

### 5. AWS App Runner (two options)
- **Option A — Config from repo:** Create service → Source: GitHub → Runtime: **Node.js 22** → **Configuration source: Repository**. App Runner reads `apprunner.yaml` (build, run, port 3000, env).
- **Option B — Dockerfile:** Create service → Source: GitHub → **Build type: Docker** → set port **3000** and env in the console.
- After deploy, use the default App Runner URL (e.g. `https://xxxxx.awsapprunner.com`).

---

## Challenges and How They Were Addressed

| Challenge | What happened | How it was solved |
|-----------|----------------|-------------------|
| **PowerShell blocking npm** | On Windows, `npm install` failed with “running scripts is disabled” (execution policy). | Use **`npm.cmd install`** (and `npm.cmd run dev`, etc.) so the `.cmd` wrapper runs instead of `npm.ps1`, avoiding the script policy. Alternatively, relax policy with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (if allowed). |
| **App Runner config: file vs console** | Need to support “read configuration from repo” for App Runner. | Added **`apprunner.yaml`** at repo root with `version`, `runtime: nodejs22`, `build` commands (`npm ci`, `npm run build`), `run` command (`npm run start`), **port 3000**, and env vars. When creating the service, choose **Configuration source: Repository** so App Runner uses this file. |
| **Two ways to deploy (Docker vs managed runtime)** | Project uses a Dockerfile for Docker/App Runner Docker, but App Runner can also use a managed runtime + config file. | Kept both: **Dockerfile** for Docker/App Runner Docker option; **apprunner.yaml** for App Runner with Node.js 22 and “configuration from repository.” Documented both as Option A and Option B in `DEPLOY-APP-RUNNER.md`. |
| **Next.js env at build time** | `NEXT_PUBLIC_*` are baked in at build time; changing them later doesn’t affect the bundle. | Documented in README and deployment guide: set `NEXT_PUBLIC_MOCK_MODE` and `NEXT_PUBLIC_API_BASE_URL` in App Runner **build** environment (or in `apprunner.yaml` for Option A) and redeploy to change mock/API behavior. |

---

## One-line recap

**Local:** `npm.cmd install` → `npm.cmd run dev` | **Docker:** `docker build -t clearpolicy-ui .` && `docker run -p 3000:3000 clearpolicy-ui` | **App Runner:** Push to GitHub, create service with either **Repository config** (Node 18 + `apprunner.yaml`) or **Docker** (Dockerfile + port 3000 in console).
