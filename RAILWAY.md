# Railway Deployment for TaskFlow

This repo is now ready to deploy as a single Railway service with backend + static frontend.

## What was added
- `Dockerfile` at repo root
- `.dockerignore` to keep build context clean
- Backend now serves `frontend/taskflow` statically from Express
- Backend now uses `process.env.PORT` for Railway compatibility

## How to deploy

1. Push your repository to GitHub.
2. Create a Railway project and connect the repository.
3. In Railway, add a new service and choose `Deploy from GitHub`.
4. Railway should detect the `Dockerfile` and build the service.

## Environment variables to add in Railway

Set these in Railway's Environment tab:

- `MONGODB_URI`
- `jwt_secret`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `ALLOW_ADMIN_REGISTRATION` (optional, e.g. `true`)
- `FRONTEND_ORIGIN` (optional, e.g. `https://your-railway-app.up.railway.app`)

## Expected behavior

- API endpoints stay under `/api/*`
- Frontend is served at the root URL
- A Railway live URL will be generated once deployment succeeds

## Local test commands

```bash
cd backend/auth
npm install
npm start
```

or if using Docker locally:

```bash
cd "c:\Users\LENOVO\OneDrive\Desktop\task manager"
docker build -t taskflow .
docker run -p 3000:3000 -e PORT=3000 -e MONGODB_URI=... taskflow
```
