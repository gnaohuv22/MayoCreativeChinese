// SINH TỰ ĐỘNG bởi scripts/db/build-site-content.mjs — phần mở đầu hiện ngay ở lần truy cập đầu (chưa có cache),
// trước khi tải xong nội dung từ DB. Có thể cũ hơn bản trong DB (sửa ở /admin/site) — tải xong DB sẽ thay.
import type { HeroContent } from '../models/site-content.model';

export const INITIAL_HERO: HeroContent = {
  "badge": {
    "vi": "Tiên Phong Tiếng Trung Ứng Dụng",
    "zh": "应用型中文先锋",
    "en": "Pioneer in Practical Chinese",
    "ja": "実用中国語のパイオニア",
    "km": "អ្នកត្រួសត្រាយភាសាចិនអនុវត្ត"
  },
  "titlePart1": {
    "vi": "Hành Trình Ngàn Dặm Bắt Đầu Từ",
    "zh": "千里之行，始于",
    "en": "A Journey of a Thousand Miles Begins with a",
    "ja": "千里の行も",
    "km": "ដំណើររាប់ពាន់ម៉ាយល៍ ចាប់ផ្តើមពី"
  },
  "titleHighlight": {
    "vi": "Một Bước Chân",
    "zh": "足下",
    "en": "Single Step",
    "ja": "一歩から",
    "km": "ជំហានដំបូង"
  },
  "subtitle": {
    "vi": "Mayo Creative Chinese (MCC) – Trung tâm tiên phong đào tạo Tiếng Trung Ứng Dụng & chuẩn hóa HSK trên nền tảng giáo dục thông minh và tư duy sáng tạo.",
    "zh": "Mayo Creative Chinese (MCC) – 领先的应用中文与HSK培训中心，致力于通过智能教育和创新思维提升中文学习体验。",
    "en": "Mayo Creative Chinese (MCC) - A leading center in practical Chinese & HSK preparation driven by smart education and creative thinking.",
    "ja": "Mayo Creative Chinese (MCC) – スマート教育と創造的思考に基づく、実用中国語及びHSK対策の先駆的トレーニングセンター。",
    "km": "Mayo Creative Chinese (MCC) – មជ្ឈមណ្ឌលឈានមុខគេក្នុងការបណ្តុះបណ្តាលភាសាចិនអនុវត្តជាក់ស្តែង និងការរៀបចំ HSK ផ្អែកលើការអប់រំឆ្លាតវៃ និងការគិតច្នៃប្រឌិត។"
  },
  "image": "tet-2026-activity/IMG_6425.webp",
  "imageCaption": {
    "vi": "Trải nghiệm học Tiếng Trung sáng tạo cùng MCC",
    "zh": "与 MCC 一起体验创意中文学习",
    "en": "Experience creative Chinese learning with MCC",
    "ja": "MCCでクリエイティブな中国語学習を体験",
    "km": "ស្វែងយល់ពីការរៀនភាសាចិនប្រកបដោយភាពច្នៃប្រឌិតជាមួយ MCC"
  },
  "stats": [
    {
      "value": {
        "vi": "110+"
      },
      "label": {
        "vi": "Lớp học đã khai giảng",
        "zh": "开班数量",
        "en": "Classes Launched",
        "ja": "開講クラス数",
        "km": "ថ្នាក់រៀនបានបើក"
      }
    },
    {
      "value": {
        "vi": "1000+"
      },
      "label": {
        "vi": "Học viên tốt nghiệp",
        "zh": "结业学员",
        "en": "Graduated Students",
        "ja": "卒業生数",
        "km": "សិស្សបានបញ្ចប់ការសិក្សា"
      }
    },
    {
      "value": {
        "vi": "100%"
      },
      "label": {
        "vi": "Học viên đạt kết quả đầu ra như cam kết",
        "zh": "学生达到了预期的学习目标",
        "en": "Students Achieve Expected HSK Output",
        "ja": "学生が目標とするHSKレベルを達成した実績",
        "km": "លទ្ធផលការសិក្សាដូចការសន្យា"
      }
    }
  ]
};
