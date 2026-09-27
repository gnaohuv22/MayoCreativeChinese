"""
Chuyển brief "Trang chi tiết từng khóa học" (Google Docs) thành dữ liệu TypeScript cho trang /khoa-hoc/:slug.

Cách dùng (cần Python 3 + beautifulsoup4):
    python scripts/course-brief-to-ts.py                  # tự tải bản HTML mới nhất của brief
    python scripts/course-brief-to-ts.py brief.html       # hoặc dùng file HTML đã tải sẵn

Kết quả ghi đè: src/app/features/courses/data/course-details.data.ts

Quy ước đọc brief (xem mục 1 của brief):
- Chữ thường / bảng → hiển thị nguyên văn.
- Đoạn "GHI CHÚ DESIGN" / "CẬP NHẬT" và bảng "Đường dẫn gợi ý / Vị trí carousel" → không hiển thị.
- Mỗi "Giai đoạn N: ..." mở một mục accordion; "▸ Chủ điểm ..." là tiêu đề phụ trong giai đoạn.
- "Khối B2" (bảng 2 cột) → cột thông tin khóa học (bỏ dòng "Nút").
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

BRIEF_ID = '13IfXMiOR3OMN-cIvlrio1I5Jvnt29sqE'
OUT = Path(__file__).resolve().parent.parent / 'src/app/features/courses/data/course-details.data.ts'

# Thẻ khóa học trên trang chủ (courses.ts) ↔ trang chi tiết
CARD_BY_SLUG = {
    'hsk-3-0': 'hsk',
    'bo-sung-hsk-2-len-3': 'supplement',
    'gia-su': 'tutor',
    'tieng-trung-tre-em': 'kids',
    'hsk-2-0': 'hsk_old',
}

SKIP_PREFIXES = ('GHI CHÚ DESIGN', 'CẬP NHẬT')
LEAD_LABELS = ('Đối tượng', 'Thông điệp', 'Mô tả', 'Dành cho')


def load_html() -> str:
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).read_text(encoding='utf-8')
    url = f'https://docs.google.com/document/d/{BRIEF_ID}/export?format=html'
    return urllib.request.urlopen(url).read().decode('utf-8')


def clean(text: str) -> str:
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    # Ghi chú cho designer trong ngoặc, VD "(đặt ngay dưới tiêu đề)"
    text = re.sub(r'\s*\((?:đặt|gợi ý)[^)]*\)', '', text)
    # Tham chiếu nội bộ của brief, VD "... ở mục 4.4 này."
    text = re.sub(r'\s*ở mục [\d.]+ này', '', text)
    return text


class Styles:
    def __init__(self, html: str):
        css = re.search(r'<style[^>]*>(.*?)</style>', html, re.S).group(1)
        rules = re.findall(r'\.(c\d+)\{([^}]*)\}', css)
        self.bold = {c for c, b in rules if 'font-weight:700' in b}
        self.italic = {c for c, b in rules if 'font-style:italic' in b}

    def _share(self, el, classes: set) -> float:
        spans = [s for s in el.find_all('span') if s.get_text(strip=True)]
        if not spans:
            return 0.0
        total = sum(len(s.get_text(strip=True)) for s in spans)
        hit = sum(len(s.get_text(strip=True)) for s in spans if classes & set(s.get('class', [])))
        return hit / total

    def line(self, el) -> dict:
        out = {'text': clean(el.get_text(' '))}
        if self._share(el, self.bold) > 0.6:
            out['bold'] = True
        if self._share(el, self.italic) > 0.6:
            out['italic'] = True
        if el.name == 'li':
            out['bullet'] = True
        return out


def cell_lines(td, st: Styles) -> list:
    lines = [st.line(p) for p in td.find_all(['p', 'li'])]
    return [l for l in lines if l['text']]


def table_rows(table, st: Styles) -> list:
    return [[cell_lines(td, st) for td in tr.find_all('td')] for tr in table.find_all('tr')]


def plain(cell: list) -> str:
    return ' '.join(l['text'] for l in cell).strip()


def info_rows(rows: list) -> list:
    out = []
    for r in rows:
        if len(r) < 2:
            continue
        label = plain(r[0]).rstrip(':').strip()
        if not label or label == 'Nút':
            continue
        out.append({'label': label, 'value': [l['text'] for l in r[1]]})
    return out


def parse(html: str) -> list:
    st = Styles(html)
    soup = BeautifulSoup(html, 'html.parser')
    elements = [e for e in soup.body.children if getattr(e, 'name', None)]

    courses = []
    course = None
    mode = None           # 'A' | 'B1' | 'B2' | 'options'
    target = None         # list đang nhận block (course/track/stage)
    track = None
    pending_list_title = None

    def close_stage():
        nonlocal target
        target = track['blocks'] if track else course['blocks']

    for el in elements:
        text = clean(el.get_text(' '))
        if el.name == 'h2' and re.match(r'4\.\d', text):
            course = {'slug': '', 'name': '', 'goal': '', 'lead': [], 'chips': [], 'stats': [],
                      'blocks': [], 'info': []}
            courses.append(course)
            mode, track, target = None, None, course['blocks']
            continue
        if course is None:
            continue
        if el.name == 'h2' or el.name == 'h1':
            break  # hết phần 4

        if el.name == 'h3':
            if text.startswith('Khối A'):
                mode = 'A'
            elif text.startswith('Khối B1'):
                mode = 'B1'
                close_stage()
            elif text.startswith('Khối B2'):
                mode = 'B2'
            elif 'lựa chọn' in text and 'option' in text:
                mode = 'options'
            else:
                mode = 'B1'
                close_stage()
                target.append({'kind': 'heading', 'text': text})
            continue

        if el.name == 'table':
            rows = table_rows(el, st)
            first = plain(rows[0][0]) if rows and rows[0] else ''
            if first.startswith('Đường dẫn gợi ý'):
                course['slug'] = plain(rows[0][1]).split('/')[-1]
            elif mode == 'B2':
                info = info_rows(rows)
                if track is not None:
                    track['info'] = info
                else:
                    course['info'] = info
                mode = 'B1'
            elif mode == 'options':
                course['tracks'] = [{
                    'id': f'chang-{i + 1}',
                    'title': re.sub(r'^[①②③④⑤]\s*', '', plain(r[0])),
                    'sessions': plain(r[1]),
                    'summary': plain(r[2]),
                    'blocks': [], 'info': [],
                } for i, r in enumerate(rows[1:])]
            elif first == 'Thanh accordion':
                # Gia sư: mỗi dòng là một mục accordion
                for r in rows[1:]:
                    course['blocks'].append({
                        'kind': 'stage', 'title': re.sub(r'^\d+\.\s*', '', plain(r[0])),
                        'blocks': [{'kind': 'paragraph', 'lines': r[1]}],
                    })
            elif mode == 'B1' and not course['stats'] and len(rows) == 1 and not course['blocks']:
                # Dải số liệu nổi bật: ô = [số, mô tả]
                course['stats'] = [{'value': c[0]['text'], 'label': ' '.join(l['text'] for l in c[1:])}
                                   for c in rows[0] if c]
            else:
                head = [plain(c) for c in rows[0]]
                target.append({'kind': 'table', 'head': head, 'rows': rows[1:]})
            continue

        if el.name in ('ul', 'ol'):
            items = [clean(li.get_text(' ')) for li in el.find_all('li')]
            items = [i for i in items if i]
            if items:
                block = {'kind': 'list', 'items': items}
                if pending_list_title:
                    block['title'] = pending_list_title
                target.append(block)
            pending_list_title = None
            continue

        if el.name != 'p' or not text or text.startswith(SKIP_PREFIXES):
            continue

        if mode == 'A' or (mode is None and ':' in text):
            label, _, value = text.partition(':')
            label, value = label.strip(), value.strip()
            if label == 'Tên khóa học':
                course['name'] = value
            elif label == 'Mục tiêu khóa học':
                if value:
                    course['goal'] = value
                else:
                    mode = 'B1'  # "Mục tiêu khóa học:" + danh sách (khóa bổ sung) thuộc B1
                    pending_list_title = 'Mục tiêu khóa học'
            elif label == 'Chip':
                course['chips'] = [c.strip() for c in re.split(r'\s*·\s*', value) if c.strip()]
            elif label == 'Tab chuyển đối tượng':
                tabs_part, _, note = value.partition('. ')
                course['audiences'] = [clean(t) for t in tabs_part.split('|')]
                course['audienceNote'] = note.strip()
            elif label in LEAD_LABELS:
                course['lead'].append({'label': label, 'text': value})
            continue

        # Bắt đầu một "chặng" (khóa Trẻ em): "① GIAO TIẾP NHẬP MÔN — 3 khóa × 16 buổi"
        m = re.match(r'^([①②③④⑤])\s*(.*)$', text)
        if m and course.get('tracks'):
            idx = '①②③④⑤'.index(m.group(1))
            track = course['tracks'][idx]
            target = track['blocks']
            mode = 'B1'
            continue

        if re.match(r'^Giai đoạn\s*\d', text):
            parent = track['blocks'] if track else course['blocks']
            title = re.sub(r'^(Giai đoạn\s*\d+)\s*:\s*', lambda m: m.group(1) + ': ', text)
            stage = {'kind': 'stage', 'title': title, 'blocks': []}
            parent.append(stage)
            target = stage['blocks']
            continue

        if text.startswith('▸'):
            target.append({'kind': 'subheading', 'text': text.lstrip('▸ ').strip()})
            continue

        line = st.line(el)
        if text.endswith(':') and len(text) <= 60:  # nhãn ngắn đứng trước một danh sách
            pending_list_title = text.rstrip(':').strip()
            continue
        target.append({'kind': 'paragraph', 'lines': [line]})

    for c in courses:
        c['cardId'] = CARD_BY_SLUG.get(c['slug'])
        if c['slug'] == 'hsk-2-0':
            # GHI CHÚ DESIGN: banner phụ đầu trang dẫn về lộ trình HSK 3.0
            c['banner'] = {'text': 'Bạn mới bắt đầu? Xem lộ trình HSK 3.0', 'slug': 'hsk-3-0'}
    return courses


def main():
    courses = parse(load_html())
    assert courses and all(c['slug'] and c['name'] for c in courses), 'Không đọc được khóa học nào từ brief'
    body = json.dumps(courses, ensure_ascii=False, indent=2)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        '// TỰ ĐỘNG SINH từ brief "Trang chi tiết từng khóa học" — không sửa tay.\n'
        '// Chạy lại: python scripts/course-brief-to-ts.py\n'
        "import type { CourseDetail } from '../models/course-detail.model';\n\n"
        f'export const COURSE_DETAILS: CourseDetail[] = {body};\n',
        encoding='utf-8', newline='\n')
    for c in courses:
        stages = sum(1 for b in c['blocks'] if b['kind'] == 'stage')
        tracks = len(c.get('tracks', []))
        print(f"{c['slug']:<22} {c['name']:<42} stages={stages} tracks={tracks} info={len(c['info'])} stats={len(c['stats'])}")


if __name__ == '__main__':
    main()
