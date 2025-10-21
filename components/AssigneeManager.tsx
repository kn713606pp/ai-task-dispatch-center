import React, { useState, useEffect } from 'react';
import type { Assignee } from '../types';

interface AssigneeManagerProps {
    isOpen: boolean;
    onClose: () => void;
    assignees: Assignee[];
    onSave: (updatedAssignees: Assignee[]) => void;
}

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const AssigneeManager: React.FC<AssigneeManagerProps> = ({ isOpen, onClose, assignees, onSave }) => {
    const [localAssignees, setLocalAssignees] = useState<Assignee[]>(assignees);

    useEffect(() => {
        setLocalAssignees(assignees);
    }, [assignees, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleInputChange = (index: number, field: keyof Assignee, value: string) => {
        const updated = [...localAssignees];
        updated[index] = { ...updated[index], [field]: value };
        setLocalAssignees(updated);
    };

    const handleAdd = () => {
        const newName = window.prompt("請輸入新負責人的姓名：")?.trim();
        if (newName) {
            if (localAssignees.some(a => a.name === newName)) {
                alert("錯誤：此姓名已存在。");
                return;
            }
            const newAssignee: Assignee = { name: newName, lineId: '', gmail: '' };
            setLocalAssignees(prev => [...prev, newAssignee]);
        }
    };

    const handleDelete = (indexToDelete: number) => {
        if (window.confirm(`確定要刪除負責人 "${localAssignees[indexToDelete].name}" 嗎？`)) {
            setLocalAssignees(prev => prev.filter((_, index) => index !== indexToDelete));
        }
    };

    const handleSave = () => {
        const names = localAssignees.map(a => a.name.trim());
        if (names.some(name => name === '')) {
            alert("儲存失敗：負責人姓名不可為空。");
            return;
        }
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            alert("儲存失敗：負責人姓名不可重複。");
            return;
        }
        onSave(localAssignees);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="card w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">負責人聯絡資訊管理</h2>
                    <button onClick={handleAdd} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium">
                        新增負責人
                    </button>
                </div>
                <p className="text-sm text-gray-500 mb-6">此處設定的資訊將用於「通知任務負責人」功能。後端系統會使用這些資訊來呼叫真實的 Line 或 Gmail API。</p>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {localAssignees.map((assignee, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg relative group">
                            <button
                                onClick={() => handleDelete(index)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={`刪除 ${assignee.name}`}
                            >
                                <TrashIcon />
                            </button>
                             <div className="mb-3">
                                <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-600">姓名</label>
                                <input
                                    type="text"
                                    id={`name-${index}`}
                                    placeholder="請輸入姓名"
                                    value={assignee.name}
                                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor={`line-${index}`} className="block text-sm font-medium text-gray-600">Line Notify 權杖 (Token)</label>
                                    <input
                                        type="text"
                                        id={`line-${index}`}
                                        placeholder="請輸入 Line Notify 權杖"
                                        value={assignee.lineId}
                                        onChange={(e) => handleInputChange(index, 'lineId', e.target.value)}
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`gmail-${index}`} className="block text-sm font-medium text-gray-600">Gmail</label>
                                    <input
                                        type="email"
                                        id={`gmail-${index}`}
                                        placeholder="請輸入 Gmail 電子郵件"
                                        value={assignee.gmail}
                                        onChange={(e) => handleInputChange(index, 'gmail', e.target.value)}
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        取消
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        儲存變更
                    </button>
                </div>
            </div>
        </div>
    );
};