---
description: How to run the SaveRaks 2.0 project efficiently
---

# 🚀 Running SaveRaks 2.0 Efficiently

This workflow will help you start all necessary services for development.

## 1. Environment Check
Before starting, ensure your `.env` files are configured. 
- Root `.env`: Contains Docker passwords and API keys.
- `backend/.env`: Points to `localhost` for local development.

## 2. Start Infrastructure
// turbo
1. Run the database and cache services:
```powershell
docker-compose up -d postgres redis minio
```

## 3. Start Backend
1. Open a new terminal in `backend`
2. Generate Prisma client:
// turbo
```powershell
npx prisma generate
```
3. Start the dev server:
// turbo
```powershell
npm run dev
```

## 4. Start Frontend
1. Open a new terminal in `frontend`
2. Start the dev server:
// turbo
```powershell
npm run dev
```

## 🛠️ Troubleshooting common errors:
- **CORS Error**: Ensure `FRONTEND_URL` in `backend/.env` matches your Vite URL (usually `http://localhost:5173`).
- **DB Connection**: Ensure `DATABASE_URL` uses `localhost` if running backend outside Docker, or `postgres` if inside.
- **Port Mismatch**: Check `PORT` in `backend/.env`. If it's `5000`, update your frontend API calls.
