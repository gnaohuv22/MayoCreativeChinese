import { describe, expect, it } from 'vitest';
import { SESSION_EXPIRED_MESSAGE, writeErrorMessage } from './supabase.client';

describe('writeErrorMessage', () => {
  it('turns RLS rejections into the session-expired message', () => {
    expect(writeErrorMessage({ code: '42501', message: 'new row violates row-level security policy for table "vocab_cards"' }))
      .toBe(SESSION_EXPIRED_MESSAGE);
    // Storage báo lỗi RLS không kèm mã Postgres
    expect(writeErrorMessage({ message: 'new row violates row-level security policy' })).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('keeps other errors as they are', () => {
    expect(writeErrorMessage({ code: '23505', message: 'duplicate key value' })).toBe('duplicate key value');
  });
});
