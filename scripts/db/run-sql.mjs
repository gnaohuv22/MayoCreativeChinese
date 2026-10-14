// Chạy 1 hoặc nhiều file SQL trong một transaction.
// Usage: DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres \
//        node scripts/db/run-sql.mjs [--dry-run] path/to/a.sql [path/to/b.sql ...]
// --dry-run: chạy hết rồi rollback (kiểm tra migration / file thử trước khi áp dụng thật).
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const dryRun = process.argv.includes('--dry-run');
const files = process.argv.slice(2).filter(arg => arg !== '--dry-run');
if (!process.env.DATABASE_URL || files.length === 0) {
  console.error('Usage: DATABASE_URL=... node scripts/db/run-sql.mjs [--dry-run] <file.sql> [...]');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.on('notice', notice => console.log(`  ${notice.message}`));
await client.connect();
try {
  await client.query('begin');
  for (const file of files) {
    console.log(`→ ${file}`);
    const result = await client.query(await readFile(file, 'utf8'));
    for (const r of [result].flat()) {
      if (r.command === 'SELECT' && r.rows.length) console.table(r.rows);
    }
  }
  await client.query(dryRun ? 'rollback' : 'commit');
  console.log(dryRun ? 'OK (dry run, đã rollback)' : 'OK');
} catch (err) {
  await client.query('rollback');
  console.error('Rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
