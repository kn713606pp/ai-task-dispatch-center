# 後端 Docker 配置
FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和安裝依賴
COPY package*.json ./
RUN npm install --only=production --no-audit --no-fund

# 複製應用程式碼
COPY . .

# 暴露端口
EXPOSE 8080

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080

# 啟動應用程式
CMD ["node", "server.js"]
