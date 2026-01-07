# SaveRaks 2.0

Eco-Guardian Platform for Surasakmontree School

## Quick Start

### Development
```bash
# Copy environment file
cp .env.example .env

# Start with Docker Compose (dev mode)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f
```

### Production (Recommended - Nginx Reverse Proxy)
```bash
# Copy and configure environment file
cp .env.example .env
# Edit .env with your production values

# One-command deployment
npm run deploy          # Windows
# or
npm run deploy:unix     # Linux/Mac

# Manual deployment
docker-compose up -d
```

## Architecture

### Production Setup with Nginx Reverse Proxy
```
User → Nginx (Port 80) → 
├── /api/* → Backend (Port 3000)
└── /* → Frontend (Port 80, internal)
```

**Benefits:**
- Single entry point (Port 80 only)
- SSL termination ready
- Load balancing capability
- Security headers centralized
- Rate limiting
- Better error handling

## Services

| Service | Dev Port | Prod Port | External Access |
|---------|----------|-----------|-----------------|
| Nginx (Proxy) | - | 80 | ✅ User Entry Point |
| Frontend | 5173 | 80 (internal) | ❌ Via Nginx |
| Backend | 3000 | 3000 (internal) | ❌ Via Nginx |
| PostgreSQL | 5432 | 5432 | ⚠️ Internal Only |
| Redis | 6379 | 6379 | ⚠️ Internal Only |
| MinIO Console | 9001 | 9001 | ✅ Admin Access |

## Default Credentials

**Note**: Default credentials are for development only. 
- Configure production credentials using environment variables
- See `.env.example` for required environment variables
"# saveraks6" 
