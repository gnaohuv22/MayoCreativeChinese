import type { LocalizedText } from '../../../services/i18n.service';

/** Nội dung trang chủ — mỗi khối là 1 dòng public.site_sections (migration 028) */

export interface HeroContent {
  badge: LocalizedText;
  titlePart1: LocalizedText;
  titleHighlight: LocalizedText;
  subtitle: LocalizedText;
  /** Đường dẫn trong public/ hoặc URL ảnh đã tải lên bucket site-media */
  image: string;
  imageCaption: LocalizedText;
  stats: { value: LocalizedText; label: LocalizedText }[];
}

export interface AboutContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  mottoTitle: LocalizedText;
  mottoContent: LocalizedText;
  /** 4 thẻ, icon gắn theo vị trí */
  pillars: { title: LocalizedText; desc: LocalizedText }[];
}

export interface TeacherItem {
  id: string;
  /** Trống → avatar chữ cái đầu */
  image: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  credentials: LocalizedText[];
}

export interface TeachersContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  bannerImage: string;
  bannerTitle: LocalizedText;
  bannerDesc: LocalizedText;
  items: TeacherItem[];
}

export const COURSE_ICONS = ['certificate', 'academic', 'chat', 'business', 'tutor', 'logistics'] as const;
export type CourseIcon = (typeof COURSE_ICONS)[number];

export interface CourseItem {
  id: string;
  icon: CourseIcon;
  title: LocalizedText;
  desc: LocalizedText;
  duration: LocalizedText;
  classSize: LocalizedText;
  objective: LocalizedText;
  /** Nhãn nổi bật (VD: Mới) — trống thì không hiện */
  badge: LocalizedText;
  /** Trang chi tiết /khoa-hoc/<detail> (có thể kèm ?query), trống = không có */
  detail: string;
}

export interface CoursesContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  items: CourseItem[];
}

export interface GalleryItem {
  id: string;
  src: string;
  /** id trong categories */
  category: string;
  caption: LocalizedText;
}

export interface GalleryContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  categories: { id: string; label: LocalizedText }[];
  items: GalleryItem[];
}

/** Chân trang (mọi trang công khai) + số Zalo / link Facebook trên trang chủ */
export interface ContactContent {
  /** Câu giới thiệu dưới logo */
  description: LocalizedText;
  address: LocalizedText;
  /** Hotline, cũng là số Zalo (VD: 0353 149 176) */
  phone: string;
  email: string;
  facebookUrl: string;
  messengerUrl: string;
  copyright: LocalizedText;
}

/** Chỉ giữ chữ số: dùng cho tel: và zalo.me */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  teachers: TeachersContent;
  courses: CoursesContent;
  gallery: GalleryContent;
  contact: ContactContent;
}

export type SiteSectionId = keyof SiteContent;
export const SITE_SECTION_IDS: SiteSectionId[] = ['hero', 'about', 'teachers', 'courses', 'gallery', 'contact'];
