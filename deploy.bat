@echo off
REM SaveRaks 2.0 Production Deployment Script for Windows
REM This script handles the complete deployment process with nginx reverse proxy

echo 🚀 Starting SaveRaks 2.0 Production Deployment...

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [ERROR] Please edit .env file with your production values before running this script again.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] docker-compose is not installed. Please install it first.
    pause
    exit /b 1
)

echo [INFO] Environment check passed ✓

REM Create logs directory for backend
if not exist backend\logs mkdir backend\logs

echo [INFO] Building and starting services...

REM Stop existing services
echo [INFO] Stopping existing services...
docker-compose down --remove-orphans

REM Build and start services
echo [INFO] Building Docker images...
docker-compose build --no-cache

echo [INFO] Starting infrastructure services (PostgreSQL, Redis, MinIO)...
docker-compose up -d postgres redis minio

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout /t 30 /nobreak >nul

REM Run database migrations
echo [INFO] Running database migrations...
docker-compose exec -T backend npm run prisma:migrate

REM Start application services
echo [INFO] Starting application services...
docker-compose up -d backend frontend

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...
timeout /t 20 /nobreak >nul

REM Start nginx reverse proxy
echo [INFO] Starting nginx reverse proxy...
docker-compose up -d nginx

REM Check service health
echo [INFO] Checking service health...

REM Check backend health
curl -f http://localhost:80/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Backend health check passed ✓
) else (
    echo [ERROR] Backend health check failed
    docker-compose logs backend
    pause
    exit /b 1
)

REM Check nginx health
curl -f http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Frontend health check passed ✓
) else (
    echo [ERROR] Frontend health check failed
    docker-compose logs nginx
    pause
    exit /b 1
)

echo [INFO] 🎉 SaveRaks 2.0 deployed successfully!
echo [INFO] 📍 Application is available at: http://localhost:80
echo [INFO] 🔧 Admin interface: http://localhost:80/admin
echo [INFO] 📊 API endpoints: http://localhost:80/api

REM Show running services
echo [INFO] Running services:
docker-compose ps

echo [INFO] Deployment completed successfully! 🚀

REM Show useful commands
echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose logs -f [service_name]
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Update application: git pull && deploy.bat

pause
