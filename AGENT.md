# AGENT.md — Developer & AI Pair Programming Guide

This document defines core architectural rules, coding standards, and CSS design system guidelines for **Mayo Creative Chinese (MCC)**. All developers and AI assistants must follow these rules strictly.

---

## 1. Project Overview & Tech Stack

- **Platform**: Mayo Creative Chinese (MCC) — Chinese learning & HSK exam simulation platform.
- **Framework**: **Angular 21** (Standalone components, Zoneless-ready, Angular Signals, `ChangeDetectionStrategy.OnPush`).
- **Styling**: **Tailwind CSS v4** + PostCSS. Theme tokens defined in `src/styles.css`.
- **Database & Backend**: **Supabase** (PostgreSQL 15 with RLS, Storage bucket `exam-assets`).
- **Client Storage**: `dexie` (IndexedDB) for offline flashcards; `localStorage` / `sessionStorage` for exam state.

---

## 2. Directory Structure

```text
src/
├── app/
│   ├── app.ts / app.html / app.css       # Root application shell
│   ├── app.routes.ts                      # Top-level routing
│   ├── components/                        # Shared global components
│   │   ├── shared/
│   │   │   ├── nav-header/                # <app-nav-header> (Unified header across app)
│   │   │   ├── theme-toggle/              # <app-theme-toggle> (Circular theme switcher)
│   │   │   ├── toast/                     # <app-toast> & ToastService (Notifications)
│   │   │   ├── icon/                      # <app-icon> (Heroicons v2 SVG icons)
│   │   │   ├── badge/                     # <app-hsk-badge> (HSK level & version)
│   │   │   └── stat-card/                 # <app-stat-card> (Metrics card)
│   │   └── ... (marketing components)
│   ├── features/
│   │   ├── exams/                         # HSK Exam feature module
│   │   │   ├── pages/ (exam-list, exam-manage, exam-editor, exam-take, exam-result)
│   │   │   ├── components/ (exam-card, question-editor, audio-uploader, image-uploader)
│   │   │   ├── services/ (exam.service.ts)
│   │   │   ├── models/ (exam.model.ts)
│   │   │   └── exam.routes.ts
│   │   └── flashcards/                    # Flashcard feature module
│   │       ├── pages/ (flashcard-hub, flashcard-manage, flashcard-study)
│   │       ├── components/ (vocab-card, import-preview)
│   │       ├── services/ (vocab.service.ts, progress.service.ts)
│   │       └── flashcards.routes.ts
│   └── services/                          # Global services (theme, toast, i18n)
└── styles.css                             # Tailwind v4 theme, fonts, animations
```

---

## 3. Core Coding Standards

### 3.1 Strict File Separation
Every Angular component **must** consist of 3 separate files:
1. `[name].ts` — TypeScript class, signals, methods.
2. `[name].html` — Semantic HTML template.
3. `[name].css` — Component-scoped styles.

**Strictly Forbidden:**
- Do NOT use inline `template: \`...\`` in `.ts` files.
- Do NOT embed `<style>` tags inside `.html` files.
- Do NOT use inline `styles: [...]` in `.ts` files.

### 3.2 Reactivity & Performance (Signals + OnPush)
- Always set `changeDetection: ChangeDetectionStrategy.OnPush` on every `@Component`.
- Use modern Angular Signals: `signal()`, `computed()`, `input()`, `output()`.
- When mutating state after async/Promise callbacks (Supabase, fetch), call `this.cdr.markForCheck()` to ensure proper change detection under `OnPush`.
- For array state updates, always produce immutable copies (`[...list]` or `.map()`) so `OnPush` child components detect reference changes.

### 3.3 Icons & Assets (No Emojis in UI)
- **Zero Emojis in UI**: Never use emoji glyphs (e.g. 📝, 🎧, 🏆, 💡, ⏱️) in UI templates or code.
- Always use the shared SVG icon component:
  ```html
  <app-icon name="trophy" size="sm" customClass="text-brand-pink" />
  ```
- All icons are registered in `src/app/components/shared/icon/app-icon.ts` and rendered via `app-icon.html` (Heroicons v2).
- Use `AppIconComponent` whenever an icon is required.

### 3.4 Global Notifications (Toast System)
- Trigger user feedback using `ToastService` (`inject(ToastService)`):
  ```typescript
  this.toastService.success('Thành công', 'Dữ liệu đã được lưu.');
  this.toastService.error('Lỗi', 'Không thể hoàn tất thao tác.');
  ```
- Default duration is 5000ms. Handled globally via `<app-toast />` mounted in `app.html`.

---

## 4. CSS & Design System Standards

### 4.1 Brand Design Tokens
Always use defined Tailwind theme tokens from `src/styles.css`:

| Token | Light Mode Value | Dark Mode Value | Usage |
|---|---|---|---|
| Canvas Background | `bg-brand-light` (`#FDF8F9`) | `dark:bg-brand-dark` (`#1E1E45`) | Full-page background wrapper |
| Primary Text | `text-brand-navy` (`#2D2D5F`) | `dark:text-brand-text-dark` (`#e8e0f0`) | Main body & heading text |
| Brand Primary Accent | `bg-brand-pink` / `text-brand-pink` (`#CE2D6E`) | Same / `dark:text-brand-accent` (`#FFA6C9`) | Primary CTAs, active badges |
| Card / Panel Surface | `bg-white/80` or `bg-white` | `dark:bg-white/5` or `dark:bg-brand-dark` | Cards, tables, modals |
| Surface Borders | `border-brand-navy/10` | `dark:border-white/10` or `dark:border-white/15` | Dividers, card borders |

### 4.2 Dark Mode Rules
- **No Arbitrary Dark Hex Codes**: Never hardcode colors like `dark:bg-[#0b0f19]`, `dark:bg-[#252554]`, `dark:bg-[#272757]`, or `dark:bg-[#1E1E45]`. Use tokens `dark:bg-brand-dark` or `dark:bg-white/5`.
- **Contrast Requirement**: Every text or border class must have an explicit `dark:` counterpart:
  - `text-zinc-600` → must pair with `dark:text-zinc-300` or `dark:text-brand-text-dark/70`.
  - `text-zinc-500` / `text-zinc-400` → must pair with `dark:text-zinc-400`.
  - `border-zinc-200` → must pair with `dark:border-white/10`.
  - Alert banners (`bg-emerald-50`, `bg-red-50`) must have `dark:bg-emerald-950/40`, `dark:bg-red-950/40`.
- **Theme Switcher**: Use `<app-theme-toggle />` everywhere a theme button is needed.

### 4.3 Typography & Fonts
- Default font family is set in `styles.css` (`Inter` + `Noto Sans SC`).
- Do NOT write inline `style="font-family: 'Noto Sans SC', sans-serif;"`. Use the `font-sans` or `font-display` utility class.

### 4.4 Header Standardization (<app-nav-header>)
- **All sub-pages** across both Exams and Flashcards **must** use `<app-nav-header />`:
  ```html
  <app-nav-header
    activeModule="exams"
    backLink="/exams"
    backLabel="Danh sách đề thi"
    [showBack]="true"
    pageTitle="Tiêu đề trang"
  />
  ```
- **Only Exception**: The active exam session (`/exams/:id/take`) uses its dedicated focus header (countdown timer, question navigation, submit button) to prevent accidental exits.
- `FlashcardShellComponent` has been retired. Each feature page manages its own layout container beneath `<app-nav-header />`.

### 4.5 Mobile-First & Layout Safety
- **No Overflow**: Always test small viewports (`< 640px`).
- **No Badge Line-Breaks**: Use `shrink-0 whitespace-nowrap` on badges like `<app-hsk-badge />`.
- **Status Dots & Flags**: Indicators placed inside buttons/cards must use padding-safe positioning (`top-1 right-1`) with explicit `z-20` to avoid being hidden by adjacent layout elements.
- **Compact CTAs**: On small viewports, condense action buttons using icon-only layouts:
  `<span class="hidden sm:inline">Text</span>`.

---

## 5. Build & Verification Checklist

Before pushing any changes:
1. **Compilation Check**:
   ```bash
   npm run build
   ```
   Must exit with code 0. Zero TypeScript or template errors allowed.
2. **Design Token Check**: Verify no raw arbitrary hex colors are introduced in HTML templates.
3. **Responsive & Theme Check**: Check both Light Mode and Dark Mode rendering across desktop and mobile screen sizes.
