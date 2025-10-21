import React, { useCallback, useState, useRef, useEffect } from 'react';

interface JsonOutputProps {
    jsonText: string;
    hasError: boolean;
    onUpdate: (newJsonText: string) => void;
    onDelete: () => void;
}

export const JsonOutput: React.FC<JsonOutputProps> = ({ jsonText, hasError, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.textContent = jsonText;
        }
    }, [jsonText]);
    
    const handleCopy = useCallback(() => {
        if (hasError) {
            alert('沒有可複製的有效 JSON 數據。');
            return;
        }
        navigator.clipboard.writeText(jsonText).then(() => {
            alert('JSON 數據已成功複製到剪貼板！');
        }).catch(err => {
            console.error('無法複製到剪貼板', err);
            alert('複製失敗，請手動複製文本框中的內容。');
        });
    }, [jsonText, hasError]);

    const handleEditToggle = () => {
        if (isEditing && preRef.current) {
            onUpdate(preRef.current.textContent || '');
        }
        setIsEditing(!isEditing);
    };
    
    return (
        <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-700">結構化工作任務 (JSON)</h2>
            <div className="text-sm text-gray-500 mb-2">此資料已發送給 Opal 自動寫入「任務總清單」Sheets。</div>
            <pre 
                ref={preRef}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                className={`bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 custom-scrollbar ${isEditing ? 'ring-2 ring-indigo-500 focus:outline-none' : ''}`}
            >
            </pre>
            <div className="mt-4 space-x-2">
                 <button
                    onClick={handleCopy}
                    disabled={hasError || isEditing}
                    className="p-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition duration-150 disabled:bg-gray-400"
                >
                    複製 JSON
                </button>
                <button
                    onClick={handleEditToggle}
                    disabled={hasError}
                    className="p-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition duration-150 disabled:bg-gray-400"
                >
                    {isEditing ? '儲存' : '編輯'}
                </button>
                 <button
                    onClick={onDelete}
                    disabled={hasError || isEditing}
                    className="p-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition duration-150 disabled:bg-gray-400"
                >
                    刪除
                </button>
            </div>
        </div>
    );
};