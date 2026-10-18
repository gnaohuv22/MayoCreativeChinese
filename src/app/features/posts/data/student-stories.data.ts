import type { StoryImage } from '../models/student-story.model';

/** Ảnh trong public/stories/<thư-mục>/<n>.webp */
function images(folder: string, count: number, alt: string): StoryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `stories/${folder}/${i + 1}.webp`,
    alt: `${alt} — ảnh ${i + 1}`,
  }));
}

const results = images('ket-qua-hsk-18-07-2026', 8, 'Kết quả thi HSK ngày 18/07/2026 của học viên MCC');
const classroom = images('lop-hoc-offline', 7, 'Lớp học offline tại MCC');

// Nội dung các bài "Câu chuyện học viên" nằm trong DB (public.site_posts, migration 030), sửa ở /admin/stories

/** Ảnh lớp học & thành tích dùng chung cho khối "MCC trong lớp học" ở trang khóa học */
export const CLASS_MOMENTS: StoryImage[] = [
  classroom[0], results[1], classroom[1], results[2], classroom[2], results[4],
];
