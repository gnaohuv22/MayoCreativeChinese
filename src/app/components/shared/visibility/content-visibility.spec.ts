import { describe, expect, it } from 'vitest';
import { contentAccess, strictestVisibility } from './content-visibility';

describe('contentAccess', () => {
  it('opens public content to everyone', () => {
    expect(contentAccess('public', false)).toBe('open');
    expect(contentAccess('public', true)).toBe('open');
  });

  it('shows staff content to staff only, locked for visitors', () => {
    expect(contentAccess('staff', true)).toBe('staff');
    expect(contentAccess('staff', false)).toBe('locked');
  });

  it('keeps drafts locked on learner pages, even for staff', () => {
    expect(contentAccess('private', true)).toBe('locked');
    expect(contentAccess('private', false)).toBe('locked');
  });
});

describe('strictestVisibility', () => {
  it('picks the most restrictive level of a merged range', () => {
    expect(strictestVisibility(['public', 'staff', 'public'])).toBe('staff');
    expect(strictestVisibility(['public', 'private', 'staff'])).toBe('private');
    expect(strictestVisibility(['public', 'public'])).toBe('public');
  });
});
