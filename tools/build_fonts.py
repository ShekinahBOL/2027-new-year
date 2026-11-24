"""產生字型子集（用法：python3 -I tools/build_fonts.py <fontsource files 目錄>）
- public/fonts/ui-600.woff2 / ui-900.woff2：介面上用到的宋體字
- public/fonts/v/NNN.woff2：每則經文只含自己的字（經文＋出處），抽到才載入
改了經文或介面文字後重跑一次。"""
import glob, io, json, os, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.merge import Merger

SRC = sys.argv[1]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')

def chunks(weight):
    files = sorted(glob.glob(os.path.join(SRC, f'noto-serif-tc-*-{weight}-normal.woff2')))
    out = []
    for f in files:
        t = TTFont(f)
        out.append((f, set(t.getBestCmap().keys())))
    return out

def build(chars, weight, chunk_list, dest):
    cps = {ord(c) for c in chars if not c.isspace()}
    tmp = []
    for path, cmap in chunk_list:
        need = cps & cmap
        if not need:
            continue
        f = TTFont(path)
        opts = subset.Options()
        opts.layout_features = ['*']
        opts.notdef_outline = True
        opts.name_IDs = ['*']
        s = subset.Subsetter(opts)
        s.populate(unicodes=need)
        s.subset(f)
        f.flavor = None
        buf = io.BytesIO(); f.save(buf); buf.seek(0)
        p = dest + f'.part{len(tmp)}.ttf'
        open(p, 'wb').write(buf.getvalue())
        tmp.append(p)
        cps -= need
    if cps:
        print('  missing glyphs:', ''.join(sorted(chr(c) for c in cps)))
    if len(tmp) == 1:
        font = TTFont(tmp[0])
    else:
        font = Merger().merge(tmp)
    font.flavor = 'woff2'
    font.save(dest)
    for p in tmp:
        os.remove(p)
    return os.path.getsize(dest)

def ui_text():
    txt = ''
    for rel in ['index.html', 'js/app.js', 'admin/index.html']:
        p = os.path.join(ROOT, rel)
        if os.path.exists(p):
            txt += open(p, encoding='utf-8').read()
    keep = ''.join(sorted(set(ch for ch in txt if ord(ch) > 0x2000)))
    return keep + '0123456789-:（）「」，。、 ' + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

c600, c900 = chunks(600), chunks(900)
os.makedirs(os.path.join(ROOT, 'fonts', 'v'), exist_ok=True)
print('ui-600', build(ui_text(), 600, c600, os.path.join(ROOT, 'fonts', 'ui-600.woff2')))
print('ui-900', build('進到水深之處2026-2027跨年禱告會控制台', 900, c900, os.path.join(ROOT, 'fonts', 'ui-900.woff2')))
verses = json.load(open(os.path.join(ROOT, 'config', 'verses.json'), encoding='utf-8'))['verses']
sizes = []
for v in verses:
    dest = os.path.join(ROOT, 'fonts', 'v', f"{v['id']:03d}.woff2")
    sizes.append(build(v['text'] + v['ref'] + '0123456789:-ab ', 600, c600, dest))
print('verse fonts: n=%d min=%d max=%d total=%d' % (len(sizes), min(sizes), max(sizes), sum(sizes)))
