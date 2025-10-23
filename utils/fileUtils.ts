/**
 * 將檔案轉換為 Base64 字串
 * @param file - 要轉換的檔案
 * @returns Promise<string> - Base64 編碼的字串
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // 移除 data:type;base64, 前綴，只保留 base64 數據
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('檔案讀取失敗'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('檔案讀取錯誤'));
        };
        
        reader.readAsDataURL(file);
    });
};

/**
 * 獲取檔案的 MIME 類型
 * @param file - 檔案物件
 * @returns string - MIME 類型
 */
export const getFileMimeType = (file: File): string => {
    return file.type || 'application/octet-stream';
};

/**
 * 檢查檔案大小是否在限制範圍內
 * @param file - 檔案物件
 * @param maxSizeInMB - 最大檔案大小（MB）
 * @returns boolean - 是否在限制範圍內
 */
export const isFileSizeValid = (file: File, maxSizeInMB: number = 10): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
};

/**
 * 格式化檔案大小顯示
 * @param bytes - 檔案大小（位元組）
 * @returns string - 格式化後的大小字串
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
