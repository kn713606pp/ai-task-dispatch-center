import React, { useState, useCallback } from 'react';

const App: React.FC = () => {
    const [message, setMessage] = useState('AI 任務派遣中心已載入');

    return (
        <div style={{ 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ 
                        fontSize: '2.5em', 
                        marginBottom: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🤖 AI 任務派遣中心
                    </h1>
                    <p style={{ fontSize: '1.2em', color: '#666' }}>
                        智慧型任務分析、自動指派與多平台通知系統
                    </p>
                </header>

                <main>
                    <div style={{
                        background: '#f8f9fa',
                        borderRadius: '15px',
                        padding: '30px',
                        marginBottom: '30px'
                    }}>
                        <h2 style={{ 
                            color: '#333', 
                            marginBottom: '20px', 
                            fontSize: '1.5em' 
                        }}>
                            🎤 音訊輸入測試
                        </h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            如果您看到這個頁面，表示 React 應用已成功載入！
                        </p>
                        <button 
                            onClick={() => setMessage('按鈕點擊成功！React 功能正常')}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '15px 30px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            測試按鈕
                        </button>
                        <p style={{ 
                            marginTop: '20px', 
                            padding: '15px', 
                            background: '#e8f5e8', 
                            borderRadius: '8px',
                            color: '#2d5a2d'
                        }}>
                            {message}
                        </p>
                    </div>

                    <div style={{
                        background: '#fff3cd',
                        border: '2px solid #ffeaa7',
                        borderRadius: '15px',
                        padding: '30px',
                        marginBottom: '30px'
                    }}>
                        <h2 style={{ color: '#856404', marginBottom: '20px' }}>
                            🎙️ 音訊功能狀態
                        </h2>
                        <p style={{ color: '#856404' }}>
                            音訊輸入組件將在此處顯示（如果載入成功）
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;