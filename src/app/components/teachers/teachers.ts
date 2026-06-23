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
      credentials: [
        'teacher.mai.cred1',
        'teacher.mai.cred2',
        'teacher.mai.cred3',
        'teacher.mai.cred4',
        'teacher.mai.cred5'
      ]
    },
    {
      id: 'thao',
      image: 'teacher-introduce/Thao.png',
      nameKey: 'teacher.thao.name',
      roleKey: 'teachers.role.cofounder',
      bioKey: 'teacher.thao.bio',
      credentials: [
        'teacher.thao.cred1',
        'teacher.thao.cred2',
        'teacher.thao.cred3',
        'teacher.thao.cred4'
      ]
    },
    {
      id: 'ly',
      image: 'teacher-introduce/Ly.png',
      nameKey: 'teacher.ly.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.ly.bio',
      credentials: [
        'teacher.ly.cred1',
        'teacher.ly.cred2',
        'teacher.ly.cred3',
        'teacher.ly.cred4'
      ]
    },
    {
      id: 'dung',
      image: 'teacher-introduce/Dung.png',
      nameKey: 'teacher.dung.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.dung.bio',
      credentials: [
        'teacher.dung.cred1',
        'teacher.dung.cred2',
        'teacher.dung.cred3',
        'teacher.dung.cred4'
      ]
    },
    {
      id: 'lina',
      image: 'teacher-introduce/Lina.png',
      nameKey: 'teacher.lina.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.lina.bio',
      credentials: [
        'teacher.lina.cred1',
        'teacher.lina.cred2',
        'teacher.lina.cred3',
        'teacher.lina.cred4'
      ]
    },
    {
      id: 'hong',
      image: 'teacher-introduce/Hong.png',
      nameKey: 'teacher.hong.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.hong.bio',
      credentials: [
        'teacher.hong.cred1',
        'teacher.hong.cred2',
        'teacher.hong.cred3',
        'teacher.hong.cred4'
      ]
    },
    {
      id: 'linh',
      image: 'teacher-introduce/Linh.png',
      nameKey: 'teacher.linh.name',
      roleKey: 'teachers.role.tutor',
      bioKey: 'teacher.linh.bio',
      credentials: [
        'teacher.linh.cred1',
        'teacher.linh.cred2',
        'teacher.linh.cred3',
        'teacher.linh.cred4'
      ]
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
