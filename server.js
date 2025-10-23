// server.js
// 這是一個使用 Node.js 和 Express 框架建立的後端伺服器範例。
// 它的職責是安全地處理 API 金鑰，並代表前端應用程式與外部服務 (Google, Line) 進行通訊。

const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { google } = require('googleapis');
const axios = require('axios');
const nodemailer = require('nodemailer');

// --- 初始化設定 ---
const app = express();
const PORT = process.env.PORT || 3001; // 後端伺服器將在此埠號運行

// --- 中介軟體 (Middleware) ---
app.use(cors()); // 允許來自前端的跨域請求
app.use(express.json()); // 解析傳入的 JSON 請求體

// --- Google Cloud & Firestore 初始化 ---
// 在執行此伺服器之前，請確保您已設定好 Google Cloud 服務帳戶，
// 並將金鑰檔案的路徑設定在環境變數 GOOGLE_APPLICATION_CREDENTIALS 中。
// 例如: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
const firestore = new Firestore();

// --- API 端點 (Endpoints) ---

/**
 * @route POST /api/dispatch
 * @desc 接收任務和摘要，並將它們儲存到 Firestore、Google Sheets 和 Google Docs。
 */
app.post('/api/dispatch', async (req, res) => {
    const { tasks, summary } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: '無效的任務資料。' });
    }

    try {
        // 1. 將任務寫入 Firestore
        const batch = firestore.batch();
        const collectionRef = firestore.collection(process.env.FIRESTORE_COLLECTION || 'tasks');
        tasks.forEach(task => {
            const docRef = collectionRef.doc(); // 自動生成文件 ID
            batch.set(docRef, task);
        });
        await batch.commit();
        console.log('成功將任務寫入 Firestore。');

        // 2. 將任務同步至 Google Sheets
        // TODO: 填入您的 Google Sheet ID
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
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
            spreadsheetId: SPREADSHEET_ID,
            range: 'A1', // 從 A1 開始附加
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        console.log('成功將任務同步至 Google Sheets。');

        // 3. 建立 Google Docs 文件
        const docsAuth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/documents'],
        });
        const docs = google.docs({ version: 'v1', auth: docsAuth });
        const docTitle = `任務摘要 - ${new Date().toLocaleDateString('zh-TW')}`;
        
        await docs.documents.create({
            requestBody: {
                title: docTitle,
            },
        });
        console.log(`成功建立 Google Docs 文件: ${docTitle}`);
        // 注意：為了簡化，這裡只建立了空文件。您可以使用 documents.batchUpdate 來寫入摘要內容。

        res.status(200).json({ success: true, message: '所有資料已成功派遣。' });

    } catch (error) {
        console.error('派遣過程中發生錯誤:', error);
        res.status(500).json({ message: '後端處理失敗。', error: error.message });
    }
});

/**
 * @route POST /api/notify
 * @desc 接收通知請求，並透過 Line Notify 和 Gmail 發送。
 */
app.post('/api/notify', async (req, res) => {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
        return res.status(400).json({ message: '無效的通知資料。' });
    }

    // 設定 Gmail 發送器
    // TODO: 在環境變數中設定您的 Gmail 帳號和應用程式密碼
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // 您的 Gmail
            pass: process.env.GMAIL_APP_PASSWORD, // 您的 Gmail 應用程式密碼
        },
    });

    try {
        for (const payload of notifications) {
            const { assignee, tasks } = payload;
            const taskList = tasks.map(t => `- ${t.title} (優先級: ${t.priority})`).join('\n');
            const message = `\n您有新的任務指派：\n\n${taskList}\n\n請儘速處理。`;

            // a. 發送 Line Notify
            if (assignee.lineId) { // lineId 欄位現在儲存的是 Line Notify Token
                await axios.post('https://notify-api.line.me/api/notify', `message=${encodeURIComponent(message)}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${assignee.lineId}`,
                    },
                });
                console.log(`已向 ${assignee.name} 發送 Line 通知。`);
            }

            // b. 發送 Gmail
            if (assignee.gmail) {
                await transporter.sendMail({
                    from: `"AI 任務派遣中心" <${process.env.GMAIL_USER}>`,
                    to: assignee.gmail,
                    subject: '【重要通知】您有新的任務指派',
                    text: `哈囉 ${assignee.name}，\n\n${message}`,
                });
                console.log(`已向 ${assignee.name} (${assignee.gmail}) 發送 Gmail 通知。`);
            }
        }
        res.status(200).json({ success: true, message: '所有通知已成功發送。' });
    } catch (error) {
        console.error('通知發送過程中發生錯誤:', error);
        res.status(500).json({ message: '通知發送失敗。', error: error.message });
    }
});


// --- 啟動伺服器 ---
app.listen(PORT, () => {
    console.log(`後端伺服器正在 http://localhost:${PORT} 上運行`);
});
