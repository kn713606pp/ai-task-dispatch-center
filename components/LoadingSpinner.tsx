import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="card p-6 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">AI 正在分析任務中...</span>
            </div>
            <div className="mt-3 text-sm text-blue-600 text-center">
                這可能需要幾秒鐘，請稍候...
            </div>
        </div>
    );
};
