import React, { useState, useRef, useCallback } from 'react';

interface AudioProcessorProps {
    onTranscriptionComplete: (transcription: string) => void;
}

export const AudioProcessor: React.FC<AudioProcessorProps> = ({ onTranscriptionComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start(1000); // 每秒收集一次數據
            setIsRecording(true);
            setRecordingTime(0);
            
            // 開始計時
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (error) {
            console.error('無法訪問麥克風:', error);
            alert('無法訪問麥克風，請檢查瀏覽器權限設定。');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const processAudio = useCallback(async () => {
        if (!audioBlob) return;
        
        setIsProcessing(true);
        
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('mimeType', 'audio/webm');
            formData.append('languageCode', 'zh-TW');
            
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(`${apiBaseUrl}/api/transcribe`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`轉錄失敗: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                onTranscriptionComplete(result.transcription);
                setAudioBlob(null);
                setRecordingTime(0);
            } else {
                throw new Error(result.message || '轉錄失敗');
            }
            
        } catch (error) {
            console.error('音訊轉錄錯誤:', error);
            alert(`音訊轉錄失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        } finally {
            setIsProcessing(false);
        }
    }, [audioBlob, onTranscriptionComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card p-6 mb-6 bg-yellow-50 border-yellow-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">🎤 音訊轉文字</h2>
            
            <div className="space-y-4">
                {/* 錄音控制 */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            isRecording 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isRecording ? '⏹️ 停止錄音' : '🎙️ 開始錄音'}
                    </button>
                    
                    {isRecording && (
                        <div className="flex items-center gap-2 text-red-600">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                        </div>
                    )}
                </div>
                
                {/* 音訊處理 */}
                {audioBlob && !isRecording && (
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            錄音完成！檔案大小: {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        
                        <button
                            onClick={processAudio}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? '🔄 轉錄中...' : '📝 轉錄為文字'}
                        </button>
                        
                        {isProcessing && (
                            <div className="text-sm text-gray-600">
                                正在處理音訊，請稍候...（可能需要幾分鐘）
                            </div>
                        )}
                    </div>
                )}
                
                {/* 使用說明 */}
                <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                    <strong>使用說明：</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>點擊「開始錄音」開始錄製語音</li>
                        <li>支援長時間錄音（最長 8 小時）</li>
                        <li>錄音完成後點擊「轉錄為文字」進行 AI 轉錄</li>
                        <li>轉錄結果會自動填入主要內容輸入框</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
