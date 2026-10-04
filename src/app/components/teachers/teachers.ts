import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

interface Teacher {
  id: string;
  image?: string;
  /** Chữ cái hiển thị trên avatar mặc định khi chưa có ảnh */
  initial?: string;
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
      image: 'teacher-introduce/Mai.webp',
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
      image: 'teacher-introduce/Thao.webp',
      nameKey: 'teacher.thao.name',
      roleKey: 'teachers.role.cofounder',
      bioKey: 'teacher.thao.bio',
      credentials: [
        'teacher.thao.cred1',
        'teacher.thao.cred5',
        'teacher.thao.cred2',
        'teacher.thao.cred3',
        'teacher.thao.cred4'
      ]
    },
    {
      id: 'ly',
      image: 'teacher-introduce/Ly.webp',
      nameKey: 'teacher.ly.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.ly.bio',
      credentials: [
        'teacher.ly.cred1',
        'teacher.ly.cred2',
        'teacher.ly.cred5',
        'teacher.ly.cred3',
        'teacher.ly.cred4'
      ]
    },
    {
      id: 'dung',
      image: 'teacher-introduce/Dung.webp',
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
      image: 'teacher-introduce/Lina.webp',
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
      image: 'teacher-introduce/Hong.webp',
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
      id: 'lelinh',
      image: 'teacher-introduce/LeLinh.webp',
      nameKey: 'teacher.lelinh.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.lelinh.bio',
      credentials: [
        'teacher.lelinh.cred1',
        'teacher.lelinh.cred2',
        'teacher.lelinh.cred3',
        'teacher.lelinh.cred4'
      ]
    },
    {
      id: 'thuymai',
      image: 'teacher-introduce/ThuyMai.webp',
      nameKey: 'teacher.thuymai.name',
      roleKey: 'teachers.role.teacher',
      bioKey: 'teacher.thuymai.bio',
      credentials: [
        'teacher.thuymai.cred1',
        'teacher.thuymai.cred2',
        'teacher.thuymai.cred3',
        'teacher.thuymai.cred4'
      ]
    },
    {
      id: 'linh',
      image: 'teacher-introduce/Linh.webp',
      nameKey: 'teacher.linh.name',
      roleKey: 'teachers.role.tutor',
      bioKey: 'teacher.linh.bio',
      credentials: [
        'teacher.linh.cred1',
        'teacher.linh.cred2',
        'teacher.linh.cred3',
        'teacher.linh.cred4'
      ]
    },
    {
      id: 'tam',
      image: 'teacher-introduce/MyTam.webp',
      nameKey: 'teacher.tam.name',
      roleKey: 'teachers.role.tutor',
      bioKey: 'teacher.tam.bio',
      credentials: [
        'teacher.tam.cred1',
        'teacher.tam.cred2',
        'teacher.tam.cred3',
        'teacher.tam.cred4'
      ]
    },
    {
      id: 'huyenanh',
      image: 'teacher-introduce/HuyenAnh.webp',
      nameKey: 'teacher.huyenanh.name',
      roleKey: 'teachers.role.tutor',
      bioKey: 'teacher.huyenanh.bio',
      credentials: [
        'teacher.huyenanh.cred1',
        'teacher.huyenanh.cred2',
        'teacher.huyenanh.cred3',
        'teacher.huyenanh.cred4'
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
