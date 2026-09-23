import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import type { Exam, ExamFilter, HskVersion } from '../../models/exam.model';
import { StatCardComponent } from '../../../../components/shared/stat-card/stat-card';
import { ExamCardComponent } from '../../components/exam-card/exam-card';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-exam-manage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StatCardComponent,
    ExamCardComponent,
    AppIconComponent,
    NavHeaderComponent,
  ],
  templateUrl: './exam-manage.html',
  styleUrl: './exam-manage.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamManageComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly toastService = inject(ToastService);

  exams = signal<Exam[]>([]);
  isLoading = signal<boolean>(true);

  filter: ExamFilter = {
    hsk_level: 'all',
    hsk_version: 'all',
    is_published: 'all',
    searchQuery: '',
  };

  ngOnInit() {
    this.loadExams();
  }

  async loadExams() {
    this.isLoading.set(true);
    const data = await this.examService.getExams(this.filter);
    this.exams.set(data);
    this.isLoading.set(false);
  }

  resetFilters() {
    this.filter = {
      hsk_level: 'all',
      hsk_version: 'all',
      is_published: 'all',
      searchQuery: '',
    };
    this.loadExams();
  }

  countByVersion(ver: HskVersion): number {
    return this.exams().filter(e => e.hsk_version === ver).length;
  }

  countPublished(): number {
    return this.exams().filter(e => e.is_published).length;
  }

  async togglePublish(item: Exam) {
    if (!item.id) return;
    const newStatus = !item.is_published;
    const res = await this.examService.togglePublish(item.id, newStatus);
    if (!res.error) {
      // Create fresh immutable object to trigger OnPush in child ExamCardComponent immediately
      this.exams.update(list => list.map(e => e.id === item.id ? { ...e, is_published: newStatus } : e));
      if (newStatus) {
        this.toastService.success(`Đã xuất bản đề thi "${item.title}" thành công!`);
      } else {
        this.toastService.info(`Đã chuyển đề thi "${item.title}" về trạng thái bản nháp.`);
      }
    } else {
      this.toastService.error(`Không thể cập nhật trạng thái: ${res.error}`);
    }
  }

  async deleteExam(item: Exam) {
    if (!item.id) return;
    const confirmed = confirm(`Bạn có chắc muốn xoá đề thi "${item.title}"? Tất cả câu hỏi và dữ liệu liên quan sẽ bị xoá vĩnh viễn.`);
    if (!confirmed) return;

    const res = await this.examService.deleteExam(item.id);
    if (!res.error) {
      this.exams.update(list => list.filter(e => e.id !== item.id));
      this.toastService.success(`Đã xoá đề thi "${item.title}" thành công.`);
    } else {
      this.toastService.error(`Xoá đề thi thất bại: ${res.error}`);
    }
  }
}
