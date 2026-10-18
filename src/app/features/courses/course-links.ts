/** Query param chọn đối tượng trên trang có tab (VD: /khoa-hoc/tieng-trung-tre-em?doi-tuong=nguoi-lon) */
export const AUDIENCE_PARAM = 'doi-tuong';

/** 'Người lớn (người đi làm, sinh viên)' → 'nguoi-lon-nguoi-di-lam-sinh-vien' */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
