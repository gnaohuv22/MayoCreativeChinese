/**
 * Cache kết quả đọc trong bộ nhớ (theo phiên tab) cho dữ liệu ít đổi — tránh tải lại khi
 * người học qua lại giữa các trang. Request đang chạy được dùng chung; kết quả lỗi không giữ lại.
 */
export class RequestCache {
  private readonly entries = new Map<string, { at: number; value: Promise<unknown> }>();

  constructor(private readonly ttlMs: number) {}

  /** `keep` = false → không giữ kết quả (vd request lỗi), lần sau tải lại */
  get<T>(key: string, load: () => Promise<T>, keep: (value: T) => boolean = () => true): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.value as Promise<T>;

    const value = load().then(
      v => {
        if (!keep(v)) this.drop(key, value);
        return v;
      },
      err => {
        this.drop(key, value);
        throw err;
      },
    );
    this.entries.set(key, { at: Date.now(), value });
    return value;
  }

  clear(): void {
    this.entries.clear();
  }

  private drop(key: string, value: Promise<unknown>): void {
    if (this.entries.get(key)?.value === value) this.entries.delete(key);
  }
}
