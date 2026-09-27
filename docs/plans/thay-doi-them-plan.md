# Adjustment Plan — "Thay đổi thêm" feedback

> Source: [docs/flashcards-test/README.md](../flashcards-test/README.md) § "Thay đổi thêm" (screenshots `image6`–`image26`).
> Scope: plan only, no code changed yet. Every "Current" entry below was checked against the source.

## Status (2026-09-27)

Implemented: **A1–A8, B1, B2, C1–C4, D1, E2**, plus a title suggestion button and Ctrl+V image paste. Follow-ups: questions are numbered by their position in the exam (section → part → question) on every add or remove and on save, and multiple-choice options can have an image (upload, or Ctrl+V into the option text). The take page shows picture options in 3 columns, and the result page shows them with the correct and chosen answers highlighted. E1 (Excel import) is **deferred** (see decision 4).

DB migrations applied to the live project (session pooler `aws-0-ap-southeast-1`, since the direct host is IPv6-only):
`004-exam-storage-policies.sql`, `005-vocab-meaning-unique.sql`, `006-exam-part-stimulus.sql`. Also renamed the seeded exam to "HSK 3 - ĐỀ THI THỬ 01".

Decisions on the open questions:
1. Levels 7-9 are merged **only** in the "HSK 1 - 9" collection (route param `7-9`).
2. The supplement list compares by **hanzi + pinyin**. That's one headword (词条) in the official syllabus (GF 0025—2021): a polyphonic word (多音字) counts as a separate word, and a new *meaning* of an old word does not. Import dedup is stricter: hanzi + pinyin + meaning.
3. Titles follow "HSK n - ĐỀ THI THỬ 0x" ("NEW HSK n - …" for 3.0). The editor has a "Gợi ý tên" button.
4. Manual entry, made faster (bank question type, shared Part block, paste images, duplicate exam). Excel/OCR import is deferred: converting a paper exam into Excel is as slow as typing it into the editor, and OCR is error-prone for pinyin and picture questions and needs a backend.

Found and fixed during testing: the take page's root `overflow-x-hidden` made it a scroll container, which broke **all** `sticky` elements there (header, audio bar). It's now `overflow-x-clip`.

## Summary

The 20 feedback items fall into five groups. Group A can ship today. Group B holds two real bugs. Group C is the largest: most of the exam-editor complaints (images 17–23) share **one missing concept, a shared stimulus per Part**, so they're solved together. Group E (the AI suggestion in images 25–26) is already fully designed in [exam-import-plan.md](exam-import-plan.md). This plan only decides *when* to build it.

| Group | Items | Effort | Needs DB migration |
|---|---|---|---|
| A. Copy & content fixes | A1–A8 | ~1–2 h | No (A6 is a data edit) |
| B. Bugs | B1 upload RLS, B2 vocab dedup | ~0.5 day | **Yes** (both) |
| C. Exam editor & player | C1–C5 | ~2–3 days | **Yes** (C2) |
| D. Result page in Vietnamese | D1 | ~1 h | No |
| E. Excel import + duplicate exam | E1, E2 | E2 ~0.5 day, E1 ~1–2 weeks | Yes (E1) |

Suggested order: **B1 → A → D → B2 → C → E2 → E1**. B1 goes first because it blocks the teacher from building any exam with images or audio.

---

## A. Copy & content fixes (vocab hub, footer, gallery)

| # | Image | Current behaviour | Change to |
|---|---|---|---|
| A1 | 6 | Hero badge "Hệ thống Từ vựng HSK Đa Phiên Bản" — [flashcard-hub.html:11](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.html) | "Hệ thống từ vựng HSK các cấp độ" |
| A2 | 6 | H1 "Kho Từ Vựng HSK" — [flashcard-hub.html:15](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.html) (also `vocab.title` in [vi.json:175](../../public/i18n/vi.json)) | "KHO TỪ VỰNG TIẾNG TRUNG" |
| A3 | 6 | Paragraph "…dạng bảng tra cứu phân trang. Hỗ trợ chuẩn HSK 2.0, NEW HSK 3.0 phân chia theo bài học, và danh mục bổ sung nâng cấp." — [flashcard-hub.html:19](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.html) | "…dạng bảng tra cứu từ vựng tiện lợi. Hỗ trợ chương trình HSK 2.0, NEW HSK 3.0 các cấp độ và danh mục từ vựng bổ sung chuyển đổi giữa HSK 2.0 và 3.0." |
| A4 | 7, 11 | Version badge renders `v2.0` / `v3.0`: collection card `badge: 'v2.0'` ([flashcard-hub.ts:61](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.ts)), shared `<app-hsk-badge>` `v{{ version() }}` ([hsk-badge.html:22](../../src/app/components/shared/badge/hsk-badge.html)), import preview ([import-preview.html:87](../../src/app/features/flashcards/components/import-preview/import-preview.html)), exam-list filter "v2.0 Tiêu Chuẩn" ([exam-list.html:69](../../src/app/features/exams/pages/exam-list/exam-list.html)) | `HSK 2.0` / `HSK 3.0` everywhere. Change the shared badge once. The CSS `uppercase` class on the hub card makes the text show as "V2.0", so the label itself must change. |
| A5 | 8, 9, 10 | Collection descriptions in [flashcard-hub.ts:63,73,84](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.ts) | **HSK 2.0:** "…theo tiêu chuẩn đánh giá năng lực 6 cấp cũ". **HSK 3.0:** "…theo bài học của giáo trình NEW HSK 3.0". **HSK 1-9:** "…cao cấp 9 theo Tiêu chuẩn phân cấp trình độ giáo dục Trung văn quốc tế." The picker subtitles in [vocab-level-picker.ts:62,70,78](../../src/app/features/flashcards/pages/vocab-level-picker/vocab-level-picker.ts) need to match. |
| A6 | 10 | "HSK 1-9" collection lists levels 7, 8, 9 as separate chips ([flashcard-hub.ts:85](../../src/app/features/flashcards/pages/flashcard-hub/flashcard-hub.ts)) and separate level cards ([vocab-level-picker.ts:80](../../src/app/features/flashcards/pages/vocab-level-picker/vocab-level-picker.ts)) | Show one **"HSK 7-9"** entry. Keep `hsk_level` 7/8/9 in the DB. Add a virtual level (e.g. route `combined/7-9`) that queries `hsk_level IN (7,8,9)`. **Open question:** should NEW HSK 3.0 (`/flashcards/hsk3`) also merge 7-9? The feedback only mentions the 1-9 collection. |
| A7 | 12 | Footer address "Tầng 4, Số 185 Chùa Láng…" — `contact.address` in all 5 locale files ([vi.json:144](../../public/i18n/vi.json), en/zh/ja/km) | Floor **2** ("Tầng 2" / "2nd Floor" / "2 楼" / "2階" / "ជាន់ទី ២") |
| A8 | 13, 14 | Gallery captions are shifted by one photo ([vi.json:136-138](../../public/i18n/vi.json) + 4 other locales, mapping in [gallery.ts:58-72](../../src/app/components/gallery/gallery.ts)). What the photos actually show: `IMG_2771` = **HSK3 288/300**; `ddb4b26f…` = **HSK4 267/300 + HSKK Intermediate 73**; `fb1d0525…` = **HSK4 267/300** (speaking not yet available) | `hsk1` → HSK3 288/300 (currently says "HSK2"). `hsk2` → HSK4 267/300 + HSKK Trung cấp (currently says "HSK3 288"). `hsk3` → HSK4 267/300 (drop the HSKK claim). *Side note:* `fb1d0525…` shows the student's full name and admission ticket number. Consider blurring it. |

**Exam title (image 11).** "HSK 3 — Đề thi thử tiêu chuẩn số 01" is **data**, not code. It comes from [002-exam-seed-data.sql:42](../../src/app/features/exams/data/002-exam-seed-data.sql) and is stored in the `exams` row. Rename it to "HSK 3 - ĐỀ THI THỬ 01" in the editor (or with a SQL `UPDATE`), and update the seed so it stays consistent. If this should be the naming convention for all exams, also change the editor's default title.

---

## B. Bugs

### B1 — Image/audio upload fails (image 16) ⚠ blocking

- **Symptom:** the uploader shows *"new row violates row-level security policy"*. Both images and audio fail.
- **Root cause:** [001-exam-schema.sql:125-135](../../src/app/features/exams/data/001-exam-schema.sql) opens RLS on the five exam **tables** only. Supabase **Storage** also runs RLS, on `storage.objects`, and no policy exists for bucket `exam-assets`, so every `upload()` from the anon key is rejected. [exam.service.ts:313](../../src/app/features/exams/services/exam.service.ts) passes `upsert: true`, so an UPDATE policy is needed too.
- **Fix:** add `004-exam-storage-policies.sql`:
  ```sql
  -- ensure bucket exists and is public-read
  insert into storage.buckets (id, name, public) values ('exam-assets','exam-assets', true)
    on conflict (id) do update set public = true;
  create policy "exam-assets read"   on storage.objects for select using (bucket_id = 'exam-assets');
  create policy "exam-assets insert" on storage.objects for insert with check (bucket_id = 'exam-assets');
  create policy "exam-assets update" on storage.objects for update using (bucket_id = 'exam-assets');
  ```
  Optionally set a size limit and MIME allow-list on the bucket (`image/*`, `audio/*`).
- **Security note:** this matches the existing "anyone with the anon key can write" model of the exam tables. It's fine for now, but once admin auth exists, both the tables and the storage policies should be limited to `authenticated` admins.
- **Verify:** upload a PNG and an MP3 in the editor, save, and reload the take page.

### B2 — Vocabulary: same hanzi with a different meaning is marked "Trùng" (image 15)

- **Requirement:** only skip a row when **hanzi + pinyin + meaning** all match. Example: 对 duì "Đúng" vs 对 duì "Đối với, hướng tới" must **both** be kept.
- **Current behaviour:**
  1. The duplicate key is `hanzi_level_version` ([file-parser.util.ts:136-144](../../src/app/features/flashcards/utils/file-parser.util.ts)). It also flags a row when only the bare `hanzi` or `hanzi_level` exists. Keys come from `getExistingVocabKeys` ([vocab.service.ts:324-338](../../src/app/features/flashcards/services/vocab.service.ts)).
  2. The DB unique constraint is `(hanzi, hsk_level, hsk_version)` ([003-vocab-version-migration.sql:26](../../src/app/features/flashcards/data/003-vocab-version-migration.sql)).
  3. `addCards` upserts with `onConflict: 'hanzi,hsk_level,hsk_version'` ([vocab.service.ts:225](../../src/app/features/flashcards/services/vocab.service.ts)). The second 对 would **overwrite** the first. If both 对 rows are in the same batch, Postgres rejects the whole batch ("ON CONFLICT DO UPDATE command cannot affect row a second time"), and the fallback upsert fails the same way.
  4. The preview label "Trùng (ghi đè)" ([import-preview.html:106](../../src/app/features/flashcards/components/import-preview/import-preview.html)) promises an overwrite, which is the opposite of what's wanted.
- **Changes:**
  - Migration `005-vocab-meaning-unique.sql`: drop `vocab_cards_hanzi_level_version_key` and add `UNIQUE (hanzi, pinyin, meaning, hsk_level, hsk_version)`. First check that no current rows would collide.
  - Compare normalised values: trim, collapse whitespace, lowercase the pinyin and meaning, and normalise pinyin tone marks to NFC.
  - `validateRows` + `getExistingVocabKeys`: build the key from the same five fields and drop the bare-hanzi checks.
  - `addCards`: use the new conflict target with `ignoreDuplicates: true`, because an exact duplicate means nothing new to add.
  - Preview: relabel duplicates as "Trùng (bỏ qua)". Optionally add a soft "Cùng chữ, khác nghĩa" hint on rows that share a hanzi with an existing card, so the teacher can still spot real typos.
  - `addCard` (single add) shows "Từ … đã tồn tại" on a 23505 error. Reword it to mention the meaning.
- **Knock-on risk: flashcard progress.** Progress in IndexedDB is keyed `[hanzi+hskLevel]` ([progress.db.ts:13](../../src/app/features/flashcards/db/progress.db.ts), [progress.service.ts:19](../../src/app/features/flashcards/services/progress.service.ts)), so the two 对 cards would share one progress record. Switch the key to the card's DB `id` with a Dexie `version(3)` migration. Existing progress can be mapped back by `hanzi+level` → first matching card id.
- **Also check:** `getSupplementVocab` ([vocab.service.ts:117-125](../../src/app/features/flashcards/services/vocab.service.ts)) diffs by hanzi only. That's probably still right, since "new hanzi in 3.0" is the intent, but a new *meaning* of an old hanzi won't appear in the supplement. Confirm with the teacher.

---

## C. Exam editor & exam-taking

### C1 — Multi-line text for Part title / instructions / section instructions (image 19)

- **Current:** section instructions ([exam-editor.html:274](../../src/app/features/exams/pages/exam-editor/exam-editor.html)), part title ([:303](../../src/app/features/exams/pages/exam-editor/exam-editor.html)) and part instructions ([:336](../../src/app/features/exams/pages/exam-editor/exam-editor.html)) are single-line `<input>`s, so line breaks can't be entered. The player prints them in `<p>` without `whitespace-pre-line` ([exam-take.html:277, 292](../../src/app/features/exams/pages/exam-take/exam-take.html)). Image 23 shows the result: example, pinyin and word bank run together on one line.
- **Change:** use an auto-growing `<textarea>` for those three fields, plus the exam description. Render them with `whitespace-pre-line` in the take page, the result page and the exam-card description. The DB columns are already `TEXT`, so no migration is needed.

### C2 — Shared "Ví dụ / Đề bài chung" block per Part (images 17, 20, 21, 22) — the core change

- **Need:** besides the instructions ("GHI SỐ ĐIỂM 1 CÂU / TỪ CÂU 1-10"), each Part needs one shared block that all its questions refer to:
  - a **picture bank** A–F (image 17: listening "look at the pictures, choose the matching one"; reading has the same format)
  - a **word bank** (image 21/22: `A 因为 B 远 C 事情 D 生病 E 贵 F 等`)
  - a **worked example** (例如, which the audio also reads aloud; images 19/20)
- **Current:** no such concept exists. The hierarchy is Section → Part → Question ([exam.model.ts:31-67](../../src/app/features/exams/models/exam.model.ts)), and `ExamPart` has only `title` + `instructions`. The teacher is working around it by stuffing the word bank and example into the one-line instructions input (image 21), which renders as an unreadable line (image 23).
- **Change:**
  - Migration `006-exam-part-stimulus.sql`, additive only:
    ```sql
    alter table exam_parts
      add column if not exists example_text      text,   -- 例如 / worked example (multi-line)
      add column if not exists stimulus_text     text,   -- shared passage / word bank (multi-line)
      add column if not exists stimulus_image_url text,  -- shared picture bank A–F
      add column if not exists stimulus_audio_url text,  -- optional part-level audio
      add column if not exists option_labels     text;   -- e.g. 'A,B,C,D,E,F' for bank-type parts
    ```
  - `ExamPart` model + `saveFullExam` ([exam.service.ts:169](../../src/app/features/exams/services/exam.service.ts)): read and write the new fields.
  - Editor: under the part header, add a collapsible "Ví dụ / Đề bài chung" card with a textarea for the example, a textarea for the shared text, `<app-image-uploader>` and `<app-audio-uploader>`.
  - Player: render that card above the part's questions (pinyin-friendly font, `whitespace-pre-line`).
- **Relation to the import plan:** [exam-import-plan.md](exam-import-plan.md) proposes a separate `exam_groups` table for multiple stimulus groups per part, such as two reading passages in one part. Part-level stimulus covers every case in the current feedback and is far smaller. If groups are built later, a part stimulus is simply "the part's implicit single group", and the migration can move it into `exam_groups`. **Recommendation: build part-level now.**

### C3 — Picture/word-bank question type (images 17, 18)

- **Current:** the `matching` type appears in the editor dropdown ([exam.model.ts:118](../../src/app/features/exams/models/exam.model.ts)), but the editor gives it only a free-text answer field ([question-editor.html:177](../../src/app/features/exams/components/question-editor/question-editor.html)). The player has **no branch** for it and falls through to a textarea ([exam-take.html:505](../../src/app/features/exams/pages/exam-take/exam-take.html)). The teacher therefore used `single_choice` with blank A–F options (image 22), which works but is clumsy: six empty option inputs per question.
- **Change:** turn `matching` into "Chọn từ ngân hàng chung (tranh / từ)":
  - Part-level `option_labels` (default A–F) come from C2, and questions don't store their own options.
  - Editor: each question gets only a content field, an optional audio file, and a row of A–F buttons to pick the correct answer. No option text inputs.
  - Player: compact A–F letter buttons under each question stem, with the shared bank from C2 shown above.
  - Grading: exact label match, which `checkAnswerCorrectness` ([exam.service.ts:446](../../src/app/features/exams/services/exam.service.ts)) already does.
  - Rename the label in `QUESTION_TYPE_LABELS` so teachers recognise it.
- **Nice to have:** per-option image upload inside `single_choice`. The DB column `exam_options.image_url` and the player already support it ([exam-take.html:392](../../src/app/features/exams/pages/exam-take/exam-take.html)), but the editor has no uploader for options ([question-editor.html:95-129](../../src/app/features/exams/components/question-editor/question-editor.html)). This covers "3 pictures, pick one" questions.

### C4 — Keep the shared block on screen while scrolling (image 23)

- **Need:** a part with many questions (e.g. 41–45 using one A–F word bank) forces students to scroll back up to see the bank.
- **Current:** only the header ([exam-take.html:151](../../src/app/features/exams/pages/exam-take/exam-take.html)) and the section audio bar ([:204](../../src/app/features/exams/pages/exam-take/exam-take.html)) are sticky.
- **Change:** on desktop, make the C2 stimulus card `sticky` inside its part `<section>`, offset below header and audio bar, with a `max-height` (~40vh) and internal scroll, so it stays visible until the part ends. On mobile, show a collapsed sticky bar ("Xem đề bài chung ▾") that expands on tap, so it doesn't eat the screen. Add a toggle to pin or unpin it.

### C5 — Editor defaults

[exam-editor.ts:83](../../src/app/features/exams/pages/exam-editor/exam-editor.ts) `initDefaultStructure()` hard-codes one HSK 3 part. Once C2/C3 exist, the defaults for listening part 1–2 should use the new bank type. Low priority, and it goes away with E1's templates.

---

## D. Result page in Vietnamese (image 24)

| Current | Where | Change to |
|---|---|---|
| "Phần reading" / "PHẦN LISTENING" (raw `sectionType`, uppercased) | [exam-result.html:258](../../src/app/features/exams/pages/exam-result/exam-result.html) | Map: listening → "Nghe hiểu", reading → "Đọc hiểu", writing → "Viết", speaking → "Nói". Add a shared `SECTION_TYPE_LABELS` in `exam.model.ts` and reuse it in take/result. |
| "Câu trả lời của bạn: **false**" | [exam-result.html:315](../../src/app/features/exams/pages/exam-result/exam-result.html) | Format true/false answers as "Đúng (对)" / "Sai (错)" with a small pipe or helper (`formatAnswer(value, questionType)`). |
| "Đáp án chuẩn xác: **true**" | [exam-result.html:320-322](../../src/app/features/exams/pages/exam-result/exam-result.html) | Label "Đáp án chính xác:", value formatted as above |
| Editor buttons "Đúng (对 - True)" / "Sai (错 - False)" | [question-editor.html:158,170](../../src/app/features/exams/components/question-editor/question-editor.html) | "Đúng (对)" / "Sai (错)" |

Also sweep the rest of the exam UI for leftover English, e.g. "(Listening)" in the question editor audio label at [question-editor.html:55](../../src/app/features/exams/components/question-editor/question-editor.html).

---

## E. Faster exam creation (images 25–26 + the text above them)

The two screenshots are a suggestion from another AI assistant. The workflow it describes is original paper/PDF → OCR/AI extracts questions, types, options and answers → one import file → a single upload. Its main point is that the import must be designed **per `question_type`**, not as one flat Excel sheet. The teacher asks for a practical version of this: *an Excel list of questions, with images cropped and pasted in by hand*. They also ask whether an exam can be duplicated.

### E1 — Excel import

Already designed in detail in [exam-import-plan.md](exam-import-plan.md): an `.xlsx` with sheets exams/sections/parts/groups/questions plus a ZIP of media, with preview, validation and an atomic RPC. It's consistent with the AI suggestion. Adjustments based on this feedback:

- Build it **after C2/C3**, so the template has columns for the part example, shared text, picture bank and the bank question type. Otherwise the importer targets a model that can't represent HSK parts.
- Simplify v1 to match the teacher's workflow. Images and audio are **optional** in the Excel file: the teacher imports text and answers, then pastes or uploads the cropped pictures in the editor. The ZIP media bundle can come in v2.
- **AI/OCR extraction** from the PDF: the teacher offered their own Claude account. The lowest-effort path is a documented prompt that turns scanned pages into the import template's rows, which the teacher reviews in the preview before importing. No in-app AI integration is needed for v1.

### E2 — Duplicate exam ("liệu có thể duplicate được đề k")

- **Current:** not supported. There's no clone method in [exam.service.ts](../../src/app/features/exams/services/exam.service.ts) and no action in exam-manage or exam-card.
- **Change:** add a "Nhân bản" action on the admin exam card. `getExamWithDetails(id)` → strip all `id`/FK fields → title + " (bản sao)", `is_published = false` → `saveFullExam()`. Media URLs are reused (same Storage objects), and nothing needs re-uploading. About half a day, and it helps right away: the teacher can build 01 and then clone it for 02/03.

---

## Open questions for the teacher

1. **A6:** merge levels 7-9 only in the "HSK 1-9" collection, or also in NEW HSK 3.0?
2. **B2:** should the "Bổ sung 2.0 → 3.0" list include *new meanings* of an old hanzi, or only brand-new hanzi?
3. **Exam titles:** should all exams follow "HSK n - ĐỀ THI THỬ 0x"? If so, the editor can suggest it automatically.
4. **E1:** confirm that v1 without the media ZIP (images added in the editor afterwards) is acceptable.
