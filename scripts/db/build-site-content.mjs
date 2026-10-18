// Dựng nội dung trang chủ ban đầu (migration 028) từ dữ liệu cứng cũ: các mảng trong component landing + public/i18n/*.json.
// Usage: node scripts/db/build-site-content.mjs
//   → src/app/features/landing/data/028b-site-content-seed.sql (chèn nếu chưa có, không ghi đè bản Mai đã sửa)
//   → public/site-content.json (bản dự phòng khi không đọc được DB)
import { readFileSync, writeFileSync } from 'node:fs';

const LANGS = ['vi', 'zh', 'en', 'ja', 'km'];
const dict = Object.fromEntries(LANGS.map(l => [l, JSON.parse(readFileSync(`public/i18n/${l}.json`, 'utf8'))]));

/** Khoá i18n → { vi, zh, ... } (bỏ ngôn ngữ thiếu hoặc trùng nguyên văn tiếng Việt) */
function t(key) {
  const out = {};
  for (const l of LANGS) {
    const v = dict[l][key];
    if (v == null || v === '') continue;
    if (l !== 'vi' && v === dict.vi[key]) continue;
    out[l] = v;
  }
  if (!out.vi) throw new Error(`Thiếu tiếng Việt cho ${key}`);
  return out;
}

const hero = {
  badge: t('hero.badge'),
  titlePart1: t('hero.title_part1'),
  titleHighlight: t('hero.title_highlight'),
  subtitle: t('hero.subtitle'),
  image: 'tet-2026-activity/IMG_6425.webp',
  imageCaption: t('hero.image_caption'),
  stats: ['classes', 'graduates', 'rate'].map(s => ({ value: t(`hero.stats.${s}`), label: t(`hero.stats.${s}_desc`) })),
};

const about = {
  title: t('about.title'),
  subtitle: t('about.subtitle'),
  mottoTitle: t('about.motto_title'),
  mottoContent: t('about.motto_content'),
  // Thứ tự trên trang (icon gắn theo vị trí)
  pillars: ['sessions', 'hsk', 'practical', 'classroom'].map(p => ({ title: t(`about.pillar.${p}`), desc: t(`about.pillar.${p}_desc`) })),
};

const TEACHERS = [
  ['mai', 'Mai', 'founder', [1, 2, 3, 4, 5]],
  ['thao', 'Thao', 'cofounder', [1, 5, 2, 3, 4]],
  ['ly', 'Ly', 'teacher', [1, 2, 5, 3, 4]],
  ['dung', 'Dung', 'teacher', [1, 2, 3, 4]],
  ['lina', 'Lina', 'teacher', [1, 2, 3, 4]],
  ['hong', 'Hong', 'teacher', [1, 2, 3, 4]],
  ['lelinh', 'LeLinh', 'teacher', [1, 2, 3, 4]],
  ['thuymai', 'ThuyMai', 'teacher', [1, 2, 3, 4]],
  ['linh', 'Linh', 'tutor', [1, 2, 3, 4]],
  ['tam', 'MyTam', 'tutor', [1, 2, 3, 4]],
  ['huyenanh', 'HuyenAnh', 'tutor', [1, 2, 3, 4]],
];
const teachers = {
  title: t('teachers.title'),
  subtitle: t('teachers.subtitle'),
  bannerImage: 'teacher-introduce/team-banner.webp',
  bannerTitle: t('teachers.banner_title'),
  bannerDesc: t('teachers.banner_desc'),
  items: TEACHERS.map(([id, img, role, creds]) => ({
    id,
    image: `teacher-introduce/${img}.webp`,
    name: t(`teacher.${id}.name`),
    role: t(`teachers.role.${role}`),
    bio: t(`teacher.${id}.bio`),
    credentials: creds.map(n => t(`teacher.${id}.cred${n}`)),
  })),
};

const COURSES = [
  ['hsk', 'certificate', null, 'hsk-3-0'],
  ['supplement', 'certificate', 'course.badge.new', 'bo-sung-hsk-2-len-3'],
  ['kids', 'academic', null, 'tieng-trung-tre-em'],
  ['communication', 'chat', null, 'tieng-trung-tre-em?doi-tuong=nguoi-lon'],
  ['tutor', 'tutor', null, 'gia-su'],
  ['business', 'business', null, ''],
  ['logistics', 'logistics', null, ''],
  ['hsk_old', 'certificate', null, 'hsk-2-0'],
];
const courses = {
  title: t('courses.title'),
  subtitle: t('courses.subtitle'),
  items: COURSES.map(([id, icon, badge, detail]) => ({
    id,
    icon,
    title: t(`course.${id}.title`),
    desc: t(`course.${id}.desc`),
    duration: t(`course.${id}.duration`),
    classSize: t(`course.${id}.class_size`),
    objective: t(`course.${id}.objective`),
    badge: badge ? t(badge) : {},
    detail,
  })),
};

const GALLERY = [
  ['tet1', 'tet-2026-activity/IMG_1970.webp', 'tet'],
  ['tet2', 'tet-2026-activity/IMG_1979.webp', 'tet'],
  ['tet3', 'tet-2026-activity/IMG_1963.webp', 'tet'],
  ['hsk1', 'hsk-achievement/IMG_2771.webp', 'hsk'],
  ['hsk2', 'hsk-achievement/ddb4b26f-f9af-4aa3-823e-689b479eb9c0.webp', 'hsk'],
  ['hsk3', 'hsk-achievement/fb1d0525-373d-4ba7-8842-61437fc4f80e.webp', 'hsk'],
  ['women1', 'hsk-achievement/women-day-2025/IMG_4816.webp', 'women'],
  ['women2', 'hsk-achievement/women-day-2025/IMG_4825.webp', 'women'],
  ['women3', 'hsk-achievement/women-day-2025/IMG_4833.webp', 'women'],
];
const gallery = {
  title: t('gallery.title'),
  subtitle: t('gallery.subtitle'),
  categories: ['tet', 'hsk', 'women'].map(id => ({ id, label: t(`gallery.filter.${id}`) })),
  items: GALLERY.map(([id, src, category]) => ({ id, src, category, caption: t(`gallery.caption.${id}`) })),
};

const sections = { hero, about, teachers, courses, gallery };
writeFileSync('public/site-content.json', JSON.stringify(sections) + '\n');

// Dollar-quote có nhãn riêng để nội dung không thể đóng chuỗi SQL
const json = s => `$mcc$${JSON.stringify(s)}$mcc$::jsonb`;
const sql = [
  '-- 028b — Nội dung trang chủ ban đầu (sinh bởi scripts/db/build-site-content.mjs, đừng sửa tay).',
  '-- Chỉ chèn khi chưa có: chạy lại không ghi đè nội dung đã sửa trong /admin/site.',
  'insert into public.site_sections (id, content) values',
  Object.entries(sections).map(([id, c]) => `  ('${id}', ${json(c)})`).join(',\n'),
  'on conflict (id) do nothing;',
  '',
].join('\n');
writeFileSync('src/app/features/landing/data/028b-site-content-seed.sql', sql);
console.log('OK', Object.keys(sections).join(', '));
