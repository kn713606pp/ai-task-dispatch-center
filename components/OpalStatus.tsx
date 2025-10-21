import React from 'react';
import type { BackendStatus as BackendStatusType } from '../types';

interface BackendStatusProps {
    status: BackendStatusType;
    onSendNotification: () => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ status, onSendNotification }) => {
    const statusEntries = Object.entries(status).filter(([, message]) => message);
    const isNotificationPending = status.notification?.includes('等待');

    return (
        <div className="card p-6 bg-gray-50 border-l-4 border-gray-500 text-gray-800">
            <h3 className="font-bold">超級派遣 / 後端系統執行狀態</h3>
            <ul className="text-sm mt-2 space-y-1">
                {statusEntries.map(([key, message]) => (
                    <li key={key} className="flex items-center justify-between">
                        <span dangerouslySetInnerHTML={{ __html: message }}></span>
                        {key === 'notification' && isNotificationPending && (
                            <button
                                onClick={onSendNotification}
                                className="ml-4 px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-600 transition duration-150"
                            >
                                通知任務負責人
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};