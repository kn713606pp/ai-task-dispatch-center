import React, { useState, useMemo } from 'react';

interface SummaryOutputProps {
    summaryText: string;
    onUpdate: (newSummary: string) => void;
}

export const SummaryOutput: React.FC<SummaryOutputProps> = ({ summaryText, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(summaryText);

    const summaryItems = useMemo(() => {
        if (!summaryText || summaryText === '等待輸入...' || summaryText.includes('無須總結')) return [];
        return summaryText
            .split('\n')
            .map(line => line.trim().replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''))
            .filter(line => line.length > 0);
    }, [summaryText]);

    const handleEditToggle = () => {
        if (isEditing) {
            onUpdate(editedText);
        } else {
            setEditedText(summaryText);
        }
        setIsEditing(!isEditing);
    };

    return (
        <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">總結摘要 (Google Docs 格式)</h2>
            <div className="text-sm text-gray-500 mb-2">此內容已發送給 Opal 自動建立 Google Docs 文件並觸發 Line 通知。</div>
            
            {isEditing ? (
                <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-40 p-3 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            ) : (
                <div className="bg-gray-100 p-4 rounded-lg text-sm min-h-[100px] max-h-96 custom-scrollbar">
                    {summaryItems.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-1">
                            {summaryItems.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ol>
                    ) : (
                        <p>{summaryText}</p>
                    )}
                </div>
            )}
            
            <button
                onClick={handleEditToggle}
                className="mt-4 p-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition duration-150"
            >
                {isEditing ? '儲存摘要' : '編輯摘要'}
            </button>
        </div>
    );
};