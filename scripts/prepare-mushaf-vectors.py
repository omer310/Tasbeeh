"""Package verified SVG artwork separately from small ayah navigation metadata.

No word shaping, letter replacement, or inferred word boxes. The archive is an
ordinary offline Expo asset; only the current/adjacent pages are decoded at run time.
"""
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.local-backups/mushaf-vectors'
REVISION = 'b4155f07e4aea087d2c458069acff9f7c7e749f6'
SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

def reference(edition, key):
    # The printed Basri Al-Mulk has 31 ayahs. The Unicode Duri source has 30:
    # printed 9 (through "nadhir") and 10 (from "fakadhdhabna") form text ayah 9.
    # Keep both publisher regions, selecting/playing the complete shared passage.
    c, a = map(int, key.split(':'))
    if edition == 'duri' and c == 67 and a >= 10: a -= 1
    return f'{c}:{a}'

def main():
    tree = json.loads((CACHE / 'tree.json').read_text())
    assert tree['sha'] == REVISION
    entries = {x['path']: x for x in tree['tree']}
    manifest = {'repository': 'https://github.com/quran-ws/quran-svg', 'revision': REVISION, 'editions': {}}
    total = 0
    for edition, source in [('hafs', 'hafs'), ('duri', 'douri')]:
        index, signatures, counts = {}, [], set()
        for page in range(1, 605):
            raw = (CACHE / edition / f'{page}.svg').read_bytes()
            path = f'mushafs/{source}/kfqc/svg/{page:03d}.svg'
            assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == entries[path]['sha']
            root = ET.fromstring(raw)
            regions = []
            for element in list(root):
                if element.get('class') != 'ayahPolygon': continue
                key = f"{element.get('surah')}:{element.get('ayah')}"
                assert re.fullmatch(r'\d+:\d+', key), (edition, page, element.attrib)
                d = element.get('d')
                if not d:
                    points = re.findall(r'-?\d+(?:\.\d+)?', element.get('points', ''))
                    d = 'M ' + ' L '.join(' '.join(points[i:i+2]) for i in range(0, len(points), 2)) + ' Z'
                assert d and not re.search(r'[^MLZmlz\d\s.,+-]', d), (edition, page, d)
                reader_key = reference(edition, key)
                regions.append([key, reader_key, d])
                counts.add(reader_key)
                pages = index.setdefault(reader_key, [])
                if page not in pages: pages.append(page)
                root.remove(element)
            assert regions, (edition, page)
            view_box = list(map(float, root.get('viewBox').split()))
            if page <= 2:
                # Opening-page viewBoxes contain large margins. These bounds are
                # the measured union of the published artwork and its hit layer.
                # Preserve every path/transform; change the viewport only.
                view_box = [-2, -74, 242, 308]
                root.set('viewBox', ' '.join(map(str, view_box)))
            # React Native SvgXml does not apply stylesheet classes. Inline the
            # two opening-page styles, including their even-odd fill rules.
            styles = {}
            for element in list(root):
                if element.tag != f'{{{SVG}}}style': continue
                for name, declarations in re.findall(r'\.([\w-]+)\s*\{([^}]+)\}', element.text or ''):
                    styles[name] = dict(pair.strip().split(':', 1) for pair in declarations.split(';') if ':' in pair)
                root.remove(element)
            for element in root.iter():
                for name in element.get('class', '').split():
                    for key, value in styles.get(name, {}).items(): element.set(key.strip(), value.strip())
            # SVGs are monochrome ink; preserve white cut-outs and make only
            # non-white ink inherit the app's theme. No geometry is changed.
            for element in root.iter():
                if 'fill' in element.attrib and element.get('fill').lower() not in ['none', 'white', '#fff', '#ffffff']:
                    element.set('fill', 'currentColor')
            root.set('fill', 'currentColor')
            xml = ET.tostring(root, encoding='utf-8')
            asset = ROOT / f'assets/quran-vectors/{edition}/{page}.zip'
            asset.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(asset, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                info = zipfile.ZipInfo('page.svg', date_time=(2026, 9, 19, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, xml, compresslevel=9)
            total += asset.stat().st_size
            signatures.append(hashlib.sha256(asset.read_bytes()).hexdigest())
            write(ROOT / f'data/quran/printed-pages/{edition}/{page}.json', {'viewBox': view_box, 'regions': regions})
        expected = 6236 if edition == 'hafs' else 6217
        assert len(counts) == expected, (edition, len(counts), expected)
        write(ROOT / f'data/quran/printed-pages/{edition}-index.json', index)
        manifest['editions'][edition] = {'pages': 604, 'readerAyahs': expected, 'assetSha256': signatures}
    # Write static catalog imports only after every referenced asset exists.
    for kind, folder, suffix in [('Metadata', 'data/quran/printed-pages', 'json'), ('Asset', 'assets/quran-vectors', 'zip')]:
        lines = ['// Generated by scripts/prepare-mushaf-vectors.py.', 'const editions = {']
        for edition in ['hafs', 'duri']:
            lines += [f'  {edition}: [null,'] + [f"    () => require('../{folder}/{edition}/{page}.{suffix}')," for page in range(1, 605)] + ['  ],']
        lines += ['};', "module.exports = (page, edition) => editions[edition === 'duri' ? 'duri' : 'hafs'][page]();", '']
        (ROOT / f'utils/mushaf{kind}Catalog.js').write_text('\n'.join(lines), encoding='utf-8')
    write(ROOT / 'data/quran/printed-pages/manifest.json', manifest)
    print(f'Packaged 1,208 offline vector pages ({total / 1e6:.1f} MB) with exact ayah regions.')

if __name__ == '__main__': main()
