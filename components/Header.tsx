import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800">AI 任務派遣中心</h1>
            <p className="text-gray-500 mt-2">將任何形式的資訊先透過 AI 解析為結構化任務，確認後再一鍵派遣至所有後端工作平台。</p>
        </header>
    );
};