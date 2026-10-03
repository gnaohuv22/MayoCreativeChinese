/** Cạnh dài tối đa — đủ nét cho ảnh đề thi trên màn hình 2x (khung hiển thị ≤ 800px) */
const MAX_SIDE = 1600;
const QUALITY = 0.85;
/** Nhỏ hơn mức này thì giữ nguyên, nén không đáng */
const MIN_BYTES = 100 * 1024;

/**
 * Thu nhỏ + chuyển ảnh sang WebP trước khi upload (ảnh chụp màn hình PNG thường giảm 3–5 lần).
 * Giữ nguyên file gốc nếu là GIF/SVG, trình duyệt không mã hoá được WebP, hoặc kết quả không nhỏ hơn.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size < MIN_BYTES || !/^image\/(png|jpeg|webp|bmp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', QUALITY));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;

    const base = file.name.includes('.') ? file.name.slice(0, file.name.lastIndexOf('.')) : file.name;
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
