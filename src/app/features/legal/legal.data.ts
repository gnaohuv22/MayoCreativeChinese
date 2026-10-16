/** Nội dung trang pháp lý: chính sách bảo mật, điều khoản sử dụng */
export type LegalDocKey = 'privacy' | 'terms';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
  /** Đoạn sau danh sách */
  closing?: string[];
}

export interface LegalDoc {
  title: string;
  /** Ngày hiệu lực, dd/mm/yyyy */
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

/** Thông tin doanh nghiệp theo GCN ĐKDN 0111378037 và QĐ 909/QĐ-UBND (chỉ thông tin công khai) */
export const COMPANY = {
  name: 'CÔNG TY TNHH GIÁO DỤC SÁNG TẠO M&L',
  englishName: 'M&L CREATIVE EDUCATION COMPANY LIMITED',
  taxCode: '0111378037',
  registration: 'do Phòng Đăng ký kinh doanh và Tài chính doanh nghiệp – Sở Tài chính thành phố Hà Nội cấp lần đầu ngày 04/02/2026',
  centre: 'Trung tâm ngoại ngữ Mayo Creative Chinese',
  licence: 'Quyết định số 909/QĐ-UBND ngày 30/09/2026 của Ủy ban nhân dân phường Láng',
  address: 'Tầng 2, số 185 phố Chùa Láng, phường Láng, thành phố Hà Nội, Việt Nam',
  phone: '0353 149 176',
  phoneHref: 'tel:0353149176',
  email: 'mayocreativechinese.mcc@gmail.com',
  representative: 'Bà Lưu Ngọc Mai – Giám đốc',
};

const CONTACT_ITEMS = [
  `Đơn vị: ${COMPANY.name} – chủ quản ${COMPANY.centre}`,
  `Địa chỉ: ${COMPANY.address}`,
  `Điện thoại / Zalo: ${COMPANY.phone}`,
  `Email: ${COMPANY.email}`,
];

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Chính sách bảo mật thông tin cá nhân',
    effectiveDate: '16/10/2026',
    intro:
      'Chính sách này cho biết Mayo Creative Chinese (MCC) thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của bạn như thế nào khi bạn dùng trang web, tài khoản học trực tuyến và các biểu mẫu đăng ký của MCC, theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
    sections: [
      {
        heading: '1. Đơn vị kiểm soát và xử lý dữ liệu',
        items: [
          `${COMPANY.name} (${COMPANY.englishName})`,
          `Mã số doanh nghiệp: ${COMPANY.taxCode}, ${COMPANY.registration}`,
          `Chủ quản ${COMPANY.centre}, thành lập theo ${COMPANY.licence}`,
          `Địa chỉ: ${COMPANY.address}`,
          `Người đại diện theo pháp luật: ${COMPANY.representative}`,
          `Điện thoại: ${COMPANY.phone} · Email: ${COMPANY.email}`,
        ],
      },
      {
        heading: '2. Dữ liệu chúng tôi thu thập',
        items: [
          'Khi bạn đăng ký tư vấn hoặc học thử: họ tên, năm sinh, số điện thoại, email, khóa học quan tâm, hình thức học mong muốn.',
          'Khi bạn tạo tài khoản: họ tên, email, số điện thoại và mật khẩu (mật khẩu chỉ được lưu dưới dạng mã hóa một chiều, MCC không đọc được).',
          'Khi bạn đăng nhập bằng Google: họ tên, địa chỉ email và ảnh đại diện do Google cung cấp. MCC không nhận được mật khẩu Google của bạn.',
          'Khi bạn học: tiến độ flashcard, kết quả và bài làm các đề thi thử, lớp học bạn tham gia.',
          'Dữ liệu kỹ thuật: địa chỉ IP (dùng để giới hạn số lần đăng ký, đăng nhập và chống spam); dữ liệu lưu trên trình duyệt của bạn như ngôn ngữ, giao diện sáng/tối, phiên đăng nhập và tiến độ học khi chưa đăng nhập.',
          'Kiểm tra chống bot: biểu mẫu đăng ký dùng Cloudflare Turnstile, dịch vụ này xử lý một số thông tin kỹ thuật của trình duyệt để phân biệt người thật với chương trình tự động.',
          'MCC không thu thập dữ liệu cá nhân nhạy cảm (như tình trạng sức khỏe, tôn giáo, tài chính, sinh trắc học).',
        ],
      },
      {
        heading: '3. Mục đích sử dụng',
        items: [
          'Tạo và quản lý tài khoản, cho phép bạn đăng nhập và khôi phục mật khẩu.',
          'Lưu tiến độ học và kết quả bài thi để bạn học tiếp trên mọi thiết bị; giáo viên của lớp xem kết quả để hướng dẫn học viên.',
          'Liên hệ tư vấn, xếp lớp, thông báo về lớp học và khóa học bạn đã đăng ký.',
          'Bảo đảm an toàn hệ thống: chống spam, chống truy cập trái phép.',
          'MCC không bán dữ liệu cá nhân và không dùng dữ liệu của bạn cho quảng cáo của bên thứ ba.',
        ],
      },
      {
        heading: '4. Bên xử lý dữ liệu và việc chuyển dữ liệu ra nước ngoài',
        paragraphs: [
          'MCC dùng các nhà cung cấp dịch vụ sau để vận hành trang web. Họ chỉ xử lý dữ liệu theo yêu cầu của MCC và cho các mục đích nêu trên:',
        ],
        items: [
          'Supabase – cơ sở dữ liệu và đăng nhập (máy chủ đặt tại Singapore).',
          'Vercel – lưu trữ và phân phối trang web.',
          'Cloudflare – kiểm tra chống bot (Turnstile).',
          'Google – đăng nhập bằng Google, Google Sheets (lưu phiếu đăng ký tư vấn), Gmail (gửi thư xác nhận và khôi phục mật khẩu).',
        ],
        closing: [
          'Một số máy chủ của các nhà cung cấp trên đặt ngoài Việt Nam, nên dữ liệu của bạn có thể được chuyển ra nước ngoài. Khi đồng ý với chính sách này, bạn đồng ý với việc chuyển dữ liệu đó. MCC chỉ cung cấp dữ liệu cho cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định của pháp luật.',
        ],
      },
      {
        heading: '5. Thời gian lưu trữ',
        items: [
          'Dữ liệu tài khoản, tiến độ học và kết quả bài thi: lưu đến khi bạn yêu cầu xóa tài khoản hoặc tài khoản bị xóa theo Điều khoản sử dụng.',
          'Phiếu đăng ký tư vấn, học thử: tối đa 24 tháng kể từ ngày đăng ký, trừ khi bạn trở thành học viên.',
          'Địa chỉ IP dùng để chống spam: tự động xóa sau 1 ngày.',
          'Dữ liệu lưu trên trình duyệt: do bạn kiểm soát, có thể xóa bất cứ lúc nào trong cài đặt trình duyệt.',
        ],
      },
      {
        heading: '6. Quyền của bạn',
        paragraphs: [
          'Theo Nghị định 13/2023/NĐ-CP, bạn có quyền được biết, đồng ý hoặc rút lại sự đồng ý, truy cập, yêu cầu chỉnh sửa, xóa, hạn chế xử lý, phản đối xử lý dữ liệu cá nhân của mình, và khiếu nại, tố cáo, yêu cầu bồi thường theo quy định của pháp luật.',
          'Để thực hiện các quyền này (ví dụ: xin bản sao dữ liệu hoặc xóa tài khoản), hãy liên hệ MCC qua email hoặc điện thoại ở mục 9. MCC phản hồi trong vòng 72 giờ kể từ khi nhận được yêu cầu và có thể đề nghị bạn xác minh danh tính trước khi thực hiện. Việc rút lại sự đồng ý không ảnh hưởng đến các xử lý đã thực hiện trước đó.',
        ],
      },
      {
        heading: '7. Bảo mật dữ liệu',
        items: [
          'Kết nối tới trang web được mã hóa (HTTPS); mật khẩu được mã hóa một chiều.',
          'Chỉ nhân sự được phân quyền mới xem được dữ liệu học viên; các thao tác của nhân sự được ghi nhật ký.',
          'Nếu xảy ra sự cố lộ lọt dữ liệu, MCC sẽ thông báo cho cơ quan có thẩm quyền và người bị ảnh hưởng theo quy định.',
        ],
      },
      {
        heading: '8. Trẻ em',
        paragraphs: [
          'Người dưới 16 tuổi chỉ tạo tài khoản hoặc đăng ký khi có sự đồng ý của cha mẹ hoặc người giám hộ. Với trẻ từ đủ 7 tuổi, cần có cả sự đồng ý của trẻ. Cha mẹ, người giám hộ có thể liên hệ MCC để xem, chỉnh sửa hoặc xóa dữ liệu của con em mình.',
        ],
      },
      {
        heading: '9. Liên hệ',
        items: CONTACT_ITEMS,
      },
      {
        heading: '10. Thay đổi chính sách',
        paragraphs: [
          'MCC có thể cập nhật chính sách này khi dịch vụ hoặc quy định pháp luật thay đổi. Ngày hiệu lực ở đầu trang cho biết lần cập nhật gần nhất; với thay đổi quan trọng, MCC sẽ thông báo trên trang web hoặc qua email.',
        ],
      },
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng',
    effectiveDate: '16/10/2026',
    intro:
      `Điều khoản này áp dụng khi bạn truy cập trang web và dùng tài khoản học trực tuyến của ${COMPANY.centre} (MCC), do ${COMPANY.name} (mã số doanh nghiệp ${COMPANY.taxCode}) vận hành. Khi tạo tài khoản hoặc sử dụng dịch vụ, bạn đồng ý với các điều khoản dưới đây và với Chính sách bảo mật của MCC.`,
    sections: [
      {
        heading: '1. Dịch vụ',
        items: [
          'Trang web giới thiệu các khóa học của MCC và cung cấp công cụ học trực tuyến: flashcard từ vựng, đề thi thử HSK, khu học viên.',
          'Tài khoản khách được tạo miễn phí. Một số nội dung chỉ dành cho học viên các lớp của MCC.',
          'Các khóa học có học phí được thỏa thuận riêng bằng hợp đồng hoặc thẻ học viên theo quy định; điều khoản này không thay thế các thỏa thuận đó.',
        ],
      },
      {
        heading: '2. Tài khoản',
        items: [
          'Bạn cung cấp thông tin chính xác khi đăng ký và cập nhật khi có thay đổi.',
          'Mỗi tài khoản dành cho một người. Bạn tự bảo mật mật khẩu và chịu trách nhiệm về hoạt động trên tài khoản của mình; hãy báo ngay cho MCC nếu nghi ngờ tài khoản bị người khác sử dụng.',
          'Tài khoản học viên lớp do MCC cấp; học viên đổi mật khẩu ở lần đăng nhập đầu tiên.',
          'Người dưới 16 tuổi cần có sự đồng ý của cha mẹ hoặc người giám hộ khi tạo tài khoản.',
        ],
      },
      {
        heading: '3. Nội dung và quyền sở hữu trí tuệ',
        items: [
          'Bài giảng, từ vựng, đề thi thử, hình ảnh, âm thanh và giao diện trên trang thuộc quyền sở hữu của MCC hoặc được sử dụng hợp pháp. Bạn được dùng cho mục đích học tập cá nhân.',
          'Không sao chép, phát tán, bán lại hoặc dùng nội dung cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản của MCC.',
          'Đề thi thử do MCC biên soạn để luyện tập. Điểm số trên trang không phải kết quả thi HSK chính thức và không thay thế chứng chỉ do đơn vị tổ chức thi cấp.',
        ],
      },
      {
        heading: '4. Hành vi không được phép',
        items: [
          'Truy cập trái phép, dò quét, tấn công hoặc làm gián đoạn hệ thống.',
          'Dùng chương trình tự động để tạo tài khoản, gửi biểu mẫu hoặc tải nội dung hàng loạt.',
          'Mạo danh người khác, cung cấp thông tin sai, chia sẻ tài khoản cho người khác dùng.',
          'Đăng tải hoặc gửi nội dung vi phạm pháp luật Việt Nam.',
        ],
      },
      {
        heading: '5. Tạm khóa và xóa tài khoản',
        paragraphs: [
          'MCC có thể tạm khóa hoặc xóa tài khoản vi phạm điều khoản này, và sẽ thông báo cho bạn khi có thể. Bạn có thể yêu cầu xóa tài khoản bất cứ lúc nào qua thông tin liên hệ ở mục 8; dữ liệu được xử lý theo Chính sách bảo mật.',
        ],
      },
      {
        heading: '6. Giới hạn trách nhiệm',
        paragraphs: [
          'MCC nỗ lực để dịch vụ hoạt động liên tục và nội dung chính xác, nhưng dịch vụ trực tuyến có thể bị gián đoạn do bảo trì hoặc sự cố ngoài tầm kiểm soát. Trong phạm vi pháp luật cho phép, MCC không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc không truy cập được dịch vụ.',
        ],
      },
      {
        heading: '7. Luật áp dụng và giải quyết tranh chấp',
        paragraphs: [
          'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không thương lượng được, tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền tại thành phố Hà Nội.',
        ],
      },
      {
        heading: '8. Liên hệ',
        items: CONTACT_ITEMS,
      },
      {
        heading: '9. Thay đổi điều khoản',
        paragraphs: [
          'MCC có thể cập nhật điều khoản này. Ngày hiệu lực ở đầu trang cho biết lần cập nhật gần nhất; việc bạn tiếp tục sử dụng dịch vụ sau khi cập nhật được hiểu là đồng ý với điều khoản mới.',
        ],
      },
    ],
  },
};
