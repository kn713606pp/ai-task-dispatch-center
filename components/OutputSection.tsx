import React, { useState } from 'react';
import type { Task, BackendStatus } from '../types';

interface OutputSectionProps {
    tasks: Task[] | null;
    summary: string;
    backendStatus: BackendStatus | null;
    error: string | null;
    onUpdateTasks: (tasks: Task[]) => void;
    onDeleteTasks: (taskIds: string[]) => void;
    onUpdateSummary: (summary: string) => void;
    onDispatch: () => void;
    isDispatching: boolean;
    onSendNotification: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
    tasks,
    summary,
    backendStatus,
    error,
    onUpdateTasks,
    onDeleteTasks,
    onUpdateSummary,
    onDispatch,
    isDispatching,
    onSendNotification
}) => {
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [editingSummary, setEditingSummary] = useState(false);
    const [tempTaskData, setTempTaskData] = useState<Partial<Task>>({});

    const handleEditTask = (taskId: string, task: Task) => {
        setEditingTask(taskId);
        setTempTaskData({ ...task });
    };

    const handleSaveTask = (taskId: string) => {
        if (tasks && tempTaskData.title && tempTaskData.description) {
            const updatedTasks = tasks.map(task => 
                task.id === taskId 
                    ? { ...task, ...tempTaskData }
                    : task
            );
            onUpdateTasks(updatedTasks);
        }
        setEditingTask(null);
        setTempTaskData({});
    };

    const handleCancelEdit = () => {
        setEditingTask(null);
        setTempTaskData({});
    };

    const handleEditSummary = () => {
        setEditingSummary(true);
    };

    const handleSaveSummary = () => {
        onUpdateSummary(summary);
        setEditingSummary(false);
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('確定要刪除此任務嗎？')) {
            onDeleteTasks([taskId]);
        }
    };

    if (error) {
        return (
            <div className="card p-6 mb-6 bg-red-50 border-red-200">
                <h2 className="text-xl font-semibold mb-4 text-red-800">❌ 錯誤</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!tasks) {
        return (
            <div className="card p-6 mb-6 bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">📋 任務列表</h2>
                <p className="text-gray-600">等待任務輸入...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 摘要區域 */}
            <div className="card p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-blue-800">📝 任務摘要</h2>
                    <button
                        onClick={handleEditSummary}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                        ✏️ 編輯
                    </button>
                </div>
                
                {editingSummary ? (
                    <div className="space-y-3">
                        <textarea
                            value={summary}
                            onChange={(e) => onUpdateSummary(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={4}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveSummary}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                儲存
                            </button>
                            <button
                                onClick={() => setEditingSummary(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-700 whitespace-pre-wrap">{summary}</div>
                )}
            </div>

            {/* 任務列表 */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">📋 任務列表 ({tasks.length} 項)</h2>
                
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            {editingTask === task.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={tempTaskData.title || task.title}
                                        onChange={(e) => setTempTaskData({...tempTaskData, title: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="任務標題"
                                    />
                                    <textarea
                                        value={tempTaskData.description || task.description}
                                        onChange={(e) => setTempTaskData({...tempTaskData, description: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="任務描述"
                                        rows={3}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={tempTaskData.priority || task.priority}
                                            onChange={(e) => setTempTaskData({...tempTaskData, priority: e.target.value})}
                                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="低">低</option>
                                            <option value="中">中</option>
                                            <option value="高">高</option>
                                        </select>
                                        <select
                                            value={tempTaskData.category || task.category}
                                            onChange={(e) => setTempTaskData({...tempTaskData, category: e.target.value})}
                                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="開發">開發</option>
                                            <option value="設計">設計</option>
                                            <option value="行銷">行銷</option>
                                            <option value="營運">營運</option>
                                            <option value="其他">其他</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveTask(task.id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                        >
                                            儲存
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-lg text-gray-800">{task.title}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditTask(task.id, task)}
                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                            >
                                                ✏️ 編輯
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                            >
                                                🗑️ 刪除
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 mb-3">{task.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        <span className={`px-2 py-1 rounded ${
                                            task.priority === '高' ? 'bg-red-100 text-red-800' :
                                            task.priority === '中' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            優先級: {task.priority}
                                        </span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                            類別: {task.category}
                                        </span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                            負責人: {task.assignee}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                            截止: {task.dueDate}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 派遣按鈕 */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={onDispatch}
                        disabled={isDispatching}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        {isDispatching ? '🔄 派遣中...' : '🚀 執行派遣至後端系統'}
                    </button>
                </div>
            </div>

            {/* 後端狀態 */}
            {backendStatus && (
                <div className="card p-6 bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">📊 後端處理狀態</h2>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                                backendStatus.firestore.includes('✅') ? 'bg-green-500' :
                                backendStatus.firestore.includes('❌') ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm">{backendStatus.firestore}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                                backendStatus.sheets.includes('✅') ? 'bg-green-500' :
                                backendStatus.sheets.includes('❌') ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm">{backendStatus.sheets}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                                backendStatus.docs.includes('✅') ? 'bg-green-500' :
                                backendStatus.docs.includes('❌') ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm">{backendStatus.docs}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                                backendStatus.notification.includes('✅') ? 'bg-green-500' :
                                backendStatus.notification.includes('❌') ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm">{backendStatus.notification}</span>
                        </div>
                    </div>

                    {/* 通知按鈕 */}
                    {backendStatus.notification.includes('等待手動觸發') && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={onSendNotification}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                            >
                                📱 發送負責人通知
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
