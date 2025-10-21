import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { blobToBase64 } from '../utils/fileUtils';

interface LiveRecorderProps {
    isOpen: boolean;
    onClose: () => void;
    onTranscriptReady: (transcript: string) => void;
}

type Status = 'idle' | 'recording' | 'paused' | 'recorded' | 'transcribing' | 'finished' | 'error';

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
};

export const LiveRecorder: React.FC<LiveRecorderProps> = ({ isOpen, onClose, onTranscriptReady }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [transcript, setTranscript] = useState('');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cleanup = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
    }, []);

    const resetState = useCallback(() => {
        cleanup();
        setStatus('idle');
        setTranscript('');
        setAudioBlob(null);
        setRecordingTime(0);
        setError(null);
    }, [cleanup]);

    const handleClose = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording' || mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.stop();
        }
        resetState();
        onClose();
    }, [resetState, onClose]);


    const startRecording = useCallback(async () => {
        resetState();
        setStatus('recording');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' });
                setAudioBlob(blob);
                setStatus('recorded');
                cleanup();
            };
            
            mediaRecorderRef.current.start();
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (err) {
            console.error('麥克風啟動失敗:', err);
            setError('無法啟動麥克風。請檢查權限設定。');
            setStatus('error'); // Set error status, but no audioBlob exists yet.
            cleanup();
        }
    }, [cleanup, resetState]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.pause();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setStatus('paused');
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "paused") {
            mediaRecorderRef.current.resume();
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);
            setStatus('recording');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
            mediaRecorderRef.current.stop();
        }
    }, []);
    
    const generateTranscript = useCallback(async () => {
        if (!audioBlob) return;
        setStatus('transcribing');
        setError(null);
        
        try {
            const base64Data = await blobToBase64(audioBlob);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: audioBlob.type, data: base64Data } },
                        { text: '請將這段錄音轉換為精確的繁體中文逐字稿，盡可能保留原始語氣和停頓。' }
                    ]
                }
            });
            
            setTranscript(response.text);
            setStatus('finished');

        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
             console.error('Gemini API 轉錄失敗:', err);
             setError(`逐字稿生成失敗: ${errorMessage}`);
             setStatus('error'); // IMPORTANT: Set status to error but KEEP the audioBlob.
        }
    }, [audioBlob]);

    const handleDownload = useCallback(() => {
        if (!audioBlob) return;
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = audioBlob.type.split('/')[1]?.split(';')[0] || 'webm';
        a.download = `recording-${timestamp}.${extension}`;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }, [audioBlob]);

    const handleInsert = () => {
        onTranscriptReady(transcript);
        handleClose();
    };
    
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);
    
    if (!isOpen) return null;

    const hasRecording = audioBlob !== null;

    const renderContent = () => {
        switch (status) {
            case 'recording':
            case 'paused':
                return (
                    <div>
                        <div className={`text-4xl font-mono text-indigo-600 ${status === 'recording' ? 'animate-pulse' : ''}`}>{formatTime(recordingTime)}</div>
                        {recordingTime > 1800 && ( // 1800 seconds = 30 minutes
                            <div className="text-xs text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md p-2 mt-3">
                                <strong>提醒：</strong>錄音已超過30分鐘，建議分段錄製以提高轉錄成功率。
                            </div>
                        )}
                    </div>
                );
            case 'transcribing':
                 return <div className="flex flex-col items-center text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div><p className="mt-2">AI 逐字稿生成中...</p></div>;
            case 'finished':
                 return <div className="text-left w-full"><p>{transcript}</p></div>;
            case 'recorded':
                 return <p className="text-gray-500">錄音完成 ({formatTime(recordingTime)})。請點擊「生成逐字稿」。</p>;
            case 'error':
                 return (
                    <div className="text-center text-red-500">
                        <p className="font-semibold">發生錯誤</p>
                        <p className="text-sm mt-1">{error}</p>
                        {hasRecording && <p className="text-sm mt-2 text-gray-600">您的錄音檔已儲存，您可以選擇重試或下載。</p>}
                    </div>
                );
            default:
                 return <span className="text-gray-400">點擊「開始錄音」以開始...</span>;
        }
    }

    const renderMainActions = () => {
        switch (status) {
            case 'idle':
            case 'error':
                if (!hasRecording) return <button onClick={startRecording} className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">開始錄音</button>;
                return null;
            case 'recording':
                return <>
                    <button onClick={pauseRecording} className="w-full px-4 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold">暫停</button>
                    <button onClick={stopRecording} className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">停止</button>
                </>;
            case 'paused':
                return <>
                    <button onClick={resumeRecording} className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">繼續</button>
                    <button onClick={stopRecording} className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">停止</button>
                </>;
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={handleClose}>
            <div className="card w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">AI 錄音與逐字稿</h2>
                <p className="text-sm text-gray-500 mb-4">專注錄音，完成後一鍵生成逐字稿。</p>
                
                <div className="bg-gray-100 p-4 rounded-lg text-sm min-h-[200px] max-h-64 overflow-y-auto custom-scrollbar border flex items-center justify-center text-center">
                    {renderContent()}
                </div>

                <div className="mt-6 flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                        {renderMainActions()}
                    </div>
                    
                    {hasRecording && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(status === 'recorded' || status === 'error') && (
                                <button onClick={generateTranscript} className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold text-sm">
                                    {status === 'error' ? '重試轉錄' : '生成逐字稿'}
                                </button>
                            )}

                            {status === 'finished' && (
                                <button onClick={handleInsert} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-sm">
                                    插入逐字稿
                                </button>
                            )}
                            
                            <button onClick={handleDownload} className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold text-sm">
                                下載錄音檔
                            </button>
                            
                            <button onClick={startRecording} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">
                                重新錄製
                            </button>
                            
                            <button onClick={handleClose} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">
                                關閉
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};