-- Offline fixture regression tests. Run via npm run test:security, not against live DB.
begin;
do $$
declare e uuid := '00000000-0000-0000-0000-000000000010';
 s uuid := '00000000-0000-0000-0000-000000000020';
 p uuid; q uuid; i integer := 0;
 kind text; kinds text[] := array['single_choice','true_false','fill_blank','ordering','matching','short_answer','essay'];
 keys text[] := array['A','对','你好 / 您好','1423','B','中文,汉语','你好世界'];
begin
 insert into student_profiles(user_id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
 insert into exams(id,title,hsk_level,total_score,passing_score,visibility) values(e,'SECURITY-OFFLINE',3,300,180,'public');
 insert into exam_sections(id,exam_id,section_type,title,max_score) values(s,e,'reading','Reading',100);
 foreach kind in array kinds loop
  i:=i+1; p:=gen_random_uuid();
  insert into exam_parts(id,section_id,title,question_type) values(p,s,kind,kind);
  q:=('00000000-0000-0000-0000-'||lpad((100+i)::text,12,'0'))::uuid;
  insert into exam_questions(id,part_id,question_num,correct_answer,content,score) values(q,p,i,keys[i],case when kind='ordering' then '① 我 ② 中文 ③ 学习 ④ 在' else '' end,2.5);
 end loop;
 -- Preserve prior records but do not use client-scored history to release keys.
 insert into exam_attempts(student_id,exam_id,score,total_score) values('00000000-0000-0000-0000-000000000001',e,300,300);
end $$;
set local role authenticated;
select set_config('test.uid','00000000-0000-0000-0000-000000000001',true);
do $$
declare e uuid := '00000000-0000-0000-0000-000000000010'; a uuid; row record;
 good jsonb := '{"00000000-0000-0000-0000-000000000101":"a","00000000-0000-0000-0000-000000000102":"true","00000000-0000-0000-0000-000000000103":"您好","00000000-0000-0000-0000-000000000104":"我在中文学习","00000000-0000-0000-0000-000000000105":"b","00000000-0000-0000-0000-000000000106":"汉 语","00000000-0000-0000-0000-000000000107":"你好世界"}';
begin
 assert (select count(*)=0 from get_exam_answers(e)), 'legacy attempt must not unlock answers';
 begin
  perform correct_answer from exam_questions;
  raise exception 'FAIL raw answer select allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into exam_attempts(student_id,exam_id,score,total_score,grading_version) values(auth.uid(),e,300,300,'server-v1');
  raise exception 'FAIL direct insert allowed';
 exception when insufficient_privilege then null; end;
 a := submit_exam_attempt(jsonb_build_object('exam_id',e,'answers','{}'::jsonb,'score',300,'correct_count',999,'total_score',999,'section_scores','[{"score":999}]'::jsonb,'student_id','00000000-0000-0000-0000-000000000002'));
 select * into row from exam_attempts where id=a;
 assert row.student_id=auth.uid() and row.score=0 and row.correct_count=0 and row.question_count=7 and row.total_score=300 and row.passing_score=180 and row.grading_version='server-v1', 'forged aggregate accepted';
 assert (row.section_scores->0->>'score')::numeric=0, 'forged section accepted';
 assert (select count(*)=7 from get_exam_answers(e)), 'server submission unlocks review';
 a:=submit_exam_attempt(jsonb_build_object('exam_id',e,'answers',good));
 select * into row from exam_attempts where id=a;
 assert row.score=300 and row.correct_count=7 and row.question_count=7, 'supported types grading failed';
 assert (row.section_scores->0->>'score')::numeric=100, 'section normalization';
 a:=submit_exam_attempt(jsonb_build_object('exam_id',e,'answers',jsonb_build_object('00000000-0000-0000-0000-000000000101','A')));
 select * into row from exam_attempts where id=a;
 assert row.score=42.9 and row.correct_count=1, 'partial normalized grade';
 begin
  perform submit_exam_attempt(jsonb_build_object('exam_id',e,'answers',jsonb_build_object('00000000-0000-0000-0000-000000000999','A')));
  raise exception 'FAIL foreign question accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform submit_exam_attempt(jsonb_build_object('exam_id',e,'answers',jsonb_build_object('00000000-0000-0000-0000-000000000101',true)));
  raise exception 'FAIL non-string accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform submit_exam_attempt(jsonb_build_object('exam_id',e,'answers','[]'::jsonb));
  raise exception 'FAIL array accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform submit_exam_attempt(jsonb_build_object('exam_id',e,'time_spent_secs',-1));
  raise exception 'FAIL invalid time accepted';
 exception when invalid_parameter_value then null; end;
 perform set_config('test.uid','00000000-0000-0000-0000-000000000002',true);
 assert (select count(*)=0 from get_exam_answers(e)), 'another student attempt unlocked keys';
 perform set_config('test.staff','true',true);
 assert (select count(*)=7 from get_exam_answers(e)), 'staff editor key access';
 perform set_config('test.staff','false',true);
 perform set_config('test.denied','true',true);
 assert (select count(*)=0 from get_exam_answers(e)), 'invisible exam keys';
 begin
  perform submit_exam_attempt(jsonb_build_object('exam_id',e));
  raise exception 'FAIL denied exam submitted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$
begin
 assert public.exam_answer_matches('①④②③','1,4,2,3','ordering','① 我 ② 中文 ③ 学习 ④ 在');
 assert public.exam_answer_matches('我在中文学习','1423 / 1234','ordering','① 我 ② 中文 ③ 学习 ④ 在');
 assert not public.exam_answer_matches('1234','1423','ordering','① 我 ② 中文 ③ 学习 ④ 在');
 assert public.exam_answer_matches('false','错','true_false','');
 assert not public.exam_answer_matches('','A','single_choice','');
 assert not has_function_privilege('anon','public.submit_exam_attempt(jsonb)','execute');
 assert not has_function_privilege('anon','public.get_exam_answers(uuid)','execute');
 raise notice '035 offline OK';
end $$;
rollback;
