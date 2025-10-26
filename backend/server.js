// 優化的後端伺服器 - Google Cloud Run 版本
const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { google } = require('googleapis');
const axios = require('axios');
const nodemailer = require('nodemailer');
const multer = require('multer');
const AudioProcessor = require('./audio-processor');

const app = express();
const PORT = process.env.PORT || 8080;

// 優化的 CORS 設定
const corsOptions = {
    origin: [
        'https://storage.googleapis.com', // Google Cloud Storage 域名
        'https://storage.googleapis.com/*', // 所有 Cloud Storage 子域名
        'http://localhost:3000', // 開發環境
        'https://*.googleapis.com', // Google APIs 域名
        'https://*.googleusercontent.com', // Google 用戶內容域名
        '*' // 暫時允許所有來源，用於調試
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    optionsSuccessStatus: 200 // 支援舊版瀏覽器
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// 添加請求日誌中間件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'unknown'}`);
    next();
});

// 添加錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('服務器錯誤:', err);
    res.status(500).json({ error: '內部服務器錯誤', message: err.message });
});

// 初始化服務
const firestore = new Firestore();
const audioProcessor = new AudioProcessor();

// 設定檔案上傳（支援大檔案）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB 限制
    },
});

// 根路由
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'AI Task Dispatch Center Backend API',
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        region: process.env.GOOGLE_CLOUD_REGION || 'unknown',
        endpoints: {
            health: '/health',
            analyze: '/api/analyze',
            dispatch: '/api/dispatch',
            notify: '/api/notify',
            transcribe: '/api/transcribe'
        }
    });
});

// 健康檢查端點
app.get('/health', (req, res) => {
    console.log('收到健康檢查請求');
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        region: process.env.GOOGLE_CLOUD_REGION || 'unknown',
        message: '後端服務正常運行'
    });
});

// 簡單測試端點
app.get('/test', (req, res) => {
    console.log('收到測試請求');
    res.status(200).json({ 
        message: '測試端點正常',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        port: process.env.PORT || 'unknown'
    });
});

// 根路徑測試
app.get('/', (req, res) => {
    console.log('收到根路徑請求');
    res.status(200).json({ 
        message: 'AI 任務派遣中心後端服務',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: ['/test', '/health', '/api/debug', '/api/analyze']
    });
});

// 任務派遣端點
app.post('/api/dispatch', async (req, res) => {
    const { tasks, summary } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: '無效的任務資料。' });
    }

    try {
        // 分批處理大量任務
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < tasks.length; i += batchSize) {
            batches.push(tasks.slice(i, i + batchSize));
        }

        // 1. 將任務寫入 Firestore（分批處理）
        for (const batch of batches) {
            const firestoreBatch = firestore.batch();
            const collectionRef = firestore.collection(process.env.FIRESTORE_COLLECTION || 'tasks');
            
            batch.forEach(task => {
                const docRef = collectionRef.doc();
                firestoreBatch.set(docRef, {
                    ...task,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });
            
            await firestoreBatch.commit();
        }
        console.log(`成功將 ${tasks.length} 個任務寫入 Firestore。`);

        // 2. 將任務同步至 Google Sheets（如果設定了）
        if (process.env.GOOGLE_SHEET_ID) {
            const auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const sheets = google.sheets({ version: 'v4', auth });
            
            const values = tasks.map(task => [
                task.title,
                task.description,
                task.priority,
                task.status,
                task.category,
                task.assignee,
                task.dueDate || '',
                new Date().toISOString(),
            ]);

            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });
            console.log('成功將任務同步至 Google Sheets。');
        }

        res.status(200).json({ 
            success: true, 
            message: '所有資料已成功派遣。',
            processedTasks: tasks.length
        });

    } catch (error) {
        console.error('派遣過程中發生錯誤:', error);
        res.status(500).json({ 
            message: '後端處理失敗。', 
            error: error.message 
        });
    }
});

// 通知端點
app.post('/api/notify', async (req, res) => {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
        return res.status(400).json({ message: '無效的通知資料。' });
    }

    // 設定 Gmail 發送器
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    try {
        const results = [];
        
        for (const payload of notifications) {
            const { assignee, tasks } = payload;
            const taskList = tasks.map(t => `- ${t.title} (優先級: ${t.priority})`).join('\n');
            const message = `\n您有新的任務指派：\n\n${taskList}\n\n請儘速處理。`;

            const notificationResult = { assignee: assignee.name, success: [], failed: [] };

            // 發送 Line Notify
            if (assignee.lineId) {
                try {
                    await axios.post('https://notify-api.line.me/api/notify', 
                        `message=${encodeURIComponent(message)}`, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Bearer ${assignee.lineId}`,
                        },
                    });
                    notificationResult.success.push('Line Notify');
                    console.log(`已向 ${assignee.name} 發送 Line 通知。`);
                } catch (error) {
                    notificationResult.failed.push('Line Notify');
                    console.error(`Line 通知發送失敗: ${error.message}`);
                }
            }

            // 發送 Gmail
            if (assignee.gmail) {
                try {
                    await transporter.sendMail({
                        from: `"AI 任務派遣中心" <${process.env.GMAIL_USER}>`,
                        to: assignee.gmail,
                        subject: '【重要通知】您有新的任務指派',
                        text: `哈囉 ${assignee.name}，\n\n${message}`,
                    });
                    notificationResult.success.push('Gmail');
                    console.log(`已向 ${assignee.name} (${assignee.gmail}) 發送 Gmail 通知。`);
                } catch (error) {
                    notificationResult.failed.push('Gmail');
                    console.error(`Gmail 通知發送失敗: ${error.message}`);
                }
            }
            
            results.push(notificationResult);
        }
        
        res.status(200).json({ 
            success: true, 
            message: '通知處理完成。',
            results: results
        });
    } catch (error) {
        console.error('通知發送過程中發生錯誤:', error);
        res.status(500).json({ 
            message: '通知發送失敗。', 
            error: error.message 
        });
    }
});

// 調試端點 - 檢查 API 是否可用
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'AI 分析 API 端點正常',
        timestamp: new Date().toISOString(),
        endpoints: ['/api/analyze', '/api/debug']
    });
});

// AI 分析端點
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('收到 AI 分析請求');
        console.log('請求體:', JSON.stringify(req.body, null, 2));
        
        const { text, timestamp } = req.body;
        
        if (!text || !text.trim()) {
            console.log('錯誤: 沒有收到要分析的文字內容');
            return res.status(400).json({ 
                success: false, 
                message: '沒有收到要分析的文字內容' 
            });
        }

        console.log(`分析文字長度: ${text.length} 字元`);
        
        // 使用 Gemini API 進行分析
        const analysisResult = await analyzeWithGemini(text);
        
        console.log('AI 分析完成');
        
        res.json({
            success: true,
            tasks: analysisResult.tasks,
            summary: analysisResult.summary,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('AI 分析錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'AI 分析失敗: ' + error.message 
        });
    }
});

// Gemini API 分析函數
async function analyzeWithGemini(text) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY 環境變數未設定');
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `請根據以下內容分析並提取任務：

${text}

請按照以下 JSON 格式回應：
{
  "tasks": [
    {
      "id": "唯一ID",
      "title": "任務標題",
      "description": "任務描述",
      "priority": "緊急|高|中|低",
      "status": "待辦事項",
      "category": "部門分類",
      "assignee": "負責人",
      "dueDate": "YYYY-MM-DD"
    }
  ],
  "summary": "任務摘要"
}

請確保：
1. 董總交辦事項優先級設為「緊急」，負責人為「艾蜜莉」
2. 急件在標題前加上【急件】
3. 根據內容關鍵字分配部門和負責人
4. 日期格式為 YYYY-MM-DD`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
            throw new Error('Gemini API 回應格式錯誤');
        }

        const content = response.data.candidates[0].content.parts[0].text;
        console.log('Gemini API 原始回應:', content);

        // 解析 JSON 回應
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('無法從 Gemini 回應中提取 JSON');
        }

        const result = JSON.parse(jsonMatch[0]);
        
        // 驗證回應格式
        if (!result.tasks || !Array.isArray(result.tasks)) {
            throw new Error('Gemini 回應格式錯誤：缺少 tasks 陣列');
        }

        // 為每個任務添加 ID（如果沒有）
        result.tasks = result.tasks.map((task, index) => ({
            ...task,
            id: task.id || `task_${Date.now()}_${index}`
        }));

        console.log('Gemini API 分析完成，任務數量:', result.tasks.length);
        return result;

    } catch (error) {
        console.error('Gemini API 錯誤:', error);
        throw new Error('Gemini API 調用失敗: ' + error.message);
    }
}

// 圖片分析端點 (OCR)
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '沒有收到圖片檔案' });
        }

        console.log('收到圖片分析請求:', req.file.originalname);
        
        // 這裡應該調用 Google Cloud Vision API 進行 OCR
        // 暫時使用模擬結果，實際應該調用 Vision API
        const mockText = `【圖片 OCR 分析結果】\n\n這是一個模擬的 OCR 分析結果。實際應用中會使用 Google Cloud Vision API 提取圖片中的文字內容。\n\n檔案名稱: ${req.file.originalname}\n檔案大小: ${req.file.size} bytes\n檔案類型: ${req.file.mimetype}`;
        
        res.json({
            success: true,
            text: mockText,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
        });
        
    } catch (error) {
        console.error('圖片分析錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '圖片分析失敗: ' + error.message 
        });
    }
});

// 檔案分析端點
app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '沒有收到檔案' });
        }

        console.log('收到檔案分析請求:', req.file.originalname);
        
        // 這裡應該根據檔案類型調用相應的解析 API
        // 暫時使用模擬結果，實際應該解析檔案內容
        const mockText = `【檔案分析結果】\n\n這是一個模擬的檔案分析結果。實際應用中會根據檔案類型（Word、PDF、JSON、Markdown 等）解析檔案內容。\n\n檔案名稱: ${req.file.originalname}\n檔案大小: ${req.file.size} bytes\n檔案類型: ${req.file.mimetype}`;
        
        res.json({
            success: true,
            text: mockText,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
        });
        
    } catch (error) {
        console.error('檔案分析錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '檔案分析失敗: ' + error.message 
        });
    }
});

// 雲端檔案分析端點
app.post('/api/analyze-cloud-document', async (req, res) => {
    try {
        const { url, type } = req.body;
        
        if (!url) {
            return res.status(400).json({ success: false, message: '沒有收到雲端檔案 URL' });
        }

        console.log('收到雲端檔案分析請求:', url);
        
        // 這裡應該調用相應的雲端服務 API 獲取檔案內容
        // 暫時使用模擬結果，實際應該獲取真實的檔案內容
        const mockText = `【雲端檔案分析結果】\n\n這是一個模擬的雲端檔案分析結果。實際應用中會通過 Google Docs API 或其他雲端服務 API 獲取檔案內容。\n\n檔案 URL: ${url}\n檔案類型: ${type || 'unknown'}`;
        
        res.json({
            success: true,
            text: mockText,
            url: url,
            type: type
        });
        
    } catch (error) {
        console.error('雲端檔案分析錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '雲端檔案分析失敗: ' + error.message 
        });
    }
});

// 音訊轉錄端點
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '沒有上傳音訊檔案' });
        }

        const { mimeType, languageCode } = req.body;
        const audioBuffer = req.file.buffer;

        console.log(`開始處理音訊檔案: ${req.file.originalname}, 大小: ${audioBuffer.length} bytes`);

        // 根據檔案大小選擇處理方式
        let transcription;
        if (audioBuffer.length > 10 * 1024 * 1024) { // 大於 10MB 使用長時間轉錄
            transcription = await audioProcessor.processLongAudio(
                audioBuffer, 
                mimeType || 'audio/wav', 
                languageCode || 'zh-TW'
            );
        } else {
            transcription = await audioProcessor.processAudioInChunks(
                audioBuffer, 
                mimeType || 'audio/wav'
            );
        }

        res.status(200).json({
            success: true,
            transcription: transcription,
            duration: req.file.size,
            language: languageCode || 'zh-TW'
        });

    } catch (error) {
        console.error('音訊轉錄錯誤:', error);
        res.status(500).json({
            message: '音訊轉錄失敗',
            error: error.message
        });
    }
});

// 啟動伺服器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI 任務派遣中心後端服務正在端口 ${PORT} 上運行`);
    console.log(`健康檢查端點: http://localhost:${PORT}/health`);
});
