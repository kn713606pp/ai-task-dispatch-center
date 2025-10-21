import React from 'react';
import type { Task, BackendStatus as BackendStatusType } from '../types';
import { JsonOutput } from './JsonOutput';
import { SummaryOutput } from './SummaryOutput';
import { BackendStatus } from './OpalStatus';

interface OutputSectionProps {
    tasks: Task[] | null;
    summary: string;
    backendStatus: BackendStatusType | null;
    error: string | null;
    isDispatching: boolean;
    onUpdateTasks: (newJsonText: string) => void;
    onDeleteTasks: () => void;
    onUpdateSummary: (newSummary: string) => void;
    onDispatch: () => void;
    onSendNotification: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({ 
    tasks, 
    summary, 
    backendStatus, 
    error,
    isDispatching,
    onUpdateTasks,
    onDeleteTasks,
    onUpdateSummary,
    onDispatch,
    onSendNotification
}) => {
    const jsonText = tasks ? JSON.stringify(tasks, null, 2) : (error || '等待輸入...');
    const showDispatchButton = tasks && !backendStatus && !error;

    return (
        <section className="space-y-8 mt-8">
            {showDispatchButton && (
                 <div className="card p-6 border-2 border-dashed border-indigo-400">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-700">2. 檢視與執行派遣</h2>
                    <p className="text-gray-600 mb-4">請確認下方由 AI 解析出的任務與摘要。確認無誤後，點擊按鈕將資料正式寫入後端系統。</p>
                    <button
                        onClick={onDispatch}
                        disabled={isDispatching}
                        className="w-full p-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150 shadow-lg text-lg flex items-center justify-center space-x-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span>{isDispatching ? '派遣中...' : '執行派遣至後端系統'}</span>
                    </button>
                </div>
            )}

            <JsonOutput 
                jsonText={jsonText} 
                hasError={!!error || !tasks} 
                onUpdate={onUpdateTasks}
                onDelete={onDeleteTasks}
            />
            <SummaryOutput 
                summaryText={summary} 
                onUpdate={onUpdateSummary}
            />
            {backendStatus && <BackendStatus status={backendStatus} onSendNotification={onSendNotification} />}
        </section>
    );
};