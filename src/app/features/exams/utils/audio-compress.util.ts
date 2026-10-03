import type { EncodeRequest } from './audio-encode.worker';

/** Mono 24 kHz 48 kbps — đủ rõ cho bài nghe giọng nói, ~1/3 dung lượng MP3 128 kbps stereo */
const SAMPLE_RATE = 24000;
const KBPS = 48;
/** File đã ở mức này thì nén lại chỉ làm giảm chất lượng mà không nhẹ đi bao nhiêu */
const MAX_KEEP_KBPS = 64;
const MIN_BYTES = 1024 * 1024;

/**
 * Nén audio trước khi upload thành MP3 mono 48 kbps. Giữ nguyên file gốc nếu file nhỏ,
 * bitrate đã thấp, trình duyệt không giải mã được, hoặc kết quả không nhỏ hơn.
 */
export async function compressAudio(file: File): Promise<File> {
  if (file.size < MIN_BYTES) return file;

  try {
    // Giải mã thẳng về 24 kHz (trình duyệt tự đổi tần số lấy mẫu)
    const ctx = new OfflineAudioContext(1, 1, SAMPLE_RATE);
    const audio = await ctx.decodeAudioData(await file.arrayBuffer());
    if ((file.size * 8) / audio.duration / 1000 <= MAX_KEEP_KBPS) return file;

    const blob = await encodeInWorker({ samples: downmix(audio), sampleRate: SAMPLE_RATE, kbps: KBPS });
    if (blob.size >= file.size) return file;

    const base = file.name.includes('.') ? file.name.slice(0, file.name.lastIndexOf('.')) : file.name;
    return new File([blob], `${base}.mp3`, { type: 'audio/mpeg' });
  } catch (err) {
    console.warn('Không nén được audio, tải file gốc:', err);
    return file;
  }
}

function downmix(audio: AudioBuffer): Float32Array {
  // Bản sao: mảng gửi sang worker bị chuyển quyền sở hữu (transfer), không chuyển được bộ nhớ của AudioBuffer
  if (audio.numberOfChannels === 1) return audio.getChannelData(0).slice();
  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < mono.length; i++) mono[i] += data[i];
  }
  for (let i = 0; i < mono.length; i++) mono[i] /= audio.numberOfChannels;
  return mono;
}

function encodeInWorker(request: EncodeRequest): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./audio-encode.worker', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<{ blob?: Blob; error?: string }>) => {
      worker.terminate();
      data.blob ? resolve(data.blob) : reject(new Error(data.error));
    };
    worker.onerror = err => {
      worker.terminate();
      reject(err);
    };
    worker.postMessage(request, [request.samples.buffer]);
  });
}
