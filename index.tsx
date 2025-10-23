import React from 'react';
import ReactDOM from 'react-dom/client';

// 最簡單的測試組件
const TestApp = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { fontSize: '2em', textAlign: 'center', marginBottom: '20px' }
    }, '🤖 AI 任務派遣中心'),
    React.createElement('p', {
      key: 'subtitle',
      style: { fontSize: '1.2em', textAlign: 'center', marginBottom: '30px' }
    }, '如果您看到這個頁面，表示 React 已成功載入！'),
    React.createElement('div', {
      key: 'content',
      style: {
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        color: '#333',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('h2', {
        key: 'status',
        style: { color: '#2d5a2d', marginBottom: '15px' }
      }, '✅ 系統狀態：正常'),
      React.createElement('p', {
        key: 'info',
        style: { marginBottom: '15px' }
      }, 'React 應用已成功載入並渲染。'),
      React.createElement('p', {
        key: 'next',
        style: { color: '#666' }
      }, '如果看到這個頁面，說明基本的 JavaScript 和 React 功能正常。')
    ])
  ]);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(TestApp));