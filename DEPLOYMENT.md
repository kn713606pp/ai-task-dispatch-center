# 🚀 部署指南

## 概述
本專案採用前後端分離架構：
- **前端**: React + Vite，部署到 GitHub Pages
- **後端**: Node.js + Express，部署到 Railway 或 Heroku

## 📋 部署前準備

### 1. 環境變數設定
複製 `env.example` 為 `.env` 並填入正確的值：

```bash
cp env.example .env
```

### 2. GitHub Secrets 設定
在 GitHub 倉庫設定中添加以下 Secrets：

#### 前端部署所需：
- `GEMINI_API_KEY`: 您的 Gemini API 金鑰
- `VITE_API_BASE_URL`: 後端 API 的完整 URL (部署後填入)

#### 後端部署所需：
- `GOOGLE_APPLICATION_CREDENTIALS`: Google Cloud 服務帳戶金鑰 (JSON 內容)
- `FIRESTORE_COLLECTION`: Firestore 集合名稱
- `GOOGLE_SHEET_ID`: Google Sheets ID
- `GMAIL_USER`: Gmail 帳號
- `GMAIL_APP_PASSWORD`: Gmail 應用程式密碼

## 🎯 部署步驟

### 前端部署 (GitHub Pages)

1. **啟用 GitHub Pages**：
   - 前往倉庫設定 → Pages
   - 選擇 "GitHub Actions" 作為來源

2. **更新 CORS 設定**：
   在 `server.js` 中更新 `corsOptions.origin` 陣列，加入您的 GitHub Pages URL：
   ```javascript
   origin: [
       'http://localhost:3000',
       'https://your-username.github.io', // 替換為實際 URL
   ]
   ```

### 後端部署選項

#### 選項 A: Railway 部署

1. **建立 Railway 專案**：
   - 前往 [Railway](https://railway.app)
   - 連接 GitHub 倉庫
   - 選擇此專案

2. **設定環境變數**：
   在 Railway 儀表板中設定所有必要的環境變數

3. **更新 GitHub Actions**：
   在 `.github/workflows/deploy-backend.yml` 中設定：
   - `RAILWAY_TOKEN`: Railway API Token
   - `RAILWAY_SERVICE_ID`: Railway 服務 ID

#### 選項 B: Heroku 部署

1. **建立 Heroku 應用**：
   ```bash
   heroku create your-app-name
   ```

2. **設定環境變數**：
   ```bash
   heroku config:set GOOGLE_APPLICATION_CREDENTIALS="$(cat path/to/service-account.json)"
   heroku config:set FIRESTORE_COLLECTION=tasks
   # ... 其他環境變數
   ```

3. **更新 GitHub Actions**：
   在 `.github/workflows/deploy-backend.yml` 中設定：
   - `HEROKU_API_KEY`: Heroku API Key
   - `HEROKU_APP_NAME`: Heroku 應用名稱
   - `HEROKU_EMAIL`: Heroku 帳號

## 🔄 部署流程

1. **推送代碼到 main 分支**
2. **GitHub Actions 自動觸發**：
   - 前端自動部署到 GitHub Pages
   - 後端自動部署到 Railway/Heroku
3. **更新前端 API URL**：
   - 取得後端部署 URL
   - 更新 GitHub Secrets 中的 `VITE_API_BASE_URL`
   - 重新觸發前端部署

## 🧪 測試部署

### 前端測試
- 訪問 GitHub Pages URL
- 檢查瀏覽器開發者工具中的網路請求

### 後端測試
- 訪問 `https://your-backend-url/health`
- 應該返回健康狀態 JSON

## 🐛 故障排除

### 常見問題

1. **CORS 錯誤**：
   - 檢查 `server.js` 中的 `corsOptions.origin`
   - 確保包含正確的前端 URL

2. **API 呼叫失敗**：
   - 檢查 `VITE_API_BASE_URL` 是否正確
   - 確認後端服務正在運行

3. **環境變數問題**：
   - 檢查 GitHub Secrets 設定
   - 確認後端平台環境變數設定

### 日誌檢查

- **GitHub Actions**: 在 Actions 標籤中查看部署日誌
- **Railway**: 在 Railway 儀表板查看日誌
- **Heroku**: 使用 `heroku logs --tail` 查看日誌

## 📞 支援

如果遇到問題，請檢查：
1. 所有環境變數是否正確設定
2. CORS 設定是否包含正確的域名
3. 後端服務是否正常運行
4. 網路連線是否正常
