import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(BASE_DIR, "app", "index.html")

with open(INDEX_HTML, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Thay thế hàm a (hành động khi click nút AI trong menu)
old_a = 'a=r=>{Ue.available?me()?.restart===!0?(r.preventDefault(),ue("addon:action","askrestart")):me()?.compatible===!1&&(r.preventDefault(),ue("addon:action","incompatible")):(r.preventDefault(),ue("addon:action","intro"))}'
new_a = 'a=r=>{r.preventDefault(),window.KaolaAccount?.openPricing?.()}'

if old_a in text:
    text = text.replace(old_a, new_a, 1)
    print('[OK] Replaced action a with window.KaolaAccount.openPricing()')
elif new_a in text:
    print('[SKIP] action a already patched')
else:
    print('[FAIL] Cannot find action a pattern')

# 2. Bật hiển thị nút AI trên menu trái (when: true) và đổi label thành Kaola AI
old_ai = 'O(r,m(j,{get when(){return!1},get children(){return m(ut,{href:"/aitools",onClick:a,icon:"#aitools",get label(){return D("actAiTools","AI Tools")}})}}),s)'
new_ai = 'O(r,m(j,{get when(){return!0},get children(){return m(ut,{href:"/aitools",onClick:a,icon:"#aitools",get label(){return D("actAiTools","Kaola AI")}})}}),s)'

if old_ai in text:
    text = text.replace(old_ai, new_ai, 1)
    print('[OK] Enabled AI menu item (when: !0, label: Kaola AI)')
elif new_ai in text:
    print('[SKIP] AI menu item already enabled')
else:
    print('[FAIL] Cannot find old_ai pattern in index.html')

with open(INDEX_HTML, 'w', encoding='utf-8') as f:
    f.write(text)

print('[DONE] Completed patching AI menu item.')
