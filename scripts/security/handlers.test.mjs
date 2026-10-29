import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import ts from 'typescript';
import { POST, GET } from '../../api/rest.mjs';
import { canonicalRestPath } from '../../server/rest-path.mjs';

// External writes and CAPTCHA calls are mocked in every test.
test('REST rejects traversal/normalization and protects encoded signup names', async () => {
  for (const path of [
    '/rest/v1/../auth',
    '/rest/v1/%2e%2e/auth',
    '/rest/v1/%252e%252e/auth',
    '/rest/v1/\\auth',
    '/rest/v1/%5cauth',
    '/rest/v1/rpc%2fregister_guest',
    '/rest/v1//rpc/register_guest',
    '/rest/v1/%ZZ',
    '/rest/v1/x#fragment',
    '/rest/v1/x\n',
  ])
    assert.equal(canonicalRestPath(path), null, path);
  assert.equal(
    canonicalRestPath('/rest/v1/exams?select=id&title=eq.a%20b'),
    '/rest/v1/exams?select=id&title=eq.a%20b',
  );
  const old = globalThis.fetch;
  const oldSecret = process.env.TURNSTILE_SECRET;
  let calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response('{}');
  };
  try {
    delete process.env.TURNSTILE_SECRET;
    for (const p of [
      '/rest/v1/rpc/register_guest',
      '/rest/v1/rpc/%72egister_guest',
      '/rest/v1/rpc/REGISTER_GUEST',
    ]) {
      const r = await POST(
        new Request('https://test.invalid/api/rest', {
          method: 'POST',
          headers: { 'x-rest-path': p, 'x-turnstile-token': 'test' },
        }),
      );
      assert.equal(r.status, 403);
      assert.equal(calls.length, 0);
    }
    process.env.TURNSTILE_SECRET = 'mock';
    for (const result of [
      { success: false },
      { success: true, action: 'wrong', hostname: 'mayochinese.com' },
      { success: true, action: 'signup', hostname: 'evil.invalid' },
    ]) {
      globalThis.fetch = async () => Response.json(result);
      assert.equal(
        (
          await POST(
            new Request('https://test.invalid', {
              method: 'POST',
              headers: {
                'x-rest-path': '/rest/v1/rpc/register_guest',
                'x-turnstile-token': 'token',
              },
            }),
          )
        ).status,
        403,
      );
    }
    calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      return String(url).includes('siteverify')
        ? Response.json({ success: true, action: 'signup', hostname: 'mayochinese.com' })
        : Response.json({ ok: true });
    };
    assert.equal(
      (
        await POST(
          new Request('https://test.invalid', {
            method: 'POST',
            headers: {
              'x-rest-path': '/rest/v1/rpc/%72egister_guest',
              'x-turnstile-token': 'token',
            },
            body: '{}',
          }),
        )
      ).status,
      200,
    );
    assert.equal(calls.length, 2);
    assert.equal(calls[1].init.redirect, 'manual');
    globalThis.fetch = async () =>
      new Response(null, { status: 302, headers: { Location: 'https://evil.invalid' } });
    const redirect = await GET(
      new Request('https://test.invalid', { headers: { 'x-rest-path': '/rest/v1/exams' } }),
    );
    assert.equal(redirect.status, 502);
    assert.equal(redirect.headers.get('location'), null);
  } finally {
    globalThis.fetch = old;
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET;
    else process.env.TURNSTILE_SECRET = oldSecret;
  }
});

test('retired registration endpoint never loads credentials or writes Sheets', async () => {
  const ctx = {
    exports: {},
    require() {
      throw Error('No imports allowed');
    },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('api/register.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    ctx,
  );
  for (const body of [{ fullName: '=1+1' }, null, 'fullName=%3D1%2B1']) {
    let status;
    const res = {
      setHeader() {},
      status(v) {
        status = v;
        return this;
      },
      json() {},
    };
    await ctx.exports.default({ method: 'POST', body }, res);
    assert.equal(status, 410);
  }
});

function appsScript({
  secret = 'mock',
  captcha = { success: true, action: 'course_register', hostname: 'mayochinese.com' },
} = {}) {
  const writes = [];
  const sheet = {
    getLastRow: () => 3,
    getRange: (r, c) => ({
      getValue: () => 1,
      getValues: () => [['', '', '', '']],
      setValue: (v) => writes.push(v),
      setValues: (v) => writes.push(v[0]),
    }),
  };
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => secret }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { openById: () => ({ getSheets: () => [sheet] }) },
    Utilities: { formatDate: () => 'time' },
    ContentService: {
      createTextOutput: (s) => ({ setMimeType: () => s }),
      MimeType: { JSON: 'application/json' },
    },
    UrlFetchApp: {
      fetch: () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(captcha) }),
    },
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('scripts/google-apps-script/register.gs', 'utf8'), ctx);
  const send = (p) =>
    JSON.parse(
      ctx.doPost({
        parameter: {
          securityKey: 'mcc_secret_token_2026_xyz',
          fullName: 'Test',
          phoneNumber: '0900000000',
          turnstileToken: 'mock',
          ...p,
        },
      }),
    );
  return { ctx, writes, send };
}
test('Apps Script writes literal text and validates all registration fields', () => {
  for (const formula of ['=1+1', '+SUM(1,1)', '-1+1', '@SUM(1,1)']) {
    const { send, writes } = appsScript();
    assert.equal(send({ fullName: formula, course: formula }).status, 'success');
    assert.equal(writes[0][0], "'" + formula);
    assert.equal(writes[0][5], "'" + formula);
  }
  for (const input of [
    { fullName: [] },
    { fullName: 'x'.repeat(121) },
    { phoneNumber: '=1+1' },
    { email: '=1+1' },
    { studyMode: '=1+1' },
    { birthYear: '=1+1' },
    { course: 'x\t=1' },
    { intent: 'constructor' },
  ]) {
    const { send, writes } = appsScript();
    assert.equal(send(input).status, 'error');
    assert.equal(writes.length, 0);
  }
});
test('Apps Script missing configuration, token, wrong action/host and failed CAPTCHA never write', () => {
  for (const options of [
    { secret: '' },
    { captcha: { success: false } },
    { captcha: { success: true, action: 'wrong', hostname: 'mayochinese.com' } },
    { captcha: { success: true, action: 'course_register', hostname: 'evil.invalid' } },
  ]) {
    const { send, writes } = appsScript(options);
    assert.equal(send({}).message, 'captcha_failed');
    assert.equal(writes.length, 0);
  }
  const { send, writes } = appsScript();
  assert.equal(send({ turnstileToken: '' }).message, 'captcha_failed');
  assert.equal(writes.length, 0);
});
// Exercise the actual submit method without an Angular/browser/network session.
// Only the method is transpiled; no alternate implementation is maintained here.
function submitMethod() {
  const source = fs.readFileSync('src/app/features/exams/pages/exam-take/exam-take.ts', 'utf8');
  const ast = ts.createSourceFile('exam.ts', source, ts.ScriptTarget.Latest, true);
  const klass = ast.statements.find(
    (n) => ts.isClassDeclaration(n) && n.name.text === 'ExamTakeComponent',
  );
  const method = klass.members.find((n) => n.name?.getText(ast) === 'submitExam');
  const ctx = { exports: {}, alert() {} };
  vm.runInNewContext(
    ts.transpileModule(`export class Subject { ${method.getText(ast)} }`, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    ctx,
  );
  return ctx.exports.Subject.prototype.submitExam;
}
function submitHarness({ learner = true, save = async () => ({}) } = {}) {
  const calls = [];
  let busy = false;
  return {
    calls,
    context: {
      exam: () => ({ id: 'exam' }),
      answers: () => ({ q: 'A' }),
      isSubmitting: Object.assign(() => busy, {
        set: (v) => {
          busy = v;
        },
      }),
      stopTimer() {
        calls.push('stop');
      },
      startTimer() {
        calls.push('timer');
      },
      saveDraft() {
        calls.push('draft');
      },
      clearDraft() {
        calls.push('clear');
      },
      initialDurationSeconds: () => 90,
      timeRemainingSeconds: () => 30,
      auth: { isLearner: () => learner },
      studentService: {
        submitAttempt: async (...args) => {
          calls.push('save');
          assert.deepEqual(args.slice(0, 1), ['exam']);
          return save();
        },
      },
      examService: {
        attachAnswers: async () => {
          calls.push('keys');
          return {};
        },
        gradeExam: () => {
          calls.push('grade');
          return { id: 'result' };
        },
      },
      toast: {
        error() {
          calls.push('error');
        },
      },
      cdr: { markForCheck() {} },
      router: {
        navigate() {
          calls.push('navigate');
        },
      },
    },
  };
}
test('exam submission commits before loading answers and only then shows results', async () => {
  let release;
  const deferred = new Promise((r) => {
    release = r;
  });
  const { calls, context } = submitHarness({ save: () => deferred });
  const pending = submitMethod().call(context);
  assert.deepEqual(calls, ['stop', 'save']);
  release({});
  await pending;
  assert.deepEqual(calls, ['stop', 'save', 'keys', 'grade', 'clear', 'navigate']);
});
test('failed exam persistence keeps draft and never requests keys or grades', async () => {
  const { calls, context } = submitHarness({ save: async () => ({ error: 'offline' }) });
  await submitMethod().call(context);
  assert.deepEqual(calls, ['stop', 'save', 'draft', 'timer', 'error']);
  assert.equal(context.isSubmitting(), false);
});
test('staff practice can review without writing a learner attempt', async () => {
  const { calls, context } = submitHarness({ learner: false });
  await submitMethod().call(context);
  assert.deepEqual(calls, ['stop', 'keys', 'grade', 'clear', 'navigate']);
});
test('local proxy shares path restrictions, blocks signup and prevents redirect propagation', async () => {
  const config = (await import('../../proxy.conf.mjs')).default['/api/rest'];
  const events = {};
  config.configure({
    on: (name, handler) => {
      events[name] = handler;
    },
  });
  for (const path of [
    '/rest/v1/%2e%2e/auth',
    '/rest/v1/rpc/%72egister_guest',
    '/rest/v1/rpc/REGISTER_GUEST',
  ]) {
    let destroyed = false,
      status;
    const req = {
      destroy() {
        destroyed = true;
      },
      removeHeader() {},
      setHeader() {},
    };
    events.proxyReq(
      req,
      { headers: { 'x-rest-path': path }, socket: {} },
      {
        writeHead: (n) => {
          status = n;
          return { end() {} };
        },
      },
    );
    assert.equal(destroyed, true);
    assert.equal(status, 400);
  }
  const upstream = { statusCode: 302, headers: { location: 'https://evil.invalid' } };
  events.proxyRes(upstream);
  assert.equal(upstream.statusCode, 502);
  assert.equal(upstream.headers.location, undefined);
});
test('answer loader fails safely on denied or changed keys and attaches complete authorized keys', async () => {
  const source = fs.readFileSync('src/app/features/exams/services/exam.service.ts', 'utf8');
  const ast = ts.createSourceFile('exam.ts', source, ts.ScriptTarget.Latest, true);
  const klass = ast.statements.find(
    (n) => ts.isClassDeclaration(n) && n.name.text === 'ExamService',
  );
  const method = klass.members.find((n) => n.name?.getText(ast) === 'attachAnswers');
  const ctx = { exports: {}, console };
  vm.runInNewContext(
    ts.transpileModule(`export class Subject { ${method.getText(ast)} }`, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    ctx,
  );
  for (const data of [
    [],
    [{ question_id: 'other', correct_answer: 'B' }],
    [{ question_id: 'q', correct_answer: 'A' }],
  ]) {
    const question = { id: 'q' };
    const exam = { id: 'exam', sections: [{ parts: [{ questions: [question] }] }] };
    const result = await ctx.exports.Subject.prototype.attachAnswers.call(
      { supabase: { rpc: async () => ({ data }) } },
      exam,
    );
    if (data[0]?.question_id === 'q') {
      assert.equal(result.error, undefined);
      assert.equal(question.correct_answer, 'A');
    } else {
      assert.ok(result.error);
      assert.equal(question.correct_answer, undefined);
    }
  }
});
