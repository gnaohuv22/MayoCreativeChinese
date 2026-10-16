/**
 * MAYO CREATIVE CHINESE — Google Apps Script nhận form "Đăng ký học thử"
 *
 * Bản lưu trong repo của script đang deploy tại endpoint trong
 * src/app/services/registration.service.ts. Sửa ở đây → dán lại vào Apps Script
 * → Deploy › Manage deployments › (bút chì) › Version: New version › Deploy
 * (giữ nguyên URL; nếu chọn "New deployment" thì URL đổi và phải cập nhật registration.service.ts).
 *
 * Chống bot (Cloudflare Turnstile): Project Settings › Script Properties › thêm TURNSTILE_SECRET
 * = secret key của widget. Chưa có thuộc tính này thì bỏ qua kiểm tra (form chạy như trước).
 *
 * Cột: A Thời gian · B Họ tên · C Năm sinh · D SĐT · E Email
 *      F Khóa quan tâm · G Hình thức · H Loại đăng ký   (F–H thêm 09/2026 cho trang /khoa-hoc)
 */

const SHEET_ID = '1lw0sjyzDUvu7GamJ2dEXLm_OD70iGMM1MXbHmvqDg0k';
const SECURITY_KEY = 'mcc_secret_token_2026_xyz';

/** Tên miền trang web được phép gửi form (khớp tên miền đăng ký trên widget Turnstile) */
const TURNSTILE_HOSTNAMES = ['mayo-creative-chinese.vercel.app'];
const TURNSTILE_ACTION = 'course_register';

const HEADERS = ['Thời gian', 'Họ tên', 'Năm sinh', 'SĐT / Zalo', 'Email', 'Khóa quan tâm', 'Hình thức', 'Loại đăng ký'];

const STUDY_MODE_LABELS = {
  online: 'Online',
  offline: 'Offline',
  undecided: 'Chưa chắc chắn / cần tư vấn',
};

const INTENT_LABELS = {
  register: 'Đăng ký khóa học',
  trial: 'Học thử miễn phí',
};

function doPost(e) {
  const p = (e && e.parameter) || {};

  if (p.securityKey !== SECURITY_KEY) {
    return json_({ status: 'error', message: 'Unauthorized' });
  }
  if (!p.fullName || !p.phoneNumber) {
    return json_({ status: 'error', message: 'Missing required fields' });
  }
  if (!verifyTurnstile_(p.turnstileToken)) {
    return json_({ status: 'error', message: 'captcha_failed' });
  }

  // Tránh 2 người gửi cùng lúc ghi đè dòng của nhau
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    ensureHeaders_(sheet);
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'),
      p.fullName,
      p.birthYear || '',
      "'" + p.phoneNumber, // giữ số 0 đầu (Sheets tự đổi thành số nếu không có dấu ')
      p.email || '',
      p.course || '',
      STUDY_MODE_LABELS[p.studyMode] || p.studyMode || '',
      INTENT_LABELS[p.intent] || INTENT_LABELS.register,
    ]);
  } finally {
    lock.releaseLock();
  }

  return json_({ status: 'success' });
}

/** Hỏi Cloudflare token có hợp lệ, đúng thao tác, đúng tên miền; lỗi mạng coi là không hợp lệ */
function verifyTurnstile_(token) {
  const secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if (!secret) return true;
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  try {
    const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return false;
    const result = JSON.parse(res.getContentText());
    return result.success === true
      && result.action === TURNSTILE_ACTION
      && TURNSTILE_HOSTNAMES.indexOf(result.hostname) !== -1;
  } catch (err) {
    console.error('Turnstile siteverify failed: ' + err);
    return false;
  }
}

/** Thêm tiêu đề cột còn thiếu (không ghi đè tiêu đề đã có) */
function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.every(v => v === '')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    return;
  }
  HEADERS.forEach((h, i) => {
    if (current[i] === '') sheet.getRange(1, i + 1).setValue(h).setFontWeight('bold');
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
