#!/bin/bash

# SaveRaks 2.0 Production Deployment Script
# This script handles the complete deployment process with nginx reverse proxy

set -e  # Exit on any error

echo "🚀 Starting SaveRaks 2.0 Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_error "Please edit .env file with your production values before running this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

print_status "Environment check passed ✓"

# Create logs directory for backend
mkdir -p backend/logs

print_status "Building and starting services..."

# Stop existing services
print_status "Stopping existing services..."
docker-compose down --remove-orphans

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T backend npm run prisma:migrate

# Start application services
print_status "Starting application services..."
docker-compose up -d backend frontend

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 20

# Start nginx reverse proxy
print_status "Starting nginx reverse proxy..."
docker-compose up -d nginx

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    print_status "Backend health check passed ✓"
else
    print_error "Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check nginx health
if curl -f http://localhost:80 > /dev/null 2>&1; then
    print_status "Frontend health check passed ✓"
else
    print_error "Frontend health check failed"
    docker-compose logs nginx
    exit 1
fi

print_status "🎉 SaveRaks 2.0 deployed successfully!"
print_status "📍 Application is available at: http://localhost:80"
print_status "🔧 Admin interface: http://localhost:80/admin"
print_status "📊 API endpoints: http://localhost:80/api"

# Show running services
print_status "Running services:"
docker-compose ps

print_status "Deployment completed successfully! 🚀"

# Show useful commands
echo ""
print_status "Useful commands:"
echo "  View logs: docker-compose logs -f [service_name]"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Update application: git pull && ./deploy.sh"
