import { verifyGradingParity } from './grading-parity.mjs';
import { test } from 'node:test';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
test('035 migration grading, privileges, ownership and answer release in isolated PostgreSQL', async (t) => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync('scripts/security/exam-fixture.sql', 'utf8'));
    await db.exec(
      fs
        .readFileSync('src/app/features/exams/data/001-exam-schema.sql', 'utf8')
        .replace(/CREATE EXTENSION[^;]*;/i, ''),
    );
    await db.exec("alter table exams add column visibility text default 'public';");
    const original = fs.readFileSync(
      'src/app/features/classes/data/019-classes-students.sql',
      'utf8',
    );
    await db.exec(
      original.slice(
        original.indexOf('create table if not exists public.exam_attempts ('),
        original.indexOf('create index if not exists idx_exam_attempts_student'),
      ),
    );
    await db.exec('grant select on exam_questions, exam_attempts to authenticated;');
    // Actual new migration, no SQL rewriting. Reapply to exercise idempotence.
    for (let i = 0; i < 2; i++)
      await db.exec(
        fs.readFileSync('src/app/features/classes/data/035-exam-integrity.sql', 'utf8'),
      );
    await db.exec(fs.readFileSync('scripts/db/tests/035-exam-integrity.test.sql', 'utf8'));
    await t.test(
      'actual SQL and gradeExam matcher remain equivalent across supported forms and edge cases',
      async () => {
        const count = await verifyGradingParity(db);
        t.diagnostic(`${count} differential grading cases passed`);
      },
    );
  } catch (e) {
    console.error({
      message: e.message,
      position: e.position,
      internalPosition: e.internalPosition,
      internalQuery: e.internalQuery,
      where: e.where,
    });
    throw e;
  } finally {
    await db.close();
  }
});
