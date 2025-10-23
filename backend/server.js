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
        'http://localhost:3000' // 開發環境
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

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
            dispatch: '/api/dispatch',
            notify: '/api/notify',
            transcribe: '/api/transcribe'
        }
    });
});

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        region: process.env.GOOGLE_CLOUD_REGION || 'unknown'
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
