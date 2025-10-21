// Vercel Serverless API - 任務派遣端點
const { Firestore } = require('@google-cloud/firestore');
const { google } = require('googleapis');
const axios = require('axios');
const nodemailer = require('nodemailer');

// 初始化 Firestore
const firestore = new Firestore();

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

    const { tasks, summary } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: '無效的任務資料。' });
    }

    try {
        // 1. 將任務寫入 Firestore
        const batch = firestore.batch();
        const collectionRef = firestore.collection(process.env.FIRESTORE_COLLECTION || 'tasks');
        tasks.forEach(task => {
            const docRef = collectionRef.doc();
            batch.set(docRef, task);
        });
        await batch.commit();
        console.log('成功將任務寫入 Firestore。');

        // 2. 將任務同步至 Google Sheets (如果設定了)
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

        res.status(200).json({ success: true, message: '所有資料已成功派遣。' });

    } catch (error) {
        console.error('派遣過程中發生錯誤:', error);
        res.status(500).json({ message: '後端處理失敗。', error: error.message });
    }
}
