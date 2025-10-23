import React, { useState, useCallback } from 'react';

interface InputSectionProps {
    onProcess: (text: string, url: string, files: File[], manualTask: string) => void;
    isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading }) => {
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [manualTask, setManualTask] = useState('');

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        // 手動輸入任務的 Enter 提交
        if (e.currentTarget.id === 'manual-input' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleProcess();
        }
        // 主要文字輸入的 Cmd/Ctrl + Enter 提交
        if (e.currentTarget.id === 'text-input' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleProcess();
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleProcess = () => {
        onProcess(text, url, files, manualTask);
    };

    return (
        <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 輸入任務資訊</h2>
            
            <div className="space-y-4">
                {/* 主要文字輸入 */}
                <div>
                    <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                        主要內容（文字、指令、貼文等）
                    </label>
                    <textarea
                        id="text-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="請輸入任務相關的文字內容..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">按 Cmd/Ctrl + Enter 快速提交</p>
                </div>

                {/* URL 輸入 */}
                <div>
                    <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
                        重要連結
                    </label>
                    <input
                        id="url-input"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                </div>

                {/* 檔案上傳 */}
                <div>
                    <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                        檔案上傳
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    {files.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600">已選擇檔案：</p>
                            <ul className="text-sm text-gray-500">
                                {files.map((file, index) => (
                                    <li key={index}>• {file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 手動任務輸入 */}
                <div>
                    <label htmlFor="manual-input" className="block text-sm font-medium text-gray-700 mb-2">
                        手動輸入單一任務
                    </label>
                    <input
                        id="manual-input"
                        type="text"
                        value={manualTask}
                        onChange={(e) => setManualTask(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="直接輸入一個具體任務..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">按 Enter 快速提交</p>
                </div>

                {/* 處理按鈕 */}
                <button
                    onClick={handleProcess}
                    disabled={isLoading || (!text && !url && files.length === 0 && !manualTask)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                    {isLoading ? '🔄 分析中...' : '🚀 開始分析任務'}
                </button>
            </div>
        </div>
    );
};
