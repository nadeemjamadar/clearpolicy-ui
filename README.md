# ClearPolicy UI

React + Next.js (App Router) prototype for policy-document Q&A: upload policies, ask questions, get answers with citations. Runs locally and on AWS App Runner.

## Quick start (local)

```bash
cd clearpolicy-ui
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default is **mock mode** (no backend).

## Build & run (production)

```bash
npm run build
npm run start
```

Runs on port 3000.

## Docker

```bash
docker build -t clearpolicy-ui .
docker run -p 3000:3000 clearpolicy-ui
```

Optional env at runtime:

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_MOCK_MODE=true -e NEXT_PUBLIC_API_BASE_URL= clearpolicy-ui
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MOCK_MODE` | `true` = localStorage + mock Q&A; `false` = call real API |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (e.g. `https://api.example.com`) when not in mock mode |

See `.env.example`. Do not hard-code secrets.

## Features (MVP)

- **Policy upload & library**: Upload PDF/DOCX; list filename, version, status (Indexed/Processing), timestamp; select policies for Q&A.
- **Q&A**: Choose jurisdiction, ask a question; see answer, confidence (0–100%), citations (policy name, page, snippet). If unsupported: *"I don't know. Please consult a broker or legal professional."*
- **Audit & export**: Last 20 Q&A stored in browser; export audit history as JSON.
- **Mock mode**: Works without backend; real APIs used when `NEXT_PUBLIC_MOCK_MODE=false`.

## API (when not in mock mode)

- `POST /api/policies/upload` — upload file
- `GET /api/policies` — list policies
- `POST /api/qa` — body: `{ question, jurisdiction, policy_ids }`

## Verification checklist (before demo)

- [ ] `npm run build` and `npm run start` succeed.
- [ ] `docker build -t clearpolicy-ui .` and `docker run -p 3000:3000 clearpolicy-ui` succeed.
- [ ] Upload a PDF or DOCX; it appears in the list with version, status, timestamp.
- [ ] Select one or more policies, choose jurisdiction, ask a question; answer, confidence, and citations appear.
- [ ] Ask a question containing "unknown"; fallback message is shown.
- [ ] Export audit as JSON; file contains last 20 Q&A.
- [ ] With `NEXT_PUBLIC_MOCK_MODE=false` and `NEXT_PUBLIC_API_BASE_URL` set, app calls real endpoints (backend must be running).

---

## AWS App Runner deployment guide

### Exact App Runner configuration

- **Runtime**: Docker (source: ECR image or GitHub).
- **Port**: 3000.
- **Start command**: Leave default (image `CMD` is used: `node server.js`).
- **Build**: If using GitHub, build command: `docker build -t clearpolicy-ui .` (or use App Runner’s native build from Dockerfile).
- **Environment variables**: Set in App Runner service:
  - `NEXT_PUBLIC_MOCK_MODE` = `true` (or `false` if backend is available).
  - `NEXT_PUBLIC_API_BASE_URL` = your API base URL when not in mock mode (no trailing slash).

### IAM permissions (for App Runner + ECR/GitHub)

- **App Runner**: Default execution role for pulling images and running the service.
- **ECR** (if using ECR): `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:BatchCheckLayerAvailability`.
- **GitHub** (if using GitHub source): Connection uses GitHub App / OAuth; no extra IAM for repo access.

### Deploy via AWS Console

1. **Create ECR repository** (if using ECR):  
   ECR → Create repository → name e.g. `clearpolicy-ui`.

2. **Build and push image** (local or CI):
   ```bash
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t clearpolicy-ui .
   docker tag clearpolicy-ui:latest <account>.dkr.ecr.<region>.amazonaws.com/clearpolicy-ui:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/clearpolicy-ui:latest
   ```

3. **App Runner → Create service**:
   - Source: **Container registry** → Amazon ECR → select repository and image tag.
   - Or Source: **Source code repository** → Connect GitHub → select repo/branch.
   - Deployment settings: **Manual** or **Automatic**.
   - Configure service: CPU/Memory as needed.
   - **Port**: 3000.
   - **Environment variables**: Add `NEXT_PUBLIC_MOCK_MODE`, `NEXT_PUBLIC_API_BASE_URL` (values are baked at build time for Next.js; for Docker deploy they can be set at build or use runtime if your image reads env at start).
   - Create service.

4. **Note**: Next.js `NEXT_PUBLIC_*` are inlined at **build** time. For Docker, pass them at **build** time when running `docker build` (e.g. `--build-arg`) if you need different values per environment, or keep one set in Dockerfile/defaults and override via App Runner only for non-public vars if any.

### Deploy via GitHub → App Runner (recommended)

1. **Connect GitHub**: App Runner → Create service → Source code repository → Connect to GitHub → authorize and pick repo.

2. **Repository**: Choose `clearpolicy-ui` (or the repo containing the app).

3. **Branch**: e.g. `main`.

4. **Deployment trigger**: Automatic on push (recommended).

5. **Build settings**:
   - **Build type**: Docker.
   - **Dockerfile**: Use repository Dockerfile (path `Dockerfile`).
   - **Build command**: (leave default or set to `docker build -t clearpolicy-ui .` if App Runner expects a build command; many setups use “Docker” and detect Dockerfile automatically.)

6. **Service**: Port **3000**; add env vars `NEXT_PUBLIC_MOCK_MODE`, `NEXT_PUBLIC_API_BASE_URL`.

7. Create service; App Runner builds from Dockerfile and deploys.

### Troubleshooting

| Issue | What to check |
|-------|----------------|
| **Build failures** | Ensure Dockerfile runs in repo root; `npm run build` succeeds locally; Node 18+ in Dockerfile; no hardcoded paths. |
| **Port issues** | App Runner must use port **3000**; Dockerfile `EXPOSE 3000` and app `PORT=3000` / `HOSTNAME=0.0.0.0`. |
| **ENV variable issues** | `NEXT_PUBLIC_*` must be set at **build** time for Next.js to embed them. For GitHub + App Runner, set in App Runner “Build configuration” as build env vars if the build step uses them; for ECR, pass at `docker build` and redeploy. |
| **502 / service not starting** | Confirm `node server.js` runs in container (standalone output); check App Runner logs in CloudWatch. |
| **API calls fail in production** | Set `NEXT_PUBLIC_API_BASE_URL` to the full backend URL (HTTPS) and `NEXT_PUBLIC_MOCK_MODE=false`; ensure CORS allows the App Runner origin. |

---

## Project structure

```
clearpolicy-ui/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── PolicyLibrary.tsx
│   ├── QASection.tsx
│   └── AuditExport.tsx
├── lib/
│   └── api.ts
├── public/
├── Dockerfile
├── .dockerignore
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── .env.example
└── README.md
```
