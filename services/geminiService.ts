import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from '../constants';
import { fileToBase64 } from '../utils/fileUtils';
import type { GeminiResponse } from '../types';

// 實現 AI 任務截取與結構化規則的服務
export const processInputs = async (text: string, url: string, files: File[], manualTask: string): Promise<GeminiResponse | null> => {
    try {
        // 模擬 AI 處理時間
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 根據規則解析輸入內容
        const inputContent = text || manualTask || '從音訊轉錄的任務';
        
        // 第一層：特殊指令與優先級判斷
        let priority = '中';
        let category = '待分配';
        let assignee = '艾蜜莉';
        let dueDate = null;
        let title = inputContent;
        let description = inputContent;
        
        // 檢查董總交辦
        if (inputContent.includes('老闆交代') || inputContent.includes('董事長說') || 
            inputContent.includes('總經理指示') || inputContent.includes('James說')) {
            priority = '緊急';
            category = '董總交辦';
            assignee = '艾蜜莉';
            dueDate = '2025-09-28';
            description = `${inputContent}\n\n此為董總交辦事項，請艾蜜莉確認任務細節後手動調整指派。`;
        }
        // 檢查副總任務
        else if (inputContent.includes('我需要') || inputContent.includes('我這邊') || 
                 inputContent.includes('我的任務') || inputContent.includes('幫我處理')) {
            priority = '高';
            // 繼續進入第二層分析
        }
        // 檢查急件
        else if (inputContent.includes('急') || inputContent.includes('緊急') || 
                 inputContent.includes('立刻') || inputContent.includes('馬上') || 
                 inputContent.includes('今天完成') || inputContent.includes('十萬火急')) {
            priority = '緊急';
            title = `【急件】${inputContent}`;
            // 繼續進入第二層分析
        }
        
        // 第二層：部門關鍵字與負責人指派
        if (category === '待分配' || priority === '高' || priority === '緊急') {
            // 品質確保
            if (inputContent.includes('品質') || inputContent.includes('QC') || 
                inputContent.includes('檢驗') || inputContent.includes('測試') || 
                inputContent.includes('SOP') || inputContent.includes('COA') || 
                inputContent.includes('ISO') || inputContent.includes('GMPC') || 
                inputContent.includes('客訴') || inputContent.includes('異常') || 
                inputContent.includes('法規')) {
                category = '品質確保';
                assignee = '艾蜜莉';
            }
            // 有機新產品
            else if (inputContent.includes('研發') || inputContent.includes('R&D') || 
                     inputContent.includes('新品') || inputContent.includes('配方') || 
                     inputContent.includes('打樣') || inputContent.includes('成分') || 
                     inputContent.includes('原料') || inputContent.includes('植萃') || 
                     inputContent.includes('實驗') || inputContent.includes('試產')) {
                category = '有機新產品';
                assignee = '班傑明';
            }
            // 運籌
            else if (inputContent.includes('供應鏈') || inputContent.includes('物流') || 
                     inputContent.includes('倉儲') || inputContent.includes('庫存') || 
                     inputContent.includes('採購') || inputContent.includes('詢價') || 
                     inputContent.includes('訂單') || inputContent.includes('供應商') || 
                     inputContent.includes('進出口') || inputContent.includes('ERP')) {
                category = '運籌';
                assignee = '克蘿伊';
            }
            // 代工
            else if (inputContent.includes('代工') || inputContent.includes('OEM') || 
                     inputContent.includes('ODM') || inputContent.includes('客戶') || 
                     inputContent.includes('品牌') || inputContent.includes('報價') || 
                     inputContent.includes('量產') || inputContent.includes('交期') || 
                     inputContent.includes('出貨排程')) {
                category = '代工';
                assignee = '丹尼爾';
            }
            // 法務
            else if (inputContent.includes('合約') || inputContent.includes('協議') || 
                     inputContent.includes('法律') || inputContent.includes('訴訟') || 
                     inputContent.includes('智財') || inputContent.includes('專利') || 
                     inputContent.includes('商標') || inputContent.includes('審核')) {
                category = '法務';
                assignee = '艾蜜莉';
            }
            // 人資
            else if (inputContent.includes('招募') || inputContent.includes('面試') || 
                     inputContent.includes('薪資') || inputContent.includes('考績') || 
                     inputContent.includes('勞健保') || inputContent.includes('訓練')) {
                category = '人資';
                assignee = '奥莉薇亞';
            }
            // 行政
            else if (inputContent.includes('會議') || inputContent.includes('會議室') || 
                     inputContent.includes('差旅') || inputContent.includes('訂機票') || 
                     inputContent.includes('訂飯店') || inputContent.includes('訪客') || 
                     inputContent.includes('文具') || inputContent.includes('檔案管理')) {
                category = '行政';
                assignee = '奥莉薇亞';
            }
            // 總務
            else if (inputContent.includes('維修') || inputContent.includes('保養') || 
                     inputContent.includes('設備') || inputContent.includes('水電') || 
                     inputContent.includes('裝修') || inputContent.includes('辦公室') || 
                     inputContent.includes('清潔') || inputContent.includes('公務車')) {
                category = '總務';
                assignee = '奥莉薇亞';
            }
            // 能設
            else if (inputContent.includes('能設') || inputContent.includes('廠務') || 
                     inputContent.includes('水電') || inputContent.includes('空調') || 
                     inputContent.includes('機台') || inputContent.includes('工程') || 
                     inputContent.includes('施工') || inputContent.includes('能源') || 
                     inputContent.includes('消防')) {
                category = '能設';
                assignee = '班傑明';
            }
            // 職安
            else if (inputContent.includes('職安') || inputContent.includes('工安') || 
                     inputContent.includes('環安衛') || inputContent.includes('EHS') || 
                     inputContent.includes('消防演習') || inputContent.includes('急救') || 
                     inputContent.includes('化學品') || inputContent.includes('SDS')) {
                category = '職安';
                assignee = '克蘿伊';
            }
        }
        
        // 創建任務
        const mockTasks = [
            {
                id: `task_${Date.now()}`,
                title: title,
                description: description,
                priority: priority,
                status: '待辦事項',
                category: category,
                assignee: assignee,
                dueDate: dueDate
            }
        ];
        
        // 生成摘要
        const summary = inputContent.length > 100 ? 
            `• 任務內容：${inputContent}\n• 優先級：${priority}\n• 負責部門：${category}\n• 負責人：${assignee}` : 
            '無須總結';
        
        return {
            tasks: mockTasks,
            summary: summary
        };
    } catch (error) {
        console.error('AI 處理錯誤:', error);
        return null;
    }
};