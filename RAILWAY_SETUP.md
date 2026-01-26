
# 1. Update backend/.env on Railway
# Replace DATABASE_URL with the Private URL format:
# postgresql://[USER]:[PASSWORD]@[PRIVATE_HOST]:[PORT]/[DB_NAME]
# Usually: postgresql://postgres:[PASSWORD]@postgres-railway-internal.railway.internal:5432/railway
# Check Railway Dashboard > PostgreSQL > Connect > "Private Network"

# 2. Update backend/.env for local development
# Keep the Public URL for local testing, but DO NOT use it in production on Railway.
