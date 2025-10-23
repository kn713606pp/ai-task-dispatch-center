import React, { useState, useRef, useCallback } from 'react';

// TypeScript 類型聲明
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface AudioProcessorProps {
    onTranscriptionComplete: (transcription: string) => void;
}

interface AudioFile {
    id: string;
    name: string;
    blob: Blob;
    duration: number;
    timestamp: Date;
}

export const AudioProcessor: React.FC<AudioProcessorProps> = ({ onTranscriptionComplete }) => {
    // 語音自然語言輸入狀態
    const [isVoiceInput, setIsVoiceInput] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    
    // 長錄音狀態
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    
    // 音訊檔案管理
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    
    // 轉錄結果管理
    const [transcriptionResult, setTranscriptionResult] = useState<string>('');
    
    // 錄音相關
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const accumulatedTimeRef = useRef<number>(0);

    // 語音自然語言輸入功能
    const startVoiceInput = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('您的瀏覽器不支援語音識別功能');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false; // 簡短任務，不需要連續識別
        recognition.interimResults = true;
        recognition.lang = 'zh-TW';

        recognition.onstart = () => {
            setIsVoiceInput(true);
            setVoiceText('');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setVoiceText(prev => prev + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
            console.error('語音識別錯誤:', event.error);
            setIsVoiceInput(false);
        };

        recognition.onend = () => {
            setIsVoiceInput(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const stopVoiceInput = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsVoiceInput(false);
        }
    }, []);

    // 長錄音功能
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
                const duration = recordingTime;
                const timestamp = new Date();
                
                const newFile: AudioFile = {
                    id: `recording_${timestamp.getTime()}`,
                    name: `長錄音_${currentFileIndex + 1}_${formatTime(duration)}`,
                    blob: audioBlob,
                    duration: duration,
                    timestamp: timestamp
                };
                
                setAudioFiles(prev => [...prev, newFile]);
                setCurrentFileIndex(prev => prev + 1);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start(1000); // 每秒收集一次數據
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);
            accumulatedTimeRef.current = 0;
            
            // 開始計時
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    // 每10分鐘自動分檔
                    if (newTime % 600 === 0) {
                        // 停止當前錄音並開始新的錄音
                        if (mediaRecorderRef.current && isRecording) {
                            mediaRecorderRef.current.stop();
                            setTimeout(() => {
                                startRecording();
                            }, 1000);
                        }
                    }
                    return newTime;
                });
            }, 1000);
            
        } catch (error) {
            console.error('無法訪問麥克風:', error);
            alert('無法訪問麥克風，請檢查瀏覽器權限設定。');
        }
    }, [recordingTime, currentFileIndex, isRecording]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording, isPaused]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            // 重新開始計時
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    if (newTime % 600 === 0) {
                        if (mediaRecorderRef.current && isRecording) {
                            mediaRecorderRef.current.stop();
                            setTimeout(() => {
                                startRecording();
                            }, 1000);
                        }
                    }
                    return newTime;
                });
            }, 1000);
        }
    }, [isRecording, isPaused]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    // 下載檔案
    const downloadFile = useCallback((file: AudioFile) => {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    // 檔案選擇功能
    const toggleFileSelection = useCallback((fileId: string) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
            }
            return newSet;
        });
    }, []);

    const selectAllFiles = useCallback(() => {
        setSelectedFiles(new Set(audioFiles.map(file => file.id)));
    }, [audioFiles]);

    const clearSelection = useCallback(() => {
        setSelectedFiles(new Set());
    }, []);

    // 轉錄功能
    const processSelectedFiles = useCallback(async () => {
        if (selectedFiles.size === 0) {
            alert('請先選擇要轉錄的檔案');
            return;
        }
        
        setIsProcessing(true);
        
        try {
            const selectedAudioFiles = audioFiles.filter(file => selectedFiles.has(file.id));
            let allTranscriptions: string[] = [];
            
            for (const file of selectedAudioFiles) {
                const formData = new FormData();
                formData.append('audio', file.blob, `${file.name}.webm`);
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
                    allTranscriptions.push(`【${file.name}】\n${result.transcription}\n`);
                } else {
                    throw new Error(result.message || '轉錄失敗');
                }
            }
            
            const combinedTranscription = allTranscriptions.join('\n---\n\n');
            setTranscriptionResult(combinedTranscription);
            
            // 清除已轉錄的檔案
            setAudioFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
            setSelectedFiles(new Set());
            
        } catch (error) {
            console.error('音訊轉錄錯誤:', error);
            alert(`音訊轉錄失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedFiles, audioFiles]);

    // 刪除檔案
    const deleteFile = useCallback((fileId: string) => {
        if (window.confirm('確定要刪除此檔案嗎？')) {
            setAudioFiles(prev => prev.filter(file => file.id !== fileId));
            setSelectedFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileId);
                return newSet;
            });
        }
    }, []);

    // 使用語音輸入結果
    const useVoiceText = useCallback(() => {
        if (voiceText.trim()) {
            onTranscriptionComplete(voiceText);
            setVoiceText('');
        }
    }, [voiceText, onTranscriptionComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card p-6 mb-6 bg-yellow-50 border-yellow-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">🎤 音訊輸入</h2>
            
            <div className="space-y-6">
                {/* 語音自然語言輸入 */}
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium mb-3 text-gray-800">🎤 語音自然語言輸入（簡短工作任務）</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={isVoiceInput ? stopVoiceInput : startVoiceInput}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    isVoiceInput 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                {isVoiceInput ? '⏹️ 停止語音' : '🎤 開始語音輸入'}
                            </button>
                            
                            {isVoiceInput && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm">正在聆聽...</span>
                                </div>
                            )}
                        </div>
                        
                        {/* 語音輸入文字視窗 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">語音輸入結果：</label>
                            <div className="p-3 bg-gray-50 rounded border min-h-[100px] max-h-60 overflow-y-auto">
                                {voiceText ? (
                                    <p className="text-gray-800 whitespace-pre-wrap">{voiceText}</p>
                                ) : (
                                    <p className="text-gray-500 italic">語音輸入結果將顯示在此處...</p>
                                )}
                            </div>
                            {voiceText && (
                                <button
                                    onClick={useVoiceText}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                >
                                    ✅ 使用此文字
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 長錄音模式 */}
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium mb-3 text-gray-800">🎙️ 長錄音模式</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isProcessing}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    isRecording 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isRecording ? '⏹️ 停止錄音' : '🎙️ 開始錄音'}
                            </button>
                            
                            {isRecording && (
                                <>
                                    <button
                                        onClick={isPaused ? resumeRecording : pauseRecording}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
                                    >
                                        {isPaused ? '▶️ 繼續錄音' : '⏸️ 暫停錄音'}
                                    </button>
                                </>
                            )}
                            
                            {isRecording && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                                    <span className="text-sm">(每10分鐘自動分檔)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 錄音檔案管理 */}
                {audioFiles.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-800">📁 錄音檔案 ({audioFiles.length})</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllFiles}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                >
                                    全選
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                >
                                    清除選擇
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            {audioFiles.map((file) => (
                                <div key={file.id} className={`p-3 rounded border ${
                                    selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.has(file.id)}
                                                onChange={() => toggleFileSelection(file.id)}
                                                className="w-4 h-4"
                                            />
                                            <div>
                                                <div className="font-medium text-sm">{file.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    時長: {formatTime(file.duration)} | 
                                                    大小: {(file.blob.size / 1024 / 1024).toFixed(2)} MB | 
                                                    時間: {file.timestamp.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadFile(file)}
                                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                            >
                                                💾 下載
                                            </button>
                                            <button
                                                onClick={() => deleteFile(file.id)}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                            >
                                                🗑️ 刪除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {selectedFiles.size > 0 && (
                            <div className="mt-4 pt-3 border-t">
                                <button
                                    onClick={processSelectedFiles}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? '🔄 轉錄中...' : `📝 轉錄選中的 ${selectedFiles.size} 個檔案`}
                                </button>
                                {isProcessing && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        正在處理音訊，請稍候...（可能需要幾分鐘）
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 轉錄結果文字視窗 */}
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium mb-3 text-gray-800">📝 轉錄結果</h3>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">轉錄文字內容：</label>
                        <div className="p-3 bg-gray-50 rounded border min-h-[120px] max-h-80 overflow-y-auto">
                            {transcriptionResult ? (
                                <p className="text-gray-800 whitespace-pre-wrap">{transcriptionResult}</p>
                            ) : (
                                <p className="text-gray-500 italic text-sm">
                                    選擇錄音檔案並點擊「轉錄」按鈕後，轉錄結果將顯示在此處...
                                </p>
                            )}
                        </div>
                        {transcriptionResult && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onTranscriptionComplete(transcriptionResult)}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                >
                                    ✅ 使用此文字
                                </button>
                                <button
                                    onClick={() => setTranscriptionResult('')}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                                >
                                    🗑️ 清除結果
                                </button>
                            </div>
                        )}
                        <div className="text-xs text-gray-500">
                            提示：轉錄完成後，點擊「使用此文字」按鈕將結果應用到任務分析中
                        </div>
                    </div>
                </div>
                
                {/* 使用說明 */}
                <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                    <strong>使用說明：</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li><strong>🎤 語音自然語言輸入：</strong>適合簡短工作任務，即時語音轉文字</li>
                        <li><strong>🎙️ 長錄音模式：</strong>支援長時間錄音，計時顯示，暫停/繼續功能</li>
                        <li><strong>⏸️ 暫停功能：</strong>可暫停錄音並繼續，不會中斷計時</li>
                        <li><strong>📁 自動分檔：</strong>每10分鐘自動分段，避免檔案過大</li>
                        <li><strong>💾 下載存檔：</strong>可下載錄音檔案到本地</li>
                        <li><strong>📝 直接轉錄：</strong>可選擇檔案直接轉錄為文字</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};