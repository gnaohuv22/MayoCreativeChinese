import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import type {
  Exam,
  ExamSection,
  ExamPart,
  ExamQuestion,
  QuestionType,
  SectionType
} from '../../models/exam.model';
import { QUESTION_TYPE_LABELS, hasPartStimulus, partOptionLabels, renumberQuestions, suggestExamTitle } from '../../models/exam.model';
import { QuestionEditorComponent } from '../../components/question-editor/question-editor';
import { AudioUploaderComponent } from '../../components/audio-uploader/audio-uploader';
import { ImageUploaderComponent } from '../../components/image-uploader/image-uploader';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { VisibilityPickerComponent } from '../../../../components/shared/visibility/visibility-picker';

@Component({
  selector: 'app-exam-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuestionEditorComponent,
    AudioUploaderComponent,
    ImageUploaderComponent,
    AppIconComponent,
    VisibilityPickerComponent,
  ],
  templateUrl: './exam-editor.html',
  styleUrl: './exam-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamEditorComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isEditMode = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  saveStatus = signal<'success' | 'error' | null>(null);
  saveMessage = signal<string | null>(null);

  questionTypeLabels = QUESTION_TYPE_LABELS;
  readonly hasPartStimulus = hasPartStimulus;
  questionTypeKeys: QuestionType[] = [
    'single_choice',
    'true_false',
    'fill_blank',
    'ordering',
    'matching',
    'short_answer',
    'essay'
  ];

  exam: Exam = {
    title: '',
    hsk_level: 3,
    hsk_version: '2.0',
    duration_mins: 90,
    total_score: 300,
    passing_score: 180,
    description: '',
    visibility: 'private',
    sections: []
  };

  async ngOnInit() {
    const examId = this.route.snapshot.paramMap.get('id');
    if (examId) {
      this.isEditMode.set(true);
      const data = await this.examService.getExamWithDetails(examId, { withAnswers: true });
      if (data) {
        renumberQuestions(data);
        this.exam = data;
        this.cdr.markForCheck();
      }
    } else {
      this.initDefaultStructure();
    }
  }

  private initDefaultStructure() {
    this.exam.sections = [
      {
        section_type: 'listening',
        title: 'Phần 1: Nghe hiểu (听力)',
        sort_order: 1,
        max_score: 100,
        instructions: 'Gồm các câu hỏi nghe hiểu. Hãy lắng nghe và chọn đáp án chính xác.',
        parts: [
          {
            title: 'Phần I: Chọn đáp án đúng',
            question_type: 'single_choice',
            sort_order: 1,
            questions: [
              {
                question_num: 1,
                content: 'Hội thoại nghe mẫu...',
                correct_answer: 'A',
                score: 2.5,
                sort_order: 1,
                options: [
                  { label: 'A', content: '', sort_order: 1 },
                  { label: 'B', content: '', sort_order: 2 },
                  { label: 'C', content: '', sort_order: 3 },
                ]
              }
            ]
          }
        ]
      },
      {
        section_type: 'reading',
        title: 'Phần 2: Đọc hiểu (阅读)',
        sort_order: 2,
        max_score: 100,
        instructions: 'Đọc kỹ các đoạn văn và câu hỏi trước khi trả lời.',
        parts: []
      },
      {
        section_type: 'writing',
        title: 'Phần 3: Viết (书写)',
        sort_order: 3,
        max_score: 100,
        instructions: 'Sắp xếp câu hoặc viết chữ Hán tương ứng.',
        parts: []
      }
    ];
  }

  addSection(type: SectionType) {
    if (!this.exam.sections) this.exam.sections = [];
    const titles: Record<SectionType, string> = {
      listening: 'Nghe hiểu (听力)',
      reading: 'Đọc hiểu (阅读)',
      writing: 'Viết (书写)',
      speaking: 'Nói (口语)'
    };
    this.exam.sections.push({
      section_type: type,
      title: `Phần ${this.exam.sections.length + 1}: ${titles[type]}`,
      sort_order: this.exam.sections.length + 1,
      max_score: 100,
      parts: []
    });
  }

  removeSection(index: number) {
    this.exam.sections?.splice(index, 1);
    this.exam.sections?.forEach((s, idx) => s.sort_order = idx + 1);
    renumberQuestions(this.exam);
  }

  addPart(sec: ExamSection) {
    if (!sec.parts) sec.parts = [];
    sec.parts.push({
      title: `Part ${sec.parts.length + 1}`,
      question_type: 'single_choice',
      sort_order: sec.parts.length + 1,
      questions: []
    });
  }

  removePart(sec: ExamSection, index: number) {
    sec.parts?.splice(index, 1);
    sec.parts?.forEach((p, idx) => p.sort_order = idx + 1);
    renumberQuestions(this.exam);
  }

  addQuestion(part: ExamPart) {
    if (!part.questions) part.questions = [];
    const isSingleChoice = part.question_type === 'single_choice';
    const isMatching = part.question_type === 'matching';

    part.questions.push({
      question_num: 0, // gán lại bởi renumberQuestions theo vị trí trong đề
      content: '',
      correct_answer: isSingleChoice || isMatching ? 'A' : '',
      score: 2.5,
      sort_order: part.questions.length + 1,
      options: isSingleChoice ? [
        { label: 'A', content: '', sort_order: 1 },
        { label: 'B', content: '', sort_order: 2 },
        { label: 'C', content: '', sort_order: 3 },
      ] : undefined
    });
    renumberQuestions(this.exam);
  }

  removeQuestion(part: ExamPart, index: number) {
    part.questions?.splice(index, 1);
    part.questions?.forEach((q, idx) => q.sort_order = idx + 1);
    renumberQuestions(this.exam);
  }

  /** Nhãn đáp án dùng chung của Part dạng 'matching' (A–F mặc định) */
  optionLabelsFor(part: ExamPart): string[] {
    return partOptionLabels(part);
  }

  /** Đặt tên đề theo quy ước "HSK 3 - ĐỀ THI THỬ 01" (số thứ tự = số đề cùng cấp hiện có + 1) */
  async applySuggestedTitle() {
    const level = Number(this.exam.hsk_level);
    const version = this.exam.hsk_version;
    const existing = await this.examService.countExams(level, version);
    // Khi sửa đề đã có, bản thân đề này đã nằm trong số đếm
    const index = this.isEditMode() ? Math.max(1, existing) : existing + 1;
    this.exam.title = suggestExamTitle(level, version, index);
    this.cdr.markForCheck();
  }

  async saveExam() {
    if (!this.exam.title.trim()) {
      this.saveStatus.set('error');
      this.saveMessage.set('Vui lòng nhập tên đề thi!');
      return;
    }

    this.isSaving.set(true);
    this.saveStatus.set(null);
    this.saveMessage.set(null);

    const res = await this.examService.saveFullExam(this.exam);
    this.isSaving.set(false);

    if (res.error) {
      this.saveStatus.set('error');
      this.saveMessage.set(`Lưu đề thi thất bại: ${res.error}`);
    } else {
      this.saveStatus.set('success');
      this.saveMessage.set('Đã lưu toàn bộ đề thi HSK thành công!');
      if (!this.isEditMode() && res.id) {
        this.router.navigate(['/admin/exams', res.id, 'edit']);
      }
    }
  }
}
