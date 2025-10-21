// 音訊處理服務 - 支援長時間錄音
const { SpeechClient } = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

class AudioProcessor {
    constructor() {
        this.speechClient = new SpeechClient();
        this.storage = new Storage();
    }

    /**
     * 處理長時間音訊檔案
     * @param {Buffer} audioBuffer - 音訊檔案緩衝區
     * @param {string} mimeType - 音訊格式
     * @param {string} languageCode - 語言代碼
     * @returns {Promise<string>} 轉錄文字
     */
    async processLongAudio(audioBuffer, mimeType = 'audio/wav', languageCode = 'zh-TW') {
        try {
            // 1. 上傳音訊到 Cloud Storage（處理大檔案）
            const bucketName = process.env.GCS_BUCKET_NAME || 'ai-dispatch-audio';
            const fileName = `audio-${Date.now()}.${this.getFileExtension(mimeType)}`;
            const file = this.storage.bucket(bucketName).file(fileName);
            
            await file.save(audioBuffer);
            console.log(`音訊檔案已上傳到 Cloud Storage: ${fileName}`);

            // 2. 設定長時間音訊轉錄配置
            const audioConfig = {
                encoding: this.getEncoding(mimeType),
                sampleRateHertz: 16000,
                languageCode: languageCode,
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: true,
                enableWordConfidence: true,
                model: 'latest_long', // 使用最新的長時間音訊模型
            };

            const request = {
                audio: {
                    uri: `gs://${bucketName}/${fileName}`,
                },
                config: audioConfig,
            };

            // 3. 執行長時間轉錄（支援最長 480 分鐘）
            console.log('開始長時間音訊轉錄...');
            const [operation] = await this.speechClient.longRunningRecognize(request);
            const [response] = await operation.promise({ maxPollingDelay: 30000 });

            // 4. 清理上傳的檔案
            await file.delete();
            console.log('音訊檔案已清理');

            // 5. 組合所有轉錄結果
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join(' ');

            return transcription;

        } catch (error) {
            console.error('音訊處理錯誤:', error);
            throw new Error(`音訊轉錄失敗: ${error.message}`);
        }
    }

    /**
     * 分段處理音訊（備用方案）
     * @param {Buffer} audioBuffer - 音訊檔案緩衝區
     * @param {string} mimeType - 音訊格式
     * @returns {Promise<string>} 轉錄文字
     */
    async processAudioInChunks(audioBuffer, mimeType = 'audio/wav') {
        try {
            // 將音訊分段處理（每段 60 秒）
            const chunkSize = 60 * 16000 * 2; // 60秒 * 16kHz * 2bytes
            const chunks = [];
            
            for (let i = 0; i < audioBuffer.length; i += chunkSize) {
                chunks.push(audioBuffer.slice(i, i + chunkSize));
            }

            console.log(`音訊已分為 ${chunks.length} 段處理`);

            const transcriptions = [];
            
            // 並行處理所有分段
            const promises = chunks.map(async (chunk, index) => {
                const audioConfig = {
                    encoding: this.getEncoding(mimeType),
                    sampleRateHertz: 16000,
                    languageCode: 'zh-TW',
                };

                const request = {
                    audio: { content: chunk.toString('base64') },
                    config: audioConfig,
                };

                const [response] = await this.speechClient.recognize(request);
                return response.results
                    .map(result => result.alternatives[0].transcript)
                    .join(' ');
            });

            const results = await Promise.all(promises);
            return results.join(' ');

        } catch (error) {
            console.error('分段音訊處理錯誤:', error);
            throw new Error(`分段音訊轉錄失敗: ${error.message}`);
        }
    }

    /**
     * 取得音訊編碼格式
     */
    getEncoding(mimeType) {
        const encodingMap = {
            'audio/wav': 'LINEAR16',
            'audio/mp3': 'MP3',
            'audio/m4a': 'MP4',
            'audio/flac': 'FLAC',
        };
        return encodingMap[mimeType] || 'LINEAR16';
    }

    /**
     * 取得檔案副檔名
     */
    getFileExtension(mimeType) {
        const extensionMap = {
            'audio/wav': 'wav',
            'audio/mp3': 'mp3',
            'audio/m4a': 'm4a',
            'audio/flac': 'flac',
        };
        return extensionMap[mimeType] || 'wav';
    }
}

module.exports = AudioProcessor;
