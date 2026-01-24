FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Debug: List what was copied
RUN echo "=== Files copied ===" && \
    ls -la && \
    echo "=== Config directory ===" && \
    ls -la config/ || echo "CONFIG DIR MISSING"

# Install dependencies
RUN npm ci

# Build with lenient TypeScript settings, excluding tests
RUN npx tsc --noUnusedLocals false --noUnusedParameters false

# Debug: List what remains after build
RUN echo "=== After build ===" && \
    ls -la && \
    ls -la config/ || echo "CONFIG DIR MISSING AFTER BUILD"

# Expose port
EXPOSE 8000

# Start the app
CMD ["node", "dist/main.js"]