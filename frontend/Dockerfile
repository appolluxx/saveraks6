# frontend/Dockerfile (Production - Multi-stage)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install && \
    npm cache clean --force

# Copy source
COPY . .

# Build app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage with Nginx
FROM nginx:1.25-alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
RUN apk add --no-cache curl

# Expose port internally (not externally)
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
