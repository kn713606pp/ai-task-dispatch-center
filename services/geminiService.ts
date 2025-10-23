import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from '../constants';
import { fileToBase64 } from '../utils/fileUtils';
import type { GeminiResponse } from '../types';

// 暫時使用模擬的 AI 服務，避免依賴問題
export const processInputs = async (text: string, url: string, files: File[], manualTask: string): Promise<GeminiResponse | null> => {
    try {
        // 模擬 AI 處理時間
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 創建模擬的任務數據
        const mockTasks = [
            {
                id: `task_${Date.now()}`,
                title: text || manualTask || '從音訊轉錄的任務',
                description: text || manualTask || '這是一個模擬的任務，用於測試音訊輸入功能',
                priority: '高',
                status: '待辦事項',
                category: '測試',
                assignee: '艾蜜莉',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];
        
        const mockSummary = text || manualTask || '這是一個模擬的摘要，用於測試音訊輸入功能';
        
        return {
            tasks: mockTasks,
            summary: mockSummary
        };
    } catch (error) {
        console.error('AI 處理錯誤:', error);
        return null;
    }
};