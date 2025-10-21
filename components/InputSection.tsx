import React, { useState, useCallback } from 'react';
import { FileDropzone } from './FileDropzone';
import { VoiceInputButton } from './VoiceInputButton';
import { LiveRecorder } from './LiveRecorder';

interface InputSectionProps {
    onProcess: (text: string, url: string, files: File[], manualTask: string) => void;
    isLoading: boolean;
}

const RecordIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" className="text-red-500 animate-pulse" />
    </svg>
);


export const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading }) => {
    const [textInput, setTextInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [manualInput, setManualInput] = useState('');
    const [isRecorderOpen, setIsRecorderOpen] = useState(false);

    const handleProcessClick = useCallback(() => {
        onProcess(textInput, urlInput, files, manualInput);
    }, [onProcess, textInput, urlInput, files, manualInput]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        // For single-line input, submit with Enter
        if (e.currentTarget.id === 'manual-input' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleProcessClick();
        }
        // For textarea, submit with Cmd/Ctrl + Enter
        if (e.currentTarget.id === 'text-input' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleProcessClick();
        }
    }, [handleProcessClick]);

    const handleTranscriptReady = (transcript: string) => {
        setTextInput(prev => prev ? `${prev}\n\n--- 錄音逐字稿 ---\n${transcript}` : transcript);
        setIsRecorderOpen(false);
    };
    
    return (
        <section className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">1. 任務與點子輸入區</h2>
            <div className="space-y-4">
                <div className="flex items-start space-x-2">
                    <textarea
                        id="text-input"
                        rows={4}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="1. 自然語法輸入 (可按 Ctrl+Enter 提交) / 2. 手動貼文 (例如：王經理，這個新產品的合約請法務在下週一前完成審核，這是急件。)"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col space-y-2">
                        <VoiceInputButton onTranscriptChange={setTextInput} disabled={isLoading} />
                         <button
                            type="button"
                            onClick={() => setIsRecorderOpen(true)}
                            className="self-start p-3 bg-blue-500 text-white rounded-lg transition duration-150 shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="啟動 AI 錄音與逐字稿"
                            disabled={isLoading}
                        >
                            <RecordIcon />
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    id="manual-input"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    placeholder="5. 手動快速輸入單一任務 (可按 Enter 提交)"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                
                <input
                    type="text"
                    id="url-input"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    placeholder="7. 輸入 YouTube 連結或 Google Doc/Sheet 連結 (雲端檔案)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isLoading}
                />

                <FileDropzone onFilesChange={setFiles} disabled={isLoading} />
                
                <div className="pt-2">
                    <button
                        id="process-button"
                        className="w-full p-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-lg text-lg flex items-center justify-center space-x-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        onClick={handleProcessClick}
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span>{isLoading ? 'AI 解析中...' : '啟動 AI 任務解析'}</span>
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        第一步：點擊此處，僅啟動 AI 分析，將上方內容轉換為結構化任務。
                    </p>
                </div>
            </div>
            <LiveRecorder
                isOpen={isRecorderOpen}
                onClose={() => setIsRecorderOpen(false)}
                onTranscriptReady={handleTranscriptReady}
            />
        </section>
    );
};