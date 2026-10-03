/// <reference lib="webworker" />
import { Mp3Encoder } from '@breezystack/lamejs';

/** Bội số của 1152 (1 frame MP3) — đủ lớn để ít lần gọi, đủ nhỏ để không giữ nhiều bộ nhớ */
const CHUNK = 1152 * 20;

export interface EncodeRequest {
  samples: Float32Array;
  sampleRate: number;
  kbps: number;
}

/** Mã hoá PCM mono (Float32 -1..1) thành MP3 — chạy trong worker để không đơ trang soạn đề */
addEventListener('message', ({ data }: MessageEvent<EncodeRequest>) => {
  try {
    const { samples, sampleRate, kbps } = data;
    const encoder = new Mp3Encoder(1, sampleRate, kbps);
    const parts: Uint8Array[] = [];
    const pcm = new Int16Array(CHUNK);

    for (let start = 0; start < samples.length; start += CHUNK) {
      const end = Math.min(start + CHUNK, samples.length);
      for (let i = start; i < end; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        pcm[i - start] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const out = encoder.encodeBuffer(pcm.subarray(0, end - start));
      if (out.length) parts.push(out.slice());
    }
    const tail = encoder.flush();
    if (tail.length) parts.push(tail.slice());

    postMessage({ blob: new Blob(parts as BlobPart[], { type: 'audio/mpeg' }) });
  } catch (err) {
    postMessage({ error: String(err) });
  }
});
