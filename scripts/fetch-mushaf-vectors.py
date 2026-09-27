"""Fetch checksum-verified publisher page vectors, never reflow Quran text.

Cached inputs only; prepare-mushaf-vectors.py produces the bundled assets.
Source and usage terms: docs/QURAN_VECTOR_PAGES.md.
"""
import concurrent.futures
import hashlib
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION = 'b4155f07e4aea087d2c458069acff9f7c7e749f6'
CACHE = ROOT / '.local-backups/mushaf-vectors'
BASE = f'https://raw.githubusercontent.com/quran-ws/quran-svg/{REVISION}/'

def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Manarat-Mushaf/1.0'})
    return urllib.request.urlopen(request, timeout=60).read()

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    tree_path = CACHE / 'tree.json'
    if not tree_path.exists():
        tree_path.write_bytes(download(f'https://api.github.com/repos/quran-ws/quran-svg/git/trees/{REVISION}?recursive=1'))
    tree = json.loads(tree_path.read_text())
    assert tree['sha'] == REVISION and not tree.get('truncated')
    entries = {x['path']: x for x in tree['tree']}
    work = [(edition, page, f'mushafs/{source}/kfqc/svg/{page:03d}.svg')
            for edition, source in [('hafs', 'hafs'), ('duri', 'douri')] for page in range(1, 605)]

    def get(item):
        edition, page, path = item
        target = CACHE / edition / f'{page}.svg'
        target.parent.mkdir(parents=True, exist_ok=True)
        for attempt in range(4):
            try:
                data = target.read_bytes() if target.exists() else download(BASE + path)
                digest = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
                assert digest == entries[path]['sha'], f'Checksum mismatch: {path}'
                if not target.exists(): target.write_bytes(data)
                return len(data)
            except Exception:
                if attempt == 3: raise
                time.sleep(attempt + 1)

    total = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for count, size in enumerate(pool.map(get, work), 1):
            total += size
            if count % 100 == 0 or count == len(work):
                print(f'{count}/{len(work)} verified vector pages ({total / 1e6:.1f} MB source)', flush=True)
    for name in ['NOTICE.md', 'LICENSE', 'docs/FORMAT.md', 'docs/PROVENANCE.md']:
        (CACHE / name.split('/')[-1]).write_bytes(download(BASE + name))

if __name__ == '__main__': main()
