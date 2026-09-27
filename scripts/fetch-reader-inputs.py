"""Fetch pinned public Quran text/layout inputs for prepare-reader-text.py."""
import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.local-backups/quran-scripts'
CACHE.mkdir(parents=True, exist_ok=True)
META = 'a5dd4a46dc6f7830a4303e89c3b4b3a15a213ac9'
LAYOUT = '72116ce4d405d67823804f0eed795c1e6409b4af'
def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0', 'Referer':'https://qul.tarteel.ai/'})
    return urllib.request.urlopen(request, timeout=90).read()

data = fetch(f'https://raw.githubusercontent.com/quran-center/quran-meta/{META}/examples/data-check/data/DouriData_v2-0.json')
assert hashlib.sha256(data).hexdigest() == '3ebae16badd0b1a20e6da0952557e234abb97041d752706245d0660fa48e5f51'
(CACHE / 'DouriData.json').write_bytes(data)
font = fetch('https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/qpc/uthmanic-douri-v20.ttf')
assert hashlib.sha256(font).hexdigest() == '3a862f8e4ba9b7fd024e2b74981026eb5a901cb292e2b43766795112a35a6b45'
(CACHE / 'duri.ttf').write_bytes(font)
archive = zipfile.ZipFile(io.BytesIO(fetch(f'https://codeload.github.com/zonetecde/mushaf-layout/zip/{LAYOUT}')))
dest = ROOT / '.local-backups/quran-layout/mushaf'
dest.mkdir(parents=True, exist_ok=True)
for page in range(1,605):
    name = f'page-{page:03d}.json'
    # Extract only the exact expected page files, with no archive path traversal.
    data = archive.read(f'mushaf-layout-{LAYOUT}/mushaf/{name}')
    assert json.loads(data)['page'] == page
    (dest / name).write_bytes(data)
print('Fetched the pinned Duri text, unmodified font and 604 page/line inputs.')
