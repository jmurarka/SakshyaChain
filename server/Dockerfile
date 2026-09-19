FROM node:20-alpine

WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy server codebase
COPY . .

# Default Environment Variables for Container Environment
ENV PORT=5000
ENV STRICT_CORS_ENABLED=true
ENV ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:80,http://localhost:5000,http://192.168.1.14:5173"
ENV ALLOWED_CLIENT_IPS="127.0.0.1,::1,172.,192.168.,*"

EXPOSE 5000

CMD ["node", "src/server.js"]
