import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, RESPONSE_SCHEMA } from '../constants';
import { fileToBase64 } from '../utils/fileUtils';
import type { GeminiResponse } from '../types';

// Fix: Per coding guidelines, API key must be obtained exclusively from process.env.API_KEY and used directly.
// This also resolves the TypeScript error related to 'import.meta.env'.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processInputs = async (text: string, url: string, files: File[], manualTask: string): Promise<GeminiResponse | null> => {
    const model = 'gemini-2.5-flash';

    // FIX: Correctly type payloadParts to be an array of Part objects ({ text: string } or { inlineData: ... }).
    const payloadParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];

    if (text) {
        payloadParts.push({ text: `原始指令或貼文內容: ${text}` });
    }

    if (manualTask) {
        payloadParts.push({ text: `使用者手動輸入的單一任務: ${manualTask}` });
    }

    if (url) {
        payloadParts.push({ text: `重要資訊來源連結: ${url}。請假設您已讀取該連結內容，並將其資訊納入任務識別與摘要。` });
    }

    for (const file of files) {
        try {
            const base64Data = await fileToBase64(file);
            payloadParts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            });
            payloadParts.push({ text: `請解析上方 ${file.name} 檔案的內容，提取任務與摘要。` });
        } catch (e) {
            console.error(`File ${file.name} conversion failed:`, e);
            payloadParts.push({ text: `[警告] 檔案 ${file.name} 處理失敗。請忽略此檔案。` });
        }
    }

    if (payloadParts.length === 0) {
        return null;
    }

    try {
        const response = await ai.models.generateContent({
            model,
            // FIX: The 'contents' field should be a single Content object for a non-chat request, not an array.
            contents: { parts: payloadParts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GeminiResponse;

    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("AI 模型 API 呼叫失敗。");
    }
};
