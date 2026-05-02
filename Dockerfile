FROM node:22-slim

WORKDIR /app

COPY backend/auth/package.json ./backend/auth/
COPY backend/auth/package-lock.json* ./backend/auth/  
COPY backend ./backend
COPY frontend/taskflow ./frontend/taskflow

WORKDIR /app/backend/auth
RUN npm install --production

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
