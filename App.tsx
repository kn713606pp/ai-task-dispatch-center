import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { LoadingSpinner } from './components/LoadingSpinner';
import { processInputs } from './services/geminiService';
import { triggerDataPersistenceWorkflow, triggerNotificationService } from './services/opalService';
import type { Task, BackendStatus, Assignee, NotificationPayload } from './types';
import { AssigneeManager } from './components/AssigneeManager';
import { AudioProcessor } from './components/AudioProcessor';

const ASSIGNEE_NAMES = ['艾蜜莉', '班傑明', '克蘿伊', '丹尼爾', '奥莉薇亞'];

const App: React.FC = () => {
    const [tasks, setTasks] = useState<Task[] | null>(null);
    const [summary, setSummary] = useState<string>('等待輸入...');
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [isDispatching, setIsDispatching] = useState<boolean>(false);
    const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
    const [assignees, setAssignees] = useState<Assignee[]>(() =>
        ASSIGNEE_NAMES.map(name => ({
            name,
            lineId: '',
            gmail: ''
        }))
    );

    const handleAudioTranscription = useCallback((transcription: string) => {
        // 將轉錄文字作為輸入進行分析
        handleAnalyze(transcription, '', [], '');
    }, []);

    const handleAnalyze = useCallback(async (text: string, url: string, files: File[], manualTask: string) => {
        if (!text && !url && files.length === 0 && !manualTask) {
            alert('請至少輸入文字、連結、檔案或手動輸入任務。');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setTasks(null);
        setSummary('摘要生成中...');
        setBackendStatus(null);

        try {
            const aiResponse = await processInputs(text, url, files, manualTask);
            
            if (aiResponse) {
                setTasks(aiResponse.tasks);
                setSummary(aiResponse.summary || "無須總結，輸入為簡短指令。");
            } else {
                 throw new Error("AI 模型未能產生有效的輸出。");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '發生未知錯誤';
            console.error("Processing error:", errorMessage);
            setError(`錯誤: AI 處理失敗。詳情請查看控制台。(${errorMessage})`);
            setSummary("無法生成摘要。");
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const handleDispatch = useCallback(async () => {
        if (!tasks) {
            alert('沒有可派遣的任務。');
            return;
        }
        setIsDispatching(true);
        const initialStatus: BackendStatus = {
            firestore: '準備中...',
            sheets: '等待中...',
            docs: '等待中...',
            notification: '等待手動觸發「負責人通知」'
        };
        setBackendStatus(initialStatus);

        await triggerDataPersistenceWorkflow(
            tasks,
            summary,
            (update) => {
                setBackendStatus(prevStatus => ({
                    ...prevStatus!,
                    [update.step]: update.message,
                }));
            }
        );
        setIsDispatching(false);
    }, [tasks, summary]);

    const handleSendNotification = useCallback(async () => {
        if (!backendStatus || !backendStatus.notification.includes('等待') || !tasks) {
            alert('通知已在發送中、已完成或沒有任務可通知。');
            return;
        }

        // 智慧型通知邏輯：將任務按負責人分組
        const notificationsMap = new Map<string, { assignee: Assignee; tasks: Task[] }>();
        
        for (const task of tasks) {
            const assigneeInfo = assignees.find(a => a.name === task.assignee);
            if (!assigneeInfo) {
                console.warn(`找不到負責人 "${task.assignee}" 的聯絡資訊，將跳過此任務的通知。`);
                continue;
            }

            if (!assigneeInfo.lineId && !assigneeInfo.gmail) {
                 alert(`負責人 "${assigneeInfo.name}" 尚未設定 Line 或 Gmail 聯絡資訊，無法發送通知。請先至「管理負責人聯絡資訊」面板中設定。`);
                 return; // 中斷發送流程
            }

            if (!notificationsMap.has(assigneeInfo.name)) {
                notificationsMap.set(assigneeInfo.name, { assignee: assigneeInfo, tasks: [] });
            }
            notificationsMap.get(assigneeInfo.name)!.tasks.push(task);
        }

        const notificationPayloads: NotificationPayload[] = Array.from(notificationsMap.values());
        
        if (notificationPayloads.length === 0) {
            alert('所有任務負責人均未設定聯絡資訊，無法發送任何通知。');
            return;
        }

        await triggerNotificationService(notificationPayloads, (update) => {
            setBackendStatus(prevStatus => ({
                ...prevStatus!,
                [update.step]: update.message,
            }));
        });
    }, [backendStatus, tasks, assignees]);

    const handleUpdateTasks = useCallback((newJsonText: string) => {
        try {
            const newTasks = JSON.parse(newJsonText);
            setTasks(newTasks);
            alert('JSON 已成功更新！');
        } catch (e) {
            alert('更新失敗：輸入的內容不是有效的 JSON 格式。');
        }
    }, []);

    const handleDeleteTasks = useCallback(() => {
        if (window.confirm('確定要刪除所有任務嗎？')) {
            setTasks(null);
            setBackendStatus(null); // Also clear backend status
        }
    }, []);

    const handleUpdateSummary = useCallback((newSummary: string) => {
        setSummary(newSummary);
        alert('摘要已成功更新！');
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Header />

            <div className="text-right mb-4 -mt-6">
                <button
                    onClick={() => setIsManagerOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                    管理負責人聯絡資訊
                </button>
            </div>

            <main>
                <AudioProcessor onTranscriptionComplete={handleAudioTranscription} />
                <InputSection onProcess={handleAnalyze} isLoading={isAnalyzing} />
                {isAnalyzing && <LoadingSpinner />}
                <OutputSection 
                    tasks={tasks} 
                    summary={summary} 
                    backendStatus={backendStatus} 
                    error={error}
                    onUpdateTasks={handleUpdateTasks}
                    onDeleteTasks={handleDeleteTasks}
                    onUpdateSummary={handleUpdateSummary}
                    onDispatch={handleDispatch}
                    isDispatching={isDispatching}
                    onSendNotification={handleSendNotification}
                />
            </main>
            
            <AssigneeManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                assignees={assignees}
                onSave={setAssignees}
            />
        </div>
    );
};

export default App;
