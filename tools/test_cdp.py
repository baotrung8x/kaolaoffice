import socket, base64, os, struct, json, urllib.request, subprocess, time

def cdp_eval(expression):
    with urllib.request.urlopen('http://localhost:9222/json') as r:
        target = json.loads(r.read())[0]
    path = target['webSocketDebuggerUrl'].replace('ws://localhost:9222', '')
    
    s = socket.socket()
    s.connect(('localhost', 9222))
    key = base64.b64encode(os.urandom(16)).decode()
    req = (f"GET {path} HTTP/1.1\r\n"
           f"Host: localhost:9222\r\n"
           f"Upgrade: websocket\r\n"
           f"Connection: Upgrade\r\n"
           f"Sec-WebSocket-Key: {key}\r\n"
           f"Sec-WebSocket-Version: 13\r\n\r\n")
    s.sendall(req.encode())
    resp = s.recv(4096).decode()
    assert '101' in resp

    
    msg = json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expression, 'returnByValue': True}}).encode()
    header = bytearray([0x81])
    length = len(msg)
    if length < 126:
        header.append(0x80 | length)
    else:
        header.append(0x80 | 126)
        header.extend(struct.pack('>H', length))
    mask = os.urandom(4)
    header.extend(mask)
    masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(msg))
    s.sendall(header + masked)
    
    data = s.recv(16384)
    payload_len = data[1] & 0x7f
    offset = 2
    if payload_len == 126:
        payload_len = struct.unpack('>H', data[2:4])[0]
        offset = 4
    res_str = data[offset : offset + payload_len].decode('utf-8', errors='ignore')
    s.close()
    return json.loads(res_str)

proc = subprocess.Popen([r"c:\laragon\www\kaolaoffice\app\DesktopEditors.exe", '--remote-debugging-port=9222'])
time.sleep(4)

try:
    r1 = cdp_eval('window.KaolaAIWidgetLoaded')
    print('window.KaolaAIWidgetLoaded:', r1.get('result', {}).get('result', {}).get('value'))
    r2 = cdp_eval('!!document.getElementById("kaola-ai-widget-root")')
    print('has widget root:', r2.get('result', {}).get('result', {}).get('value'))
    r3 = cdp_eval('document.getElementById("kaola-ai-widget-root").shadowRoot.querySelector(".widget-btn").outerHTML')
    print('widget button HTML:', r3.get('result', {}).get('result', {}).get('value'))
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    subprocess.call(['powershell', '-Command', 'Get-Process *editor* -ErrorAction SilentlyContinue | Stop-Process -Force'])


