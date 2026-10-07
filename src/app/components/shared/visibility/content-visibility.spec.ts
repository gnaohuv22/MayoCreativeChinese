import { describe, expect, it } from 'vitest';
import { contentAccess, strictestVisibility, type ContentViewer } from './content-visibility';

const VISITOR: ContentViewer = { staff: false, student: false };
const STAFF: ContentViewer = { staff: true, student: false };
const STUDENT: ContentViewer = { staff: false, student: true };

describe('contentAccess', () => {
  it('opens public content to everyone', () => {
    expect(contentAccess('public', VISITOR)).toBe('open');
    expect(contentAccess('public', STAFF)).toBe('open');
    expect(contentAccess('public', STUDENT)).toBe('open');
  });

  it('opens student content to students and staff, members-only for visitors', () => {
    expect(contentAccess('students', STUDENT)).toBe('open');
    expect(contentAccess('students', STAFF)).toBe('open');
    expect(contentAccess('students', VISITOR)).toBe('members');
  });

  it('shows staff content to staff, and to students only when suggested to their class', () => {
    expect(contentAccess('staff', STAFF)).toBe('staff');
    expect(contentAccess('staff', VISITOR)).toBe('locked');
    expect(contentAccess('staff', STUDENT)).toBe('locked');
    expect(contentAccess('staff', STUDENT, true)).toBe('open');
    expect(contentAccess('staff', VISITOR, true)).toBe('locked');
  });

  it('keeps drafts locked on learner pages, even for staff or when suggested', () => {
    expect(contentAccess('private', STAFF)).toBe('locked');
    expect(contentAccess('private', VISITOR)).toBe('locked');
    expect(contentAccess('private', STUDENT, true)).toBe('locked');
  });
});

describe('strictestVisibility', () => {
  it('picks the most restrictive level of a merged range', () => {
    expect(strictestVisibility(['public', 'staff', 'public'])).toBe('staff');
    expect(strictestVisibility(['public', 'private', 'staff'])).toBe('private');
    expect(strictestVisibility(['public', 'students'])).toBe('students');
    expect(strictestVisibility(['students', 'staff'])).toBe('staff');
    expect(strictestVisibility(['public', 'public'])).toBe('public');
  });
});
