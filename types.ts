export interface Task {
    title: string;
    description: string;
    priority: '緊急' | '高' | '中' | '低';
    status: string;
    category: string;
    assignee: string;
    dueDate: string | null;
}

export interface GeminiResponse {
    tasks: Task[];
    summary: string;
}

export interface OpalResponse {
    success: boolean;
    message: string;
}

export interface BackendStatusUpdate {
    step: keyof BackendStatus;
    message: string;
}

export interface BackendStatus {
    firestore: string;
    sheets: string;
    docs: string;
    notification: string;
}

export interface Assignee {
    name: string;
    lineId: string;
    gmail: string;
}

/**
 * 定義了發送給後端 `/api/notify` 的資料結構。
 * 將單一負責人的聯絡資訊與其被指派的所有任務綁定在一起。
 */
export interface NotificationPayload {
    assignee: Assignee;
    tasks: Task[];
}