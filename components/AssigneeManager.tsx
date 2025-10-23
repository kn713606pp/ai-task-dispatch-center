import React, { useState, useEffect } from 'react';
import type { Assignee } from '../types';

interface AssigneeManagerProps {
    isOpen: boolean;
    onClose: () => void;
    assignees: Assignee[];
    onSave: (assignees: Assignee[]) => void;
}

export const AssigneeManager: React.FC<AssigneeManagerProps> = ({
    isOpen,
    onClose,
    assignees,
    onSave
}) => {
    const [localAssignees, setLocalAssignees] = useState<Assignee[]>(assignees);
    const [newAssignee, setNewAssignee] = useState({ name: '', lineId: '', gmail: '' });

    useEffect(() => {
        setLocalAssignees(assignees);
    }, [assignees]);

    const handleSave = () => {
        onSave(localAssignees);
        onClose();
    };

    const handleUpdateAssignee = (index: number, field: keyof Assignee, value: string) => {
        const updated = [...localAssignees];
        updated[index] = { ...updated[index], [field]: value };
        setLocalAssignees(updated);
    };

    const handleAddAssignee = () => {
        if (newAssignee.name.trim()) {
            setLocalAssignees([...localAssignees, { ...newAssignee }]);
            setNewAssignee({ name: '', lineId: '', gmail: '' });
        }
    };

    const handleRemoveAssignee = (index: number) => {
        if (window.confirm('確定要刪除此負責人嗎？')) {
            const updated = localAssignees.filter((_, i) => i !== index);
            setLocalAssignees(updated);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">👥 管理負責人聯絡資訊</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 現有負責人列表 */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">現有負責人</h3>
                        <div className="space-y-3">
                            {localAssignees.map((assignee, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                姓名
                                            </label>
                                            <input
                                                type="text"
                                                value={assignee.name}
                                                onChange={(e) => handleUpdateAssignee(index, 'name', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Line Notify Token
                                            </label>
                                            <input
                                                type="text"
                                                value={assignee.lineId}
                                                onChange={(e) => handleUpdateAssignee(index, 'lineId', e.target.value)}
                                                placeholder="Line Notify 權杖"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Gmail
                                            </label>
                                            <input
                                                type="email"
                                                value={assignee.gmail}
                                                onChange={(e) => handleUpdateAssignee(index, 'gmail', e.target.value)}
                                                placeholder="example@gmail.com"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleRemoveAssignee(index)}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                        >
                                            🗑️ 刪除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 新增負責人 */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">新增負責人</h3>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        姓名
                                    </label>
                                    <input
                                        type="text"
                                        value={newAssignee.name}
                                        onChange={(e) => setNewAssignee({...newAssignee, name: e.target.value})}
                                        placeholder="負責人姓名"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Line Notify Token
                                    </label>
                                    <input
                                        type="text"
                                        value={newAssignee.lineId}
                                        onChange={(e) => setNewAssignee({...newAssignee, lineId: e.target.value})}
                                        placeholder="Line Notify 權杖"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gmail
                                    </label>
                                    <input
                                        type="email"
                                        value={newAssignee.gmail}
                                        onChange={(e) => setNewAssignee({...newAssignee, gmail: e.target.value})}
                                        placeholder="example@gmail.com"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={handleAddAssignee}
                                    disabled={!newAssignee.name.trim()}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    ➕ 新增負責人
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 使用說明 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">📋 使用說明</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Line Notify Token:</strong> 從 Line Notify 官方網站取得個人權杖</li>
                            <li>• <strong>Gmail:</strong> 用於發送郵件通知的電子郵件地址</li>
                            <li>• 至少需要設定其中一種聯絡方式才能發送通知</li>
                            <li>• 負責人姓名會用於任務指派和通知分組</li>
                        </ul>
                    </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        儲存設定
                    </button>
                </div>
            </div>
        </div>
    );
};
