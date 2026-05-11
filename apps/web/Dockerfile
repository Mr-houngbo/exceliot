FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
# Next.js will be run in dev mode with volume mount
