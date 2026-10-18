/**
 * MAYO CREATIVE CHINESE — BÀI ĐĂNG "CÂU CHUYỆN HỌC VIÊN"
 * Lưu ở public.site_posts (migration 030), sửa ở /admin/stories
 */

export interface StoryImage {
  src: string;
  alt: string;
}

/** Một kết quả thi được vinh danh */
export interface StoryResult {
  name: string;
  level: string;
  score: string;
  note?: string;
}

export type StoryBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'results'; items: StoryResult[] }
  | { kind: 'list'; items: string[] };

export type StoryBlockKind = StoryBlock['kind'];

/** Thẻ bài trên trang chủ / trang khóa học (không tải nội dung bài) */
export interface StorySummary {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  /** Ảnh đầu tiên của bài */
  cover: StoryImage;
}

export interface StudentStory extends StorySummary {
  images: StoryImage[];
  body: StoryBlock[];
}

/** Một dòng public.site_posts (khu quản trị) */
export interface StoryRow {
  id: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  category: string;
  title: string;
  excerpt: string;
  images: StoryImage[];
  body: StoryBlock[];
  updated_at: string;
}

export const EMPTY_IMAGE: StoryImage = { src: '', alt: '' };
