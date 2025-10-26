import type { BackendStatusUpdate, Task, NotificationPayload } from '../types';

/**
 * 觸發後端資料持久化工作流程 (Firestore, Google Sheets, Google Docs)
 * @param tasks - 要派遣的任務陣列
 * @param summary - 任務摘要
 * @param onProgressUpdate - 用於更新前端 UI 狀態的回呼函式
 */
export const triggerDataPersistenceWorkflow = async (
    tasks: Task[],
    summary: string,
    onProgressUpdate: (update: BackendStatusUpdate) => void
): Promise<void> => {
    try {
        onProgressUpdate({ step: 'firestore', message: '1. 派遣任務至後端系統...' });

        // 對後端 /api/dispatch 端點發送真實的網路請求
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${apiBaseUrl}/api/dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks, summary }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `後端 API 錯誤: ${response.statusText}`);
        }

        // 根據後端回應更新前端狀態
        const responseData = await response.json();
        if (responseData.success) {
            onProgressUpdate({ step: 'firestore', message: '✅ 1. 任務成功寫入 Firestore！' });
            onProgressUpdate({ step: 'sheets', message: '✅ 2. 成功同步至 Google Sheets！' });
            onProgressUpdate({ step: 'docs', message: '✅ 3. Google Docs 文件已建立！' });
        } else {
            throw new Error(responseData.message || '後端處理失敗');
        }

    } catch (error) {
        console.error('Data Persistence Workflow error:', error);
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        onProgressUpdate({ step: 'firestore', message: `❌ **資料儲存中斷：** 發生錯誤。` });
        onProgressUpdate({ step: 'sheets', message: errorMessage });
    }
};

/**
 * 觸發後端通知服務 (Line, Gmail)
 * @param notifications - 包含負責人聯絡資訊和對應任務的通知負載
 * @param onProgressUpdate - 用於更新前端 UI 狀態的回呼函式
 */
export const triggerNotificationService = async (
    notifications: NotificationPayload[],
    onProgressUpdate: (update: BackendStatusUpdate) => void
): Promise<void> => {
    try {
        onProgressUpdate({ step: 'notification', message: '4. 發送通知給任務負責人...' });

        // 對後端 /api/notify 端點發送真實的網路請求
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${apiBaseUrl}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notifications }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `後端通知 API 錯誤: ${response.statusText}`);
        }
        
        onProgressUpdate({ step: 'notification', message: '✅ 4. 任務負責人通知已發送！' });
    } catch (error) {
        console.error('Notification Service error:', error);
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        onProgressUpdate({ step: 'notification', message: `❌ **通知發送失敗：** ${errorMessage}` });
    }
};
