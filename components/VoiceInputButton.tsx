import React, { useState, useEffect, useRef } from 'react';

// FIX: Update prop type to correctly handle state setter functions passed from useState.
interface VoiceInputButtonProps {
    onTranscriptChange: React.Dispatch<React.SetStateAction<string>>;
    disabled: boolean;
}

// FIX: Cast window to any to access browser-specific APIs and rename variable to avoid shadowing the global SpeechRecognition type.
const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscriptChange, disabled }) => {
    const [isListening, setIsListening] = useState(false);
    // FIX: The `SpeechRecognition` type is not available in the default TS environment. Using `any` to avoid compilation errors for this browser-specific API.
    const recognitionRef = useRef<any | null>(null);

    useEffect(() => {
        if (!SpeechRecognitionImpl) {
            console.warn('此瀏覽器不支援 Web Speech API (SpeechRecognition)。');
            return;
        }

        const recognition = new SpeechRecognitionImpl();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-Hant';

        // FIX: Explicitly type event as any to handle browser-specific API event.
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                // This now correctly calls the state setter with a function.
                onTranscriptChange(prev => prev ? `${prev}\n${finalTranscript}` : finalTranscript);
            }
        };
        
        // FIX: Explicitly type event as any to handle browser-specific API event.
        recognition.onerror = (event: any) => {
            console.error('語音識別錯誤:', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                alert(`語音輸入發生錯誤: ${event.error}`);
            }
            setIsListening(false);
        };
        
        recognition.onend = () => {
             setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            // FIX: Use the ref to stop recognition for consistency and to avoid potential closure issues.
            recognitionRef.current?.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleListening = () => {
        if (disabled || !recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    if (!SpeechRecognitionImpl) {
        return (
             <button
                type="button"
                className="self-start p-3 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50 flex-shrink-0"
                title="瀏覽器不支援語音輸入 (建議使用 Chrome)"
                disabled
            >
                <MicIcon />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`self-start p-3 text-white rounded-lg transition duration-150 shadow-md flex-shrink-0
                ${isListening ? 'bg-green-500 hover:bg-green-600 animate-pulse' : 'bg-red-500 hover:bg-red-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={isListening ? '點擊停止聆聽' : '點擊開始語音輸入'}
            disabled={disabled}
        >
            <MicIcon />
        </button>
    );
};

const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7v0a7 7 0 01-7-7v0M12 19v2m-4.5-4.5l.707-.707m8.086 0l.707.707M12 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4z"/>
    </svg>
);