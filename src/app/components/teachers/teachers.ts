import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

interface Teacher {
  id: string;
  image?: string;
  nameKey: string;
  roleKey: string;
  bioKey: string;
  credentials: string[];
}

@Component({
  selector: 'app-teachers',
  imports: [NgOptimizedImage],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css'
})
export class TeachersComponent {
  protected readonly i18n = inject(I18nService);

  readonly expandedTeacherId = signal<string | null>(null);

  readonly teachers: Teacher[] = [
    {
      id: 'mai',
      image: 'teacher-introduce/Mai.png',
      nameKey: 'teacher.mai.name',
      roleKey: 'teachers.role.founder',
      bioKey: 'teacher.mai.bio',
      credentials: ['FTU Alumna', 'SUFE Master', 'HSK 6', 'HSKK Advanced', 'CSC Scholar']
    },
    {
      id: 'thao',
      image: 'teacher-introduce/Thao.png',
      nameKey: 'teacher.thao.name',
      roleKey: 'teachers.role.cofounder',
      bioKey: 'teacher.thao.bio',
      credentials: ['FTU Alumna', 'HSK 6 (254 pts)', 'HSKK Advanced', '3+ Yrs Exp']
    },
    {
      id: 'ly',
      image: 'teacher-introduce/Ly.png',
      nameKey: 'teacher.ly.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.ly.bio',
      credentials: ['FTU Alumna', 'HSK 6 (242 pts)', 'HSKK Advanced', 'Valedictorian']
    },
    {
      id: 'dung',
      image: 'teacher-introduce/Dung.png',
      nameKey: 'teacher.dung.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.dung.bio',
      credentials: ['ULIS Alumna', 'Anhui Univ Master', 'HSK 6', 'CTCSOL Cert', 'CSC Scholar']
    },
    {
      id: 'lina',
      image: 'teacher-introduce/Lina.png',
      nameKey: 'teacher.lina.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.lina.bio',
      credentials: ['Anhui Univ Master', 'CTCSOL Cert', 'Translator Prize', '4+ Yrs Exp']
    },
    {
      id: 'hong',
      image: 'teacher-introduce/Hong.png',
      nameKey: 'teacher.hong.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.hong.bio',
      credentials: ['Friendship Scholar', 'HSK 6', 'HSKK Advanced', 'Oratorical Prize', '3+ Yrs Exp']
    },
    {
      id: 'linh',
      image: 'teacher-introduce/Linh.png',
      nameKey: 'teacher.linh.name',
      roleKey: 'teachers.role.tutor',
      bioKey: 'teacher.linh.bio',
      credentials: ['FTU CLC', 'MCC Alumna', 'HSK 4', 'HSKK Intermediate', 'IELTS 7.5']
    }
  ];

  toggleBio(id: string): void {
    if (this.expandedTeacherId() === id) {
      this.expandedTeacherId.set(null);
    } else {
      this.expandedTeacherId.set(id);
    }
  }
}
