// Vercel Serverless API - 通知端點
const axios = require('axios');
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // 設定 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: '只允許 POST 請求' });
    }

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
        for (const payload of notifications) {
            const { assignee, tasks } = payload;
            const taskList = tasks.map(t => `- ${t.title} (優先級: ${t.priority})`).join('\n');
            const message = `\n您有新的任務指派：\n\n${taskList}\n\n請儘速處理。`;

            // 發送 Line Notify
            if (assignee.lineId) {
                await axios.post('https://notify-api.line.me/api/notify', `message=${encodeURIComponent(message)}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${assignee.lineId}`,
                    },
                });
                console.log(`已向 ${assignee.name} 發送 Line 通知。`);
            }

            // 發送 Gmail
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
}
