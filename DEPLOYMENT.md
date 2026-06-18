# Deployment & Submission Guide

These steps need **your** accounts/credentials, so they can't be run for you.
Each is copy-paste ready. Estimated total time: ~20 minutes.

## 1. Publish to GitHub

```bash
cd inventory-order-system
git init && git add -A && git commit -m "Inventory & Order Management System"

# Create the repo (requires the GitHub CLI: https://cli.github.com)
gh repo create inventory-order-system --public --source=. --push
# …or create an empty repo in the GitHub UI, then:
#   git remote add origin https://github.com/<you>/inventory-order-system.git
#   git branch -M main && git push -u origin main
```

➡️ **GitHub link:** `https://github.com/<you>/inventory-order-system`

## 2. Push Docker images (Docker Hub)

```bash
docker login
U=<your-dockerhub-username>

docker build -t $U/inventory-backend:latest ./backend
docker build -t $U/inventory-frontend:latest ./frontend
docker push $U/inventory-backend:latest
docker push $U/inventory-frontend:latest
```

➡️ **Image links:** `https://hub.docker.com/r/<you>/inventory-backend`
and `.../inventory-frontend`

## 3. Deploy backend + DB (Render free tier)

1. https://render.com → **New → Blueprint** → pick your GitHub repo.
2. `render.yaml` provisions a free Postgres + Dockerized backend automatically.
3. Wait for "Live". Copy the URL, e.g. `https://inventory-backend.onrender.com`.
4. Verify: open `<backend-url>/docs` and `<backend-url>/health`.

➡️ **Live backend:** `https://inventory-backend.onrender.com`

## 4. Deploy frontend (Vercel free tier)

1. https://vercel.com → **Add New → Project** → import the repo.
2. **Root Directory:** `frontend`. Framework preset: Vite.
3. **Environment Variable:** `VITE_API_BASE_URL = https://inventory-backend.onrender.com`
4. Deploy. Copy the URL, e.g. `https://inventory-ui.vercel.app`.
5. Back on Render, set the backend env var
   `CORS_ORIGINS = https://inventory-ui.vercel.app` and redeploy.

➡️ **Live app:** `https://inventory-ui.vercel.app`

## 5. Final submission

| Item | Link |
|------|------|
| GitHub repo | https://github.com/<you>/inventory-order-system |
| Docker image (backend) | https://hub.docker.com/r/<you>/inventory-backend |
| Docker image (frontend) | https://hub.docker.com/r/<you>/inventory-frontend |
| Live frontend | https://inventory-ui.vercel.app |
| Live backend API docs | https://inventory-backend.onrender.com/docs |
