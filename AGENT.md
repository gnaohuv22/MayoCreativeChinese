# AGENT.md — Developer & AI Pair Programming Guide

Tài liệu hướng dẫn kiến trúc, quy chuẩn lập trình và các best practices cốt lõi của dự án **Mayo Creative Chinese (MCC)**. Tất cả các developer và AI coding assistants (sessions hiện tại và tương lai) **BẮT BUỘC** phải đọc và tuân thủ nghiêm ngặt các quy tắc này trước khi chỉnh sửa mã nguồn.

---

## 1. Tổng quan Dự án & Tech Stack

- **Dự án**: Mayo Creative Chinese (MCC) — Nền tảng học Tiếng Trung Ứng dụng & Luyện thi HSK chuẩn quốc tế.
- **Frontend Framework**: **Angular 21**
  - Standalone Components (không dùng NgModule cũ).
  - Modern Reactive Architecture với **Angular Signals** (`signal`, `computed`, `input`, `output`).
  - `ChangeDetectionStrategy.OnPush` bắt buộc trên toàn bộ component.
  - Hỗ trợ Zoneless-ready, tuân thủ Angular Modern Guidelines.
- **Styling**: **Tailwind CSS v4** + PostCSS.
  - Phong cách thiết kế: *Neon Calligraphy* kết hợp hiện đại & truyền thống Á Đông.
  - Màu thương hiệu chính:
    - `brand-navy`: `#161e38` (Navy đậm trang nhã)
    - `brand-pink`: `#e11d48` / `#f43f5e` (Hồng hoa đào rực rỡ)
    - `brand-dark`: `#0f172a` / `#0b0f19` (Nền tối sâu thẳm)
  - Dark Mode: Quản lý tập trung qua `ThemeService` gắn class `.dark` vào `document.documentElement`.
- **Backend & Database**: **Supabase**
  - PostgreSQL 15 với Row Level Security (RLS) policies.
  - Supabase Storage: Bucket `exam-assets` chứa file âm thanh (`audio/`) và hình ảnh (`images/`).
  - Client SDK: `@supabase/supabase-js`.
- **Client Storage**:
  - `dexie` (IndexedDB) cho tính năng Flashcards offline/guest.
  - `localStorage` & `sessionStorage` cho lưu trữ nháp bài thi, lịch sử điểm số bài nộp.

---

## 2. Cấu trúc Thư mục Dự án (Project Structure)

```text
e:\MayoCreativeChinese\
├── src\
│   ├── app\
│   │   ├── app.ts / app.html / app.css       # Root application component
│   │   ├── app.routes.ts                      # Root routing definition
│   │   ├── components\                        # Shared Marketing & Layout UI
│   │   │   ├── header\                        # Main Navigation bar + Dark mode toggle
│   │   │   ├── hero\                          # Hero banner landing page
│   │   │   ├── about\                         # About Mayo section
│   │   │   ├── teachers\                      # Giảng viên
│   │   │   ├── courses\                       # Khóa học
│   │   │   ├── gallery\                       # Thư viện ảnh hoạt động
│   │   │   ├── footer\                        # Footer chân trang
│   │   │   └── shared\                        # Atomic / Reusable UI components
│   │   │       ├── icon\                      # <app-icon> (SVG Heroicons tập trung)
│   │   │       ├── badge\                     # <app-hsk-badge> (HSK level & version)
│   │   │       ├── stat-card\                 # Thẻ thống kê số liệu
│   │   │       ├── register-modal\            # Modal đăng ký học thử
│   │   │       └── scroll-to-top\             # Nút cuộn lên đầu trang
│   │   ├── features\                          # Domain Business Features
│   │   │   ├── flashcards\                    # Feature học từ vựng Flashcard
│   │   │   │   ├── components\
│   │   │   │   ├── services\
│   │   │   │   └── pages\
│   │   │   └── exams\                         # Feature Hệ thống Đề thi HSK (Phases 1 & 2)
│   │   │       ├── models\
│   │   │       │   └── exam.model.ts          # Định nghĩa toàn bộ Types & Interfaces đề thi
│   │   │       ├── services\
│   │   │       │   └── exam.service.ts        # Supabase CRUD, Auto-grading & Submissions
│   │   │       ├── components\
│   │   │       │   ├── exam-card\             # Card đề thi (Learner & Admin modes)
│   │   │       │   ├── question-editor\       # Form tạo/sửa câu hỏi động theo type
│   │   │       │   ├── audio-uploader\        # Upload file nghe lên Supabase Storage
│   │   │       │   └── image-uploader\        # Upload ảnh minh hoạ
│   │   │       ├── pages\
│   │   │       │   ├── exam-list\             # Trang danh sách đề thi (/exams)
│   │   │       │   ├── exam-manage\           # Trang quản trị kho đề (/exams/manage)
│   │   │       │   ├── exam-editor\           # Trang biên soạn cấu trúc đề (/exams/new, :id/edit)
│   │   │       │   ├── exam-take\             # Trang làm bài thi trực tuyến (/exams/:id/take)
│   │   │       │   └── exam-result\           # Trang kết quả & xem lại đáp án (/exams/:id/result)
│   │   │       ├── data\
│   │   │       │   ├── 001-exam-schema.sql    # DDL 5 bảng quan hệ + RLS + Triggers
│   │   │       │   └── 002-exam-seed-data.sql # Bộ dữ liệu mẫu HSK 3 tiêu chuẩn
│   │   │       └── exam.routes.ts             # Route module con của đề thi
│   │   └── services\                          # Core global services
│   │       ├── theme.service.ts               # Dark / Light mode state
│   │       ├── i18n.service.ts                # Đa ngôn ngữ (VI / ZH / EN)
│   │       └── register-modal.service.ts      # State modal đăng ký
│   ├── index.html
│   ├── main.ts
│   └── styles.css                             # Global styles, Tailwind v4 imports & animations
├── cloudflared.exe                            # Cloudflare quick tunnel binary (được gitignore)
├── angular.json                               # Angular CLI configuration
├── package.json
└── AGENT.md                                   # Tài liệu quy chuẩn này
```

---

## 3. Quy chuẩn Lập trình Bắt buộc (Code Quality & Best Practices)

Mọi code thay đổi trong tương lai **phải tuân thủ 100%** các nguyên tắc sau:

### 3.1. Phân tách Trách nhiệm Tuyệt đối (Separation of Concerns)
- **Quy tắc vàng**: Mỗi component phải được tách biệt thành **3 tệp riêng biệt**:
  1. `[name].ts`: Chứa class TypeScript, logic, reactive signals, event handlers.
  2. `[name].html`: Chứa cấu trúc ngữ nghĩa template HTML.
  3. `[name].css`: Chứa style cục bộ cho component.
- 🚫 **NGHIÊM CẤM**:
  - Không viết inline `template: \`...\`` trong tệp `.ts`.
  - Không nhúng thẻ `<style>` bên trong tệp `.html`.
  - Không gộp CSS vào TypeScript dưới dạng inline string `styles: [...]`.

### 3.2. Hiệu năng & Reactivity (Angular Signals + OnPush)
- Luôn khai báo `changeDetection: ChangeDetectionStrategy.OnPush` trên mọi `@Component`.
- Quản lý trạng thái bằng **Signals** (`signal()`, `computed()`, `input()`, `output()`).
- Khi cập nhật state sau các Promise hoặc API calls bất đồng bộ (Supabase, fetch), hãy gọi `this.cdr.markForCheck()` để đảm bảo giao diện luôn được re-render chính xác dưới chế độ `OnPush`.

### 3.3. Tiêu chuẩn Biểu tượng (Nghiêm cấm Sử dụng Emoji trong UI Code)
- 🚫 **Tuyệt đối không dùng icon emoji** (vd: 📝, 🎧, 🏆, 💡, ⏱️) trong code HTML/TS của giao diện ứng dụng.
- ✅ **Luôn sử dụng SVG Icons mã nguồn mở** qua component dùng chung:
  ```html
  <app-icon name="trophy" size="sm" customClass="text-brand-pink" />
  ```
- Danh mục icon được đăng ký tại `src/app/components/shared/icon/app-icon.ts` và render SVG chuẩn tại `app-icon.html` (Heroicons v2).
- Nếu cần thêm icon mới, bổ sung `case` vào `app-icon.ts` và `app-icon.html`.

### 3.4. Thiết kế Mobile-First & Chống Overlap
- **Thanh điều hướng trên cùng (Top Bar)**:
  - Phải tối giản, tránh nhồi nhét quá nhiều nút dẫn đến tràn/đè giao diện trên màn hình nhỏ.
  - Trên mobile, các nút hành động (như "Nộp bài") nên thu gọn thành **Icon-only** (`p-2 sm:px-4 sm:py-2`), dùng `<span class="hidden sm:inline">Nộp bài</span>`.
  - Điều hướng lớn (như chuyển các phần thi Nghe / Đọc / Viết) phải đặt ở phần cuối trang bài làm (Bottom Navigation), không đặt cố định trên top bar.
- **Huy hiệu & Badges (`app-hsk-badge`)**:
  - Luôn có thuộc tính `shrink-0 whitespace-nowrap` trên host và các span bên trong để đảm bảo chữ và số (vd: "HSK 3", "v2.0") không bao giờ bị ngắt dòng bất thường.
- **Phần tử trạng thái tuyệt đối (Floating Badges, Flag indicators)**:
  - Khi đặt dấu chấm/cờ đánh dấu bên trong button hoặc card, luôn đặt **bên trong padding** (`top-1 right-1`) và gán `z-index` rõ ràng (`z-20`), không dùng tọa độ âm ngoài biên để tránh bị che bởi `overflow` của container cha hoặc các button lân cận.

### 3.5. Hệ thống Chế độ Tối (Dark / Light Theme)
- Khởi tạo và sử dụng `ThemeService` (`inject(ThemeService)`).
- Hỗ trợ đổi theme bằng nút bấm:
  ```html
  <button (click)="theme.toggleTheme()" [title]="theme.isDarkMode() ? 'Chế độ sáng' : 'Chế độ tối'">
    @if (theme.isDarkMode()) {
      <app-icon name="sun" size="xs" />
    } @else {
      <app-icon name="moon" size="xs" />
    }
  </button>
  ```
- Viết CSS Tailwind với biến thể `dark:...` đồng bộ cho mọi bề mặt, card, text và đường viền.

---

## 4. Kiến trúc Hệ thống Đề thi HSK (Exam Architecture)

### 4.1. Data Model Phân cấp 4 tầng
1. **`exams`**: Thông tin tổng thể của đề (tiêu đề, cấp độ HSK 1-9, phiên bản 2.0 hoặc 3.0, thời lượng phút, tổng điểm, điểm sàn đậu 180, trạng thái publish).
2. **`exam_sections`**: Các phần thi lớn (`listening`, `reading`, `writing`, `speaking`), điểm tối đa phần (thường 100đ), audio tổng.
3. **`exam_parts`**: Từng dạng bài cụ thể trong phần (`single_choice`, `true_false`, `fill_blank`, `ordering`, `matching`, `short_answer`, `essay`), hướng dẫn làm bài.
4. **`exam_questions` & `exam_options`**: Câu hỏi chi tiết (đề bài, audio câu, ảnh minh hoạ, điểm, đáp án đúng, giải thích/dịch nghĩa chi tiết) và các phương án lựa chọn A, B, C, D...

### 4.2. Động cơ Chấm điểm & Quản lý Bài thi (`ExamService`)
- Phương thức `gradeExam(exam, answers, timeSpentSeconds)`:
  - Hỗ trợ đối chiếu đa dạng câu trả lời (chuẩn hóa chữ hoa/thường, cắt khoảng trắng thừa).
  - Tự động chuẩn hóa câu trả lời Đúng/Sai (`true`/`false`, `对`/`错`, `đúng`/`sai`).
  - Hỗ trợ nhiều đáp án tương đương ngăn cách bởi dấu `/`, `|`, `hoặc`.
  - Tính điểm quy đổi chuẩn hóa 100 điểm cho từng kỹ năng và 300 điểm toàn đề.
  - Phân loại đạt/chưa đạt dựa theo `exam.passing_score`.
- Quản lý phiên làm bài và bản nháp:
  - Tự động lưu bài làm định kỳ vào `sessionStorage` để chống mất dữ liệu khi học viên reload trang.
  - Sau khi nộp, lưu kết quả đầy đủ vào `localStorage` (`mayo_exam_submissions`) để học viên xem lại phân tích năng lực bất kỳ lúc nào.

---

## 5. Quy trình Kiểm thử & Xem trước từ xa (Verification & Tunneling)

### 5.1. Biên dịch Kiểm tra Lỗi
Trước khi commit hoặc đẩy lên Git, **bắt buộc** phải chạy lệnh:
```bash
npm run build
```
Đảm bảo ứng dụng đạt **Exit code 0**, không có lỗi type TypeScript, lỗi syntax template HTML hay CSS.

### 5.2. Mở Remote Preview cho Khách hàng / Reviewer
Để cho phép xem trước web từ bên ngoài mạng nội bộ (qua điện thoại hoặc máy tính cá nhân):
1. **Chạy dev server lắng nghe toàn mạng**:
   ```bash
   npm start -- --host 0.0.0.0 --port 4200
   ```
2. **Khởi chạy Cloudflare Tunnel**:
   ```bash
   .\cloudflared.exe tunnel --http-host-header localhost:4200 --url http://localhost:4200
   ```
3. Lấy URL dạng `https://<subdomain>.trycloudflare.com` từ log của `cloudflared` để cung cấp cho người kiểm thử. *(Lưu ý cờ `--http-host-header localhost:4200` là bắt buộc để vượt qua bước kiểm tra Host header của Vite/Angular dev server).*

### 5.3. Chụp ảnh Màn hình Tự động (Headless Chrome)
Trong môi trường dòng lệnh Windows PowerShell, sử dụng cú pháp đồng bộ sau để chụp ảnh màn hình giao diện:
```powershell
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  -ArgumentList "--headless=new", "--disable-gpu", "--virtual-time-budget=4000", "--window-size=1280,950", "--screenshot=path\to\output.png", "http://localhost:4200/url-to-check" `
  -Wait
```

---

> 🎯 **Cam kết Chất lượng**: Giữ gìn sự trong sáng của codebase, cấu trúc module rõ ràng, và tính thẩm mỹ cao của Mayo Creative Chinese trong từng dòng code!
