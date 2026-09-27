/**
 * MAYO CREATIVE CHINESE — BÀI ĐĂNG "CÂU CHUYỆN HỌC VIÊN"
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

export interface StudentStory {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  cover: StoryImage;
  images: StoryImage[];
  body: StoryBlock[];
}
