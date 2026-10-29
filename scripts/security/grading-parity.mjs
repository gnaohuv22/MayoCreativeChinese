import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute actual production TS, including the method used by gradeExam, against
// actual migration functions. Expected cases independently constrain semantics.
export async function verifyGradingParity(db) {
  const ordering = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/app/features/exams/models/exam-ordering.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    ordering,
  );
  const source = fs.readFileSync('src/app/features/exams/services/exam.service.ts', 'utf8');
  const ast = ts.createSourceFile('exam.ts', source, ts.ScriptTarget.Latest, true);
  const klass = ast.statements.find(
    (n) => ts.isClassDeclaration(n) && n.name.text === 'ExamService',
  );
  const methods = klass.members.filter((n) =>
    ['checkAnswerCorrectness', 'gradeExam'].includes(n.name?.getText(ast)),
  );
  const ctx = { exports: {}, ...ordering.exports };
  vm.runInNewContext(
    ts.transpileModule(
      `export class Subject { ${methods.map((method) => method.getText(ast)).join('\n')} }`,
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      },
    ).outputText,
    ctx,
  );
  const client = (u, c, t, content) =>
    ctx.exports.Subject.prototype.checkAnswerCorrectness(u ?? '', c ?? '', t, content);
  const cases = [];
  const add = (content, u, c, expected, type = 'ordering') =>
    cases.push({ content, u, c, type, client: client(u, c, type, content), expected });
  const duplicate = '① 我 ② 我 ③ 学习';
  for (const u of ['①②③', '②①③', '123', '2,1,3', '我我学习', '我 我 学习。'])
    for (const c of ['②①③', '123', '2 → 1 → 3', '我我学习']) add(duplicate, u, c, true);
  add(duplicate, '①③②', '②①③', false);
  add(duplicate, '我学习我', '②①③', false);
  const content = '① 那只猫 ② 桌子下面 ③ 睡觉 ④ 在';
  const forms = [
    '①④②③',
    '1423',
    '1-4-2-3',
    '1,4,2,3',
    '1 → 4 → 2 → 3',
    '那只猫在桌子下面睡觉',
    '那只猫在桌子下面睡觉。',
  ];
  for (const u of forms) for (const c of forms) add(content, u, c, true);
  for (const u of ['④①②③', '4123', '在那只猫桌子下面睡觉', '那只猫在睡觉'])
    for (const c of forms) add(content, u, c, false);
  add(content, '①④②③', '4123 HOẶC 1423', true);
  add(content, '①④②③', '4123 | 1423', true);
  for (const u of ['', null, ' ', '。', '!', ',', '\u00a0\ufeff']) add(content, u, '', false);
  add('① A ② B', 'A B!', '①②', true);
  add('① A ② B', 'ab', '①②', true);
  add('① A ② B', '①②', 'ba', false);
  add('① 我们 ② 我 ③ 喜欢 ④ 们', '②④③①', '我们喜欢我们', true);
  const ten = Array.from(
    { length: 10 },
    (_, i) => String.fromCodePoint(0x2460 + i) + ' word' + (i + 1),
  ).join(' ');
  add(ten, '10,1,2,3,4,5,6,7,8,9', '⑩①②③④⑤⑥⑦⑧⑨', true);
  add(content, '1,4,2,999999999999999999999999999999', '1423', false);
  add(content, '1,4,2,00003', '1423', true);
  // Broader cross-product catches malformed/partial/no-token/fallback differences.
  const corpus = [
    '',
    ' ',
    '.',
    '。',
    '0',
    '5',
    '21',
    '1,5',
    '1,21',
    '000',
    '1,,2',
    '1.2',
    '12',
    '1-2',
    '①②',
    '①x②',
    '③①②',
    '②①③',
    '我我学习',
    '我学习我',
    'AB',
    'a b!',
    '①',
    '1',
    '①①',
    '\u00a0①\u3000②\ufeff',
    '\u0085AB',
    'A\u00a0B',
  ];
  for (const text of [
    duplicate,
    '① A ② B',
    '① 我们 ② 我 ③ 喜欢 ④ 们',
    '①\u00a0A\ufeff ②\u3000B',
    '③ C ① A',
    '',
  ])
    for (const u of corpus) for (const c of corpus) add(text, u, c);
  for (const type of [
    'single_choice',
    'true_false',
    'fill_blank',
    'matching',
    'short_answer',
    'essay',
  ])
    for (const u of [
      'A',
      'a',
      'true',
      '对',
      'false',
      '错',
      '你好',
      '您 好',
      '汉语',
      '\u00a0A\ufeff',
      '\u0085A',
      '',
    ])
      for (const c of [
        'A',
        ' true ',
        '对',
        'false',
        '错',
        '你好 / 您好',
        '汉语,中文',
        'A\u00a0',
        'A hoặc B',
        '',
      ])
        add('', u, c, undefined, type);
  const result = await db.query(
    `select x.*, public.exam_answer_matches(u,c,type,content) as server
    from jsonb_to_recordset($1::jsonb) as x(content text,u text,c text,type text,client boolean,expected boolean)`,
    [JSON.stringify(cases)],
  );
  for (const row of result.rows) {
    const label = JSON.stringify({
      content: row.content,
      user: row.u,
      correct: row.c,
      type: row.type,
    });
    assert.equal(row.server, row.client, 'SQL/client divergence: ' + label);
    if (row.expected !== null)
      assert.equal(row.server, row.expected, 'Expected behavior: ' + label);
  }
  // Compare the actual result-page aggregate to an actual persisted RPC grade.
  await db.exec(`begin;
    insert into public.student_profiles(user_id) values ('00000000-0000-0000-0000-000000000001');
    insert into public.exams(id,title,hsk_level,total_score,passing_score,visibility) values ('00000000-0000-0000-0000-000000000010','Duplicate parity',3,300,180,'public');
    insert into public.exam_sections(id,exam_id,section_type,title,max_score) values ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','reading','Reading',100);
    insert into public.exam_parts(id,section_id,title,question_type) values ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020','Ordering','ordering');
    insert into public.exam_questions(id,part_id,question_num,content,correct_answer,score) values ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000030',1,'① 我 ② 我 ③ 学习','②①③',2.5);
    set local role authenticated;
    select set_config('test.uid','00000000-0000-0000-0000-000000000001',true);`);
  try {
    const exam = {
      id: '00000000-0000-0000-0000-000000000010',
      title: 'Duplicate parity',
      total_score: 300,
      passing_score: 180,
      sections: [
        {
          section_type: 'reading',
          title: 'Reading',
          max_score: 100,
          parts: [
            {
              question_type: 'ordering',
              questions: [
                {
                  id: '00000000-0000-0000-0000-000000000040',
                  question_num: 1,
                  content: duplicate,
                  correct_answer: '②①③',
                  score: 2.5,
                },
              ],
            },
          ],
        },
      ],
    };
    for (const user of ['①②③', '213', '2,1,3', '我我学习', '①③②']) {
      const answers = { '00000000-0000-0000-0000-000000000040': user };
      const subject = new ctx.exports.Subject();
      subject.saveSubmission = () => {};
      const local = subject.gradeExam(exam, answers, 10);
      const inserted = await db.query('select public.submit_exam_attempt($1::jsonb) as id', [
        JSON.stringify({ exam_id: exam.id, answers }),
      ]);
      const saved = await db.query('select * from public.exam_attempts where id=$1', [
        inserted.rows[0].id,
      ]);
      assert.equal(Number(saved.rows[0].score), local.totalScoreEarned, user + ' result score');
      assert.equal(saved.rows[0].correct_count, local.correctCount, user + ' correct count');
      assert.equal(
        Number(saved.rows[0].section_scores[0].score),
        local.sectionResults[0].scoreEarned,
        user + ' section score',
      );
    }
  } finally {
    await db.exec('rollback');
  }
  return cases.length;
}
