/**
 * MAYO CREATIVE CHINESE — Google Apps Script nhận form "Đăng ký học thử"
 *
 * Bản lưu trong repo của script đang deploy tại endpoint trong
 * src/app/services/registration.service.ts. Sửa ở đây → dán lại vào Apps Script
 * → Deploy › Manage deployments › (bút chì) › Version: New version › Deploy
 * (giữ nguyên URL; nếu chọn "New deployment" thì URL đổi và phải cập nhật registration.service.ts).
 *
 * Chống bot (Cloudflare Turnstile): Project Settings › Script Properties › thêm TURNSTILE_SECRET
 * = secret key của widget. Thiếu secret thì từ chối đăng ký; không có chế độ bỏ qua ở bản deploy.
 *
 * Bảng (tab đầu tiên): 2 dòng tiêu đề, dữ liệu từ dòng 3. Cột:
 *   A STT · B Họ và tên · C Năm sinh · D Số điện thoại · E Email
 *   F Hình thức học · G Tên khóa học · H Mục tiêu học tập (nhân sự điền)
 *   I Trạng thái tư vấn (nhân sự điền) · J Ghi chú khác (loại đăng ký + thời gian gửi)
 * Ghi vào dòng đầu tiên còn trống ở B–E (cột STT đã đánh số sẵn nên không dùng appendRow).
 */

const SHEET_ID = '1lw0sjyzDUvu7GamJ2dEXLm_OD70iGMM1MXbHmvqDg0k';
const SECURITY_KEY = 'mcc_secret_token_2026_xyz';

/** Tên miền trang web được phép gửi form (khớp tên miền đăng ký trên widget Turnstile) */
const TURNSTILE_HOSTNAMES = ['www.mayochinese.com', 'mayochinese.com', 'mayo-creative-chinese.vercel.app'];
const TURNSTILE_ACTION = 'course_register';

/** Dòng dữ liệu đầu tiên (dòng 1–2 là tiêu đề gộp ô) */
const FIRST_DATA_ROW = 3;

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
  if (!validRegistration_(p)) {
    return json_({ status: 'error', message: 'Missing required fields' });
  }
  const captchaProblem = verifyTurnstile_(p.turnstileToken);
  if (captchaProblem) {
    return json_({ status: 'error', message: 'captcha_failed', reason: captchaProblem });
  }

  // Tránh 2 người gửi cùng lúc ghi đè dòng của nhau
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const row = firstEmptyRow_(sheet);
    const sentAt = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm');
    // STT đã đánh số sẵn thì giữ nguyên; hết số thì đánh tiếp
    const stt = sheet.getRange(row, 1);
    if (stt.getValue() === '') stt.setValue(row - FIRST_DATA_ROW + 1);
    sheet.getRange(row, 2, 1, 6).setValues([[
      literalText_(p.fullName),
      literalText_(p.birthYear || ''),
      "'" + p.phoneNumber, // giữ số 0 đầu (Sheets tự đổi thành số nếu không có dấu ')
      literalText_(p.email || ''),
      literalText_(STUDY_MODE_LABELS[p.studyMode] || ''),
      literalText_(p.course || ''),
    ]]);
    sheet.getRange(row, 10).setValue((INTENT_LABELS[p.intent] || INTENT_LABELS.register) + ' · gửi lúc ' + sentAt);
  } finally {
    lock.releaseLock();
  }

  return json_({ status: 'success' });
}

/**
 * Hỏi Cloudflare token có hợp lệ, đúng thao tác, đúng tên miền.
 * Trả '' khi hợp lệ, hoặc lý do (không chứa bí mật) để biết sai ở đâu: mã lỗi của Cloudflare
 * (vd invalid-input-secret = secret sai), action:<…>, hostname:<…>, no-token, network.
 */
function verifyTurnstile_(token) {
  const secret = (PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET') || '').trim();
  if (!secret) return 'not-configured';
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return 'no-token';
  try {
    const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return 'http-' + res.getResponseCode();
    const result = JSON.parse(res.getContentText());
    if (result.success !== true) return (result['error-codes'] || ['unknown']).join(',');
    if (result.action !== TURNSTILE_ACTION) return 'action:' + result.action;
    if (TURNSTILE_HOSTNAMES.indexOf(result.hostname) === -1) return 'hostname:' + result.hostname;
    return '';
  } catch (err) {
    console.error('Turnstile siteverify failed: ' + err);
    return 'network';
  }
}

/** Dòng đầu tiên (từ FIRST_DATA_ROW) mà Họ tên, Năm sinh, SĐT, Email (B–E) đều trống */
function firstEmptyRow_(sheet) {
  const last = Math.max(sheet.getLastRow(), FIRST_DATA_ROW);
  const values = sheet.getRange(FIRST_DATA_ROW, 2, last - FIRST_DATA_ROW + 1, 4).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i].every(v => v === '')) return FIRST_DATA_ROW + i;
  }
  return last + 1;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Chạy tay trong trình soạn thảo (chọn kiemTraTurnstile › Chạy) để kiểm tra script gọi được Cloudflare:
 * Nhật ký thực thi in phản hồi của Cloudflare, hoặc lỗi quyền nếu script chưa được cấp quyền gọi ra ngoài.
 */
function kiemTraTurnstile() {
  const secret = (PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET') || '').trim();
  console.log('TURNSTILE_SECRET: ' + (secret ? 'có, ' + secret.length + ' ký tự' : 'CHƯA CÓ'));
  try {
    const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: 'kiem-tra' },
      muteHttpExceptions: true,
    });
    console.log('Cloudflare trả về ' + res.getResponseCode() + ': ' + res.getContentText());
  } catch (err) {
    console.error('Không gọi được Cloudflare: ' + err);
  }
}

/** Prefix all untrusted text: Sheets setValues interprets leading '=' as a formula. */
function literalText_(value) { return "'" + value; }

function validRegistration_(p) {
  const limits = { fullName: 120, birthYear: 4, phoneNumber: 24, email: 254, course: 200, studyMode: 20, intent: 20 };
  for (const key in limits) {
    if (p[key] !== undefined && (typeof p[key] !== 'string' || p[key].length > limits[key] || /[\x00-\x1f\x7f]/.test(p[key]))) return false;
  }
  return typeof p.fullName === 'string' && p.fullName.trim().length > 0
    && typeof p.phoneNumber === 'string' && /^\+?[0-9 ()-]{8,24}$/.test(p.phoneNumber)
    && (!p.birthYear || /^(19|20)\d{2}$/.test(p.birthYear))
    && (!p.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    && (!p.studyMode || Object.prototype.hasOwnProperty.call(STUDY_MODE_LABELS, p.studyMode))
    && (!p.intent || Object.prototype.hasOwnProperty.call(INTENT_LABELS, p.intent));
}
