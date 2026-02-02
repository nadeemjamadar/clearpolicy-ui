# Deploy ClearPolicy UI to AWS App Runner (GitHub)

Repo: **https://github.com/nadeemjamadar/clearpolicy-ui**

## 1. Connect GitHub to AWS (one-time)

1. In **AWS Console** go to **App Runner** → **Create service**.
2. Under **Source and deployment**:
   - **Source**: **Source code repository**.
   - **Connect to GitHub**: Click **Add new** (or choose an existing connection).
   - Authorize AWS to access your GitHub (e.g. **Connect to GitHub** → approve).
   - After connecting, choose **Repository**: `nadeemjamadar/clearpolicy-ui`, **Branch**: `main`.

## 2. Configure build

- **Deployment trigger**: **Automatic** (deploy on push to `main`).
- **Build type**: **Docker**.
- **Dockerfile path**: `Dockerfile` (repo root).
- **Build command**: Leave default (App Runner uses the Dockerfile).
- **Build output**: Leave default.

## 3. Configure service

- **Service name**: e.g. `clearpolicy-ui`.
- **Port**: **3000**.
- **CPU**: 1 vCPU (or 0.25 for minimal cost).
- **Memory**: 2 GB (or 0.5 GB for minimal).

## 4. Environment variables (optional)

In **Configure service** → **Environment variables** (or **Security** → **Environment variables**):

| Key | Value | Notes |
|-----|--------|--------|
| `NEXT_PUBLIC_MOCK_MODE` | `true` | Use mock mode (no backend). Set `false` when you have an API. |
| `NEXT_PUBLIC_API_BASE_URL` | *(empty or your API URL)* | Backend base URL when mock is off. |

**Note:** `NEXT_PUBLIC_*` are baked in at **build** time in Next.js. For App Runner with GitHub, set these in the **Build** step environment variables if your build uses them; otherwise set them in the service and they apply at runtime for the Node process (e.g. if you read env in `server.js`). For this app, mock mode is determined at build time, so to change it you may need to set build env vars in App Runner’s build configuration and redeploy.

## 5. Create and deploy

- Click **Create & deploy**.
- Wait for the first build and deployment (about 5–10 minutes).
- When status is **Running**, open the **Default domain** (e.g. `https://xxxxx.us-east-1.awsapprunner.com`).

## 6. Custom domain (optional)

- In the App Runner service → **Custom domains** → **Link domain**.
- Add your domain and follow the CNAME instructions.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Build fails | Ensure branch is `main`, Dockerfile is at repo root, and build logs show no path errors. |
| 502 / service not responding | Confirm **Port** is **3000** and the image runs `node server.js` (standalone). |
| Env vars not applied | For Next.js, set build-time vars in App Runner **Build** configuration and redeploy. |

## Quick link

- **GitHub repo**: https://github.com/nadeemjamadar/clearpolicy-ui
- **App Runner console**: https://console.aws.amazon.com/apprunner/
