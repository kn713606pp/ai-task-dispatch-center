import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from '../constants';
import { fileToBase64 } from '../utils/fileUtils';
import type { GeminiResponse } from '../types';

// 實現 AI 任務截取與結構化規則的服務
export const processInputs = async (text: string, url: string, files: File[], manualTask: string): Promise<GeminiResponse | null> => {
    try {
        // 調用後端 AI 分析 API
        const inputContent = text || manualTask || '從音訊轉錄的任務';
        
        const response = await fetch(`${process.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: inputContent,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`AI 分析失敗: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.tasks && result.summary) {
            return {
                tasks: result.tasks,
                summary: result.summary
            };
        } else {
            throw new Error(result.message || 'AI 分析回應格式錯誤');
        }
        
    } catch (error) {
        console.error('AI 處理錯誤:', error);
        return null;
    }
};