
import React, { useState, useCallback, useRef } from 'react';

interface FileDropzoneProps {
    onFilesChange: (files: File[]) => void;
    disabled: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesChange, disabled }) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            setUploadedFiles(fileArray);
            onFilesChange(fileArray);
        }
    }, [onFilesChange]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
    }, [disabled, handleFiles]);

    const handleClick = useCallback(() => {
        if (disabled) return;
        fileInputRef.current?.click();
    }, [disabled]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    }, [handleFiles]);
    
    return (
        <div 
            className={`input-box ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                multiple 
                accept="image/*, application/pdf, application/msword, audio/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
            <p className="text-gray-500">3. 螢幕截圖 / 4. 檔案 / 6. 錄音檔：點擊或拖曳文件至此</p>
            <div id="file-list" className="mt-2 text-sm text-gray-700">
                {uploadedFiles.map((file, index) => (
                    <span key={index} className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                        {file.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
