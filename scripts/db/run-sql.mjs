// Chạy 1 hoặc nhiều file SQL trong một transaction.
// Usage: DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres \
//        node scripts/db/run-sql.mjs path/to/a.sql [path/to/b.sql ...]
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const files = process.argv.slice(2);
if (!process.env.DATABASE_URL || files.length === 0) {
  console.error('Usage: DATABASE_URL=... node scripts/db/run-sql.mjs <file.sql> [...]');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('begin');
  for (const file of files) {
    console.log(`→ ${file}`);
    await client.query(await readFile(file, 'utf8'));
  }
  await client.query('commit');
  console.log('OK');
} catch (err) {
  await client.query('rollback');
  console.error('Rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
