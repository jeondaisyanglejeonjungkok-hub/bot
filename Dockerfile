# Use lightweight Python base image
FROM python:3.11-slim

# Install Node.js (v20 LTS) and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY requirements.txt ./

# Install Python and Node dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Pre-download u2netp model into image so startup is instant
RUN python -c "import rembg; rembg.new_session('u2netp')"

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV REMBG_MODEL=u2netp

EXPOSE 3000

CMD ["node", "server.js"]
