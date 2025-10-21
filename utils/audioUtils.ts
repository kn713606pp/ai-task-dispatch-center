/**
 * Encodes raw audio data (Uint8Array) into a Base64 string.
 * This is required for sending audio data to the Gemini Live API.
 * @param bytes The raw audio data.
 * @returns A Base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
