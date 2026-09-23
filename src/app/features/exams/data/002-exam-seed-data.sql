-- ==============================================================================
-- MAYO CREATIVE CHINESE — HSK 3 SEED DATA (HSK 2.0 MOCK TEST 01)
-- ==============================================================================
-- Chạy script này sau khi đã thực thi 001-exam-schema.sql.
-- Dữ liệu mẫu chuẩn cấu trúc HSK 3 (Nghe, Đọc, Viết) với đa dạng loại câu hỏi:
--   - single_choice (Trắc nghiệm A, B, C, D)
--   - true_false (Phán đoán Đúng/Sai)
--   - fill_blank (Điền từ vào chỗ trống)
--   - ordering (Sắp xếp từ thành câu hoàn chỉnh)
--   - short_answer (Nhìn Pinyin điền chữ Hán)
-- ==============================================================================

DO $$
DECLARE
  v_exam_id UUID;
  v_sec_listen UUID;
  v_sec_read UUID;
  v_sec_write UUID;
  
  v_part1 UUID;
  v_part2 UUID;
  v_part3 UUID;
  v_part4 UUID;
  v_part5 UUID;
  v_part6 UUID;
  v_part7 UUID;

  v_q UUID;
BEGIN

  -- 1. TẠO ĐỀ THI MẪU: HSK 3
  INSERT INTO exams (
    title,
    hsk_level,
    hsk_version,
    duration_mins,
    total_score,
    passing_score,
    description,
    is_published
  ) VALUES (
    'HSK 3 — Đề thi thử tiêu chuẩn số 01',
    3,
    '2.0',
    90,
    300,
    180,
    'Đề thi thử HSK cấp độ 3 định dạng HSK 2.0 tiêu chuẩn gồm 3 phần: Nghe hiểu (40 câu), Đọc hiểu (30 câu) và Viết (10 câu). Giúp học viên làm quen với format đề thi thật và đánh giá năng lực hiện tại.',
    true
  ) RETURNING id INTO v_exam_id;

  -- ============================================================================
  -- PHẦN 1: NGHE HIỂU (LISTENING - 听力)
  -- ============================================================================
  INSERT INTO exam_sections (
    exam_id, section_type, title, sort_order, max_score, instructions, audio_url
  ) VALUES (
    v_exam_id,
    'listening',
    'Phần 1: Nghe hiểu (听力)',
    1,
    100,
    'Phần thi Nghe hiểu gồm 40 câu hỏi, thời gian nghe khoảng 35 phút. Mỗi câu được nghe 2 lần. Hãy chú ý lắng nghe và chọn đáp án chính xác nhất.',
    'https://animyjihwiyqsxvikxxg.supabase.co/storage/v1/object/public/exam-assets/audio/hsk3_sample_listening.mp3'
  ) RETURNING id INTO v_sec_listen;

  -- Part 1.1: Nghe chọn đáp án trắc nghiệm
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_listen,
    'Phần I: Nghe đoạn đối thoại ngắn và chọn đáp án đúng',
    'single_choice',
    'Mỗi câu có một đoạn đối thoại ngắn. Sau câu hỏi, chọn một trong các phương án A, B, C.',
    1
  ) RETURNING id INTO v_part1;

  -- Câu 1 (Nghe)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part1,
    1,
    '男：请问，洗手间在哪儿？
女：在前面，左拐就到了。
问：男的在找什么？',
    'B',
    'Dịch nghĩa:
Nam: Xin hỏi, nhà vệ sinh ở đâu?
Nữ: Ở phía trước, rẽ trái là đến.
Hỏi: Người nam đang tìm cái gì?
Đáp án B: 洗手间 (Nhà vệ sinh).',
    2.5,
    1
  ) RETURNING id INTO v_q;

  INSERT INTO exam_options (question_id, label, content, sort_order) VALUES
    (v_q, 'A', '教室 (Phòng học)', 1),
    (v_q, 'B', '洗手间 (Nhà vệ sinh)', 2),
    (v_q, 'C', '超市 (Siêu thị)', 3);

  -- Câu 2 (Nghe)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part1,
    2,
    '女：明天天气怎么样？会下雨吗？
男：刚才看天气预报了，明天是晴天，不冷也不热。
问：明天天气怎么样？',
    'A',
    'Dịch nghĩa:
Nữ: Ngày mai thời tiết thế nào? Có mưa không?
Nam: Vừa nãy anh xem dự báo thời tiết rồi, mai là trời nắng, không lạnh cũng không nóng.
Hỏi: Ngày mai thời tiết thế nào?
Đáp án A: 晴天 (Trời nắng).',
    2.5,
    2
  ) RETURNING id INTO v_q;

  INSERT INTO exam_options (question_id, label, content, sort_order) VALUES
    (v_q, 'A', '晴天 (Trời nắng)', 1),
    (v_q, 'B', '下大雨 (Mưa to)', 2),
    (v_q, 'C', '很冷 (Rất lạnh)', 3);

  -- Part 1.2: Phán đoán Đúng / Sai
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_listen,
    'Phần II: Nghe câu trần thuật và phán đoán Đúng / Sai',
    'true_false',
    'Hãy lắng nghe một đoạn ngắn rồi phán đoán xem câu nhận định là Đúng (对) hay Sai (错).',
    2
  ) RETURNING id INTO v_part2;

  -- Câu 3 (Đúng/Sai)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part2,
    3,
    '【Đoạn nghe】: 为了健康，我每天早上都去公园跑步半个小时，然后再去上班。
【Nhận định】: ★ 他每天早上锻炼身体。',
    'true',
    'Dịch nghĩa:
Đoạn nghe: Vì sức khỏe, mỗi buổi sáng tôi đều đến công viên chạy bộ nửa tiếng, sau đó mới đi làm.
Nhận định: Anh ấy mỗi sáng đều tập thể dục.
-> Khớp với ý "跑步半个小时", chọn Đúng (对 / true).',
    2.5,
    1
  );

  -- Câu 4 (Đúng/Sai)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part2,
    4,
    '【Đoạn nghe】: 这本书很有意思，我已经看了三遍了，每次看都有新的收获。
【Nhận định】: ★ 他觉得这本书很无聊。',
    'false',
    'Dịch nghĩa:
Đoạn nghe: Quyển sách này rất thú vị, tôi đã đọc 3 lần rồi, mỗi lần xem đều có thu hoạch mới.
Nhận định: Anh ấy cảm thấy quyển sách này rất nhàm chán (无聊).
-> Ngược với ý "很有意思", chọn Sai (错 / false).',
    2.5,
    2
  );


  -- ============================================================================
  -- PHẦN 2: ĐỌC HIỂU (READING - 阅读)
  -- ============================================================================
  INSERT INTO exam_sections (
    exam_id, section_type, title, sort_order, max_score, instructions
  ) VALUES (
    v_exam_id,
    'reading',
    'Phần 2: Đọc hiểu (阅读)',
    2,
    100,
    'Phần Đọc hiểu gồm 30 câu hỏi, thời gian làm bài 30 phút. Đọc kỹ văn bản và các phương án trước khi chọn câu trả lời.'
  ) RETURNING id INTO v_sec_read;

  -- Part 2.1: Điền từ vào chỗ trống (fill_blank)
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_read,
    'Phần I: Chọn từ ngữ thích hợp điền vào chỗ trống',
    'fill_blank',
    'Chọn từ thích hợp từ danh sách cho sẵn để hoàn thành câu.',
    1
  ) RETURNING id INTO v_part3;

  -- Câu 5 (Điền từ)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part3,
    5,
    '虽然汉语语法有点儿难，但是只要多练习，就一定能（______）好。',
    '学',
    'Từ cần điền là động từ "学" (học). Kết cấu: 学好 (học tốt/giỏi).
Dịch nghĩa: Mặc dù ngữ pháp tiếng Hán hơi khó, nhưng chỉ cần luyện tập nhiều, nhất định có thể học tốt.',
    3.0,
    1
  );

  -- Câu 6 (Điền từ)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part3,
    6,
    '我们公司离地铁站很（______），走路五分钟就能到。',
    '近',
    'Từ cần điền là tính từ "近" (gần). Cụm: 离...很近 (cách... rất gần).
Dịch nghĩa: Công ty chúng tôi cách ga tàu điện ngầm rất gần, đi bộ 5 phút là tới.',
    3.0,
    2
  );

  -- Part 2.2: Đọc hiểu đoạn văn ngắn (single_choice)
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_read,
    'Phần II: Đọc đoạn văn và chọn đáp án chính xác',
    'single_choice',
    'Đọc đoạn văn ngắn và chọn câu trả lời phù hợp nhất trong 3 phương án A, B, C.',
    2
  ) RETURNING id INTO v_part4;

  -- Câu 7 (Đọc hiểu trắc nghiệm)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part4,
    7,
    '很多人遇到困难的时候，都会选择放弃。其实，只要你再坚持一下，就有可能看到成功的希望。
★ 这段话主要想告诉我们：',
    'C',
    'Đoạn văn khuyên người ta khi gặp khó khăn không nên từ bỏ mà cần kiên trì thêm một chút (再坚持一下).
Đáp án C: 遇到困难不要轻易放弃 (Gặp khó khăn đừng vội từ bỏ).',
    3.5,
    1
  ) RETURNING id INTO v_q;

  INSERT INTO exam_options (question_id, label, content, sort_order) VALUES
    (v_q, 'A', '成功很容易 (Thành công rất dễ dàng)', 1),
    (v_q, 'B', '要经常去帮助别人 (Nên thường xuyên giúp đỡ người khác)', 2),
    (v_q, 'C', '遇到困难不要轻易放弃 (Gặp khó khăn đừng từ bỏ)', 3);


  -- ============================================================================
  -- PHẦN 3: VIẾT (WRITING - 书写)
  -- ============================================================================
  INSERT INTO exam_sections (
    exam_id, section_type, title, sort_order, max_score, instructions
  ) VALUES (
    v_exam_id,
    'writing',
    'Phần 3: Viết (书写)',
    3,
    100,
    'Phần Viết gồm 10 câu hỏi, thời gian 15 phút. Phần 1 sắp xếp từ thành câu, phần 2 nhìn phiên âm viết chữ Hán.'
  ) RETURNING id INTO v_sec_write;

  -- Part 3.1: Sắp xếp cụm từ thành câu (ordering)
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_write,
    'Phần I: Sắp xếp các từ đã cho thành câu hoàn chỉnh',
    'ordering',
    'Sắp xếp các cụm từ theo đúng trật tự ngữ pháp tiếng Hán.',
    1
  ) RETURNING id INTO v_part5;

  -- Câu 8 (Sắp xếp câu)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part5,
    8,
    '① 那只猫  ② 桌子下面  ③ 睡觉  ④ 在',
    '①④②③',
    'Cấu trúc ngữ pháp câu chữ 在 chỉ vị trí hành động: Chủ ngữ + 在 + Nơi chốn + Động từ.
-> 那只猫 (①) 在 (④) 桌子下面 (②) 睡觉 (③)。
Câu hoàn chỉnh: 那只猫在桌子下面睡觉。',
    10.0,
    1
  );

  -- Câu 9 (Sắp xếp câu)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part5,
    9,
    '① 比  ② 妹妹  ③ 我  ④ 高',
    '②①③④',
    'Cấu trúc câu so sánh hơn với 比: A + 比 + B + Tính từ.
-> 妹妹 (②) 比 (①) 我 (③) 高 (④)。
Câu hoàn chỉnh: 妹妹比我高。 (Em gái cao hơn tôi). Hoặc: 我比妹妹高 (③①②④). Cả 2 cách đều đúng ngữ pháp.',
    10.0,
    2
  );

  -- Part 3.2: Nhìn Pinyin điền chữ Hán (short_answer)
  INSERT INTO exam_parts (
    section_id, title, question_type, instructions, sort_order
  ) VALUES (
    v_sec_write,
    'Phần II: Nhìn phiên âm viết đúng chữ Hán',
    'short_answer',
    'Điền đúng một chữ Hán vào chỗ trống dựa theo phiên âm cho sẵn trong ngoặc.',
    2
  ) RETURNING id INTO v_part6;

  -- Câu 10 (Viết chữ Hán)
  INSERT INTO exam_questions (
    part_id, question_num, content, correct_answer, explanation, score, sort_order
  ) VALUES (
    v_part6,
    10,
    '今天是星期（tīan _______），我们不用去上班。',
    '天',
    'Pinyin "tīan" trong ngữ cảnh "星期天" (Chủ nhật) ứng với chữ Hán: 天.',
    10.0,
    1
  );

END $$;
