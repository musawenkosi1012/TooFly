# Build stage
FROM node:20-alpine AS builder
# Fix security vulnerabilities
RUN for i in 1 2 3; do apk update --force-missing-repositories && apk upgrade --no-cache && break || sleep 5; done
WORKDIR /app
COPY package*.json ./
RUN for i in 1 2 3; do npm install && break || sleep 5; done
COPY . .
# Set environment variables for the build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}
RUN npm run build

# Production stage
FROM nginx:alpine
# Fix security vulnerabilities
RUN apk update && apk upgrade --no-cache
# Create non-root user for security (Checkov CKV_DOCKER_3)
RUN adduser -D -u 10014 choreouser

# Fix permissions for Nginx to run as non-root
RUN touch /var/run/nginx.pid && \
    chown -R choreouser:choreouser /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy build output from builder stage
COPY --from=builder /app/out /usr/share/nginx/html

USER 10014
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
