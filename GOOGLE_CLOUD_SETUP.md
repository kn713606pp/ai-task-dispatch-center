# 🚀 Google Cloud 完整部署指南

## 📋 **部署前檢查清單**

### **必須準備的項目**
- [ ] Google 帳號
- [ ] GitHub 帳號
- [ ] Gemini API 金鑰
- [ ] Google Sheets ID（可選）
- [ ] Gmail 應用程式密碼（可選）

## 🎯 **第一步：Google Cloud 專案設定**

### **1.1 建立專案**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「建立專案」
3. 專案名稱：`ai-task-dispatch-center`
4. 點擊「建立」
5. **記住專案 ID**（例如：`ai-task-dispatch-center-123456`）

### **1.2 啟用必要 API**
前往「API 和服務」→「程式庫」，啟用以下 API：

```
✅ Cloud Build API
✅ Cloud Run API  
✅ Cloud Storage API
✅ Firestore API
✅ Google Sheets API
✅ Gmail API
✅ Speech-to-Text API
✅ Gemini API
```

**啟用步驟：**
1. 搜尋 API 名稱
2. 點擊 API
3. 點擊「啟用」
4. 重複以上步驟

## 🔐 **第二步：服務帳戶設定**

### **2.1 建立服務帳戶**
1. 前往「IAM 與管理」→「服務帳戶」
2. 點擊「建立服務帳戶」
3. 名稱：`ai-dispatch-service`
4. 說明：`AI 任務派遣中心服務帳戶`
5. 點擊「建立並繼續」

### **2.2 設定權限**
為服務帳戶添加以下角色：
```
✅ Cloud Run 管理員
✅ Cloud Build 編輯者
✅ Cloud Storage 管理員
✅ Firestore 使用者
✅ Speech-to-Text 使用者
✅ 專案編輯者
```

### **2.3 下載金鑰**
1. 點擊服務帳戶
2. 前往「金鑰」標籤
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」
5. 點擊「建立」
6. **下載並保存 JSON 檔案**

## 🗄️ **第三步：Cloud Storage 設定**

### **3.1 建立儲存桶**
1. 前往「Cloud Storage」→「儲存桶」
2. 點擊「建立」
3. 名稱：`ai-dispatch-audio-[您的專案ID]`
4. 位置類型：`區域`
5. 位置：`asia-east1`
6. 點擊「建立」

## 🔑 **第四步：取得必要金鑰**

### **4.1 Gemini API 金鑰**
1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 登入 Google 帳號
3. 點擊「Get API Key」
4. 建立新的 API 金鑰
5. **複製金鑰**

### **4.2 Google Sheets ID（可選）**
1. 建立新的 Google Sheets
2. 從 URL 複製 Sheets ID
3. **格式：`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**

### **4.3 Gmail 應用程式密碼（可選）**
1. 在 Gmail 中啟用「兩步驟驗證」
2. 前往「Google 帳戶」→「安全性」
3. 點擊「應用程式密碼」
4. 產生新的應用程式密碼
5. **複製密碼**

## 🔧 **第五步：GitHub Secrets 設定**

### **5.1 前往 GitHub Secrets**
1. 前往您的 GitHub 倉庫
2. 點擊「Settings」
3. 左側選單「Secrets and variables」→「Actions」
4. 點擊「New repository secret」

### **5.2 添加所有 Secrets**
```
名稱: GOOGLE_CLOUD_PROJECT_ID
值: ai-task-dispatch-center-123456

名稱: GOOGLE_APPLICATION_CREDENTIALS
值: [貼上服務帳戶JSON內容]

名稱: GEMINI_API_KEY
值: [您的Gemini API金鑰]

名稱: GOOGLE_SHEET_ID
值: [您的Google Sheets ID]

名稱: GMAIL_USER
值: [您的Gmail帳號]

名稱: GMAIL_APP_PASSWORD
值: [您的Gmail應用程式密碼]

名稱: GCS_BUCKET_NAME
值: ai-dispatch-audio-[您的專案ID]
```

## 🚀 **第六步：部署應用程式**

### **6.1 推送代碼**
```bash
git add .
git commit -m "Deploy to Google Cloud"
git push origin main
```

### **6.2 監控部署**
1. 前往 GitHub Actions 標籤
2. 查看「Deploy to Google Cloud Run」工作流程
3. 等待部署完成（約 5-10 分鐘）

### **6.3 取得部署 URL**
部署完成後，您會看到：
```
Backend URL: https://ai-dispatch-backend-xxx-uc.a.run.app
Frontend URL: https://storage.googleapis.com/ai-task-dispatch-center-123456-ai-dispatch-frontend/index.html
```

## 🧪 **第七步：測試部署**

### **7.1 測試後端**
訪問：`https://ai-dispatch-backend-xxx-uc.a.run.app/health`
應該返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### **7.2 測試前端**
訪問：`https://storage.googleapis.com/ai-task-dispatch-center-123456-ai-dispatch-frontend/index.html`
應該看到您的應用程式

### **7.3 測試音訊功能**
1. 錄製一段音訊
2. 上傳音訊檔案
3. 點擊「開始轉錄」
4. 等待處理完成

## 🔧 **第八步：更新前端 API URL**

### **8.1 更新環境變數**
在 GitHub Secrets 中添加：
```
名稱: VITE_API_BASE_URL
值: https://ai-dispatch-backend-xxx-uc.a.run.app
```

### **8.2 重新部署前端**
推送代碼觸發重新部署：
```bash
git add .
git commit -m "Update API URL"
git push origin main
```

## 📊 **第九步：監控和維護**

### **9.1 查看日誌**
1. 前往 Google Cloud Console
2. 前往「Cloud Run」
3. 點擊您的服務
4. 查看「日誌」標籤

### **9.2 監控效能**
1. 前往「Cloud Monitoring」
2. 查看服務效能指標
3. 設定警報（可選）

### **9.3 成本監控**
1. 前往「計費」
2. 查看使用量和成本
3. 設定預算警報（可選）

## 🆘 **故障排除**

### **常見問題**

#### **部署失敗**
- 檢查 GitHub Secrets 是否正確設定
- 確認所有 API 已啟用
- 檢查服務帳戶權限

#### **音訊處理失敗**
- 確認 Cloud Storage 儲存桶已建立
- 檢查 Speech-to-Text API 配額
- 查看 Cloud Run 日誌

#### **前端無法連接後端**
- 確認 VITE_API_BASE_URL 設定正確
- 檢查 CORS 設定
- 確認後端服務正在運行

### **檢查清單**
- [ ] 所有 API 已啟用
- [ ] 服務帳戶權限正確
- [ ] GitHub Secrets 設定完成
- [ ] Cloud Storage 儲存桶已建立
- [ ] 部署工作流程成功
- [ ] 前端可以訪問後端
- [ ] 音訊轉錄功能正常

## 🎉 **完成！**

您的 AI 任務派遣中心現在已經部署到 Google Cloud，支援：
- ✅ 長時間音訊錄製（1-2小時）
- ✅ 高品質語音轉文字
- ✅ 自動任務生成
- ✅ 多平台通知
- ✅ 企業級可靠性

**恭喜！您的系統已經準備就緒！** 🚀
