"""Generate immutable reader text/routes and word-based page rows from cached sources.

Run after fetching the pinned inputs documented in docs/QURAN_AUDIO.md.
Arabic normalization is used ONLY for reference alignment; output text is untouched.
"""
import difflib
import json
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.local-backups/quran-scripts'
sys.path.insert(0, str(ROOT / '.local-backups/quran-font-tools'))
import uharfbuzz as hb

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, value):
    serialized = json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n'
    output(path, serialized)

def output(path, serialized):
    if '--check' in sys.argv:
        assert path.read_text(encoding='utf-8') == serialized, f'Stale generated data: {path}'
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(serialized, encoding='utf-8')

def normalize(value):
    value = value.translate(str.maketrans('أإآٱىةؤئ', 'اااايهوي'))
    return ''.join(c for c in value if '\u0621' <= c <= '\u063a' or '\u0641' <= c <= '\u064a')

def align(source, target):
    matcher = difflib.SequenceMatcher(None, [normalize(x['text']) for x in source], [normalize(x['text']) for x in target], autojunk=False)
    for tag, i, j, a, b in matcher.get_opcodes():
        if tag == 'equal' or (tag == 'replace' and j-i == b-a):
            for src, dst in zip(source[i:j], target[a:b]):
                dst['sources'] = [src]
        elif tag == 'replace':
            for dst in target[a:b]:
                dst['sources'] = source[i:j]
        elif tag == 'insert':
            raise ValueError(f'Unmapped text: {target[a:b]}')
        # Duri does not number the opening basmala as an ayah.
        elif tag == 'delete' and any(s['key'] != '1:1' for s in source[i:j]):
            raise ValueError(f'Unexpected deleted text: {source[i:j]}')

canonical_script = "const {getQuranChapter}=require('./utils/quranData'); const {readingTokens}=require('./utils/quranAudio'); process.stdout.write(JSON.stringify(Array.from({length:114},(_,i)=>getQuranChapter(i+1).map(v=>({key:v.key,text:v.text,words:readingTokens(v.text).filter(w=>w.word!==null)})))));"
canonical = json.loads(subprocess.check_output(['node', '-e', canonical_script], cwd=ROOT))
for chapter in canonical:
    for verse in chapter:
        for word in verse['words']:
            word['key'] = verse['key']

duri = [[] for _ in range(114)]
original = read(CACHE / 'DouriData.json')
for row in original:
    text, marker = row['aya_text'].rsplit('\u00a0', 1)
    key = f"{row['sura_no']}:{row['aya_no']}"
    words = [{'text': m.group(), 'from': m.start(), 'to': m.end(), 'key': key} for m in re.finditer(r'\S+', text) if normalize(m.group())]
    assert words and all(ord(c) <= 0xffff for c in text), key
    duri[row['sura_no']-1].append({'key': key, 'text': text, 'marker': marker, 'words': words, 'sourcePage': row['page'], 'juz': row['jozz']})

for c, chapter in enumerate(duri):
    align([w for v in canonical[c] for w in v['words']], [w for v in chapter for w in v['words']])
    rows = []
    for v in chapter:
        routes = [[w['from'], w['to'], [[s['key'], s['from'], s['to']] for s in w['sources']]] for w in v['words']]
        rows.append([v['text'], v['marker'], v['sourcePage'], v['juz'], routes])
    write(ROOT / f'data/quran/duri/{c+1}.json', rows)

# Derive only page and line membership from the Madani page data. Render the
# existing Hafs text or the original Duri text, never substitute/normalize words.
layout_words = [[] for _ in range(114)]
headers = {}
for page in range(1, 605):
    raw = read(ROOT / f'.local-backups/quran-layout/mushaf/page-{page:03d}.json')
    headers[page] = []
    for row in raw['lines']:
        if row['type'] != 'text':
            headers[page].append([row['line'], row['type'], int(row.get('surah') or 0)])
        for word in row.get('words', []):
            c, a, n = map(int, word['location'].split(':'))
            text = re.sub(r'[\s٠-٩0-9]+$', '', word['word'])
            layout_words[c-1].append({'text': text, 'key': f'{c}:{a}', 'page': page, 'line': row['line']})

for c, chapter in enumerate(canonical):
    words = [w for v in chapter for w in v['words']]
    align(layout_words[c], words)
    for w in words:
        s = w.pop('sources')[0]
        w['page'], w['line'] = s['page'], s['line']

def font_width(path):
    face = hb.Face(path.read_bytes()); font = hb.Font(face); font.scale = (face.upem, face.upem)
    def width(text):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(font, buf)
        assert all(g.codepoint != 0 for g in buf.glyph_infos), repr(text)
        return round(sum(p.x_advance for p in buf.glyph_positions) / face.upem, 4)
    return width

for riwayah, chapters, font_path in [('hafs', canonical, ROOT / 'assets/fonts/Amiri-Regular.ttf'), ('duri', duri, CACHE / 'duri.ttf')]:
    width = font_width(font_path)
    pages = {p: {} for p in range(1, 605)}
    locations = {}
    for chapter in chapters:
        for verse in chapter:
            for i, w in enumerate(verse['words']):
                place = w if riwayah == 'hafs' else w['sources'][0]
                page, line = place['page'], place['line']
                locations.setdefault(verse['key'], []).append([w['from'], w['to'], page])
                marker = '' if i < len(verse['words']) - 1 else verse.get('marker', '۝' + verse['key'].split(':')[1].translate(str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')))
                previous_end = verse['words'][i-1]['to'] if i else 0
                prefix = verse['text'][previous_end:w['from']].strip()
                text = (prefix + ' ' if prefix else '') + w['text'] + (' ' + marker if marker else '')
                pages[page].setdefault(line, []).append([verse['key'], w['from'], w['to'], text, width(text)])
    for p, rows in pages.items():
        content = [[line, 'text', words] for line, words in rows.items()]
        # Surah headers/basmala use ordinary text; decoration isn't selectable.
        for line, kind, surah in headers[p]:
            content.append([line, kind, surah])
        if riwayah == 'duri':
            # The native Duri opening begins with al-hamd, after an unnumbered basmala.
            if p == 1: content.append([2, 'basmala', 1])
        content.sort(key=lambda row: (row[0], row[1] == 'text'))
        write(ROOT / f'data/quran/word-pages/{riwayah}/{p}.json', content)
    for chapter in range(1, 115):
        write(ROOT / f'data/quran/word-pages/{riwayah}-locations/{chapter}.json', {key: value for key, value in locations.items() if key.startswith(f'{chapter}:')})

def catalog(name, folder, count):
    lines = [f'// Generated by scripts/prepare-reader-text.py; load only the visible {name}.', 'const load = [null,']
    lines += [f"  () => require('../data/quran/{folder}/{i}.json')," for i in range(1, count+1)]
    lines += ['];', 'module.exports = number => load[number]?.() || [];', '']
    output(ROOT / f'utils/{name}Catalog.js', '\n'.join(lines))

catalog('duriText', 'duri', 114)
catalog('hafsPage', 'word-pages/hafs', 604)
catalog('duriPage', 'word-pages/duri', 604)
catalog('hafsLocations', 'word-pages/hafs-locations', 114)
catalog('duriLocations', 'word-pages/duri-locations', 114)
write(ROOT / 'data/quran/duri-counts.json', [len(c) for c in duri])
print('Generated', sum(map(len, duri)), 'Duri ayahs and 1208 interactive pages; original text preserved.')
