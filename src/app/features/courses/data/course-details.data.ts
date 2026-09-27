// TỰ ĐỘNG SINH từ brief "Trang chi tiết từng khóa học" — không sửa tay.
// Chạy lại: python scripts/course-brief-to-ts.py
import type { CourseDetail } from '../models/course-detail.model';

export const COURSE_DETAILS: CourseDetail[] = [
  {
    "slug": "hsk-3-0",
    "name": "Luyện thi HSK 3.0 & HSKK",
    "goal": "Xây nền tảng vững chắc từ HSK 1 đến HSK 3 và làm quen sớm với format đề HSK 3.0 mới nhất.",
    "lead": [],
    "chips": [
      "Combo HSK 1–3",
      "Format HSK 3.0",
      "59 buổi",
      "Có luyện HSKK"
    ],
    "stats": [
      {
        "value": "59",
        "label": "buổi học (2 giờ/buổi)"
      },
      {
        "value": "3",
        "label": "giai đoạn HSK 1 – 2 – 3"
      },
      {
        "value": "~1.000",
        "label": "từ vựng tích lũy"
      },
      {
        "value": "5",
        "label": "buổi luyện HSKK"
      }
    ],
    "blocks": [
      {
        "kind": "list",
        "items": [
          "Học theo format HSK 3.0, cấu trúc đề mới nhất, làm quen ngay từ HSK 1.",
          "Lộ trình trọn gói 3 giai đoạn, 59 buổi, có bài kiểm tra cuối mỗi giai đoạn.",
          "Học liệu độc quyền MCC: slide từng bài, flashcard, sách bài tập, tài liệu luyện dịch, luyện viết.",
          "Luyện HSKK ngay trong giai đoạn HSK 3 để phát triển kỹ năng nói."
        ],
        "title": "Điểm nổi bật"
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 1: HSK 1 — Nền tảng & mẫu câu cơ bản (Buổi 1–19)",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Cấu trúc: 2 buổi phiên âm + 15 buổi bài khóa + 1 buổi ôn tập + 1 bài kiểm tra cuối khóa. Đầu ra: ~300 từ vựng, 40 điểm ngữ pháp cơ bản — hiểu và dùng được các câu cơ bản trong cuộc sống.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Buổi",
              "Bài khóa",
              "Ngữ pháp trọng tâm"
            ],
            "rows": [
              [
                [
                  {
                    "text": "Buổi 1",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Giới thiệu chung về tiếng Trung và Phiên âm (Pinyin) — phần 1",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 2",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Phiên âm (Pinyin) — phần 2 và luyện tập phiên âm tổng hợp",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 3",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 1",
                    "bold": true
                  },
                  {
                    "text": "Xin chào AI Tiểu Ngữ!",
                    "bold": true
                  },
                  {
                    "text": "AI小语，你好！",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "— (bài mở đầu)",
                    "italic": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 4",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 2",
                    "bold": true
                  },
                  {
                    "text": "Mình tên là Lý Văn",
                    "bold": true
                  },
                  {
                    "text": "我叫李文",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trật tự từ cơ bản của câu trong tiếng Trung Quốc",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 5",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 3",
                    "bold": true
                  },
                  {
                    "text": "Mình là người Trung Quốc",
                    "bold": true
                  },
                  {
                    "text": "我是中国人",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu chữ “是”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ kết cấu “的”",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi “có... (hay) không?” dùng “吗”",
                    "bullet": true
                  },
                  {
                    "text": "Cách cài bàn phím tiếng Trung và cách đánh máy",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 6",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 4",
                    "bold": true
                  },
                  {
                    "text": "Chị có hai con",
                    "bold": true
                  },
                  {
                    "text": "我有两个孩子",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu chữ “有” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn đạt các con số",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “呢” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Danh lượng từ và cấu trúc danh lượng",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 7",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 5",
                    "bold": true
                  },
                  {
                    "text": "Hôm nay anh được nghỉ",
                    "bold": true
                  },
                  {
                    "text": "今天我休息",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn đạt thời gian (1)",
                    "bullet": true
                  },
                  {
                    "text": "Câu vị ngữ danh từ",
                    "bullet": true
                  },
                  {
                    "text": "Động từ năng nguyện “会”",
                    "bullet": true
                  },
                  {
                    "text": "Kiểm tra 15 phút và ôn tập ngắn",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 8",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 6",
                    "bold": true
                  },
                  {
                    "text": "Số điện thoại di động của bạn là bao nhiêu?",
                    "bold": true
                  },
                  {
                    "text": "你的手机号是多少？",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ năng nguyện “想”",
                    "bullet": true
                  },
                  {
                    "text": "Câu liên động (1)",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “怎么”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 9",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 7",
                    "bold": true
                  },
                  {
                    "text": "Em tan làm lúc 6 rưỡi tối",
                    "bold": true
                  },
                  {
                    "text": "我晚上六点半下班",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn đạt thời gian (2)",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “吧” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Vị trí của phó từ, từ chỉ thời gian khi làm trạng ngữ",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “呢” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 10",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 8",
                    "bold": true
                  },
                  {
                    "text": "Bố em cũng làm việc ở bệnh viện",
                    "bold": true
                  },
                  {
                    "text": "我爸爸也在医院工作",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Phương vị từ",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “在”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ năng nguyện “能”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 11",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 9",
                    "bold": true
                  },
                  {
                    "text": "Sáng mai mình học ở trường",
                    "bold": true
                  },
                  {
                    "text": "我明天上午在学校学习",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu tồn hiện (1)",
                    "bullet": true
                  },
                  {
                    "text": "Trật tự từ chỉ thời gian và nơi chốn khi cùng làm trạng ngữ",
                    "bullet": true
                  },
                  {
                    "text": "“第” biểu thị số thứ tự",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 12",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 10",
                    "bold": true
                  },
                  {
                    "text": "Táo ở đây rẻ thật!",
                    "bold": true
                  },
                  {
                    "text": "这儿的苹果真便宜！",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn đạt số tiền",
                    "bullet": true
                  },
                  {
                    "text": "Câu vị ngữ tính từ",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “怎么样”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 13",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 11",
                    "bold": true
                  },
                  {
                    "text": "Em đang học đại học",
                    "bold": true
                  },
                  {
                    "text": "我读大学呢",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu hỏi chính phản",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ thời gian “在/正在”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ năng nguyện “要”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 14",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 12",
                    "bold": true
                  },
                  {
                    "text": "Hôm qua tuyết rơi rồi",
                    "bold": true
                  },
                  {
                    "text": "昨天下雪了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu phi chủ vị",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “了” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “太……了”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 15",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 13",
                    "bold": true
                  },
                  {
                    "text": "Cho tôi một cốc trà",
                    "bold": true
                  },
                  {
                    "text": "请给我一杯茶",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ năng nguyện “可以”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “động từ + 一下”",
                    "bullet": true
                  },
                  {
                    "text": "Câu có hai tân ngữ (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 16",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 14",
                    "bold": true
                  },
                  {
                    "text": "Mình đã xem một bộ phim",
                    "bold": true
                  },
                  {
                    "text": "我看了一个电影",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ động thái “了” (2)",
                    "bullet": true
                  },
                  {
                    "text": "Từ li hợp (1)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ phạm vi “都”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 17",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 15",
                    "bold": true
                  },
                  {
                    "text": "Hẹn gặp ở sân bay Đại Hưng!",
                    "bold": true
                  },
                  {
                    "text": "大兴机场见！",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép đẳng lập “……，还/也……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 18",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ôn tập tổng hợp, luyện nói",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 19",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Kiểm tra cuối khóa HSK 1",
                    "bold": true
                  }
                ]
              ]
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 2: HSK 2 — Mở rộng khả năng diễn đạt (Buổi 20–37)",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Cấu trúc: 15 buổi bài khóa + 1 buổi ôn giữa khóa + 1 buổi ôn cuối khóa + 1 bài kiểm tra cuối khóa. Đầu ra: +~200 từ vựng, 45 điểm ngữ pháp — giao tiếp trôi chảy hơn trong các chủ đề quen thuộc.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Buổi",
              "Bài khóa",
              "Ngữ pháp trọng tâm"
            ],
            "rows": [
              [
                [
                  {
                    "text": "Buổi 20",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 1",
                    "bold": true
                  },
                  {
                    "text": "Chị ấy đã mời chúng em ăn vịt quay Bắc Kinh",
                    "bold": true
                  },
                  {
                    "text": "她请我们吃了北京烤鸭",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ ngữ khí “吧” (2)",
                    "bullet": true
                  },
                  {
                    "text": "Câu “是……的”",
                    "bullet": true
                  },
                  {
                    "text": "Câu kiêm ngữ",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 21",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 2",
                    "bold": true
                  },
                  {
                    "text": "Chúng ta vẫn nên gọi taxi đi Đại học Bắc Kinh nhé",
                    "bold": true
                  },
                  {
                    "text": "还是打车去北大吧",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc cố định “还是……吧”",
                    "bullet": true
                  },
                  {
                    "text": "Dùng “多” để diễn đạt số ước lượng",
                    "bullet": true
                  },
                  {
                    "text": "Động từ, cụm động từ, cụm chủ vị làm định ngữ",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 22",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 3",
                    "bold": true
                  },
                  {
                    "text": "Em muốn đi Tây An du lịch",
                    "bold": true
                  },
                  {
                    "text": "我想去西安旅游",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ kết quả",
                    "bullet": true
                  },
                  {
                    "text": "Động từ lặp lại (1)",
                    "bullet": true
                  },
                  {
                    "text": "Động từ lặp lại (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 23",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 4",
                    "bold": true
                  },
                  {
                    "text": "Con mặc đồ màu đỏ rất đẹp",
                    "bold": true
                  },
                  {
                    "text": "你穿红色的很好看",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ động thái “过”",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép nhân quả “因为……，所以……”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ chữ “的”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 24",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 5",
                    "bold": true
                  },
                  {
                    "text": "Lần đầu đến thăm nhà bạn người Trung Quốc",
                    "bold": true
                  },
                  {
                    "text": "第一次去中国朋友家",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ xu hướng đơn (1)",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ xu hướng đơn (2)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “都……了”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 25",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 6",
                    "bold": true
                  },
                  {
                    "text": "Chúc mừng sinh nhật Tiểu Tuyết!",
                    "bold": true
                  },
                  {
                    "text": "小雪，生日快乐！",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Tính từ lặp lại",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ cố định “什么的”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ kết cấu “地”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 26",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 7",
                    "bold": true
                  },
                  {
                    "text": "Bạn ấy chơi bóng rổ rất hay",
                    "bold": true
                  },
                  {
                    "text": "他篮球打得很好",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép rút gọn “一……就……”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ trạng thái (1)",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ trạng thái (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 27",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ôn tập giữa khóa, luyện nói",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 28",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 8",
                    "bold": true
                  },
                  {
                    "text": "Mặc dù em quên, nhưng anh vẫn nhớ",
                    "bold": true
                  },
                  {
                    "text": "虽然你忘了，但是我记得",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu so sánh (1)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (2)",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép chuyển ý “虽然……，但是……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 29",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 9",
                    "bold": true
                  },
                  {
                    "text": "Em đi mua một cốc trà sữa",
                    "bold": true
                  },
                  {
                    "text": "我去买杯奶茶",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu so sánh (3)",
                    "bullet": true
                  },
                  {
                    "text": "Động từ “离”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ thời lượng (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 30",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 10",
                    "bold": true
                  },
                  {
                    "text": "Sắp thi rồi",
                    "bold": true
                  },
                  {
                    "text": "就要考试了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có cụm chủ vị làm vị ngữ",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi lựa chọn",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “要/快/快要/就要……了”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 31",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 11",
                    "bold": true
                  },
                  {
                    "text": "Em thích ăn món Trung Quốc nhất",
                    "bold": true
                  },
                  {
                    "text": "我最喜欢吃中国菜",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ động thái “着” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ động thái “着” (2)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ mức độ “最”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 32",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 12",
                    "bold": true
                  },
                  {
                    "text": "Ở đây lạnh hơn Bắc Kinh nhiều",
                    "bold": true
                  },
                  {
                    "text": "这里比北京冷多了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu so sánh (4)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (5)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (6)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 33",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 13",
                    "bold": true
                  },
                  {
                    "text": "Chúng tôi yêu thích môn tiếng Trung Quốc",
                    "bold": true
                  },
                  {
                    "text": "我们爱上中文课",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có hai tân ngữ (2)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (7)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (8)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 34",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 14",
                    "bold": true
                  },
                  {
                    "text": "Một mình đón năm mới thì thật vô vị",
                    "bold": true
                  },
                  {
                    "text": "一个人过年多没意思啊",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu tồn hiện (2)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ mức độ “多”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ xu hướng kép",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 35",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 15",
                    "bold": true
                  },
                  {
                    "text": "Em muốn đi Trung Quốc một lần nữa",
                    "bold": true
                  },
                  {
                    "text": "我想再去一次中国",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ động lượng (1)",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ động lượng (2)",
                    "bullet": true
                  },
                  {
                    "text": "Câu chữ “有” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 36",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ôn tập cuối khóa, luyện nói tổng hợp",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 37",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Kiểm tra cuối khóa HSK 2",
                    "bold": true
                  }
                ]
              ]
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 3: HSK 3 + HSKK — Diễn đạt tự nhiên & luyện nói (Buổi 38–59)",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Cấu trúc: 18 buổi bài khóa + 1 buổi ôn tập & kiểm tra giữa khóa + 2 buổi luyện HSKK + 1 bài kiểm tra cuối khóa. Đầu ra: +~500 từ mới (tổng ~1.000 từ), 63 điểm ngữ pháp nâng cao — trình bày ý kiến, kể lại sự việc, giao tiếp tự nhiên hơn; luyện HSKK để phát triển kỹ năng nói.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Buổi",
              "Bài khóa",
              "Ngữ pháp trọng tâm"
            ],
            "rows": [
              [
                [
                  {
                    "text": "Buổi 38",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 1",
                    "bold": true
                  },
                  {
                    "text": "Anh chị sẽ đến sân bay đón các em",
                    "bold": true
                  },
                  {
                    "text": "我们去机场接你们",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cụm từ cố định “看上去/看起来”",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng linh hoạt của đại từ nghi vấn (1)",
                    "bullet": true
                  },
                  {
                    "text": "Định ngữ đa tầng",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 39",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 2",
                    "bold": true
                  },
                  {
                    "text": "Các em muốn ăn món gì thì gọi món đó",
                    "bold": true
                  },
                  {
                    "text": "你们想吃什么就点什么",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép đẳng lập “又……又……”",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng linh hoạt của đại từ nghi vấn (2)",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng linh hoạt của đại từ nghi vấn (3)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 40",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 3",
                    "bold": true
                  },
                  {
                    "text": "Khu dân cư này khá tốt",
                    "bold": true
                  },
                  {
                    "text": "这个小区挺好的",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Phó từ chỉ mức độ “挺”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ trình độ (1)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ “就” và “才”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 41",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 4",
                    "bold": true
                  },
                  {
                    "text": "Khách sạn này không giống như những khách sạn khác",
                    "bold": true
                  },
                  {
                    "text": "这家宾馆跟别的都不一样",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc “一……也/都+不/没……”",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (9)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “除了……(以外)，……都/还/也……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 42",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 5",
                    "bold": true
                  },
                  {
                    "text": "Những bức ảnh như thế này mới đẹp",
                    "bold": true
                  },
                  {
                    "text": "这样的照片才好看",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ trình độ (2)",
                    "bullet": true
                  },
                  {
                    "text": "Lượng từ lặp lại",
                    "bullet": true
                  },
                  {
                    "text": "Câu tồn hiện (3)",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép rút gọn “……了……就……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 43",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 6",
                    "bold": true
                  },
                  {
                    "text": "Trên tàu cao tốc vẫn có thể đặt đồ ăn giao tận nơi",
                    "bold": true
                  },
                  {
                    "text": "高铁上还可以点外卖",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc cố định “该……了”",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép giả định “如果……，就……”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ cố định “越来越”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 44",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 7",
                    "bold": true
                  },
                  {
                    "text": "Chiếc váy đó đẹp hơn quần soóc",
                    "bold": true
                  },
                  {
                    "text": "那条裙子比短裤更好看",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu liên động (2)",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (10)",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ trình độ (3)",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép tăng tiến “不但……，而且……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 45",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 8",
                    "bold": true
                  },
                  {
                    "text": "Hôm nay tôi xuất viện rồi",
                    "bold": true
                  },
                  {
                    "text": "今天我出院了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách dùng mở rộng của bổ ngữ xu hướng (1)",
                    "bullet": true
                  },
                  {
                    "text": "Từ li hợp (2)",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ thời lượng (2)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “……以前/以后/前/后”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 46",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 9",
                    "bold": true
                  },
                  {
                    "text": "Chơi không tốt cũng không sao",
                    "bold": true
                  },
                  {
                    "text": "打不好没关系",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép chỉ mục đích “为了……，……”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ khả năng",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “越 A 越 B”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 47",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ôn tập + kiểm tra giữa khóa",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 48",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 10",
                    "bold": true
                  },
                  {
                    "text": "Ngày mai em trả lại sách cho cô nhé",
                    "bold": true
                  },
                  {
                    "text": "你明天再把书还给我",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu chữ “把” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “在……上/中/下”",
                    "bullet": true
                  },
                  {
                    "text": "Câu chữ “把” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 49",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 11",
                    "bold": true
                  },
                  {
                    "text": "Xem ra em không thể giải quyết vấn đề này",
                    "bold": true
                  },
                  {
                    "text": "看来我没办法解决这个问题",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“还是” và “或者”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ cố định “看来”",
                    "bullet": true
                  },
                  {
                    "text": "Câu chữ “把” (3)",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “对……来说”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 50",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 12",
                    "bold": true
                  },
                  {
                    "text": "Thời tiết thay đổi rất nhanh vào mùa này",
                    "bold": true
                  },
                  {
                    "text": "这个季节天气变化很快",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép lựa chọn “或者……，或者……”",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng mở rộng của bổ ngữ xu hướng (2)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ phạm vi “就”",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng mở rộng của bổ ngữ xu hướng (3)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 51",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 13",
                    "bold": true
                  },
                  {
                    "text": "Hàng xóm mới của tôi đến từ Vương quốc Anh",
                    "bold": true
                  },
                  {
                    "text": "我的新邻居来自英国",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép giả định “……的话，就……”",
                    "bullet": true
                  },
                  {
                    "text": "Câu chữ “把” (4)",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép đẳng lập “一边……，一边……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 52",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 14",
                    "bold": true
                  },
                  {
                    "text": "Quyển sách này đã bị người khác mượn rồi",
                    "bold": true
                  },
                  {
                    "text": "这本书被别人借走了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu bị động (1)",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép tiếp nối “先……，再/然后……”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “× 什么 (啊)”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 53",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 15",
                    "bold": true
                  },
                  {
                    "text": "Em cũng là một nửa người Nam Kinh",
                    "bold": true
                  },
                  {
                    "text": "我是半个南京人",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Giới từ “根据”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm chỉ số lượng lặp lại “số từ+lượng từ+số từ+lượng từ”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “在……看来”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ cố định “不一会儿”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 54",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 16",
                    "bold": true
                  },
                  {
                    "text": "Con nghe nói có một số con gấu trúc đã ra nước ngoài",
                    "bold": true
                  },
                  {
                    "text": "我听说有的熊猫出国了",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu ghép đẳng lập “一会儿……，一会儿……”",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “关于”",
                    "bullet": true
                  },
                  {
                    "text": "Cụm từ cố định “一般来说”",
                    "bullet": true
                  },
                  {
                    "text": "Câu so sánh (11)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 55",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 17",
                    "bold": true
                  },
                  {
                    "text": "Mình sẽ học hỏi từ những người cẩn thận",
                    "bold": true
                  },
                  {
                    "text": "我要多向认真的人学习",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Giới từ “向”",
                    "bullet": true
                  },
                  {
                    "text": "Câu phản vấn “不是……吗？”",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép tăng tiến “……，更……”",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép điều kiện “只有……，才……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 56",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "BÀI 18",
                    "bold": true
                  },
                  {
                    "text": "Cháu đã học được cách gói sủi cảo",
                    "bold": true
                  },
                  {
                    "text": "我学会了包饺子",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn tả số ước lượng",
                    "bullet": true
                  },
                  {
                    "text": "“刚才” và “刚刚”",
                    "bullet": true
                  },
                  {
                    "text": "Câu ghép điều kiện “只要……，就……”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc cố định “从……起”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 57",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Luyện đề HSKK (khẩu ngữ) — phần 1",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 58",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Luyện đề HSKK (khẩu ngữ) — phần 2",
                    "bold": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Buổi 59",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ôn tập và kiểm tra cuối khóa HSK 3",
                    "bold": true
                  }
                ]
              ]
            ]
          }
        ]
      },
      {
        "kind": "heading",
        "text": "Tài liệu & giáo trình đi kèm"
      },
      {
        "kind": "table",
        "head": [
          "HSK 1",
          "HSK 2",
          "HSK 3"
        ],
        "rows": [
          [
            [
              {
                "text": "Giáo trình chuẩn HSK 1 theo format HSK 3.0",
                "bullet": true
              },
              {
                "text": "17 bộ slide giảng dạy độc quyền từng bài",
                "bullet": true
              },
              {
                "text": "Flashcard từ vựng từng bài",
                "bullet": true
              },
              {
                "text": "Sách bài tập, tài liệu luyện dịch và luyện viết độc quyền MCC",
                "bullet": true
              }
            ],
            [
              {
                "text": "Giáo trình chuẩn HSK 2 theo format HSK 3.0",
                "bullet": true
              },
              {
                "text": "16 bộ slide giảng dạy độc quyền từng bài",
                "bullet": true
              },
              {
                "text": "Flashcard từ + mẫu câu từng bài",
                "bullet": true
              },
              {
                "text": "Sách bài tập, tài liệu luyện dịch và luyện viết độc quyền MCC",
                "bullet": true
              }
            ],
            [
              {
                "text": "Giáo trình chuẩn HSK 3 theo format HSK 3.0",
                "bullet": true
              },
              {
                "text": "18 bộ slide giảng dạy độc quyền từng bài",
                "bullet": true
              },
              {
                "text": "Flashcard từ + mẫu câu từng bài",
                "bullet": true
              },
              {
                "text": "Sách bài tập, tài liệu luyện dịch và luyện viết độc quyền MCC",
                "bullet": true
              }
            ]
          ]
        ]
      },
      {
        "kind": "paragraph",
        "lines": [
          {
            "text": "Lớp Online: MCC cấp tài khoản xem sách bản mềm (bản quyền). Lớp Offline: có giáo trình bản cứng dùng tại lớp.",
            "italic": true
          }
        ]
      }
    ],
    "info": [
      {
        "label": "Thời lượng",
        "value": [
          "59 buổi (HSK 1: 19 buổi · HSK 2: 18 buổi · HSK 3 + HSKK: 22 buổi)"
        ]
      },
      {
        "label": "Tần suất",
        "value": [
          "2–3 buổi/tuần (~5–7 tháng)"
        ]
      },
      {
        "label": "Sĩ số",
        "value": [
          "Offline: 5–8 học viên · Online: 5–12 học viên"
        ]
      },
      {
        "label": "Cam kết đầu ra",
        "value": [
          "Sử dụng được khoảng 1.000 từ vựng khi kết thúc lộ trình.",
          "Nắm các cấu trúc quan trọng như “把”, “被”, bổ ngữ, câu phức.",
          "Trình bày ý kiến, kể lại sự việc và giao tiếp tự nhiên hơn.",
          "Được luyện HSKK để phát triển kỹ năng nói.",
          "Cam kết đầu ra bằng văn bản"
        ]
      }
    ],
    "cardId": "hsk"
  },
  {
    "slug": "bo-sung-hsk-2-len-3",
    "name": "Bổ sung Kiến thức HSK 2.0 lên HSK 3.0",
    "goal": "",
    "lead": [
      {
        "label": "Đối tượng",
        "text": "Học viên đã học HSK 3 theo chương trình 2.0 hoặc đã có nền tảng HSK 3, cần bổ sung kiến thức theo chương trình 3.0."
      },
      {
        "label": "Thông điệp",
        "text": "Đã học HSK 3 nhưng chưa cập nhật chương trình 3.0? Bổ sung kiến thức còn thiếu – hiểu cách dùng – luyện tập – vận dụng vào đề HSK 3.0."
      }
    ],
    "chips": [
      "7 buổi",
      "6 nhóm chủ đề",
      "Có buổi tổng ôn & chữa đề"
    ],
    "stats": [],
    "blocks": [
      {
        "kind": "list",
        "items": [
          "Bổ sung hệ thống từ vựng và kiến thức HSK 3.0 còn thiếu.",
          "Củng cố cách sử dụng từ vựng trong các ngữ cảnh thường gặp.",
          "Mở rộng và hệ thống hóa kiến thức HSK 3.",
          "Tăng khả năng vận dụng từ vựng vào nghe, đọc và nói.",
          "Làm quen với dạng bài và yêu cầu của HSK 3.0 thông qua buổi tổng ôn và chữa đề."
        ],
        "title": "Mục tiêu khóa học"
      },
      {
        "kind": "paragraph",
        "lines": [
          {
            "text": "Lộ trình 7 buổi — khóa tập trung vào 6 nhóm chủ đề kiến thức, kết hợp từ vựng, cách dùng và bài tập vận dụng:"
          }
        ]
      },
      {
        "kind": "table",
        "head": [
          "Buổi",
          "Chủ đề",
          "Nội dung"
        ],
        "rows": [
          [
            [
              {
                "text": "Buổi 1",
                "bold": true
              }
            ],
            [
              {
                "text": "学校与日常生活",
                "bold": true
              },
              {
                "text": "Trường học và cuộc sống hằng ngày",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 2",
                "bold": true
              }
            ],
            [
              {
                "text": "购物、饮食与日常生活",
                "bold": true
              },
              {
                "text": "Mua sắm, ăn uống và sinh hoạt hằng ngày",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 3",
                "bold": true
              }
            ],
            [
              {
                "text": "出行、地点与活动",
                "bold": true
              },
              {
                "text": "Di chuyển, địa điểm và hoạt động",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 4",
                "bold": true
              }
            ],
            [
              {
                "text": "生活、时间与状态",
                "bold": true
              },
              {
                "text": "Cuộc sống, thời gian và trạng thái",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 5",
                "bold": true
              }
            ],
            [
              {
                "text": "工作、休闲与日常活动",
                "bold": true
              },
              {
                "text": "Công việc, giải trí và hoạt động thường ngày",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 6",
                "bold": true
              }
            ],
            [
              {
                "text": "生活、地点与常用词",
                "bold": true
              },
              {
                "text": "Cuộc sống, địa điểm và các từ thường dùng",
                "italic": true
              }
            ],
            [
              {
                "text": "Bổ sung từ vựng theo chủ đề, mở rộng cách dùng và kết hợp từ, phân biệt từ dễ nhầm, bài tập vận dụng."
              }
            ]
          ],
          [
            [
              {
                "text": "Buổi 7",
                "bold": true
              }
            ],
            [
              {
                "text": "总复习与HSK 3.0真题/模拟题讲解",
                "bold": true
              },
              {
                "text": "Tổng ôn và chữa đề HSK 3.0",
                "italic": true
              }
            ],
            [
              {
                "text": "Ôn tập hệ thống từ vựng; luyện các dạng bài HSK 3.0; chữa và phân tích đề; chỉ ra lỗi thường gặp và cách xử lý bài."
              }
            ]
          ]
        ]
      },
      {
        "kind": "list",
        "items": [
          "Không học lại toàn bộ HSK 3 mà tập trung vào phần kiến thức cần bổ sung.",
          "Nội dung được hệ thống hóa theo chủ đề, giúp học viên dễ ghi nhớ và vận dụng.",
          "Kết hợp từ vựng – cách dùng – bài tập – ngữ cảnh thực tế.",
          "Có 1 buổi tổng ôn và chữa đề HSK 3.0 để học viên kiểm tra khả năng vận dụng kiến thức sau khóa học."
        ],
        "title": "Điểm nổi bật"
      }
    ],
    "info": [
      {
        "label": "Thời lượng",
        "value": [
          "7 buổi"
        ]
      },
      {
        "label": "Tần suất",
        "value": [
          "2 buổi/tuần, 90 phút/buổi"
        ]
      },
      {
        "label": "Sĩ số",
        "value": [
          "10 học viên"
        ]
      },
      {
        "label": "Hình thức",
        "value": [
          "Online / Offline"
        ]
      },
      {
        "label": "Cam kết đầu ra",
        "value": [
          "Bổ sung đầy đủ hệ thống từ vựng và kiến thức HSK 3.0 còn thiếu.",
          "Vận dụng được từ vựng vào nghe, đọc và nói.",
          "Làm quen với dạng bài và yêu cầu của đề thi HSK 3.0.",
          "Sẵn sàng học tiếp hoặc thi theo cấu trúc đề HSK 3.0 mới, không phải học lại từ đầu."
        ]
      }
    ],
    "cardId": "supplement"
  },
  {
    "slug": "gia-su",
    "name": "Gia sư Tiếng Trung 1:1 và 1:2",
    "goal": "Lộ trình học riêng theo mục tiêu của bạn, linh hoạt về nội dung và thời gian.",
    "lead": [
      {
        "label": "Mô tả",
        "text": "Được xây dựng lộ trình học riêng theo mục tiêu của học viên (thi HSK, cải thiện giao tiếp, bổ trợ kiến thức trên lớp, v.v.), linh hoạt về nội dung và thời gian."
      }
    ],
    "chips": [
      "Cá nhân hóa",
      "1:1 hoặc 1:2"
    ],
    "stats": [],
    "blocks": [
      {
        "kind": "stage",
        "title": "Gia sư theo khóa",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Xây dựng lộ trình học riêng theo mục tiêu của học viên: thi HSK, cải thiện giao tiếp, bổ trợ kiến thức trên lớp, v.v. Nội dung và lịch học linh hoạt theo nhu cầu."
              }
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Gia sư theo buổi",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Dành cho học viên cần học bổ trợ, củng cố kiến thức, luyện kỹ năng hoặc giải đáp chuyên sâu theo từng chủ đề."
              }
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Quy trình bắt đầu",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "(1) Trao đổi mục tiêu → (2) Xây lộ trình riêng → (3) Xếp gia sư & lịch học → (4) Học và theo dõi tiến độ"
              }
            ]
          }
        ]
      }
    ],
    "info": [
      {
        "label": "Thời lượng",
        "value": [
          "2–5 buổi/tuần, mỗi buổi 1 giờ 30 phút"
        ]
      },
      {
        "label": "Sĩ số",
        "value": [
          "1–2 học viên (1:1 hoặc 1:2)"
        ]
      },
      {
        "label": "Hình thức",
        "value": [
          "Gia sư theo buổi"
        ]
      },
      {
        "label": "Cam kết đầu ra",
        "value": [
          "Lộ trình bám sát mục tiêu cá nhân đã thống nhất từ đầu."
        ]
      },
      {
        "label": "Học phí",
        "value": [
          "Liên hệ tư vấn"
        ]
      }
    ],
    "cardId": "tutor"
  },
  {
    "slug": "tieng-trung-tre-em",
    "name": "Tiếng Trung Trẻ em",
    "goal": "Leo rank tiếng Trung qua 3 chặng Nhập Môn – Thông Thạo – Tinh Anh, giao tiếp phản xạ nhanh và dùng được ngay.",
    "lead": [],
    "chips": [],
    "stats": [],
    "blocks": [],
    "info": [],
    "audiences": [
      "Trẻ em (học sinh cấp 2, 3)",
      "Người lớn (người đi làm, sinh viên)"
    ],
    "audienceNote": "Hai nhóm học lớp riêng do đặc điểm tâm lý học tập khác nhau, nhưng dùng chung nội dung bài học.",
    "tracks": [
      {
        "id": "chang-1",
        "title": "Giao Tiếp Nhập Môn",
        "sessions": "3 khóa × 16 buổi = 48 buổi",
        "summary": "Bắt đầu từ số 0: giao tiếp cơ bản hằng ngày, các chủ điểm gần gũi (bạn bè, trường học, gia đình, thế giới quanh em).",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Mỗi khóa gồm 4 chủ điểm × (3 bài + 1 ôn tập).",
                "italic": true
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 1: Nhập Môn 1 — 16 buổi",
            "blocks": [
              {
                "kind": "paragraph",
                "lines": [
                  {
                    "text": "Khung chương trình được thiết kế bám sát tâm lý học nhận thức, tập trung vào xây dựng nền tảng ngữ âm vững chắc và các chủ đề giao tiếp gần gũi nhất."
                  }
                ]
              },
              {
                "kind": "table",
                "head": [
                  "Buổi",
                  "Chuyên đề",
                  "Nội dung"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "Buổi 1–4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chuyên đề Ngữ âm",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Giới thiệu tổng quan ngôn ngữ, quy tắc hình thành, và luyện tập nhóm phiên âm (nguyên âm đơn, phụ âm cơ bản, thanh điệu, vận mẫu, thanh nhẹ, biến điệu thanh 3)."
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "Buổi 5–8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chuyên đề Bản thân",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Làm quen mẫu câu chào hỏi (你好, 老师好), giới thiệu tên, quốc tịch, từ vựng nền tảng."
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "Buổi 9–12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chuyên đề Gia đình",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Học đếm số (1 đến 100), cách hỏi tuổi tác, thành viên gia đình và từ vựng nghề nghiệp cơ bản."
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "Buổi 13–15",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chuyên đề Thế giới xung quanh",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Học từ vựng về màu sắc, sở thích cá nhân, cách biểu đạt khả năng (会), câu miêu tả cơ bản (Rất đẹp, Rất thích...)."
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "Buổi 16",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Tổng kết",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Tổng kết, ôn tập và Test đánh giá năng lực đầu ra (tập trung kỹ năng Nghe – Nói)."
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Chúng em học phát âm"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng em học phát âm (1)",
                        "bold": true
                      },
                      {
                        "text": "我们学发音 (1)",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "Các nguyên âm đơn a, o, e, i, u",
                        "bullet": true
                      },
                      {
                        "text": "Các âm đầu b, p, m, f, d, t, n, l",
                        "bullet": true
                      },
                      {
                        "text": "Các thanh điệu cơ bản",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng em học phát âm (2)",
                        "bold": true
                      },
                      {
                        "text": "我们学发音 (2)",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "Các vần ai, ei, ao, ou, an en, ang, eng, ong, ia, ie, iao, iou (iu)",
                        "bullet": true
                      },
                      {
                        "text": "Các âm đầu g, k, h, j, q, x",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng em học phát âm (3)",
                        "bold": true
                      },
                      {
                        "text": "我们学发音 (3)",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "Các vần ian, in, iang, ing, iong, ua, uo, uai, uei(ui), uan, uen(un), uang, ueng",
                        "bullet": true
                      },
                      {
                        "text": "Các âm đầu zh, ch, sh, r",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng em học phát âm (4)",
                        "bold": true
                      },
                      {
                        "text": "我们学发音 (4)",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "Các vần ü, ün, üe, üan, er(r)",
                        "bullet": true
                      },
                      {
                        "text": "Các âm đầu z, c, s",
                        "bullet": true
                      },
                      {
                        "text": "Thanh nhẹ",
                        "bullet": true
                      },
                      {
                        "text": "Biến điệu của thanh 3",
                        "bullet": true
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Bạn bè và mái trường"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng em chào cô ạ",
                        "bold": true
                      },
                      {
                        "text": "老师，您好",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "你好！",
                        "bullet": true
                      },
                      {
                        "text": "你好吗？",
                        "bullet": true
                      },
                      {
                        "text": "这是……吗？",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đây là bạn mình",
                        "bold": true
                      },
                      {
                        "text": "这是我朋友",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "(我)朋友",
                        "bullet": true
                      },
                      {
                        "text": "(他的)书",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình tên là Đỗ Quốc An",
                        "bold": true
                      },
                      {
                        "text": "我叫杜国安",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……叫什么名字？",
                        "bullet": true
                      },
                      {
                        "text": "……姓什么？",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (1)",
                        "bold": true
                      },
                      {
                        "text": "复习 (1)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Gia đình của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn có em trai không",
                        "bold": true
                      },
                      {
                        "text": "你有弟弟吗",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "有……吗？",
                        "bullet": true
                      },
                      {
                        "text": "……有没有……？",
                        "bullet": true
                      },
                      {
                        "text": "几个……？",
                        "bullet": true
                      },
                      {
                        "text": "一、二、三……十",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Em trai bạn mấy tuổi",
                        "bold": true
                      },
                      {
                        "text": "你弟弟几岁",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……几岁？",
                        "bullet": true
                      },
                      {
                        "text": "……多大？",
                        "bullet": true
                      },
                      {
                        "text": "十一、十二、十三……一百",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bố bạn làm nghề gì",
                        "bold": true
                      },
                      {
                        "text": "你爸爸做什么工作",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……是不是……？",
                        "bullet": true
                      },
                      {
                        "text": "……做什么工作？",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (2)",
                        "bold": true
                      },
                      {
                        "text": "复习 (2)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Thế giới của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình và em trai đều thích màu đỏ",
                        "bold": true
                      },
                      {
                        "text": "我和弟弟都喜欢红色",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……喜欢……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Cái áo này rất đẹp",
                        "bold": true
                      },
                      {
                        "text": "这件衣服很漂亮",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "很……",
                        "bullet": true
                      },
                      {
                        "text": "不……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "13",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình biết nói tiếng Trung Quốc",
                        "bold": true
                      },
                      {
                        "text": "我会说中文",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……会……吗？",
                        "bullet": true
                      },
                      {
                        "text": "……会……",
                        "bullet": true
                      },
                      {
                        "text": "……不会……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (3)",
                        "bold": true
                      },
                      {
                        "text": "复习 (3)"
                      }
                    ]
                  ]
                ]
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 2: Nhập Môn 2 — 16 buổi",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Em và bạn bè của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Sinh nhật của bạn là ngày nào",
                        "bold": true
                      },
                      {
                        "text": "你的生日是几月几号",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……月……号",
                        "bullet": true
                      },
                      {
                        "text": "……年",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chủ nhật chúng mình đi công viên chơi",
                        "bold": true
                      },
                      {
                        "text": "星期日我们去公园玩儿",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "星期几",
                        "bullet": true
                      },
                      {
                        "text": "去买/看……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bây giờ là mấy giờ",
                        "bold": true
                      },
                      {
                        "text": "现在几点",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……几点?",
                        "bullet": true
                      },
                      {
                        "text": "……点……分",
                        "bullet": true
                      },
                      {
                        "text": "什么时候……?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (1)",
                        "bold": true
                      },
                      {
                        "text": "复习 (1)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Em và trường học của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Phía trước là thư viện",
                        "bold": true
                      },
                      {
                        "text": "前边是图书馆",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "前边是……",
                        "bullet": true
                      },
                      {
                        "text": "……在右边",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Lớp các bạn có bao nhiêu học sinh",
                        "bold": true
                      },
                      {
                        "text": "你们班有多少个学生",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "多少",
                        "bullet": true
                      },
                      {
                        "text": "还",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn thích môn Mĩ thuật không",
                        "bold": true
                      },
                      {
                        "text": "你喜欢美术课吗",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "怎么样",
                        "bullet": true
                      },
                      {
                        "text": "第……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (2)",
                        "bold": true
                      },
                      {
                        "text": "复习 (2)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Em và gia đình em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Phòng của bạn ở đâu",
                        "bold": true
                      },
                      {
                        "text": "你的房间在哪儿",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "请……",
                        "bullet": true
                      },
                      {
                        "text": "……在哪儿?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đây là ảnh của gia đình mình",
                        "bold": true
                      },
                      {
                        "text": "这是我们家的照片",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "张",
                        "bullet": true
                      },
                      {
                        "text": "哪",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Con có thể uống cốc sữa này không ạ",
                        "bold": true
                      },
                      {
                        "text": "我能喝这杯牛奶吗",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "能……吗?",
                        "bullet": true
                      },
                      {
                        "text": "能……，不能……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (3)",
                        "bold": true
                      },
                      {
                        "text": "复习 (3)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Em và thế giới quanh em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mưa rồi",
                        "bold": true
                      },
                      {
                        "text": "下雨了",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "了",
                        "bullet": true
                      },
                      {
                        "text": "……了吗?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đừng đi xem phim, chúng mình đi vườn bách thú nhé",
                        "bold": true
                      },
                      {
                        "text": "别去看电影，我们去动物园",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "别",
                        "bullet": true
                      },
                      {
                        "text": "还没有……呢",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn thích mèo con hay chó con",
                        "bold": true
                      },
                      {
                        "text": "你喜欢小猫还是小狗",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "还是",
                        "bullet": true
                      },
                      {
                        "text": "……和……都……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (4)",
                        "bold": true
                      },
                      {
                        "text": "复习 (4)"
                      }
                    ]
                  ]
                ]
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 3: Nhập Môn 3 — 16 buổi",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Em và bạn bè của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình muốn giới thiệu với cậu người bạn mới của mình",
                        "bold": true
                      },
                      {
                        "text": "我想给你介绍我的新朋友",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "Cách đọc số điện thoại",
                        "bullet": true
                      },
                      {
                        "text": "……给……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Sở thích của cậu là gì",
                        "bold": true
                      },
                      {
                        "text": "你的爱好是什么",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "太……了",
                        "bullet": true
                      },
                      {
                        "text": "为什么",
                        "bullet": true
                      },
                      {
                        "text": "因为……所以……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn có thể giúp mình không",
                        "bold": true
                      },
                      {
                        "text": "你能不能帮我",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……不……",
                        "bullet": true
                      },
                      {
                        "text": "真……啊",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (1)",
                        "bold": true
                      },
                      {
                        "text": "复习 (1)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Em và trường học của em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Giáo viên tiếng Trung Quốc của chúng mình",
                        "bold": true
                      },
                      {
                        "text": "我们的中文老师",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "已经……了",
                        "bullet": true
                      },
                      {
                        "text": "……在……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình đang học tiếng Trung Quốc",
                        "bold": true
                      },
                      {
                        "text": "我在上中文课呢",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "在/正在……呢",
                        "bullet": true
                      },
                      {
                        "text": "用……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Nếu trời không mưa, nhà mình sẽ đi công viên chơi",
                        "bold": true
                      },
                      {
                        "text": "要是不下雨，我们家就去公园玩儿",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "要是……就……",
                        "bullet": true
                      },
                      {
                        "text": "如果……就……",
                        "bullet": true
                      },
                      {
                        "text": "……跟……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (2)",
                        "bold": true
                      },
                      {
                        "text": "复习 (2)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Em và gia đình em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Buổi chiều em làm gì",
                        "bold": true
                      },
                      {
                        "text": "下午你做什么",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "又",
                        "bullet": true
                      },
                      {
                        "text": "……的时候",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Cam bao nhiêu tiền một hộp",
                        "bold": true
                      },
                      {
                        "text": "橙子多少钱一盒",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "……多少钱……",
                        "bullet": true
                      },
                      {
                        "text": "有点儿……",
                        "bullet": true
                      },
                      {
                        "text": "……一点儿",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng con đi thăm ông bà nội vào buổi sáng",
                        "bold": true
                      },
                      {
                        "text": "我们是上午去看爷爷、奶奶的",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "是……的 (1)",
                        "bullet": true
                      },
                      {
                        "text": "AA的",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (3)",
                        "bold": true
                      },
                      {
                        "text": "复习 (3)"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Em và thế giới quanh em"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Họ đến bằng tàu hoả",
                        "bold": true
                      },
                      {
                        "text": "他们是坐火车来的",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "怎么",
                        "bullet": true
                      },
                      {
                        "text": "是……的 (2)",
                        "bullet": true
                      },
                      {
                        "text": "……离……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn biết Bảo tàng Hồ Chí Minh ở đâu không",
                        "bold": true
                      },
                      {
                        "text": "你知道胡志明博物馆在哪儿吗",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "在",
                        "bullet": true
                      },
                      {
                        "text": "从",
                        "bullet": true
                      },
                      {
                        "text": "往",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chiếc ô này mua ở siêu thị",
                        "bold": true
                      },
                      {
                        "text": "这把伞是在超市买的",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "是……的 (3)",
                        "bullet": true
                      },
                      {
                        "text": "会……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập (4)",
                        "bold": true
                      },
                      {
                        "text": "复习 (4)"
                      }
                    ]
                  ]
                ]
              }
            ]
          }
        ],
        "info": [
          {
            "label": "Thời lượng",
            "value": [
              "48 buổi, 1 giờ/buổi"
            ]
          },
          {
            "label": "Sĩ số",
            "value": [
              "10 học viên"
            ]
          },
          {
            "label": "Hình thức đăng ký",
            "value": [
              "Học lẻ từng khóa nhập môn/thông thạo/tinh anh hoặc đăng ký combo 3 khóa"
            ]
          },
          {
            "label": "Đối tượng học viên",
            "value": [
              "Bắt đầu từ số 0: giao tiếp cơ bản hằng ngày, các chủ điểm gần gũi (bạn bè, trường học, gia đình, thế giới quanh em)."
            ]
          }
        ]
      },
      {
        "id": "chang-2",
        "title": "Giao Tiếp Thông Thạo",
        "sessions": "3 khóa × 16 buổi = 48 buổi",
        "summary": "Mở rộng vốn từ và mẫu câu, giao tiếp tự tin hơn về đời sống, văn hóa, xã hội xung quanh.",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Mỗi khóa gồm 4 chủ điểm × (3 bài + 1 ôn tập).",
                "italic": true
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 1: Thông Thạo 1 — 16 buổi",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Câu lạc bộ của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Trước tòa nhà học có một vườn hoa nhỏ",
                        "bold": true
                      },
                      {
                        "text": "教学楼前面有一个小花园",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "墙上有一张地图。",
                        "bullet": true
                      },
                      {
                        "text": "运动场在教学楼后面。",
                        "bullet": true
                      },
                      {
                        "text": "同学们在教室里上课。",
                        "bullet": true
                      },
                      {
                        "text": "食堂很大，里面很整齐。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Làm xong bài tập mình sẽ dạy cậu cắt giấy",
                        "bold": true
                      },
                      {
                        "text": "我做完作业会教你剪纸",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "我买到纸了。",
                        "bullet": true
                      },
                      {
                        "text": "你做完作业(了)没有?",
                        "bullet": true
                      },
                      {
                        "text": "我没有做完作业。",
                        "bullet": true
                      },
                      {
                        "text": "我要做作业。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng ta cùng gửi một phần tình yêu thương",
                        "bold": true
                      },
                      {
                        "text": "我们要送上一份爱心",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "我们要送上一份爱心。",
                        "bullet": true
                      },
                      {
                        "text": "我们游泳吧!",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 1",
                        "bold": true
                      },
                      {
                        "text": "复习一"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Di sản văn hoá của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Ngày Nhà giáo Việt Nam",
                        "bold": true
                      },
                      {
                        "text": "越南教师节",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "明英和同学们一起学习中文。",
                        "bullet": true
                      },
                      {
                        "text": "那时候，我就给你们照相。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn thích ngày lễ nào",
                        "bold": true
                      },
                      {
                        "text": "你喜欢什么节日",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "我跟你一样。",
                        "bullet": true
                      },
                      {
                        "text": "这个月饼跟那个月饼一样大。",
                        "bullet": true
                      },
                      {
                        "text": "我跟你不一样。",
                        "bullet": true
                      },
                      {
                        "text": "我跟他不一样，我喜欢水果。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Tết Nguyên đán",
                        "bold": true
                      },
                      {
                        "text": "春节",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "如果下午不忙的话，我就教你剪纸。",
                        "bullet": true
                      },
                      {
                        "text": "要是有人给你红包的话，你就要说“谢谢”。",
                        "bullet": true
                      },
                      {
                        "text": "你想吃橙子的话，妈妈就给你买。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 2",
                        "bold": true
                      },
                      {
                        "text": "复习二"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Thế giới của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Trò chơi",
                        "bold": true
                      },
                      {
                        "text": "游戏",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "昨天你和明英玩了什么游戏?",
                        "bullet": true
                      },
                      {
                        "text": "我们吃了饭就一起下国际象棋。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Lợi ích của thể thao",
                        "bold": true
                      },
                      {
                        "text": "运动的好处",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "别人都去游泳了，我们也去游泳吧。",
                        "bullet": true
                      },
                      {
                        "text": "他买了一些饼干。",
                        "bullet": true
                      },
                      {
                        "text": "你会做哪些运动?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Hội thao trường",
                        "bold": true
                      },
                      {
                        "text": "学校运动会",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "你不要(别)怕了，我明天跟你一起跑步。",
                        "bullet": true
                      },
                      {
                        "text": "我最喜欢跑步。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 3",
                        "bold": true
                      },
                      {
                        "text": "复习三"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Tương lai của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Sau này nhà của cậu sẽ như thế nào",
                        "bold": true
                      },
                      {
                        "text": "你以后的房子是什么样的",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "这个房间是我弟弟的(房间)。",
                        "bullet": true
                      },
                      {
                        "text": "你看看，这是我以后的房子。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Ước mơ của chúng ta",
                        "bold": true
                      },
                      {
                        "text": "我们的梦想",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "她不但漂亮，而且很聪明。",
                        "bullet": true
                      },
                      {
                        "text": "虽然奶茶很好喝，但是很贵。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Sau này cậu muốn làm nghề gì",
                        "bold": true
                      },
                      {
                        "text": "你以后想做什么工作",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "医生的工作辛苦得很。",
                        "bullet": true
                      },
                      {
                        "text": "这个工作难得多。",
                        "bullet": true
                      },
                      {
                        "text": "这个颜色好看极了。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 4",
                        "bold": true
                      },
                      {
                        "text": "复习四"
                      }
                    ]
                  ]
                ]
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 2: Thông Thạo 2 — 16 buổi",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Câu lạc bộ của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình thích xem video ngắn tiếng Trung",
                        "bold": true
                      },
                      {
                        "text": "我喜欢看中文短视频",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "这个中文短视频已经有一万五千人看了。",
                        "bullet": true
                      },
                      {
                        "text": "你应该看。",
                        "bullet": true
                      },
                      {
                        "text": "你不应该算苹果的价格。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình thích tổ chức sinh nhật ở nhà",
                        "bold": true
                      },
                      {
                        "text": "我喜欢在家里过生日",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "谢谢大家的帮助！",
                        "bullet": true
                      },
                      {
                        "text": "在家里，大家能玩几个小时。",
                        "bullet": true
                      },
                      {
                        "text": "你妈妈做这个蛋糕做了多长时间?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng ta vẫn cần hợp tác với các bạn ấy",
                        "bold": true
                      },
                      {
                        "text": "我们还要跟她们合作",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "都星期二了，我们的合作还有些问题呢。",
                        "bullet": true
                      },
                      {
                        "text": "这两页台词我背了两天。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 1",
                        "bold": true
                      },
                      {
                        "text": "复习一"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Di sản văn hoá của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Cảnh Vịnh Hạ Long đẹp quá",
                        "bold": true
                      },
                      {
                        "text": "下龙湾的风景太漂亮了",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "万里长城又高又长。",
                        "bullet": true
                      },
                      {
                        "text": "我昨天买了几本漫画书。",
                        "bullet": true
                      },
                      {
                        "text": "海上有七八百座山。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Huế là cố đô của chúng ta",
                        "bold": true
                      },
                      {
                        "text": "顺化是我们的古都",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "我们坐十五分钟的车就到。",
                        "bullet": true
                      },
                      {
                        "text": "我们坐十几个小时的火车才到。",
                        "bullet": true
                      },
                      {
                        "text": "七点半上课，她七点就来学校了。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình thích nghệ thuật dân gian Việt Nam",
                        "bold": true
                      },
                      {
                        "text": "我喜欢越南的民间艺术",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "京剧演员一边表演一边唱歌。",
                        "bullet": true
                      },
                      {
                        "text": "这个房间非常大。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 2",
                        "bold": true
                      },
                      {
                        "text": "复习二"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Thế giới của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thành phố Hồ Chí Minh ở đâu",
                        "bold": true
                      },
                      {
                        "text": "胡志明市在哪儿",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "请你介绍一下胡志明市。",
                        "bullet": true
                      },
                      {
                        "text": "我想去一次岘港。",
                        "bullet": true
                      },
                      {
                        "text": "我看了三遍课文。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Trong bảo tàng trưng bày nhiều cổ vật",
                        "bold": true
                      },
                      {
                        "text": "博物馆里摆着很多文物",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "博物馆里摆着很多文物。",
                        "bullet": true
                      },
                      {
                        "text": "花盆里开出了五颜六色的花，漂亮极了。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình đã lên tàu điện Hà Nội",
                        "bold": true
                      },
                      {
                        "text": "我坐上河内的城铁了",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "车里有空调，多么舒服啊！",
                        "bullet": true
                      },
                      {
                        "text": "河内有摩托车、公共汽车等交通工具。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 3",
                        "bold": true
                      },
                      {
                        "text": "复习三"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Tương lai của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thế giới xanh",
                        "bold": true
                      },
                      {
                        "text": "绿色世界",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "爸爸比妈妈忙。",
                        "bullet": true
                      },
                      {
                        "text": "这棵树没有那棵树大。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Học cách phân loại rác",
                        "bold": true
                      },
                      {
                        "text": "学会垃圾分类",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "你说得对。",
                        "bullet": true
                      },
                      {
                        "text": "这个演员演得不好。",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Môi trường trường học trở nên đẹp hơn",
                        "bold": true
                      },
                      {
                        "text": "学校的环境变得漂亮了",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "他跑得快吗?",
                        "bullet": true
                      },
                      {
                        "text": "他跑得快不快?",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 4",
                        "bold": true
                      },
                      {
                        "text": "复习四"
                      }
                    ]
                  ]
                ]
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 3: Thông Thạo 3 — 16 buổi",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Câu lạc bộ của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Trại hè Bắc Kinh",
                        "bold": true
                      },
                      {
                        "text": "北京夏令营",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "能愿动词“可以”",
                        "bullet": true
                      },
                      {
                        "text": "“能”和“可以”的区别",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đi siêu thị",
                        "bold": true
                      },
                      {
                        "text": "逛超市",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "简单趋向补语",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thú cưng nhà mình",
                        "bold": true
                      },
                      {
                        "text": "我家的宠物",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "复合趋向补语",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 1",
                        "bold": true
                      },
                      {
                        "text": "复习一"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Di sản văn hoá của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình muốn ăn món Trung Quốc",
                        "bold": true
                      },
                      {
                        "text": "我想吃中国菜",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "连词“或者”",
                        "bullet": true
                      },
                      {
                        "text": "“还是”和“或者”的区别",
                        "bullet": true
                      },
                      {
                        "text": "动词/动词词组作定语",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Chúng ta đều thích xem phim",
                        "bold": true
                      },
                      {
                        "text": "我们都喜欢看电影",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "副词“好像”",
                        "bullet": true
                      },
                      {
                        "text": "量词“段”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình muốn nếm thử nem Việt Nam",
                        "bold": true
                      },
                      {
                        "text": "我想尝尝越南春卷",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "动态助词“着”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 2",
                        "bold": true
                      },
                      {
                        "text": "复习二"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Thế giới của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bốn mùa trong năm",
                        "bold": true
                      },
                      {
                        "text": "一年四季",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“被”字被动句",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Táo của du khách bị khỉ cướp mất",
                        "bold": true
                      },
                      {
                        "text": "游客的苹果让猴子抢走了",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“叫”字被动句",
                        "bullet": true
                      },
                      {
                        "text": "“让”字被动句",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thần tượng trong lòng mình",
                        "bold": true
                      },
                      {
                        "text": "我心中的偶像",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“着”和“正/正在/在”的区别",
                        "bullet": true
                      },
                      {
                        "text": "“自己”的用法",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 3",
                        "bold": true
                      },
                      {
                        "text": "复习三"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Tương lai của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đào tạo kỹ năng mềm",
                        "bold": true
                      },
                      {
                        "text": "软技能的培训",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "快/快要……了",
                        "bullet": true
                      },
                      {
                        "text": "要/就要……了",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Hoạt động ngoại khoá",
                        "bold": true
                      },
                      {
                        "text": "课外活动",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“快/快要……了”和“要/就要……了”的区别",
                        "bullet": true
                      },
                      {
                        "text": "将要……了",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Ngủ sớm dậy sớm tốt cho sức khoẻ",
                        "bold": true
                      },
                      {
                        "text": "早睡早起身体好",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "不是……吗",
                        "bullet": true
                      },
                      {
                        "text": "难道……吗",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 4",
                        "bold": true
                      },
                      {
                        "text": "复习四"
                      }
                    ]
                  ]
                ]
              }
            ]
          }
        ],
        "info": [
          {
            "label": "Thời lượng",
            "value": [
              "48 buổi, 1 giờ/buổi"
            ]
          },
          {
            "label": "Sĩ số",
            "value": [
              "10 học viên"
            ]
          },
          {
            "label": "Hình thức đăng ký",
            "value": [
              "Học lẻ từng khóa nhập môn/thông thạo/tinh anh hoặc đăng ký combo 3 khóa"
            ]
          },
          {
            "label": "Cam kết đầu ra",
            "value": [
              "Mở rộng vốn từ và mẫu câu, giao tiếp tự tin hơn về đời sống, văn hóa, xã hội xung quanh."
            ]
          }
        ]
      },
      {
        "id": "chang-3",
        "title": "Giao Tiếp Tinh Anh",
        "sessions": "2 khóa × 24 buổi = 48 buổi",
        "summary": "Giao tiếp nâng cao, ngữ pháp phức tạp hơn, chủ đề học thuật/xã hội — chuẩn bị nền tảng giao tiếp thành thạo.",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Tinh Anh 1 gồm 4 Chủ điểm × (3 bài + 1 ôn tập); Tinh Anh 2 gồm 4 Chủ điểm, 2–3 bài + ôn tập mỗi Chủ điểm.",
                "italic": true
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 1: Tinh Anh 1",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Câu lạc bộ của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Biểu diễn tài năng",
                        "bold": true
                      },
                      {
                        "text": "才艺表演",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "动态助词“过”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Người tốt việc tốt",
                        "bold": true
                      },
                      {
                        "text": "好人好事",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "只有……才……",
                        "bullet": true
                      },
                      {
                        "text": "副词/形容词“正好”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Hoạt động xã hội cuối tuần",
                        "bold": true
                      },
                      {
                        "text": "周末的社会活动",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "只要……就……",
                        "bullet": true
                      },
                      {
                        "text": "副词“只”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 1",
                        "bold": true
                      },
                      {
                        "text": "复习一"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Di sản văn hoá của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Đón Tết cùng bạn Việt Nam",
                        "bold": true
                      },
                      {
                        "text": "跟越南朋友过春节",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "副词“再” (1)",
                        "bullet": true
                      },
                      {
                        "text": "副词“十分”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Áo dài Việt Nam và sườn xám Trung Quốc đều đẹp",
                        "bold": true
                      },
                      {
                        "text": "越南的奥黛和中国的旗袍都很漂亮",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "量词“条”",
                        "bullet": true
                      },
                      {
                        "text": "一……就……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Bạn thích nghệ thuật truyền thống hay hiện đại",
                        "bold": true
                      },
                      {
                        "text": "你喜欢传统艺术还是现代艺术",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "副词“再” (2)",
                        "bullet": true
                      },
                      {
                        "text": "之所以……是因为……",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 2",
                        "bold": true
                      },
                      {
                        "text": "复习二"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Thế giới của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Quê mình ở Lào Cai",
                        "bold": true
                      },
                      {
                        "text": "我家乡在老街",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "使用“谁”的反问句",
                        "bullet": true
                      },
                      {
                        "text": "使用“怎么”的反问句",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Ước mơ đi khắp thế giới",
                        "bold": true
                      },
                      {
                        "text": "走遍全世界的梦想",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“把”字句 (1), (2)",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Xem TV để hiểu thế giới",
                        "bold": true
                      },
                      {
                        "text": "看电视了解世界",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "“把”字句 (3), (4)",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 3",
                        "bold": true
                      },
                      {
                        "text": "复习三"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Tương lai của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình thích làm hướng dẫn viên",
                        "bold": true
                      },
                      {
                        "text": "我喜欢当一名导游",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "量词重叠",
                        "bullet": true
                      },
                      {
                        "text": "数量词重叠",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "11",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình phải học tốt ngoại ngữ",
                        "bold": true
                      },
                      {
                        "text": "我要学好外语",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "主谓结构作定语",
                        "bullet": true
                      },
                      {
                        "text": "定语与结构助词“的”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "12",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Điện thoại thông minh trong cuộc sống của chúng ta",
                        "bold": true
                      },
                      {
                        "text": "我们生活中的智能手机",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "状语",
                        "bullet": true
                      },
                      {
                        "text": "状语与结构助词“地”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 4",
                        "bold": true
                      },
                      {
                        "text": "复习四"
                      }
                    ]
                  ]
                ]
              }
            ]
          },
          {
            "kind": "stage",
            "title": "Giai đoạn 2: Tinh Anh 2",
            "blocks": [
              {
                "kind": "subheading",
                "text": "Chủ điểm 1: Cuộc sống của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "1",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Kỳ nghỉ vui vẻ",
                        "bold": true
                      },
                      {
                        "text": "快乐的假期",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "不但……，还……",
                        "bullet": true
                      },
                      {
                        "text": "介词“向”",
                        "bullet": true
                      },
                      {
                        "text": "副词“特别”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "2",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Làm việc và nghỉ ngơi hợp lý",
                        "bold": true
                      },
                      {
                        "text": "劳逸结合",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "可能补语 (1)",
                        "bullet": true
                      },
                      {
                        "text": "连词“不过”",
                        "bullet": true
                      },
                      {
                        "text": "介词“为了”",
                        "bullet": true
                      },
                      {
                        "text": "副词“常常”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "3",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Khoảng cách thế hệ",
                        "bold": true
                      },
                      {
                        "text": "代沟",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "名词“刚才”",
                        "bullet": true
                      },
                      {
                        "text": "拿……来说",
                        "bullet": true
                      },
                      {
                        "text": "副词“只好”",
                        "bullet": true
                      },
                      {
                        "text": "副词“更/更加”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 1",
                        "bold": true
                      },
                      {
                        "text": "复习一"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 2: Xã hội của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "4",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "IQ và EQ",
                        "bold": true
                      },
                      {
                        "text": "智商与情商",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "介词“对”",
                        "bullet": true
                      },
                      {
                        "text": "形容词、名词、副词“原来”",
                        "bullet": true
                      },
                      {
                        "text": "可能补语 (2)",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "5",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Mình học, mình vui",
                        "bold": true
                      },
                      {
                        "text": "我学习，我快乐",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "在……看来",
                        "bullet": true
                      },
                      {
                        "text": "副词“马上”",
                        "bullet": true
                      },
                      {
                        "text": "“以为”与“认为”的区别",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 2",
                        "bold": true
                      },
                      {
                        "text": "复习二"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 3: Môi trường của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "6",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Biến bảo vệ môi trường thành thói quen",
                        "bold": true
                      },
                      {
                        "text": "让环保成为一种习惯",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "能愿动词“得”",
                        "bullet": true
                      },
                      {
                        "text": "形容词、副词“本来”",
                        "bullet": true
                      },
                      {
                        "text": "对……来说",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "7",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Ô nhiễm thông tin và bảo vệ môi trường xã hội",
                        "bold": true
                      },
                      {
                        "text": "信息污染与社会环境保护",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "介词“由”",
                        "bullet": true
                      },
                      {
                        "text": "副词“比较”",
                        "bullet": true
                      },
                      {
                        "text": "代词“每”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "8",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thực phẩm xanh",
                        "bold": true
                      },
                      {
                        "text": "绿色食品",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "副词“究竟”",
                        "bullet": true
                      },
                      {
                        "text": "量词“趟”",
                        "bullet": true
                      },
                      {
                        "text": "介词“为”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 3",
                        "bold": true
                      },
                      {
                        "text": "复习三"
                      }
                    ]
                  ]
                ]
              },
              {
                "kind": "subheading",
                "text": "Chủ điểm 4: Tương lai của chúng ta"
              },
              {
                "kind": "table",
                "head": [
                  "Bài",
                  "Tên bài",
                  "Kiến thức / Ngữ pháp"
                ],
                "rows": [
                  [
                    [
                      {
                        "text": "9",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Thành phố tương lai",
                        "bold": true
                      },
                      {
                        "text": "未来城市",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "离合词",
                        "bullet": true
                      },
                      {
                        "text": "副词“经常”",
                        "bullet": true
                      },
                      {
                        "text": "副词“往往”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [
                      {
                        "text": "10",
                        "bold": true
                      }
                    ],
                    [
                      {
                        "text": "Sức khoẻ và tuổi thọ",
                        "bold": true
                      },
                      {
                        "text": "健康与寿命",
                        "italic": true
                      }
                    ],
                    [
                      {
                        "text": "时间名词“一会儿”",
                        "bullet": true
                      },
                      {
                        "text": "数词“亿”",
                        "bullet": true
                      },
                      {
                        "text": "副词“一共”",
                        "bullet": true
                      }
                    ]
                  ],
                  [
                    [],
                    [
                      {
                        "text": "Ôn tập 4",
                        "bold": true
                      },
                      {
                        "text": "复习四"
                      }
                    ]
                  ]
                ]
              }
            ]
          }
        ],
        "info": [
          {
            "label": "Thời lượng",
            "value": [
              "48 buổi, 1 giờ/buổi"
            ]
          },
          {
            "label": "Sĩ số",
            "value": [
              "10 học viên"
            ]
          },
          {
            "label": "Hình thức đăng ký",
            "value": [
              "Học lẻ từng khóa nhập môn/thông thạo/tinh anh hoặc đăng ký combo 3 khóa"
            ]
          },
          {
            "label": "Cam kết đầu ra",
            "value": [
              "Giao tiếp nâng cao, ngữ pháp phức tạp hơn, chủ đề học thuật/xã hội — chuẩn bị nền tảng giao tiếp thành thạo."
            ]
          }
        ]
      }
    ],
    "cardId": "kids"
  },
  {
    "slug": "hsk-2-0",
    "name": "Luyện thi HSK 2.0 & HSKK",
    "goal": "Chuẩn đầu ra HSK theo từng cấp (format 2.0), tự tin giao tiếp cơ bản, phát triển đồng đều 4 kỹ năng.",
    "lead": [
      {
        "label": "Dành cho",
        "text": "Học viên đã học theo lộ trình 2.0 hoặc có nhu cầu bắt đầu học tiếng Trung với chương trình không quá nặng."
      }
    ],
    "chips": [
      "Format HSK 2.0",
      "Offline / Online"
    ],
    "stats": [],
    "blocks": [
      {
        "kind": "stage",
        "title": "Giai đoạn 1: HSK Sơ cấp (HSK 1 + HSK 2) — 33 buổi",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "~4 tháng · 2 buổi/tuần. Đầu ra: >300 từ vựng, 50 mẫu ngữ pháp cơ bản để giao tiếp trong cuộc sống hằng ngày; rèn 4 kỹ năng nghe/đọc/viết/nói câu đơn giản; làm quen luyện khẩu ngữ HSKK sơ cấp.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Bài",
              "Tên bài",
              "Kiến thức / Ngữ pháp"
            ],
            "rows": [
              [
                [
                  {
                    "text": "1",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Chào anh!",
                    "bold": true
                  },
                  {
                    "text": "你好!",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "—"
                  }
                ]
              ],
              [
                [
                  {
                    "text": "2",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cảm ơn anh!",
                    "bold": true
                  },
                  {
                    "text": "谢谢你!",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "—"
                  }
                ]
              ],
              [
                [
                  {
                    "text": "3",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cô tên gì?",
                    "bold": true
                  },
                  {
                    "text": "你叫什么名字?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn “什么”",
                    "bullet": true
                  },
                  {
                    "text": "Câu có từ “是”",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi có từ “吗”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "4",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cô ấy là cô giáo dạy tôi tiếng Trung Quốc.",
                    "bold": true
                  },
                  {
                    "text": "她是我的汉语老师。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn “谁”, “哪”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ kết cấu “的”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ nghi vấn “呢” (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "5",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Con gái của cô ấy năm nay 20 tuổi.",
                    "bold": true
                  },
                  {
                    "text": "她女儿今年二十岁。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn “几”",
                    "bullet": true
                  },
                  {
                    "text": "Các số dưới 100",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ chỉ sự thay đổi “了”",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi “多+大”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "6",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi biết nói tiếng Trung Quốc.",
                    "bold": true
                  },
                  {
                    "text": "我会说汉语。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ năng nguyện “会” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Câu có vị ngữ là tính từ",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “怎么” (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "7",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Hôm nay là ngày mấy?",
                    "bold": true
                  },
                  {
                    "text": "今天几号?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn tả ngày tháng (1): tháng, ngày, thứ",
                    "bullet": true
                  },
                  {
                    "text": "Câu có vị ngữ là danh từ",
                    "bullet": true
                  },
                  {
                    "text": "Câu liên động (1): đi + nơi chốn + làm gì",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "8",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi muốn uống trà.",
                    "bold": true
                  },
                  {
                    "text": "我想喝茶。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ năng nguyện “想”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “多少”",
                    "bullet": true
                  },
                  {
                    "text": "Lượng từ “个”, “口”",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn đạt số tiền",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "9",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Con trai anh làm việc ở đâu?",
                    "bold": true
                  },
                  {
                    "text": "你儿子在哪儿工作?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ “在”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “哪儿”",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “在”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ nghi vấn “呢” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "10",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi có thể ngồi ở đây được không?",
                    "bold": true
                  },
                  {
                    "text": "我能坐这儿吗?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có từ “有”",
                    "bullet": true
                  },
                  {
                    "text": "Liên từ “和”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ năng nguyện “能”",
                    "bullet": true
                  },
                  {
                    "text": "Câu cầu khiến với “请”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "11",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bây giờ là mấy giờ?",
                    "bold": true
                  },
                  {
                    "text": "现在几点?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn đạt thời gian",
                    "bullet": true
                  },
                  {
                    "text": "Từ chỉ thời gian làm trạng ngữ",
                    "bullet": true
                  },
                  {
                    "text": "Danh từ “前”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "12",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ngày mai thời tiết thế nào?",
                    "bold": true
                  },
                  {
                    "text": "明天天气怎么样?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn “怎么样”",
                    "bullet": true
                  },
                  {
                    "text": "Câu có vị ngữ là kết cấu chủ-vị",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ “太”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ năng nguyện “会” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "13",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh ấy đang học nấu món ăn Trung Quốc.",
                    "bold": true
                  },
                  {
                    "text": "他在学做中国菜呢。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Từ cảm thán “喂”",
                    "bullet": true
                  },
                  {
                    "text": "“在……呢” diễn tả hành động đang diễn ra",
                    "bullet": true
                  },
                  {
                    "text": "Cách đọc số điện thoại",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “吧”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "14",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cô ấy đã mua nhiều quần áo.",
                    "bold": true
                  },
                  {
                    "text": "她买了不少衣服。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“了” diễn tả sự việc đã xảy ra",
                    "bullet": true
                  },
                  {
                    "text": "Danh từ “后”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “啊”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ “都”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "15",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi đáp máy bay đến đây.",
                    "bold": true
                  },
                  {
                    "text": "我是坐飞机来的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu “是……的” nhấn mạnh thời gian, địa điểm, cách thức",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn đạt ngày tháng (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "16",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Nếu đi Bắc Kinh để du lịch thì tốt nhất là đi vào tháng chín.",
                    "bold": true
                  },
                  {
                    "text": "九月去北京旅游最好。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ động từ “要”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ mức độ “最”",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn đạt số lượng: “几” và “多”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "17",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Hàng ngày tôi thức dậy lúc 6 giờ.",
                    "bold": true
                  },
                  {
                    "text": "我每天六点起床。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu hỏi với “是不是”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ “每”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn “多”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "18",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ly màu đỏ ở bên trái là của tôi.",
                    "bold": true
                  },
                  {
                    "text": "左边那个红色的是我的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cụm từ có “的”",
                    "bullet": true
                  },
                  {
                    "text": "Cách dùng “一下”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ ngữ khí “真”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "19",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ông ấy đã giới thiệu giúp tôi công việc này.",
                    "bold": true
                  },
                  {
                    "text": "这个工作是他帮我介绍的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc “是……的”: nhấn mạnh chủ thể thực hiện hành động",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc diễn tả thời gian “……的时候”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ thời gian “已经”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "20",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Mua chiếc áo này đi.",
                    "bold": true
                  },
                  {
                    "text": "就买这件吧。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Phó từ “就”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ ngữ khí “还” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ mức độ “有点儿”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "21",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Sao anh không ăn nữa?",
                    "bold": true
                  },
                  {
                    "text": "你怎么不吃了?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn “怎么”",
                    "bullet": true
                  },
                  {
                    "text": "Sự lặp lại lượng từ",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “因为……，所以……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "22",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Nhà chị có ở xa công ty không?",
                    "bold": true
                  },
                  {
                    "text": "你家离公司远吗?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Phó từ ngữ khí “还” (2)",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ chỉ thời gian “就”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ “离”",
                    "bullet": true
                  },
                  {
                    "text": "Trợ từ ngữ khí “呢”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "23",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Để mình suy nghĩ rồi sẽ nói cho bạn biết.",
                    "bold": true
                  },
                  {
                    "text": "让我想想再告诉你。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu nghi vấn “……，好吗?”",
                    "bullet": true
                  },
                  {
                    "text": "Phó từ “再”",
                    "bullet": true
                  },
                  {
                    "text": "Câu kiêm ngữ",
                    "bullet": true
                  },
                  {
                    "text": "Sự lặp lại động từ",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "24",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Câu hỏi quá nhiều nên mình không làm hết.",
                    "bold": true
                  },
                  {
                    "text": "题太多，我没做完。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ chỉ kết quả",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “从”",
                    "bullet": true
                  },
                  {
                    "text": "“第-” chỉ thứ tự",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "25",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Đừng tìm nữa, điện thoại di động ở trên bàn kìa.",
                    "bold": true
                  },
                  {
                    "text": "别找了，手机在桌子上呢。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu cầu khiến: “不要……了”, “别……了”",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “对”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "26",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh ấy lớn hơn mình ba tuổi.",
                    "bold": true
                  },
                  {
                    "text": "他比我大三岁。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc có động từ/cụm động từ làm định ngữ",
                    "bullet": true
                  },
                  {
                    "text": "Câu có từ “比” (1)",
                    "bullet": true
                  },
                  {
                    "text": "Trợ động từ “可能”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "27",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh mặc ít quần áo quá.",
                    "bold": true
                  },
                  {
                    "text": "你穿得太少了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ chỉ trạng thái",
                    "bullet": true
                  },
                  {
                    "text": "Câu có từ “比” (2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "28",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cửa đang mở.",
                    "bold": true
                  },
                  {
                    "text": "门开着呢。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ động thái “着”",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi “不是……吗”",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “往”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "29",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cậu đã từng xem phim đó chưa?",
                    "bold": true
                  },
                  {
                    "text": "你看过那个电影吗?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ động thái “过”",
                    "bullet": true
                  },
                  {
                    "text": "Liên từ “虽然……，但是……”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ chỉ tần suất “次”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "30",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Năm mới sắp đến rồi.",
                    "bold": true
                  },
                  {
                    "text": "新年就要到了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc diễn tả trạng thái của hành động: “要……了”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “都……了”",
                    "bullet": true
                  }
                ]
              ]
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 2: HSK 3 + HSKK Sơ cấp — 25 buổi",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "2.5 tháng · 2 buổi/tuần · 20 buổi bài khóa (mỗi buổi 90–105 phút) + 1 buổi ôn giữa khóa (buổi 14) + 1 buổi ôn & thi cuối khóa + 3 buổi hskk sơ cấpi . Đầu ra: 600 từ vựng, ~60 điểm ngữ pháp; viết & nói đoạn văn (~200 chữ); luyện đề khẩu ngữ HSKK sơ cấp.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Bài",
              "Tên bài",
              "Kiến thức / Ngữ pháp"
            ],
            "rows": [
              [
                [
                  {
                    "text": "1",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh dự định làm gì vào cuối tuần vậy?",
                    "bold": true
                  },
                  {
                    "text": "周末你有什么打算?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ chỉ kết quả “好”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “一……也/都+不/没……”",
                    "bullet": true
                  },
                  {
                    "text": "Liên từ “那”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "2",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Khi nào anh ấy quay về?",
                    "bold": true
                  },
                  {
                    "text": "他什么时候回来?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ chỉ phương hướng đơn giản",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc diễn tả hai hành động liên tiếp",
                    "bullet": true
                  },
                  {
                    "text": "Câu hỏi “能……吗?”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "3",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Trên bàn có rất nhiều thức uống.",
                    "bold": true
                  },
                  {
                    "text": "桌子上放着很多饮料。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“还是” và “或者”",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn tả sự tồn tại (V+着+lượng từ+danh từ)",
                    "bullet": true
                  },
                  {
                    "text": "Trợ động từ “会” (khả năng)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "4",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cô ấy luôn cười khi nói chuyện với khách hàng.",
                    "bold": true
                  },
                  {
                    "text": "她总是笑着跟客人说话。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc “又……又……”",
                    "bullet": true
                  },
                  {
                    "text": "Động từ1+着(+tân ngữ1)+động từ2(+tân ngữ2)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "5",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Dạo này em ngày càng béo ra.",
                    "bold": true
                  },
                  {
                    "text": "我最近越来越胖了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Trợ từ “了” chỉ sự thay đổi",
                    "bullet": true
                  },
                  {
                    "text": "“越来越+tính từ/động từ chỉ trạng thái tâm lý”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "6",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Sao bỗng dưng lại không tìm thấy?",
                    "bold": true
                  },
                  {
                    "text": "怎么突然找不到了?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ khả năng (động từ 得/不+bổ ngữ)",
                    "bullet": true
                  },
                  {
                    "text": "“名词+呢” dùng để hỏi vị trí",
                    "bullet": true
                  },
                  {
                    "text": "“刚” và “刚才”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "7",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi và cô ấy quen nhau được năm năm rồi.",
                    "bold": true
                  },
                  {
                    "text": "我跟她都认识五年了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cách diễn tả khoảng thời gian",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn tả sự hứng thú",
                    "bullet": true
                  },
                  {
                    "text": "“半”, “刻”, “差”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "8",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Em đi đâu thì anh đi đến đó.",
                    "bold": true
                  },
                  {
                    "text": "你去哪儿我就去哪儿。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“又” và “再”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn hoạt dụng (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "9",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cô ấy nói tiếng Trung Quốc hay như người Trung Quốc vậy.",
                    "bold": true
                  },
                  {
                    "text": "她的汉语说得跟中国人一样好。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“越A越B”",
                    "bullet": true
                  },
                  {
                    "text": "“A跟B一样 (+tính từ)”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc so sánh (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "10",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Môn Toán khó hơn môn Lịch Sử nhiều.",
                    "bold": true
                  },
                  {
                    "text": "数学比历史难多了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“A比B+tính từ+一点儿/一些/得多/多了”",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn tả số ước lượng (1)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "11",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Đừng quên tắt máy điều hòa không khí nhé.",
                    "bold": true
                  },
                  {
                    "text": "别忘了把空调关了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có từ “把” (1): A把B+động từ+……",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn tả số ước lượng (2): 左右",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "12",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Hãy để những đồ quan trọng ở chỗ tôi đi.",
                    "bold": true
                  },
                  {
                    "text": "把重要的东西放在我这儿吧。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“才” và “就”",
                    "bullet": true
                  },
                  {
                    "text": "Câu có từ “把” (2): A把B+động từ+在/到/给……",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "13",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh đi bộ về.",
                    "bold": true
                  },
                  {
                    "text": "我是走回来的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Bổ ngữ phương hướng phức hợp",
                    "bullet": true
                  },
                  {
                    "text": "“一边……一边……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "14",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cậu hãy mang trái cây đến đây.",
                    "bold": true
                  },
                  {
                    "text": "你把水果拿过来。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có từ “把” (3): A把B+động từ+bổ ngữ kết quả/xu hướng",
                    "bullet": true
                  },
                  {
                    "text": "“先……，再/又……，然后……”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "15",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Những câu khác đều không có vấn đề gì.",
                    "bold": true
                  },
                  {
                    "text": "其他都没什么问题。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "“除了……以外，都/还/也……”",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn hoạt dụng (2)",
                    "bullet": true
                  },
                  {
                    "text": "Cách diễn tả mức độ “极了”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "16",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bây giờ tôi mệt đến nỗi chỉ muốn đi ngủ sau khi hết giờ làm việc.",
                    "bold": true
                  },
                  {
                    "text": "我现在累得下了班就想睡觉。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc “如果……(的话)，(chủ ngữ)就……”",
                    "bullet": true
                  },
                  {
                    "text": "Bổ ngữ chỉ trạng thái có “得”",
                    "bullet": true
                  },
                  {
                    "text": "Tính từ có một âm tiết được lặp lại",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "17",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Ai cũng có cách chữa khỏi “bệnh” của em.",
                    "bold": true
                  },
                  {
                    "text": "谁都有办法看好你的“病”。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Động từ có hai âm tiết được lặp lại",
                    "bullet": true
                  },
                  {
                    "text": "Đại từ nghi vấn được sử dụng linh hoạt (3)",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "18",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tôi tin họ sẽ đồng ý.",
                    "bold": true
                  },
                  {
                    "text": "我相信他们会同意的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Cấu trúc “只要……，就……”",
                    "bullet": true
                  },
                  {
                    "text": "Giới từ “关于”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "19",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Anh không nhìn ra được à?",
                    "bold": true
                  },
                  {
                    "text": "你没看出来吗?",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Nghĩa mở rộng của bổ ngữ chỉ phương hướng",
                    "bullet": true
                  },
                  {
                    "text": "“使”, “叫” và “让”",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "20",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Mình chịu ảnh hưởng từ anh ấy.",
                    "bold": true
                  },
                  {
                    "text": "我被他影响了。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Câu có từ “被”",
                    "bullet": true
                  },
                  {
                    "text": "Cấu trúc “只有……，才……”",
                    "bullet": true
                  }
                ]
              ]
            ]
          },
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Tài liệu & giáo trình: Giáo trình chuẩn HSK3 · Tài liệu dịch và bài tập MCC biên soạn."
              }
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 3: HSK 4 + HSKK Trung cấp — 36 buổi",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "4 tháng · 2 buổi/tuần · 20 buổi giáo trình (120 phút/buổi, có HSKK từ bài 11 quyển hạ) + 1 buổi ôn & kiểm tra giữa khóa (buổi 18) + 1 buổi ôn cuối khóa (buổi 35) + 5 buổi luyện HSKK Trung cấp + 1 buổi thi cuối khóa. Đầu ra: 1.200 từ vựng, ~100 điểm ngữ pháp; đọc hiểu & viết đoạn nâng cao (~300 chữ); phỏng vấn, viết thư.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Bài",
              "Tên bài",
              "Kiến thức / Ngữ pháp"
            ],
            "rows": [
              [
                [
                  {
                    "text": "1",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tình yêu đơn giản",
                    "bold": true
                  },
                  {
                    "text": "简单的爱情",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "不仅……也/还/而且……",
                    "bullet": true
                  },
                  {
                    "text": "从来",
                    "bullet": true
                  },
                  {
                    "text": "刚",
                    "bullet": true
                  },
                  {
                    "text": "即使……也……",
                    "bullet": true
                  },
                  {
                    "text": "(在)……上",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "2",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Người bạn chân chính",
                    "bold": true
                  },
                  {
                    "text": "真正的朋友",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "正好",
                    "bullet": true
                  },
                  {
                    "text": "差不多",
                    "bullet": true
                  },
                  {
                    "text": "尽管",
                    "bullet": true
                  },
                  {
                    "text": "却",
                    "bullet": true
                  },
                  {
                    "text": "而",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "3",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Giám đốc có ấn tượng tốt về tôi.",
                    "bold": true
                  },
                  {
                    "text": "经理对我印象不错。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "挺",
                    "bullet": true
                  },
                  {
                    "text": "本来",
                    "bullet": true
                  },
                  {
                    "text": "另外",
                    "bullet": true
                  },
                  {
                    "text": "首先……其次……",
                    "bullet": true
                  },
                  {
                    "text": "不管",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "4",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Đừng quá nôn nóng kiếm tiền.",
                    "bold": true
                  },
                  {
                    "text": "不要太着急赚钱。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "以为",
                    "bullet": true
                  },
                  {
                    "text": "原来",
                    "bullet": true
                  },
                  {
                    "text": "并",
                    "bullet": true
                  },
                  {
                    "text": "按照",
                    "bullet": true
                  },
                  {
                    "text": "甚至",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "5",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Chỉ mua cái đúng, không mua cái đắt.",
                    "bold": true
                  },
                  {
                    "text": "只买对的，不买贵的。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "肯定",
                    "bullet": true
                  },
                  {
                    "text": "再说",
                    "bullet": true
                  },
                  {
                    "text": "实际",
                    "bullet": true
                  },
                  {
                    "text": "对……来说",
                    "bullet": true
                  },
                  {
                    "text": "尤其",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "6",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tiền nào của nấy.",
                    "bold": true
                  },
                  {
                    "text": "一分钱一分货。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "竟然",
                    "bullet": true
                  },
                  {
                    "text": "倍",
                    "bullet": true
                  },
                  {
                    "text": "值得",
                    "bullet": true
                  },
                  {
                    "text": "其中",
                    "bullet": true
                  },
                  {
                    "text": "(在)……下",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "7",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bác sĩ tốt nhất là bản thân.",
                    "bold": true
                  },
                  {
                    "text": "最好的医生是自己。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "估计",
                    "bullet": true
                  },
                  {
                    "text": "来不及",
                    "bullet": true
                  },
                  {
                    "text": "离合词重叠",
                    "bullet": true
                  },
                  {
                    "text": "要是",
                    "bullet": true
                  },
                  {
                    "text": "既……又/也/还……",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "8",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cuộc sống không thiếu cái đẹp.",
                    "bold": true
                  },
                  {
                    "text": "生活中不缺少美。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "使",
                    "bullet": true
                  },
                  {
                    "text": "只要",
                    "bullet": true
                  },
                  {
                    "text": "可不是",
                    "bullet": true
                  },
                  {
                    "text": "因此",
                    "bullet": true
                  },
                  {
                    "text": "往往",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "9",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Sau cơn mưa trời lại sáng.",
                    "bold": true
                  },
                  {
                    "text": "阳光总在风雨后。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "难道",
                    "bullet": true
                  },
                  {
                    "text": "通过",
                    "bullet": true
                  },
                  {
                    "text": "可是",
                    "bullet": true
                  },
                  {
                    "text": "结果",
                    "bullet": true
                  },
                  {
                    "text": "上",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "10",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tiêu chuẩn của hạnh phúc",
                    "bold": true
                  },
                  {
                    "text": "幸福的标准",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "不过",
                    "bullet": true
                  },
                  {
                    "text": "确实",
                    "bullet": true
                  },
                  {
                    "text": "在……看来",
                    "bullet": true
                  },
                  {
                    "text": "由于",
                    "bullet": true
                  },
                  {
                    "text": "比如",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "11",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Đọc sách có rất nhiều lợi ích, đọc sách hay, thích đọc sách",
                    "bold": true
                  },
                  {
                    "text": "读书好，读好书，好读书",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "连",
                    "bullet": true
                  },
                  {
                    "text": "否则",
                    "bullet": true
                  },
                  {
                    "text": "无论",
                    "bullet": true
                  },
                  {
                    "text": "然而",
                    "bullet": true
                  },
                  {
                    "text": "同时",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "12",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Khám phá thế giới bằng trái tim",
                    "bold": true
                  },
                  {
                    "text": "用心发现世界",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "并且",
                    "bullet": true
                  },
                  {
                    "text": "再……也……",
                    "bullet": true
                  },
                  {
                    "text": "对于",
                    "bullet": true
                  },
                  {
                    "text": "名量词重叠",
                    "bullet": true
                  },
                  {
                    "text": "相反",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "13",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Uống trà trong lúc xem Kinh kịch",
                    "bold": true
                  },
                  {
                    "text": "喝着茶看京剧",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "大概",
                    "bullet": true
                  },
                  {
                    "text": "偶尔",
                    "bullet": true
                  },
                  {
                    "text": "由",
                    "bullet": true
                  },
                  {
                    "text": "进行",
                    "bullet": true
                  },
                  {
                    "text": "随着",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "14",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bảo vệ Mẹ Trái đất",
                    "bold": true
                  },
                  {
                    "text": "保护地球母亲",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "够",
                    "bullet": true
                  },
                  {
                    "text": "以",
                    "bullet": true
                  },
                  {
                    "text": "既然",
                    "bullet": true
                  },
                  {
                    "text": "于是",
                    "bullet": true
                  },
                  {
                    "text": "什么的",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "15",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Nghệ thuật giáo dục con cái",
                    "bold": true
                  },
                  {
                    "text": "教育孩子的艺术",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "想起来",
                    "bullet": true
                  },
                  {
                    "text": "弄",
                    "bullet": true
                  },
                  {
                    "text": "千万",
                    "bullet": true
                  },
                  {
                    "text": "来",
                    "bullet": true
                  },
                  {
                    "text": "左右",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "16",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cuộc sống có thể tốt đẹp hơn.",
                    "bold": true
                  },
                  {
                    "text": "生活可以更美好。",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "可",
                    "bullet": true
                  },
                  {
                    "text": "恐怕",
                    "bullet": true
                  },
                  {
                    "text": "到底",
                    "bullet": true
                  },
                  {
                    "text": "拿……来说",
                    "bullet": true
                  },
                  {
                    "text": "散",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "17",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Con người và thiên nhiên",
                    "bold": true
                  },
                  {
                    "text": "人与自然",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "倒",
                    "bullet": true
                  },
                  {
                    "text": "干",
                    "bullet": true
                  },
                  {
                    "text": "趋",
                    "bullet": true
                  },
                  {
                    "text": "为了……而……",
                    "bullet": true
                  },
                  {
                    "text": "仍然",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "18",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Khoa học công nghệ và thế giới",
                    "bold": true
                  },
                  {
                    "text": "科技与世界",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "是否",
                    "bullet": true
                  },
                  {
                    "text": "受不了",
                    "bullet": true
                  },
                  {
                    "text": "接着",
                    "bullet": true
                  },
                  {
                    "text": "除此以外",
                    "bullet": true
                  },
                  {
                    "text": "把……叫作……",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "19",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Mùi vị của cuộc sống",
                    "bold": true
                  },
                  {
                    "text": "生活的味道",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "Đại từ nghi vấn hoạt dụng biểu thị phiếm chỉ",
                    "bullet": true
                  },
                  {
                    "text": "上",
                    "bullet": true
                  },
                  {
                    "text": "出来",
                    "bullet": true
                  },
                  {
                    "text": "总的来说",
                    "bullet": true
                  },
                  {
                    "text": "在于",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "20",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Quang cảnh dọc đường",
                    "bold": true
                  },
                  {
                    "text": "路上的风景",
                    "italic": true
                  }
                ],
                [
                  {
                    "text": "动词+着+动词+着",
                    "bullet": true
                  },
                  {
                    "text": "一……就……",
                    "bullet": true
                  },
                  {
                    "text": "究竟",
                    "bullet": true
                  },
                  {
                    "text": "起来",
                    "bullet": true
                  },
                  {
                    "text": "动词+起",
                    "bullet": true
                  }
                ]
              ]
            ]
          },
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Tài liệu & giáo trình: Giáo trình chuẩn HSK4 · Tài liệu dịch và bài tập MCC biên soạn."
              }
            ]
          }
        ]
      },
      {
        "kind": "stage",
        "title": "Giai đoạn 4: HSK 5 + HSKK Cao cấp — 45 buổi",
        "blocks": [
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "4 tháng · 3 buổi/tuần · 36 buổi giáo trình (120 phút/buổi) + 8 buổi ôn tập HSK5 & luyện HSKK Cao cấp + 1 buổi thi cuối khóa. Đầu ra: 2.500 từ vựng, ~130 điểm ngữ pháp; nghe – đọc – viết văn bản nâng cao (~500 chữ), dịch viết và phiên dịch; nói lưu loát, diễn đạt logic qua thảo luận, thuyết trình.",
                "italic": true
              }
            ]
          },
          {
            "kind": "table",
            "head": [
              "Chủ điểm / Chủ đề",
              "Các bài trong Chủ điểm"
            ],
            "rows": [
              [
                [
                  {
                    "text": "Chủ điểm 1 · Hiểu về cuộc sống",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Những điều nhỏ nhặt trong tình yêu — 爱的细节",
                    "bullet": true
                  },
                  {
                    "text": "Để chìa khóa cho ba mẹ — 留串钥匙给父母",
                    "bullet": true
                  },
                  {
                    "text": "Đời người có lựa chọn, mọi thứ có thể đổi thay. — 人生有选择，一切可改变。",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 2 · Đàm luận cổ kim",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Tử Lộ vác gạo. — 子路背米。",
                    "bullet": true
                  },
                  {
                    "text": "Nước suối Tế Nam — 济南的泉水",
                    "bullet": true
                  },
                  {
                    "text": "Nguồn gốc đêm giao thừa — 除夕的由来",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 3 · Lắng nghe điển tích",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Hai câu chuyện thành ngữ — 成语故事两则",
                    "bullet": true
                  },
                  {
                    "text": "Thành ngữ “Sáng ba chiều bốn” — “朝三暮四”的古今义",
                    "bullet": true
                  },
                  {
                    "text": "Một Lỗ Tấn khác — 别样鲁迅",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 4 · Tiếp cận khoa học",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Kỳ tích của cuộc tranh luận — 争论的奇迹",
                    "bullet": true
                  },
                  {
                    "text": "Tác hại của đồng hồ báo thức — 闹钟的危害",
                    "bullet": true
                  },
                  {
                    "text": "Người dùng WeChat ở nước ngoài. — 海外用户玩儿微信。",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 5 · Nhìn ra thế giới",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cưa bỏ “Đáy giỏ” cuộc sống — 锯掉生活的“筐底”",
                    "bullet": true
                  },
                  {
                    "text": "Tứ hợp viện Bắc Kinh — 北京的四合院",
                    "bullet": true
                  },
                  {
                    "text": "Đánh trận trên giấy — 纸上谈兵",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 6 · Tu thân dưỡng tính",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cân nặng và ăn kiêng — 体重与节食",
                    "bullet": true
                  },
                  {
                    "text": "Rời khỏi vào thời khắc tốt đẹp nhất — 在最美好的时刻离开",
                    "bullet": true
                  },
                  {
                    "text": "Nghệ thuật trừu tượng đẹp hay xấu? — 抽象艺术美不美?",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 7 · Giao lưu văn hóa",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bánh củ cải quê nhà — 家乡的萝卜饼",
                    "bullet": true
                  },
                  {
                    "text": "Quầy truyện tranh — 小人书摊",
                    "bullet": true
                  },
                  {
                    "text": "Tình yêu chữ Hán của “ông chú người Mỹ” — 汉字叔叔：一个美国人的汉字情缘",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 8 · Hiểu về giáo dục",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Đọc và suy nghĩ — 阅读与思考",
                    "bullet": true
                  },
                  {
                    "text": "Buông tay — 放手",
                    "bullet": true
                  },
                  {
                    "text": "Hoạt động dạy học tình nguyện — 支教行动",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 9 · Cảm nhận về đời người",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Bơm nước vào tàu — 给自己加满水",
                    "bullet": true
                  },
                  {
                    "text": "Bạn thuộc nhóm người “bận rộn” nào? — 你属于哪一种“忙”?",
                    "bullet": true
                  },
                  {
                    "text": "Đánh cờ — 下棋",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 10 · Quan tâm kinh tế",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Người tốt nghiệp được hoan nghênh nhất — 最受欢迎的毕业生",
                    "bullet": true
                  },
                  {
                    "text": "Đào tạo đối thủ — 培养对手",
                    "bullet": true
                  },
                  {
                    "text": "Cạnh tranh khiến thị trường phát triển. — 竞争让市场更高效。",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 11 · Quan sát xã hội",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Hiệu ứng “thò chân vào cửa” — 登门槛效应",
                    "bullet": true
                  },
                  {
                    "text": "Bảo vệ môi trường quanh ta — 身边的环保",
                    "bullet": true
                  },
                  {
                    "text": "“Dùng tắc trị tắc” – tuyệt chiêu giảm tải giao thông — 以堵治堵——缓解交通有妙招",
                    "bullet": true
                  }
                ]
              ],
              [
                [
                  {
                    "text": "Chủ điểm 12 · Gần với thiên nhiên",
                    "bold": true
                  }
                ],
                [
                  {
                    "text": "Cách loài chim bảo vệ da — 鸟儿的护肤术",
                    "bullet": true
                  },
                  {
                    "text": "Thực vật cũng đổ mồ hôi. — 植物会出汗。",
                    "bullet": true
                  },
                  {
                    "text": "Lão Xá và hoa — 老舍与养花",
                    "bullet": true
                  }
                ]
              ]
            ]
          },
          {
            "kind": "paragraph",
            "lines": [
              {
                "text": "Tài liệu & giáo trình: Giáo trình chuẩn HSK5 · Tài liệu dịch và bài tập MCC biên soạn."
              }
            ]
          }
        ]
      }
    ],
    "info": [
      {
        "label": "Thời lượng",
        "value": [
          "HSK 1+2: 33 buổi",
          "HSK 3 + HSKK Sơ cấp: 25 buổi",
          "HSK 4 + HSKK Trung cấp: 36 buổi",
          "HSK 5 + HSKK Cao cấp: 45 buổi (tổng 139 buổi nếu học trọn HSK 1–5)"
        ]
      },
      {
        "label": "Tần suất",
        "value": [
          "HSK1+2 & HSK3: 2 buổi/tuần",
          "HSK4: 2 buổi/tuần",
          "HSK5: 3 buổi/tuần"
        ]
      },
      {
        "label": "Sĩ số",
        "value": [
          "Offline: 5–8 học viên",
          "Online: 10–12 học viên"
        ]
      },
      {
        "label": "Lựa chọn đăng ký",
        "value": [
          "Các cấp độ từ HSK 1–5, học lẻ từng cấp hoặc combo nhiều cấp"
        ]
      },
      {
        "label": "Giáo trình",
        "value": [
          "Lớp Offline: đã gồm giáo trình in và học liệu phát tại lớp",
          "Lớp Online: khuyến khích dùng tài liệu bản mềm (riêng quyển luyện viết có thể in)"
        ]
      },
      {
        "label": "Cam kết đầu ra",
        "value": [
          "Chuẩn đầu ra HSK theo từng cấp độ như mô tả ở mỗi giai đoạn, cam kết bằng văn bản"
        ]
      }
    ],
    "cardId": "hsk_old",
    "banner": {
      "text": "Bạn mới bắt đầu? Xem lộ trình HSK 3.0",
      "slug": "hsk-3-0"
    }
  }
];
