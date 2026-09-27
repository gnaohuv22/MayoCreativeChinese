import type { StoryImage, StudentStory } from '../models/student-story.model';

/** Ảnh trong public/stories/<thư-mục>/<n>.webp */
function images(folder: string, count: number, alt: string): StoryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `stories/${folder}/${i + 1}.webp`,
    alt: `${alt} — ảnh ${i + 1}`,
  }));
}

const yenNgoc = images('hsk5-yen-ngoc', 3, 'Kết quả HSK5 và tin nhắn của chị Yến Ngọc');
const results = images('ket-qua-hsk-18-07-2026', 8, 'Kết quả thi HSK ngày 18/07/2026 của học viên MCC');
const classroom = images('lop-hoc-offline', 7, 'Lớp học offline tại MCC');
const tuongVan = images('hsk6-tuong-van', 5, 'Hành trình HSK6 của Tường Vân');
const calligraphy = images('chu-han-tet-2026', 1, 'Bài dự thi viết chữ Hán Tết của Phạm Bình Phương Khuê');

/** Nội dung lấy từ tài liệu phản hồi của MCC (mục "Adding → Bài đăng") */
export const STUDENT_STORIES: StudentStory[] = [
  {
    slug: 'ket-qua-thi-hsk-18-07-2026',
    category: 'Thành tích HSK',
    title: 'Khi HSK không chỉ là học để đủ điểm đỗ',
    excerpt: 'Kỳ thi HSK ngày 18/07/2026: bốn bạn đạt 292/300 HSK3, trong đó hai bạn chỉ sau 2,5 tháng học lớp cấp tốc.',
    cover: results[0],
    images: results,
    body: [
      { kind: 'lead', text: 'Trong kỳ thi HSK ngày 18/07/2026 vừa qua, các học viên MCC đã chính thức nhận về những kết quả thật đáng tự hào. Đằng sau mỗi con số là cả một quá trình học tập, ôn luyện chăm chỉ của các bạn và sự đồng hành sát sao của giáo viên MCC.' },
      { kind: 'paragraph', text: 'Cùng MCC vinh danh những gương mặt xuất sắc của trung tâm trong kỳ thi HSK vừa qua:' },
      {
        kind: 'results',
        items: [
          { name: 'Đỗ Khánh Linh', level: 'HSK3', score: '292/300', note: 'Sau 2,5 tháng học lớp HSK1-3 cấp tốc' },
          { name: 'Nguyễn Ngọc Hà', level: 'HSK3', score: '292/300', note: 'Sau 2,5 tháng học lớp HSK1-3 cấp tốc' },
          { name: 'Khánh Huyền', level: 'HSK3', score: '292/300' },
          { name: 'Mai Linh', level: 'HSK3', score: '292/300' },
          { name: 'Tùng Dương', level: 'HSK3', score: '278/300' },
          { name: 'Trương Hồng Phúc', level: 'HSK3', score: '226/300' },
          { name: 'Minh Nguyệt', level: 'HSK4', score: '234/300' },
        ],
      },
      { kind: 'paragraph', text: 'Điều MCC vui nhất không chỉ là nhìn thấy những con số trên bảng điểm, mà còn là được chúc mừng những nỗ lực và sự tiến bộ của từng học viên.' },
      {
        kind: 'list',
        items: [
          'Trên lớp, các bạn được học theo lộ trình, củng cố kiến thức và làm quen với dạng bài HSK.',
          'Ngoài giờ học, học viên vẫn có thể trao đổi, hỏi bài và nhận thêm hỗ trợ trong quá trình ôn tập.',
          'Quan trọng nhất vẫn là sự chủ động, chăm chỉ và nỗ lực của mỗi bạn trong suốt hành trình học tập.',
        ],
      },
      { kind: 'paragraph', text: 'Và dù học ONLINE hay OFFLINE, MCC vẫn mong muốn mang đến một môi trường học tập chất lượng để các bạn yên tâm theo đuổi mục tiêu của mình.' },
      { kind: 'paragraph', text: 'Một lần nữa, chúc mừng tất cả các học viên MCC đã hoàn thành kỳ thi và đạt được những kết quả thật đáng tự hào! Cảm ơn các bạn đã lựa chọn MCC trên hành trình chinh phục tiếng Trung. Chúc các bạn sẽ tiếp tục giữ vững tinh thần này và chinh phục những cột mốc tiếp theo!' },
    ],
  },
  {
    slug: 'nguoi-di-lam-hoc-hsk5',
    category: 'Câu chuyện học viên',
    title: 'Câu chuyện người đi làm học HSK5',
    excerpt: 'Chị Yến Ngọc bắt đầu từ con số 0, vừa đi làm vừa học và đã cầm trên tay tấm bằng HSK5.',
    cover: yenNgoc[0],
    images: yenNgoc,
    body: [
      { kind: 'lead', text: 'Theo bạn, người đi làm bận rộn có thể học tiếng Trung không? Điều quan trọng nhất để chinh phục một ngôn ngữ khó như tiếng Trung là gì?' },
      { kind: 'paragraph', text: 'Không phải là năng khiếu bẩm sinh, cũng chẳng phải là việc bạn có toàn bộ thời gian trong ngày chỉ để ngồi vào bàn học. Điều quan trọng nhất, có lẽ là sự kiên trì ngay cả những lúc lịch trình của bạn bận rộn nhất.' },
      { kind: 'paragraph', text: 'MCC đồng hành cùng chị Yến Ngọc từ những ngày đầu tiên, khi chị bắt đầu từ con số 0 tròn trĩnh. Suốt chặng đường dài đó, chị vừa đi làm, vừa học. Có những khoảng thời gian công việc bận rộn, dù phải di chuyển nhiều nhưng chị vẫn đều đặn đến lớp offline. Sự nỗ lực lặng lẽ đó là điều mà tập thể giáo viên và đội ngũ MCC luôn cực kỳ trân trọng.' },
      { kind: 'paragraph', text: 'Khi lên lớp HSK5.002, chị chuyển sang học lớp online trực tiếp với giáo viên người Trung Quốc. Ở cấp độ HSK5, lượng từ vựng và ngữ pháp đã tăng lên rất nhiều. Nhưng chính nhờ nền tảng vững từ đầu kết hợp với môi trường tương tác 100% tiếng Trung, kỹ năng nghe và nói của chị tiến bộ rõ rệt qua từng buổi học. Chị nghe tự nhiên hơn, nói trôi chảy và chủ động hơn rất nhiều.' },
      { kind: 'paragraph', text: 'Nhìn lại cả một chặng đường dài từ HSK1 đến khi cầm trên tay tấm bằng HSK5, MCC thật sự rất xúc động và tự hào.' },
      { kind: 'paragraph', text: 'Chúc mừng chị Yến Ngọc đã hoàn thành xuất sắc mục tiêu của mình. Cảm ơn chị vì đã tin tưởng và chọn MCC làm người đồng hành từ những bước chân đầu tiên!' },
    ],
  },
  {
    slug: 'hoc-vien-dat-hsk6',
    category: 'Câu chuyện học viên',
    title: 'Giáo viên HSK6 có học viên đạt HSK6 là cảm giác như thế nào?',
    excerpt: 'Từ những buổi phát âm b, p, m đầu tiên cuối năm 2023, Tường Vân đã chinh phục HSK6 với 216/300 điểm.',
    cover: tuongVan[0],
    images: tuongVan,
    body: [
      { kind: 'lead', text: 'Đó là cảm giác như nhìn thấy một hạt giống nhỏ bé mình gieo từ cuối năm 2023… hôm nay nở thành một bông hoa rực rỡ.' },
      { kind: 'paragraph', text: 'Cuối năm 2023, Tường Vân bắt đầu tiếng Trung từ con số 0, bước những bước chân đầu tiên dưới sự dẫn dắt của “chị giáo” Lưu Ngọc Mai. Từ những buổi học phát âm b, p, m đầu tiên, vậy mà sau hơn 1 năm kiên trì, bền bỉ, hôm nay em đã xuất sắc chinh phục HSK6 với 216/300 điểm – một cột mốc mà nhiều người học tiếng Trung cũng mơ ước.' },
      { kind: 'paragraph', text: 'Trong suốt hành trình đó, Vân luôn là cô học viên chăm chỉ, tham gia học và nộp bài đầy đủ, còn luôn chủ động hỏi thêm, tìm hiểu sâu hơn về bài nữa. Và rồi những nỗ lực thầm lặng ấy đã kết trái.' },
      { kind: 'paragraph', text: 'Không chỉ là điểm số — đây là một dấu mốc trưởng thành, là minh chứng cho hành trình học thuật bền bỉ mà đội ngũ MCC luôn tự hào được đồng hành cùng học viên.' },
      { kind: 'paragraph', text: 'Cảm ơn Vân vì đã tin tưởng và lựa chọn đồng hành cùng “chị giáo”. Cảm ơn vì đã chứng minh rằng: chỉ cần đủ quyết tâm, tiếng Trung không hề khó – chỉ cần ta đừng bỏ cuộc.' },
      { kind: 'paragraph', text: 'Chúc mừng em, Phan Nguyễn Tường Vân. Chặng đường HSK6 chỉ là khởi đầu — phía trước còn rất nhiều cánh cửa đẹp đang đợi em mở ra.' },
    ],
  },
  {
    slug: 'khong-khi-lop-hoc-offline',
    category: 'Lớp học MCC',
    title: 'Không khí lớp học offline tại MCC luôn vô cùng sôi động!',
    excerpt: 'Luyện nói ngay từ đầu giờ, tương tác suốt buổi học và thực hành lại kiến thức vào cuối buổi.',
    cover: classroom[0],
    images: classroom,
    body: [
      { kind: 'lead', text: 'Tại MCC, các bạn không chỉ học từ vựng, ngữ pháp mà còn được luyện nói và giao tiếp ngay từ đầu giờ, cùng nhau tương tác trong suốt buổi học và thực hành lại kiến thức vào cuối buổi.' },
      { kind: 'paragraph', text: 'Mỗi buổi học là một cơ hội để các bạn nói nhiều hơn, phản xạ nhanh hơn và tự tin sử dụng tiếng Trung hơn.' },
      { kind: 'paragraph', text: 'Cùng xem một chút “vibe” lớp học nhà MCC nhé!' },
    ],
  },
  {
    slug: 'cuoc-thi-viet-chu-han-tet',
    category: 'Hoạt động',
    title: 'Cuộc thi viết chữ Hán Tết: 笔墨迎春 – Xuân trong nét chữ',
    excerpt: 'Bài dự thi của học viên Phạm Bình Phương Khuê.',
    cover: calligraphy[0],
    images: calligraphy,
    body: [
      { kind: 'lead', text: 'Cuộc thi viết chữ Hán Tết 笔墨迎春 – Xuân trong nét chữ.' },
      { kind: 'paragraph', text: 'Họ và tên học viên: Phạm Bình Phương Khuê.' },
    ],
  },
];

/** Ảnh lớp học & thành tích dùng chung cho khối "MCC trong lớp học" ở trang khóa học */
export const CLASS_MOMENTS: StoryImage[] = [
  classroom[0], results[1], classroom[1], results[2], classroom[2], results[4],
];
