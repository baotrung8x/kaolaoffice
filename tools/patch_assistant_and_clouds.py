import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(BASE_DIR, "app", "index.html")

with open(INDEX_HTML, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Chèn KAOLA_ASSISTANT_MODULE nếu chưa có
if 'kaola_assistant.js' not in c:
    old_mod = '<!-- KAOLA_ADS_MODULE -->\n    <link rel="stylesheet" href="kaola_ads.css">\n    <script src="kaola_ads.js"></script>'
    new_mod = old_mod + '\n  <!-- KAOLA_ASSISTANT_MODULE -->\n    <link rel="stylesheet" href="kaola_assistant.css">\n    <script src="kaola_assistant.js"></script>'
    if old_mod in c:
        c = c.replace(old_mod, new_mod, 1)
        print('[OK] Injected kaola_assistant into index.html head')
    else:
        print('[WARN] Cannot find exact KAOLA_ADS_MODULE block, searching flexible')
        idx = c.find('</head>')
        if idx > 0:
            inject = '  <!-- KAOLA_ASSISTANT_MODULE -->\n    <link rel="stylesheet" href="kaola_assistant.css">\n    <script src="kaola_assistant.js"></script>\n  '
            c = c[:idx] + inject + c[idx:]
            print('[OK] Injected kaola_assistant before </head>')
else:
    print('[SKIP] kaola_assistant already in index.html head')

# 2. Patch kết nối trực tiếp Kaola Drive không qua popup PO
old_conn = 'children:u=>m(FO,{provider:u,onConnect:t})'
new_conn = 'children:u=>m(FO,{provider:u,onConnect:p=>p?.provider==="onlyoffice"?as(p,"https://drive.kaola.vn"):t(p)})'
if old_conn in c:
    c = c.replace(old_conn, new_conn, 1)
    print('[OK] Patched direct Kaola Drive connection in index.html')
elif new_conn in c:
    print('[SKIP] Direct Kaola Drive connection already patched')
else:
    print('[FAIL] Cannot find connection string in index.html')

with open(INDEX_HTML, 'w', encoding='utf-8') as f:
    f.write(c)

print('[DONE] Index.html update completed successfully.')
