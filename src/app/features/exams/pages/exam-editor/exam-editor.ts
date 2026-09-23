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
import { QUESTION_TYPE_LABELS } from '../../models/exam.model';
import { QuestionEditorComponent } from '../../components/question-editor/question-editor';
import { AudioUploaderComponent } from '../../components/audio-uploader/audio-uploader';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

@Component({
  selector: 'app-exam-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuestionEditorComponent,
    AudioUploaderComponent,
    AppIconComponent,
    NavHeaderComponent,
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
    is_published: false,
    sections: []
  };

  async ngOnInit() {
    const examId = this.route.snapshot.paramMap.get('id');
    if (examId) {
      this.isEditMode.set(true);
      const data = await this.examService.getExamWithDetails(examId);
      if (data) {
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
  }

  addQuestion(part: ExamPart) {
    if (!part.questions) part.questions = [];
    let totalQuestions = 0;
    for (const s of this.exam.sections || []) {
      for (const p of s.parts || []) {
        totalQuestions += p.questions?.length || 0;
      }
    }

    const nextNum = totalQuestions + 1;
    const isSingleChoice = part.question_type === 'single_choice';

    part.questions.push({
      question_num: nextNum,
      content: '',
      correct_answer: isSingleChoice ? 'A' : '',
      score: 2.5,
      sort_order: part.questions.length + 1,
      options: isSingleChoice ? [
        { label: 'A', content: '', sort_order: 1 },
        { label: 'B', content: '', sort_order: 2 },
        { label: 'C', content: '', sort_order: 3 },
      ] : undefined
    });
  }

  removeQuestion(part: ExamPart, index: number) {
    part.questions?.splice(index, 1);
    part.questions?.forEach((q, idx) => q.sort_order = idx + 1);
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
        this.router.navigate(['/exams', res.id, 'edit']);
      }
    }
  }
}
