import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="text-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-indigo-600 mt-2">AI 任務解析中，請稍候...</p>
        </div>
    );
};