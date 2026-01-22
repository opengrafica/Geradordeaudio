
/**
 * Decodes a base64 encoded string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array containing the decoded bytes.
 */
export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a WAV file Blob URL from raw 16-bit PCM audio data.
 * The Gemini TTS API returns audio at 24000 Hz, single channel.
 * @param pcmData The raw PCM audio data as a Uint8Array.
 * @returns A Blob URL representing the WAV file.
 */
export function createWavBlobUrl(pcmData: Uint8Array): string {
  const sampleRate = 24000; // Gemini TTS sample rate
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  new Uint8Array(buffer, 44).set(pcmData);

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
