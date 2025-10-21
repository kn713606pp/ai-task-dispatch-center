import React, { useState, useRef } from 'react';

interface AudioProcessorProps {
    onTranscriptionComplete: (transcription: string) => void;
}

export const AudioProcessor: React.FC<AudioProcessorProps> = ({ onTranscriptionComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
                setAudioFile(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('錄音失敗:', error);
            alert('無法開始錄音，請檢查麥克風權限');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    };

    const uploadAudioFile = (file: File) => {
        setAudioFile(file);
    };

    const processAudio = async () => {
        if (!audioFile) {
            alert('請先錄音或上傳音訊檔案');
            return;
        }

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('mimeType', audioFile.type);
            formData.append('languageCode', 'zh-TW');

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(`${apiBaseUrl}/api/transcribe`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`轉錄失敗: ${response.statusText}`);
            }

            const result = await response.json();
            onTranscriptionComplete(result.transcription);

        } catch (error) {
            console.error('音訊處理錯誤:', error);
            alert(`音訊轉錄失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">音訊錄製與轉錄</h3>
            
            {/* 錄音控制 */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            🎤 開始錄音
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            ⏹️ 停止錄音
                        </button>
                    )}
                    
                    {isRecording && (
                        <div className="text-red-500 font-mono text-lg">
                            🔴 {formatTime(recordingTime)}
                        </div>
                    )}
                </div>

                {/* 檔案上傳 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        或上傳音訊檔案
                    </label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadAudioFile(file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* 處理按鈕 */}
                {audioFile && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            已選擇檔案: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <button
                            onClick={processAudio}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
                        >
                            {isProcessing ? '🔄 處理中...' : '🎵 開始轉錄'}
                        </button>
                    </div>
                )}
            </div>

            {/* 處理狀態 */}
            {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-blue-700">
                            正在處理音訊檔案，這可能需要幾分鐘時間...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
