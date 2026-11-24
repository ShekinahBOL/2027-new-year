"""一次性工具：從經文 docx 轉出 public/config/verses.json（用法：python3 -I tools/docx_to_json.py <docx> <out.json>）"""
import json, re, subprocess, sys
src, out = sys.argv[1], sys.argv[2]
text = subprocess.run(['pandoc', src, '-t', 'plain'], capture_output=True, text=True, check=True).stdout
verses = []
for line in text.splitlines():
    m = re.match(r'\s+(\S+?)\s?([0-9]+:[0-9a-z\-]+)\s+(.+)$', line)
    if not m:
        continue
    book, cv, body = m.groups()
    body = re.sub(r'\s*-\S+$', '', body).strip()
    verses.append({'id': len(verses) + 1, 'ref': f'{book} {cv}', 'text': body})
assert len(verses) == 96, len(verses)
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'version': 1, 'verses': verses}, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(len(verses), 'verses')
