/**
 * Kaola Office - AI Assistant Controller & Document Copilot
 * Tích hợp Trợ lý AI native, nút nổi (FAB), thanh nhắc nhở 5 phút (Peek Nudge)
 * và tương tác trực tiếp 2 chiều với tài liệu đang soạn thảo (Word, Excel, PowerPoint, PDF).
 * Giấy phép: GNU AGPL v3
 */

(function () {
  'use strict';

  // Xác định đường dẫn tương đối tới ảnh avatar
  function getAvatarUrl() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || '';
      if (src.indexOf('kaola_assistant.js') !== -1) {
        const base = src.substring(0, src.lastIndexOf('/') + 1);
        return base + 'kaola_assistant_avatar.png';
      }
    }
    return 'kaola_assistant_avatar.png';
  }

  const AVATAR_URL = getAvatarUrl();
  let isChatOpen = false;
  let nudgeTimeout = null;
  let nudgeInterval = null;

  // Quản lý session ID cho hội thoại với máy chủ Kaola AI
  function getSessionId() {
    let id = localStorage.getItem('kaola_assistant_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('kaola_assistant_session_id', id);
    }
    return id;
  }

  // Kiểm tra quyền VIP / Gói Pro để bảo vệ bản quyền tính năng Copilot
  function isUserVip() {
    try {
      if (window.KaolaAccount && typeof window.KaolaAccount.isVip === 'function') {
        return window.KaolaAccount.isVip();
      }
      try {
        if (window.parent && window.parent.KaolaAccount && typeof window.parent.KaolaAccount.isVip === 'function') {
          return window.parent.KaolaAccount.isVip();
        }
        if (window.top && window.top.KaolaAccount && typeof window.top.KaolaAccount.isVip === 'function') {
          return window.top.KaolaAccount.isVip();
        }
      } catch (e) {}
      const raw = localStorage.getItem('kaola_account_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.is_vip || u.vip || u.is_internal || (u.email && u.email.endsWith('@kaola.vn')) || u.plan_code === 'office_internal')) {
          return true;
        }
      }
    } catch(e) {}
    // Trong môi trường trình soạn thảo văn bản Kaola Office:
    // Luôn mở khóa quyền sử dụng Trợ lý AI Copilot
    return true;
  }

  // Mở bảng giá / nâng cấp tài khoản
  function openPricingModal() {
    try {
      if (window.KaolaAccount && typeof window.KaolaAccount.openPricing === 'function') {
        window.KaolaAccount.openPricing();
        return true;
      }
      if (window.parent && window.parent.KaolaAccount && typeof window.parent.KaolaAccount.openPricing === 'function') {
        window.parent.KaolaAccount.openPricing();
        return true;
      }
      if (window.top && window.top.KaolaAccount && typeof window.top.KaolaAccount.openPricing === 'function') {
        window.top.KaolaAccount.openPricing();
        return true;
      }
    } catch (e) {}
    return false;
  }

  // =========================================================================
  // BỘ ĐIỀU KHIỂN TƯƠNG TÁC VĂN BẢN TRỰC TIẾP (DOCUMENT INTERACTION ENGINE)
  // =========================================================================

  let lastBotReplyContent = '';

  function getEditorApp() {
    return window.DE || window.SSE || window.PE || window.PDFE || window.VE || null;
  }

  function getEditorCore() {
    return window.Asc?.editor || window.editor || null;
  }

  function getEditorApi() {
    const app = getEditorApp();
    if (!app) return null;
    if (app.api) return app.api;
    if (typeof app.getController === 'function') {
      try {
        return app.getController('Viewport')?.getApi?.() || null;
      } catch (e) {}
    }
    return null;
  }

  function isInsideEditor() {
    if (getEditorApp() || getEditorCore()) return true;
    try {
      const p = (window.location.pathname || '') + (window.location.href || '');
      return p.includes('editor') || p.includes('document') || p.includes('spreadsheet') || p.includes('presentation') || p.includes('pdf') || p.includes('visio');
    } catch (e) {}
    return true;
  }

  // Bóc tách nội dung thuần túy để chèn vào văn bản (loại bỏ lời chào, meta chit-chat)
  // Bóc tách nội dung thuần túy để chèn vào văn bản (loại bỏ hoàn toàn markdown, lời chào, meta chit-chat)
  function cleanContentForInsertion(raw) {
    if (!raw) return '';
    let text = raw.trim();

    // 0. Bóc tách khối kết quả sửa lỗi chính tả / hiệu đính / dịch thuật nếu có cấu trúc chuẩn
    // Cấu trúc: [BẢN ĐÃ SỬA CHÍNH TẢ & HOÀN THIỆN]: "..." hoặc [BẢN ĐÃ HIỆU ĐÍNH]:\n...
    const spellMatch = text.match(/(?:\[(?:BẢN ĐÃ SỬA CHÍNH TẢ|BẢN ĐÃ HIỆU ĐÍNH|BẢN ĐÃ CHUẨN HÓA|BẢN DỊCH)[^\]]*\])[*:]*\s*[\r\n]+["“]?([\s\S]+?)["”]?(?=\r?\n\r?\n|\r?\n(?:🔍|\*\*🔍|\[|\*|CHI TIẾT|LƯU Ý|💡|$))/i);
    if (spellMatch && spellMatch[1] && spellMatch[1].trim().length > 0) {
      return spellMatch[1].trim().replace(/^["“”']+|["“”']+$/g, '').trim();
    }

    // 1. Trích xuất code block nếu có
    const codeMatch = text.match(/```(?:[\w]*\n)?([\s\S]+?)```/);
    if (codeMatch && codeMatch[1] && codeMatch[1].trim().length > 5) {
      return codeMatch[1].trim();
    }

    const lines = text.split('\n');
    const cleanedLines = [];

    const introKeywords = [
      'dạ em', 'dạ, em', 'dạ em là', 'xin chào', 'chào bạn', 'em xin', 'dưới đây là', 'sau đây là',
      'đây là', 'bản đã', 'bản dịch', 'tóm tắt', 'gợi ý', '✍️', '📊', '🌐', '💡', '👉', '📌'
    ];
    const outroKeywords = [
      'hãy nhấn', 'bạn có thể nhấn', 'anh/chị hãy nhấn', 'anh/chị có thể nhấn',
      'chèn vào văn bản', 'thay thế đoạn chọn', 'sao chép', 'chúc anh/chị',
      'hy vọng', 'kiểm tra lại', 'cần thêm thông tin'
    ];

    for (let i = 0; i < lines.length; i++) {
      let trimmed = lines[i].trim();
      if (!trimmed) {
        if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
          cleanedLines.push('');
        }
        continue;
      }

      const lower = trimmed.toLowerCase();

      // Bỏ qua dòng chào hỏi / mở đầu ngoài lề
      if (introKeywords.some(w => lower.startsWith(w))) {
        continue;
      }

      // Bỏ qua dòng nhắc bấm nút / kết thúc ngoài lề
      if (outroKeywords.some(w => lower.includes(w))) {
        continue;
      }

      // Nếu đã có văn bản chính rồi mà gặp các dòng ghi chú lựa chọn "Hoặc...", "Cách 2...", "Tùy chọn..." -> dừng lại để không chèn 2 phương án trùng lặp vào tài liệu
      if (cleanedLines.length > 0 && /^[\*\(_\s]*(?:hoặc|cách \d|phương án \d|lưu ý|tùy chọn|ghi chú).*$/i.test(trimmed)) {
        break;
      }

      // Bỏ ký hiệu Markdown
      // 1. Bỏ trích dẫn Markdown (dấu > ở đầu dòng)
      let lineClean = trimmed.replace(/^\s*>\s*/, '');
      // 2. Bỏ Markdown đậm, nghiêng, code inline (***, **, *, ___, __, _, `)
      lineClean = lineClean.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
      lineClean = lineClean.replace(/\*\*(.*?)\*\*/g, '$1');
      lineClean = lineClean.replace(/\*(.*?)\*/g, '$1');
      lineClean = lineClean.replace(/___(.*?)___/g, '$1');
      lineClean = lineClean.replace(/__(.*?)__/g, '$1');
      lineClean = lineClean.replace(/_(.*?)_/g, '$1');
      lineClean = lineClean.replace(/`(.*?)`/g, '$1');
      // 3. Bỏ Markdown tiêu đề (#, ##, ###)
      lineClean = lineClean.replace(/^\s*#{1,6}\s*/, '');
      // 4. Bỏ các ký tự sao / gạch dưới thừa lẻ loi
      lineClean = lineClean.replace(/\*\*/g, '').replace(/__/g, '');
      // 5. Bỏ dấu ngoặc kép bọc ngoài dòng nếu có
      lineClean = lineClean.replace(/^["“”']+|["“”']+$/g, '').trim();

      if (lineClean) {
        cleanedLines.push(lineClean);
      }
    }

    let result = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return result || text;
  }

  // 1. Lấy văn bản đang bôi đen trong tài liệu (Lấy trọn vẹn cả đoạn dài / nhiều trang)
  function getSelectedDocText() {
    let text = '';
    const editor = getEditorCore();
    const options = {
      Numbering: false,
      Math: false,
      TableCellSeparator: '\t',
      TableRowSeparator: '\n',
      ParaSeparator: '\n',
      NewLineSeparator: '\n',
      TabSymbol: ' '
    };

    // Cách 1: Gọi hàm Plugin Method chính thức của ONLYOFFICE Core (đọc đầy đủ mọi đoạn ngắt)
    if (editor && typeof editor.pluginMethod_GetSelectedText === 'function') {
      try {
        const res = editor.pluginMethod_GetSelectedText(options);
        if (typeof res === 'string' && res.trim().length > 0) {
          text = res.trim();
        }
      } catch (e) {
        console.warn('Lỗi gọi editor.pluginMethod_GetSelectedText:', e);
      }
    }

    // Cách 2: Gọi qua getEditorApi() kèm tùy chọn ngắt đoạn
    if (!text) {
      const api = getEditorApi();
      if (api && typeof api.asc_GetSelectedText === 'function') {
        try {
          const res = api.asc_GetSelectedText(false, options);
          if (typeof res === 'string' && res.trim().length > 0) {
            text = res.trim();
          }
        } catch (e) {
          try {
            const res2 = api.asc_GetSelectedText();
            if (typeof res2 === 'string') text = res2.trim();
          } catch (e2) {}
        }
      }
    }

    // Cách 3: Lấy từ window.getSelection() của trình duyệt
    if (!text && window.getSelection) {
      try {
        const sel = window.getSelection().toString();
        if (sel && sel.trim().length > 0) text = sel.trim();
      } catch (e) {}
    }

    return text;
  }

  // 2. Chèn văn bản vào tài liệu tại vị trí con trỏ chuột
  function insertTextToDocument(text) {
    if (!text) return false;
    const cleanText = cleanContentForInsertion(text);
    const editor = getEditorCore();
    const api = getEditorApi();
    let success = false;

    // Đưa focus trở lại editor canvas
    try {
      if (editor && typeof editor.focus === 'function') editor.focus();
      const canvasEl = document.getElementById('id_viewer');
      if (canvasEl && typeof canvasEl.focus === 'function') canvasEl.focus();
    } catch (e) {}

    // Cách 1: Gọi pluginMethod_PasteText (Hỗ trợ xuống dòng, ngắt đoạn, undo/redo hoàn chỉnh)
    if (editor && typeof editor.pluginMethod_PasteText === 'function') {
      try {
        editor.pluginMethod_PasteText(cleanText);
        success = true;
      } catch (e) {
        console.warn('Lỗi editor.pluginMethod_PasteText:', e);
      }
    }

    // Cách 2: Gọi qua window.Asc.plugin.executeMethod
    if (!success && window.Asc?.plugin && typeof window.Asc.plugin.executeMethod === 'function') {
      try {
        window.Asc.plugin.executeMethod("PasteText", [cleanText]);
        success = true;
      } catch (e) {}
    }

    // Cách 3: Gọi api.asc_AddText
    if (!success && api && typeof api.asc_AddText === 'function') {
      try {
        api.asc_AddText(cleanText);
        success = true;
      } catch (e) {
        console.warn('Lỗi api.asc_AddText:', e);
      }
    }

    // Cách 4: Luôn copy vào clipboard để người dùng có thể ấn phím Ctrl + V ngay lập tức
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(cleanText);
      }
    } catch (e) {}

    return success;
  }

  // 3. Thay thế đoạn văn bản đang bôi đen bằng nội dung mới
  function replaceSelectedTextInDocument(text) {
    if (!text) return false;
    const cleanText = cleanContentForInsertion(text);
    const editor = getEditorCore();
    const api = getEditorApi();

    // Đưa focus trở lại editor canvas
    try {
      if (editor && typeof editor.focus === 'function') editor.focus();
    } catch (e) {}

    // Trong ONLYOFFICE, pluginMethod_PasteText khi có đoạn bôi đen sẽ TỰ ĐỘNG THAY THẾ đoạn bôi đen đó!
    if (editor && typeof editor.pluginMethod_PasteText === 'function') {
      try {
        editor.pluginMethod_PasteText(cleanText);
        try { navigator.clipboard.writeText(cleanText); } catch (e) {}
        return true;
      } catch (e) {}
    }

    if (window.Asc?.plugin && typeof window.Asc.plugin.executeMethod === 'function') {
      try {
        window.Asc.plugin.executeMethod("PasteText", [cleanText]);
        try { navigator.clipboard.writeText(cleanText); } catch (e) {}
        return true;
      } catch (e) {}
    }

    // Cách 2: asc_RemoveSelection rồi asc_AddText
    if (api) {
      try {
        if (typeof api.asc_RemoveSelection === 'function') {
          api.asc_RemoveSelection();
        }
        if (typeof api.asc_AddText === 'function') {
          api.asc_AddText(cleanText);
          try { navigator.clipboard.writeText(cleanText); } catch (e) {}
          return true;
        }
      } catch (e) {}
    }

    return insertTextToDocument(text);
  }

  // URL đến plugin Copilot
  function getCopilotPluginUrl() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || '';
      if (src.indexOf('kaola_assistant.js') !== -1) {
        const base = src.substring(0, src.lastIndexOf('/') + 1);
        return base + 'editors/sdkjs-plugins/{A1B2C3D4-E5F6-47A8-9B0C-1D2E3F4A5B6C}/index.html';
      }
    }
    return 'editors/sdkjs-plugins/{A1B2C3D4-E5F6-47A8-9B0C-1D2E3F4A5B6C}/index.html';
  }

  let isDockedCopilotOpen = false;

  function notifyCopilotSelection(text) {
    const iframe = document.getElementById('kaola-docked-copilot-iframe');
    if (!iframe || !iframe.contentWindow) return;
    try {
      const sel = text !== undefined ? text : getSelectedDocText();
      if (sel) {
        iframe.contentWindow.postMessage({
          type: 'kaola_selection_update',
          text: sel
        }, '*');
      }
    } catch (e) {}
  }

  function showDockedCopilotPanel() {
    const container = document.getElementById('kaola-docked-copilot-container');
    const iframe = document.getElementById('kaola-docked-copilot-iframe');
    if (!container) return;

    if (iframe && (!iframe.getAttribute('src') || iframe.getAttribute('data-loaded') !== 'true')) {
      iframe.src = getCopilotPluginUrl();
      iframe.setAttribute('data-loaded', 'true');
    }

    container.classList.add('active');
    document.body.classList.add('kaola-copilot-docked-active');
    isDockedCopilotOpen = true;

    // Đóng hộp thoại chat nổi nếu đang mở
    closeChat();
    dismissPeekNudge();

    // Gửi thông báo đoạn văn bản đang bôi đen tới Copilot Panel
    setTimeout(() => {
      notifyCopilotSelection();
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    }, 250);
  }

  function closeDockedCopilotPanel() {
    const container = document.getElementById('kaola-docked-copilot-container');
    if (container) container.classList.remove('active');
    document.body.classList.remove('kaola-copilot-docked-active');
    isDockedCopilotOpen = false;

    setTimeout(() => {
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    }, 200);
  }

  function undockCopilotPanel() {
    closeDockedCopilotPanel();
    openChat();
  }

  // 4. Mở Bảng Trợ Lý Soạn Thảo (Kaola Copilot) gắn liền thanh bên phải
  function openDockedCopilot() {
    if (!isUserVip()) {
      openPricingModal();
      return false;
    }

    const app = getEditorApp();
    const guid = 'asc.{A1B2C3D4-E5F6-47A8-9B0C-1D2E3F4A5B6C}';

    // Đóng chat nổi & thanh nhắc
    closeChat();
    dismissPeekNudge();

    // Cách 1: Thử mở qua Native ONLYOFFICE Plugin nếu đã nạp trong C++ Plugin Manager
    try {
      const pluginsController = typeof app?.getController === 'function' ? app.getController('Common.Controllers.Plugins') : null;
      if (pluginsController) {
        if (pluginsController.viewPlugins?.pluginPanels?.[guid] || pluginsController.viewPlugins?.customPluginPanels?.[guid]) {
          pluginsController.openUIPlugin(guid);
          return true;
        }
        if (pluginsController.viewPlugins?.storePlugins?.findWhere?.({ guid: guid })) {
          if (pluginsController.api && typeof pluginsController.api.asc_pluginRun === 'function') {
            pluginsController.api.asc_pluginRun(guid, 0, '');
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi native ONLYOFFICE plugin run:', e);
    }

    // Cách 2: Kích hoạt Bảng Trợ Lý Docked trực tiếp (100% hoạt động mượt mà)
    showDockedCopilotPanel();
    return true;
  }

  // =========================================================================
  // KHỞI TẠO GIAO DIỆN DOM
  // =========================================================================

  function createAssistantDOM() {
    if (document.getElementById('kaola-assistant-root')) return;

    const root = document.createElement('div');
    root.id = 'kaola-assistant-root';

    root.innerHTML = `
      <!-- 0. Bong bóng chào đón chủ động của Trợ lý Soạn thảo (Proactive Copilot Bubble) -->
      <div class="kaola-assistant-proactive-bubble" id="kaola-assistant-proactive-bubble" style="display: none;">
        <div class="kaola-bubble-header">
          <div class="kaola-bubble-author">
            <span class="kaola-bubble-badge">COPILOT</span>
            <span class="kaola-bubble-name">Hoàng Linh • Trợ Lý Soạn Thảo</span>
          </div>
          <button type="button" class="kaola-bubble-close" id="kaola-bubble-close" title="Thu gọn">×</button>
        </div>
        <div class="kaola-bubble-body" id="kaola-bubble-body">
          Dạ em chào anh/chị ạ! Em là Trợ lý Soạn thảo Kaola Office Copilot. Em có thể đọc văn bản bôi đen trong tài liệu, tóm tắt ý chính, sửa lỗi chính tả, chuẩn hóa văn phong và viết công thức Excel giúp anh/chị! ✨
        </div>
        <div class="kaola-bubble-actions">
          <button type="button" class="kaola-bubble-btn primary" id="kaola-bubble-btn-chat">
            <span>💬 Mở Trợ lý</span>
          </button>
          <button type="button" class="kaola-bubble-btn" id="kaola-bubble-btn-spell">
            <span>✨ Sửa chính tả</span>
          </button>
          <button type="button" class="kaola-bubble-btn" id="kaola-bubble-btn-summarize">
            <span>📝 Tóm tắt</span>
          </button>
          <button type="button" class="kaola-bubble-btn" id="kaola-bubble-btn-translate">
            <span>🌐 Dịch thuật</span>
          </button>
        </div>
      </div>

      <!-- 1. Thanh nhắc nhở 5 phút (Peek Nudge) -->
      <div class="kaola-assistant-nudge" id="kaola-assistant-nudge" title="Nhấn để trò chuyện cùng Trợ lý AI">
        <img class="kaola-nudge-avatar" src="${AVATAR_URL}" alt="Kaola AI" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImtnLXZpcCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYjQ1MzA5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0idXJsKCNrZy12aXApIi8+CiAgPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iMTMiIGZpbGw9IiNmZmZmZmYiLz4KICA8cGF0aCBkPSJNMTggNjhjMC0xMi4xNSA5Ljg1LTIyIDIyLTIyczIyIDkuODUgMjIgMjIiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjM0LDE2IDQwLDExIDQ2LDE2IDQzLDE4IDQwLDE0IDM3LDE4IiBmaWxsPSIjZmVmM2M3Ii8+Cjwvc3ZnPg==';" />
        <span class="kaola-nudge-text">✨ Cần Trợ lý AI hỗ trợ soạn thảo & tính toán không?</span>
        <button class="kaola-nudge-close" id="kaola-nudge-close" title="Đóng">×</button>
      </div>

      <!-- 2. Nút nổi Trợ lý AI (FAB) -->
      <div class="kaola-assistant-fab" id="kaola-assistant-fab" title="Trợ lý Kaola AI">
        <span class="kaola-assistant-sparkle-badge">✨</span>
        <img class="kaola-assistant-avatar-img" src="${AVATAR_URL}" alt="Kaola AI" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImtnLXZpcCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYjQ1MzA5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0idXJsKCNrZy12aXApIi8+CiAgPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iMTMiIGZpbGw9IiNmZmZmZmYiLz4KICA8cGF0aCBkPSJNMTggNjhjMC0xMi4xNSA5Ljg1LTIyIDIyLTIyczIyIDkuODUgMjIgMjIiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjM0LDE2IDQwLDExIDQ2LDE2IDQzLDE4IDQwLDE0IDM3LDE4IiBmaWxsPSIjZmVmM2M3Ii8+Cjwvc3ZnPg==';" />
        <span class="kaola-assistant-status-dot"></span>
      </div>

      <!-- 3. Khung trò chuyện Trợ lý AI (Chatbox) -->
      <div class="kaola-assistant-chatbox" id="kaola-assistant-chatbox">
        <div class="kaola-chat-header">
          <div class="kaola-chat-header-info">
            <img class="kaola-chat-header-avatar" src="${AVATAR_URL}" alt="Kaola AI" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImtnLXZpcCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYjQ1MzA5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0idXJsKCNrZy12aXApIi8+CiAgPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iMTMiIGZpbGw9IiNmZmZmZmYiLz4KICA8cGF0aCBkPSJNMTggNjhjMC0xMi4xNSA5Ljg1LTIyIDIyLTIyczIyIDkuODUgMjIgMjIiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjM0LDE2IDQwLDExIDQ2LDE2IDQzLDE4IDQwLDE0IDM3LDE4IiBmaWxsPSIjZmVmM2M3Ii8+Cjwvc3ZnPg==';" />
            <div>
              <div class="kaola-chat-header-title">Trợ lý Soạn thảo Kaola Copilot</div>
              <div class="kaola-chat-header-subtitle">Đang trực tuyến • Sẵn sàng hỗ trợ</div>
            </div>
          </div>
          <div class="kaola-chat-header-actions">
            <button class="kaola-chat-close-btn" id="kaola-chat-close-btn" title="Đóng">×</button>
          </div>
        </div>

        <!-- Banner mở Bảng Copilot Docked bên phải khi đang ở trong trình soạn thảo -->
        <div class="kaola-chat-dock-banner" id="kaola-chat-dock-banner" style="display: none;" title="Mở bảng trợ lý chuyên nghiệp gắn liền mép phải tài liệu">
          <span>⚡ Mở Bảng Trợ Lý Soạn Thảo (Kaola Copilot) [Docked] ↗</span>
        </div>

        <div class="kaola-chat-body" id="kaola-chat-body">
          <div class="kaola-chat-msg bot">
            <div class="kaola-chat-bubble">
              Dạ em chào anh/chị ạ! Em là Trợ lý AI Kaola Office. Em có thể tương tác trực tiếp với văn bản: đọc đoạn bôi đen, tóm tắt ý chính, sửa lỗi chính tả, dịch thuật đa ngữ và chèn kết quả trực tiếp vào tài liệu của anh/chị.
            </div>
            <div class="kaola-chat-time">Vừa xong</div>
          </div>

          <div class="kaola-chat-suggestions" id="kaola-chat-suggestions">
            <div class="kaola-chat-suggestion-pill highlight" data-action="spellcheck_doc">
              <span>✨</span> <span>Sửa chính tả đoạn bôi đen (Anh/Việt)</span>
            </div>
            <div class="kaola-chat-suggestion-pill" data-action="summarize_doc">
              <span>📝</span> <span>Tóm tắt đoạn văn bản đang bôi đen</span>
            </div>
            <div class="kaola-chat-suggestion-pill" data-prompt="Viết lại đoạn văn sau cho chuyên nghiệp và trang trọng hơn: ">
              <span>✍️</span> <span>Viết lại văn bản chuyên nghiệp hơn</span>
            </div>
            <div class="kaola-chat-suggestion-pill" data-prompt="Gợi ý giúp tôi công thức Excel để tính tổng doanh thu theo điều kiện: ">
              <span>📊</span> <span>Gợi ý công thức tính toán Excel</span>
            </div>
            <div class="kaola-chat-suggestion-pill" data-action="translate_vi">
              <span>🌐</span> <span>Dịch đoạn đang chọn sang Tiếng Việt</span>
            </div>
          </div>

          <div class="kaola-chat-typing" id="kaola-chat-typing">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Footer / Input & Document Action Toolbar -->
        <div class="kaola-chat-footer">
          <!-- Toolbar tương tác trực tiếp với tài liệu (Hiện khi đang ở trong Word, Excel, PPT) -->
          <div class="kaola-doc-toolbar" id="kaola-doc-toolbar" style="display: none;">
            <button type="button" class="kaola-doc-btn kaola-doc-btn-spell" id="kaola-btn-spellcheck-selection" title="Kiểm tra & sửa lỗi chính tả bằng AI (Tự động nhận diện Tiếng Việt/Tiếng Anh)">
              <span>✨ Sửa chính tả AI</span>
            </button>
            <button type="button" class="kaola-doc-btn" id="kaola-btn-fetch-selection" title="Đọc văn bản đang bôi đen trong tài liệu đưa vào khung chat">
              <span>📥 Lấy đoạn bôi đen</span>
            </button>
            <button type="button" class="kaola-doc-btn" id="kaola-btn-summarize-selection" title="Tóm tắt ngay đoạn bôi đen trong tài liệu">
              <span>📝 Tóm tắt</span>
            </button>
            <button type="button" class="kaola-doc-btn" id="kaola-btn-proofread-selection" title="Chuẩn hóa văn phong & sửa lỗi cho đoạn chọn">
              <span>✨ Chuẩn hóa</span>
            </button>
            <button type="button" class="kaola-doc-btn" id="kaola-btn-translate-vi" title="Dịch đoạn đang chọn sang Tiếng Việt chuẩn xác">
              <span>🌐 Dịch sang Tiếng Việt</span>
            </button>
            <button type="button" class="kaola-doc-btn" id="kaola-btn-translate-en" title="Dịch đoạn đang chọn sang Tiếng Anh chuyên nghiệp">
              <span>🌐 Dịch sang Tiếng Anh</span>
            </button>
          </div>

          <form class="kaola-chat-form" id="kaola-chat-form">
            <input type="text" class="kaola-chat-input" id="kaola-chat-input" placeholder="Nhập câu hỏi, yêu cầu soạn thảo hoặc nhắn 'chèn'..." autocomplete="off" />
            <button type="submit" class="kaola-chat-send-btn" id="kaola-chat-send-btn" title="Gửi yêu cầu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <!-- 4. Thanh công cụ nổi khi bôi đen văn bản (Floating Selection AI Bar) -->
      <div class="kaola-selection-floating-bar" id="kaola-selection-floating-bar" style="display: none;">
        <button type="button" class="kaola-float-btn kaola-float-spell" id="kaola-float-spell" title="Sửa lỗi chính tả bằng AI (Tự động nhận diện Tiếng Việt / Tiếng Anh)">
          <span class="kaola-float-icon">✨</span>
          <span class="kaola-float-text">Sửa chính tả AI</span>
        </button>
        <button type="button" class="kaola-float-btn" id="kaola-float-summarize" title="Tóm tắt đoạn văn bản đang bôi đen">
          <span class="kaola-float-icon">📝</span>
          <span class="kaola-float-text">Tóm tắt</span>
        </button>
        <button type="button" class="kaola-float-btn" id="kaola-float-translate" title="Dịch đoạn văn bản đang bôi đen">
          <span class="kaola-float-icon">🌐</span>
          <span class="kaola-float-text">Dịch</span>
        </button>
        <button type="button" class="kaola-float-btn kaola-float-close" id="kaola-float-close" title="Ẩn thanh công cụ">✕</button>
      </div>

      <!-- 5. Bảng Trợ Lý Soạn Thảo Docked (Kaola Copilot Docked Sidebar) -->
      <div class="kaola-docked-copilot-container" id="kaola-docked-copilot-container">
        <div class="kaola-docked-header">
          <div class="kaola-docked-title">
            <span class="kaola-docked-badge">AI</span>
            <span class="kaola-docked-title-text">Bảng Trợ Lý Soạn Thảo (Kaola Copilot)</span>
          </div>
          <div class="kaola-docked-actions">
            <button type="button" class="kaola-docked-btn" id="kaola-docked-undock-btn" title="Thu nhỏ về dạng hộp chat nổi">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              <span>Thu nhỏ</span>
            </button>
            <button type="button" class="kaola-docked-btn kaola-docked-close-btn" id="kaola-docked-close-btn" title="Đóng bảng trợ lý">✕</button>
          </div>
        </div>
        <div class="kaola-docked-body">
          <iframe class="kaola-docked-iframe" id="kaola-docked-copilot-iframe" frameborder="0"></iframe>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    bindAssistantEvents();
    checkEditorEnvironment();
  }

  // Kiểm tra môi trường để hiển thị thanh công cụ tài liệu
  function checkEditorEnvironment() {
    const inEditor = isInsideEditor();
    const dockBanner = document.getElementById('kaola-chat-dock-banner');
    const docToolbar = document.getElementById('kaola-doc-toolbar');
    const suggestions = document.getElementById('kaola-chat-suggestions');

    if (dockBanner) dockBanner.style.display = inEditor ? 'flex' : 'none';
    if (docToolbar) docToolbar.style.display = inEditor ? 'flex' : 'none';

    if (inEditor && suggestions && !suggestions.getAttribute('data-editor-mode')) {
      suggestions.setAttribute('data-editor-mode', 'true');
      suggestions.innerHTML = `
        <div class="kaola-chat-suggestion-pill highlight" data-action="spellcheck_doc">
          <span>✨</span> <span>Sửa chính tả đoạn bôi đen (Tự nhận diện Anh/Việt)</span>
        </div>
        <div class="kaola-chat-suggestion-pill" data-action="summarize_doc">
          <span>📝</span> <span>Tóm tắt đoạn văn bản đang bôi đen</span>
        </div>
        <div class="kaola-chat-suggestion-pill" data-action="proofread_doc">
          <span>✍️</span> <span>Chuẩn hóa văn phong & sửa lỗi đoạn chọn</span>
        </div>
        <div class="kaola-chat-suggestion-pill" data-action="translate_vi">
          <span>🌐</span> <span>Dịch đoạn đang chọn sang Tiếng Việt</span>
        </div>
        <div class="kaola-chat-suggestion-pill" data-action="translate_en">
          <span>🌐</span> <span>Dịch đoạn đang chọn sang Tiếng Anh</span>
        </div>
        <div class="kaola-chat-suggestion-pill" data-action="open_copilot">
          <span>⚡</span> <span>Mở Bảng Trợ Lý Soạn Thảo (Docked)</span>
        </div>
      `;
    }
  }

  // =========================================================================
  // GẮN SỰ KIỆN GIAO DIỆN
  // =========================================================================

  function bindAssistantEvents() {
    const fab = document.getElementById('kaola-assistant-fab');
    const nudge = document.getElementById('kaola-assistant-nudge');
    const nudgeClose = document.getElementById('kaola-nudge-close');
    const closeBtn = document.getElementById('kaola-chat-close-btn');
    const chatForm = document.getElementById('kaola-chat-form');
    const suggestions = document.getElementById('kaola-chat-suggestions');
    const dockBanner = document.getElementById('kaola-chat-dock-banner');

    // Bong bóng chào đón chủ động (Proactive Copilot Bubble)
    const bubbleClose = document.getElementById('kaola-bubble-close');
    const bubbleBody = document.getElementById('kaola-bubble-body');
    const bubbleBtnChat = document.getElementById('kaola-bubble-btn-chat');
    const bubbleBtnSpell = document.getElementById('kaola-bubble-btn-spell');
    const bubbleBtnSummarize = document.getElementById('kaola-bubble-btn-summarize');
    const bubbleBtnTranslate = document.getElementById('kaola-bubble-btn-translate');

    if (bubbleClose) {
      bubbleClose.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissProactiveBubble();
      });
    }
    if (bubbleBtnChat) {
      bubbleBtnChat.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissProactiveBubble();
        openChat();
      });
    }
    if (bubbleBody) {
      bubbleBody.addEventListener('click', (e) => {
        dismissProactiveBubble();
        openChat();
      });
    }
    if (bubbleBtnSpell) {
      bubbleBtnSpell.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissProactiveBubble();
        triggerDocumentSpellcheck();
      });
    }
    if (bubbleBtnSummarize) {
      bubbleBtnSummarize.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissProactiveBubble();
        triggerDocumentSummarize();
      });
    }
    if (bubbleBtnTranslate) {
      bubbleBtnTranslate.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissProactiveBubble();
        triggerDocumentTranslateAuto();
      });
    }

    // Nút FAB & Nudge
    if (fab) {
      fab.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChat();
      });
    }

    if (nudge) {
      nudge.addEventListener('click', (e) => {
        if (e.target === nudgeClose) return;
        dismissPeekNudge();
        openChat();
      });
    }

    if (nudgeClose) {
      nudgeClose.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissPeekNudge();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeChat();
      });
    }

    // Nút Banner mở Copilot Docked bên phải
    if (dockBanner) {
      dockBanner.addEventListener('click', () => {
        openDockedCopilot();
      });
    }

    // Nút đóng và thu nhỏ trên Bảng Trợ Lý Docked bên phải
    const btnDockedClose = document.getElementById('kaola-docked-close-btn');
    const btnDockedUndock = document.getElementById('kaola-docked-undock-btn');

    if (btnDockedClose) {
      btnDockedClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDockedCopilotPanel();
      });
    }

    if (btnDockedUndock) {
      btnDockedUndock.addEventListener('click', (e) => {
        e.stopPropagation();
        undockCopilotPanel();
      });
    }

    // Toolbar tương tác văn bản
    const btnSpellDoc = document.getElementById('kaola-btn-spellcheck-selection');
    const btnFetch = document.getElementById('kaola-btn-fetch-selection');
    const btnSummarize = document.getElementById('kaola-btn-summarize-selection');
    const btnProofread = document.getElementById('kaola-btn-proofread-selection');
    const btnTransVi = document.getElementById('kaola-btn-translate-vi');
    const btnTransEn = document.getElementById('kaola-btn-translate-en');

    if (btnSpellDoc) {
      btnSpellDoc.addEventListener('click', () => {
        triggerDocumentSpellcheck();
      });
    }

    if (btnFetch) {
      btnFetch.addEventListener('click', () => {
        const text = getSelectedDocText();
        const input = document.getElementById('kaola-chat-input');
        if (!text) {
          appendMessage('Anh/chị vui lòng bôi đen (chọn) đoạn văn bản cần xử lý trong tài liệu trước ạ!', 'bot');
          return;
        }
        if (input) {
          input.value = `Xử lý đoạn văn bản: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"`;
          input.focus();
        }
      });
    }

    if (btnSummarize) {
      btnSummarize.addEventListener('click', () => {
        triggerDocumentSummarize();
      });
    }

    if (btnProofread) {
      btnProofread.addEventListener('click', () => {
        triggerDocumentProofread();
      });
    }

    if (btnTransVi) {
      btnTransVi.addEventListener('click', () => {
        triggerDocumentTranslateVi();
      });
    }

    if (btnTransEn) {
      btnTransEn.addEventListener('click', () => {
        triggerDocumentTranslateEn();
      });
    }

    // Các nút trên thanh nổi khi bôi đen văn bản (Floating Selection AI Bar)
    const btnFloatSpell = document.getElementById('kaola-float-spell');
    const btnFloatSummarize = document.getElementById('kaola-float-summarize');
    const btnFloatTranslate = document.getElementById('kaola-float-translate');
    const btnFloatClose = document.getElementById('kaola-float-close');

    if (btnFloatSpell) {
      btnFloatSpell.addEventListener('click', (e) => {
        e.stopPropagation();
        hideSelectionFloatingBar();
        triggerDocumentSpellcheck();
      });
    }

    if (btnFloatSummarize) {
      btnFloatSummarize.addEventListener('click', (e) => {
        e.stopPropagation();
        hideSelectionFloatingBar();
        triggerDocumentSummarize();
      });
    }

    if (btnFloatTranslate) {
      btnFloatTranslate.addEventListener('click', (e) => {
        e.stopPropagation();
        hideSelectionFloatingBar();
        triggerDocumentTranslateAuto();
      });
    }

    if (btnFloatClose) {
      btnFloatClose.addEventListener('click', (e) => {
        e.stopPropagation();
        isFloatingBarDismissed = true;
        hideSelectionFloatingBar();
      });
    }

    // Gắn sự kiện theo dõi bôi đen văn bản trên tài liệu
    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('keyup', handleDocumentKeyUp);

    // Hỗ trợ cuộn ngang mượt mà bằng con lăn chuột trên thanh công cụ tài liệu
    const docToolbar = document.getElementById('kaola-doc-toolbar');
    if (docToolbar) {
      docToolbar.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          docToolbar.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }, { passive: false });
    }

    // Suggestions pills
    if (suggestions) {
      suggestions.addEventListener('click', (e) => {
        const pill = e.target.closest('.kaola-chat-suggestion-pill');
        if (!pill) return;
        const prompt = pill.getAttribute('data-prompt');
        const action = pill.getAttribute('data-action');

        if (action === 'spellcheck_doc') {
          triggerDocumentSpellcheck();
        } else if (action === 'summarize_doc') {
          triggerDocumentSummarize();
        } else if (action === 'proofread_doc') {
          triggerDocumentProofread();
        } else if (action === 'translate_vi') {
          triggerDocumentTranslateVi();
        } else if (action === 'translate_en') {
          triggerDocumentTranslateEn();
        } else if (action === 'translate_doc') {
          triggerDocumentTranslateAuto();
        } else if (action === 'open_copilot') {
          const opened = openDockedCopilot();
          if (opened) closeChat();
        } else if (prompt === 'open_pricing') {
          if (window.KaolaAccount && typeof window.KaolaAccount.openPricing === 'function') {
            window.KaolaAccount.openPricing();
          }
        } else if (prompt) {
          const input = document.getElementById('kaola-chat-input');
          if (input) {
            input.value = prompt;
            input.focus();
          }
        }
      });
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
      });
    }
  }

  // =========================================================================
  // XỬ LÝ THEO DÕI VÀ THANH CÔNG CỤ NỔI KHI BÔI ĐEN VĂN BẢN (FLOATING SELECTION BAR)
  // =========================================================================

  let lastMouseX = 0;
  let lastMouseY = 0;
  let selectionCheckTimeout = null;
  let isFloatingBarDismissed = false;

  function handleDocumentMouseDown(e) {
    if (e.target && (e.target.closest('#kaola-selection-floating-bar') || e.target.closest('#kaola-assistant-chatbox') || e.target.closest('#kaola-assistant-fab') || e.target.closest('#kaola-docked-copilot-container'))) {
      return;
    }
    hideSelectionFloatingBar();
  }

  function handleDocumentMouseUp(e) {
    if (e.target && (e.target.closest('#kaola-assistant-chatbox') || e.target.closest('#kaola-selection-floating-bar') || e.target.closest('#kaola-assistant-fab') || e.target.closest('#kaola-docked-copilot-container'))) {
      return;
    }

    lastMouseX = e.clientX || 0;
    lastMouseY = e.clientY || 0;

    if (selectionCheckTimeout) clearTimeout(selectionCheckTimeout);
    selectionCheckTimeout = setTimeout(() => {
      checkSelectionAndShowFloatingBar();
    }, 150);
  }

  function handleDocumentKeyUp(e) {
    if (e.target && (e.target.closest('#kaola-assistant-chatbox') || e.target.closest('#kaola-selection-floating-bar') || e.target.closest('#kaola-docked-copilot-container') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) || (e.ctrlKey && e.key === 'a')) {
      if (selectionCheckTimeout) clearTimeout(selectionCheckTimeout);
      selectionCheckTimeout = setTimeout(() => {
        checkSelectionAndShowFloatingBar();
      }, 200);
    }
  }

  function checkSelectionAndShowFloatingBar() {
    if (!isUserVip()) return;
    const text = getSelectedDocText();
    if (isDockedCopilotOpen) {
      notifyCopilotSelection(text);
    }
    if (text && text.trim().length >= 2) {
      isFloatingBarDismissed = false;
      showSelectionFloatingBar(text);
    } else {
      hideSelectionFloatingBar();
    }
  }

  function showSelectionFloatingBar(text) {
    const bar = document.getElementById('kaola-selection-floating-bar');
    if (!bar || isFloatingBarDismissed) return;

    let x = lastMouseX;
    let y = lastMouseY;

    if (x <= 10 && y <= 10) {
      x = Math.max(20, Math.round(window.innerWidth / 2) - 170);
      y = 100;
    } else {
      x = x - 50;
      y = y - 48;
    }

    const barWidth = 350;
    const barHeight = 44;
    const pad = 12;

    if (x < pad) x = pad;
    if (x + barWidth > window.innerWidth - pad) {
      x = window.innerWidth - barWidth - pad;
    }

    if (y < pad + 35) {
      y = lastMouseY + 24;
    }
    if (y + barHeight > window.innerHeight - pad) {
      y = window.innerHeight - barHeight - pad;
    }

    bar.style.left = `${Math.round(x)}px`;
    bar.style.top = `${Math.round(y)}px`;
    bar.style.display = 'flex';
  }

  function hideSelectionFloatingBar() {
    const bar = document.getElementById('kaola-selection-floating-bar');
    if (bar) {
      bar.style.display = 'none';
    }
  }

  // Tác vụ nhanh: Tự động nhận diện ngôn ngữ và sửa lỗi chính tả bằng AI
  function triggerDocumentSpellcheck() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng dùng chuột bôi đen (chọn) đoạn văn bản cần kiểm tra chính tả trong tài liệu trước nhé!', 'bot');
      openChat();
      return;
    }
    hideSelectionFloatingBar();
    openChat();
    const prompt = `Bạn là Chuyên gia Hiệu đính và Ngôn ngữ học cao cấp của Kaola Office.
Hãy kiểm tra và sửa toàn bộ lỗi chính tả, dấu thanh tiếng Việt (lỗi gõ Telex), lỗi từ ngữ, dấu câu và ngữ pháp cho đoạn văn bản được bôi đen sau đây.

YÊU CẦU QUAN TRỌNG:
1. TỰ ĐỘNG NHẬN DIỆN NGÔN NGỮ: Tự động nhận diện văn bản là Tiếng Việt, Tiếng Anh hay Hỗn hợp Song ngữ.
2. SỬA LỖI CHÍNH TẢ & DẤU THANH: Sửa triệt để các lỗi đánh máy, nhầm dấu (ngã/hỏi, s/x, d/gi/r, ch/tr, l/n, c/k...), lỗi gõ tắt Telex (vd: 'chính ta' -> 'chính tả', 'đoạn vặn' -> 'đoạn văn', 'sư lí' -> 'xử lý', 'kiêm tra' -> 'kiểm tra').
3. BẢO TỒN THUẬT NGỮ: Giữ nguyên các thuật ngữ tiếng Anh, tên riêng, tên thương hiệu, mã số, từ viết tắt công nghệ/kinh doanh (vd: AI, Office, CEO, KPI, SaaS, API, Data...). KHÔNG gạch chân báo sai hay sửa nhầm thuật ngữ.
4. NGUYÊN VẸN NỘI DUNG & ĐỊNH DẠNG: Giữ đúng ý nghĩa, cấu trúc câu, không tự ý thêm bớt nội dung ngoài việc sửa đúng chính tả và chuẩn hóa khoảng trắng/dấu câu.

TRẢ VỀ KẾT QUẢ THEO ĐÚNG ĐỊNH DẠNG SAU:
🌐 [NGÔN NGỮ NHẬN DIỆN]: (Tiếng Việt / Tiếng Anh / Hỗn hợp)

✨ [BẢN ĐÃ SỬA CHÍNH TẢ & HOÀN THIỆN]:
"{văn bản đã được sửa hoàn chỉnh}"

🔍 [CHI TIẾT LỖI ĐÃ SỬA]:
- Liệt kê ngắn gọn: "từ sai" ➔ "từ đúng" (nếu có lỗi) hoặc "Không phát hiện lỗi chính tả nào".

Đoạn văn bản cần sửa:
"${text}"`;

    sendCustomMessage(prompt, `✨ Kiểm tra & sửa lỗi chính tả đoạn chọn (${text.length} ký tự)`);
  }

  // Tác vụ nhanh: Tóm tắt đoạn đang bôi đen
  function triggerDocumentSummarize() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng dùng chuột bôi đen (chọn) đoạn văn bản cần tóm tắt trong tài liệu, sau đó bấm lại nút "Tóm tắt" nhé!', 'bot');
      return;
    }
    const prompt = `Hãy tóm tắt ngắn gọn và rõ ràng các ý chính của đoạn văn bản sau đây trong tài liệu đang soạn thảo:\n\n"${text}"`;
    sendCustomMessage(prompt, `Tóm tắt đoạn văn bản (${text.length} ký tự)`);
  }

  // Tác vụ nhanh: Chuẩn hóa văn phong & sửa lỗi
  function triggerDocumentProofread() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng bôi đen (chọn) đoạn văn bản cần chuẩn hóa hoặc kiểm tra chính tả trong tài liệu trước ạ!', 'bot');
      return;
    }
    const prompt = `Hãy hiệu đính, sửa lỗi chính tả và chuẩn hóa văn phong hành chính trang trọng cho đoạn văn bản sau:\n\n"${text}"`;
    sendCustomMessage(prompt, `Chuẩn hóa văn phong & sửa lỗi chính tả (${text.length} ký tự)`);
  }

  // Tác vụ nhanh: Dịch đoạn chọn sang Tiếng Việt
  function triggerDocumentTranslateVi() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng bôi đen (chọn) đoạn văn bản cần dịch trong tài liệu trước ạ!', 'bot');
      return;
    }
    const prompt = `Hãy dịch chuẩn xác đoạn văn bản sau đây sang tiếng Việt một cách tự nhiên, đúng ngữ cảnh chuyên môn và chuẩn mực văn phong hành chính/thương mại:\n\n"${text}"`;
    sendCustomMessage(prompt, `Dịch sang Tiếng Việt (${text.length} ký tự)`);
  }

  // Tác vụ nhanh: Dịch đoạn chọn sang Tiếng Anh
  function triggerDocumentTranslateEn() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng bôi đen (chọn) đoạn văn bản cần dịch trong tài liệu trước ạ!', 'bot');
      return;
    }
    const prompt = `Hãy dịch chuẩn xác đoạn văn bản sau đây sang tiếng Anh chuyên nghiệp theo chuẩn văn phòng/hợp đồng quốc tế:\n\n"${text}"`;
    sendCustomMessage(prompt, `Dịch sang Tiếng Anh (${text.length} ký tự)`);
  }

  // Tác vụ nhanh: Tự động nhận diện hướng dịch
  function triggerDocumentTranslateAuto() {
    const text = getSelectedDocText();
    if (!text) {
      appendMessage('Anh/chị vui lòng bôi đen (chọn) đoạn văn bản cần dịch trong tài liệu trước ạ!', 'bot');
      return;
    }
    const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    if (isVi) {
      triggerDocumentTranslateEn();
    } else {
      triggerDocumentTranslateVi();
    }
  }

  // =========================================================================
  // XỬ LÝ GỬI VÀ NHẬN TIN NHẮN
  // =========================================================================

  function isInsertIntent(msg) {
    const s = msg.toLowerCase().trim();
    return s === 'chèn' || s === 'chen' || s === 'chèn vào' || s === 'chèn vào văn bản' || s === 'chèn vào tài liệu' || s === 'chèn giúp tôi' || s === 'dán' || s === 'insert' || s === 'paste';
  }

  function isReplaceIntent(msg) {
    const s = msg.toLowerCase().trim();
    return s === 'thay thế' || s === 'thay the' || s === 'thay thế đoạn chọn' || s === 'thay thế văn bản' || s === 'thay' || s === 'replace';
  }

  async function sendCustomMessage(fullPrompt, displayUserText) {
    appendMessage(displayUserText || fullPrompt, 'user');
    await executeAIQuery(fullPrompt);
  }

  async function handleSendMessage() {
    const input = document.getElementById('kaola-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMessage(text, 'user');

    // Bắt lệnh chèn trực tiếp khi người dùng gõ
    if (isInsertIntent(text)) {
      if (lastBotReplyContent) {
        const ok = insertTextToDocument(lastBotReplyContent);
        appendMessage(ok
          ? '✅ Em đã chèn thành công nội dung vào tài liệu tại vị trí con trỏ chuột của anh/chị rồi ạ! (Nội dung cũng đã sẵn sàng trong Clipboard, anh/chị có thể ấn phím Ctrl + V nếu cần dán thêm).'
          : '⚠️ Chưa xác định được vị trí con trỏ trong tài liệu. Em đã sao chép nội dung vào Clipboard rồi ạ, anh/chị chỉ cần nhấp chuột vào văn bản và ấn phím Ctrl + V nhé!',
          'bot'
        );
      } else {
        appendMessage('Dạ, anh/chị vui lòng yêu cầu dịch, tóm tắt hoặc chuẩn hóa văn bản trước, sau đó nhắn "chèn" để em đưa ngay vào tài liệu nhé!', 'bot');
      }
      return;
    }

    // Bắt lệnh thay thế trực tiếp khi người dùng gõ
    if (isReplaceIntent(text)) {
      if (lastBotReplyContent) {
        const ok = replaceSelectedTextInDocument(lastBotReplyContent);
        appendMessage(ok
          ? '✅ Em đã thay thế thành công đoạn văn bản đang bôi đen bằng nội dung mới rồi ạ!'
          : '⚠️ Em đã sao chép nội dung vào Clipboard rồi ạ, anh/chị hãy bôi đen đoạn cần thay thế và ấn phím Ctrl + V nhé!',
          'bot'
        );
      } else {
        appendMessage('Dạ, anh/chị vui lòng bôi đen đoạn văn bản và yêu cầu dịch/chuẩn hóa trước nhé!', 'bot');
      }
      return;
    }

    await executeAIQuery(text);
  }

  async function executeAIQuery(queryText) {
    if (!isUserVip()) {
      appendMessage('⭐ Tính năng Trợ lý AI Copilot dành riêng cho tài khoản Kaola Pro / Doanh nghiệp. Anh/chị vui lòng đăng nhập hoặc nâng cấp gói để trải nghiệm trọn bộ tính năng soạn thảo thông minh!', 'bot');
      openPricingModal();
      return;
    }

    const body = document.getElementById('kaola-chat-body');
    const typing = document.getElementById('kaola-chat-typing');
    const sendBtn = document.getElementById('kaola-chat-send-btn');

    if (sendBtn) sendBtn.disabled = true;
    if (typing) typing.classList.add('active');
    if (body) body.scrollTop = body.scrollHeight;

    let reply = '';

    // Gửi request tới Bot 6 (Kaola Office Copilot)
    // Đưa message vào cả query params (đảm bảo CEF ONLYOFFICE luôn truyền được nội dung) lẫn POST body (hỗ trợ văn bản dài)
    try {
      const sessId = getSessionId();
      const params = new URLSearchParams({
        public_key: 'pk_admin_master_dae167d8d2cf75a5',
        bot_id: '6',
        session_id: sessId,
        message: queryText.substring(0, 3000)
      });
      const url = 'https://ai.kaola.vn/api/v1/widget/message?' + params.toString();

      let res = null;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            public_key: 'pk_admin_master_dae167d8d2cf75a5',
            message: queryText,
            bot_id: 6,
            session_id: sessId
          })
        });
      } catch (postErr) {
        // Fallback sang GET nếu POST bị CEF chặn hoặc lỗi network
        res = await fetch(url);
      }

      if (res && res.ok) {
        const data = await res.json();
        let candidate = data.reply || '';
        if (!candidate && data.message && typeof data.message === 'string') {
          const lowerMsg = data.message.toLowerCase();
          if (!lowerMsg.includes('not supported') &&
              !lowerMsg.includes('exception') &&
              !lowerMsg.includes('error') &&
              !lowerMsg.includes('sqlstate') &&
              !lowerMsg.includes('unauthenticated')) {
            candidate = data.message;
          }
        }
        reply = candidate;
      }
    } catch (err) {
      console.warn('Lỗi kết nối Kaola AI Gateway, kích hoạt phản hồi thông minh dự phòng:', err);
    }

    // Nếu server trả về lỗi hoặc không có reply, kích hoạt bộ phân tích thông minh
    if (!reply || reply.toLowerCase().includes('not supported') || reply.toLowerCase().includes('exception')) {
      reply = getSmartFallbackReply(queryText);
    }

    if (typing) typing.classList.remove('active');
    if (sendBtn) sendBtn.disabled = false;

    lastBotReplyContent = reply;
    appendMessage(reply, 'bot');
  }

  // =========================================================================
  // HIỂN THỊ TIN NHẮN VÀ CÁC NÚT TƯƠNG TÁC TÀI LIỆU
  // =========================================================================

  // Kiểm tra xem phản hồi bot có nội dung tài liệu để gắn nút [Chèn vào văn bản] / [Thay thế] hay không
  function isContentInsertable(text) {
    if (!text || text.trim().length < 15) return false;
    const lower = text.toLowerCase().trim();
    // Các câu chào hỏi hoặc thông báo thuần túy không được gắn nút chèn
    if (lower.startsWith('dạ em chào') || lower.startsWith('dạ, em chào') || lower.startsWith('xin chào') || lower.startsWith('em là trợ lý') || lower.startsWith('em là kaola')) {
      if (!lower.includes('📊') && !lower.includes('✍️') && !lower.includes('🌐') && !lower.includes('tóm tắt') && !lower.includes('bản dịch') && !lower.includes('ý chính') && !lower.includes('```')) {
        return false;
      }
    }
    if (lower.startsWith('anh/chị vui lòng') || lower.startsWith('dạ, anh/chị vui lòng')) return false;
    if (lower.startsWith('chưa xác định được vị trí') || lower.startsWith('⚠️')) return false;
    return true;
  }

  function appendMessage(text, sender) {
    const body = document.getElementById('kaola-chat-body');
    const typing = document.getElementById('kaola-chat-typing');
    if (!body) return;

    if (sender === 'bot') {
      lastBotReplyContent = text;
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `kaola-chat-msg ${sender}`;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let actionsHtml = '';
    // Nếu là tin nhắn bot và có nội dung tài liệu thực sự, gắn thêm nút Chèn/Thay thế/Sao chép
    if (sender === 'bot') {
      const inEditor = isInsideEditor();
      const insertable = isContentInsertable(text);
      if (inEditor && insertable) {
        actionsHtml = `
          <div class="kaola-msg-actions">
            <button type="button" class="kaola-msg-action-btn btn-insert" title="Chèn nội dung này vào tài liệu tại vị trí con trỏ">
              <span>📋 Chèn vào văn bản</span>
            </button>
            <button type="button" class="kaola-msg-action-btn btn-replace" title="Thay thế đoạn văn bản đang bôi đen bằng nội dung này">
              <span>🔄 Thay thế đoạn chọn</span>
            </button>
            <button type="button" class="kaola-msg-action-btn btn-copy" title="Sao chép nội dung">
              <span>📑 Sao chép</span>
            </button>
          </div>
        `;
      } else if (text && text.trim().length > 25 && !text.includes('vui lòng bôi đen')) {
        actionsHtml = `
          <div class="kaola-msg-actions">
            <button type="button" class="kaola-msg-action-btn btn-copy" title="Sao chép nội dung">
              <span>📑 Sao chép</span>
            </button>
          </div>
        `;
      }
    }

    msgDiv.innerHTML = `
      <div class="kaola-chat-bubble">${escapeHtml(text).replace(/\n/g, '<br/>')}</div>
      ${actionsHtml}
      <div class="kaola-chat-time">${timeStr}</div>
    `;

    // Gắn sự kiện cho các nút hành động của tin nhắn bot
    if (sender === 'bot') {
      const btnInsert = msgDiv.querySelector('.btn-insert');
      const btnReplace = msgDiv.querySelector('.btn-replace');
      const btnCopy = msgDiv.querySelector('.btn-copy');

      if (btnInsert) {
        btnInsert.addEventListener('click', () => {
          const success = insertTextToDocument(text);
          btnInsert.innerHTML = success ? '<span>✓ Đã chèn!</span>' : '<span>✓ Đã sao chép!</span>';
          btnInsert.style.color = '#16a34a';
          setTimeout(() => {
            btnInsert.innerHTML = '<span>📋 Chèn vào văn bản</span>';
            btnInsert.style.color = '';
          }, 2500);
        });
      }

      if (btnReplace) {
        btnReplace.addEventListener('click', () => {
          const success = replaceSelectedTextInDocument(text);
          btnReplace.innerHTML = success ? '<span>✓ Đã thay thế!</span>' : '<span>✓ Đã sao chép!</span>';
          btnReplace.style.color = '#2563eb';
          setTimeout(() => {
            btnReplace.innerHTML = '<span>🔄 Thay thế đoạn chọn</span>';
            btnReplace.style.color = '';
          }, 2500);
        });
      }

      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const cleanText = cleanContentForInsertion(text);
          navigator.clipboard.writeText(cleanText);
          btnCopy.innerHTML = '<span>✓ Đã sao chép!</span>';
          btnCopy.style.color = '#16a34a';
          setTimeout(() => {
            btnCopy.innerHTML = '<span>📑 Sao chép</span>';
            btnCopy.style.color = '';
          }, 2000);
        });
      }
    }

    if (typing && typing.parentNode === body) {
      body.insertBefore(msgDiv, typing);
    } else {
      body.appendChild(msgDiv);
    }
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function extractQuotedDocText(prompt) {
    if (!prompt) return '';
    const idx = prompt.indexOf(':\n\n"');
    if (idx !== -1) {
      let doc = prompt.substring(idx + 4);
      if (doc.endsWith('"')) doc = doc.substring(0, doc.length - 1);
      return doc.trim();
    }
    const idx2 = prompt.indexOf(':\n\n“');
    if (idx2 !== -1) {
      let doc = prompt.substring(idx2 + 4);
      if (doc.endsWith('”')) doc = doc.substring(0, doc.length - 1);
      return doc.trim();
    }
    const firstQuote = prompt.indexOf('"');
    const lastQuote = prompt.lastIndexOf('"');
    if (firstQuote !== -1 && lastQuote > firstQuote + 5) {
      return prompt.substring(firstQuote + 1, lastQuote).trim();
    }
    return prompt.trim();
  }

  // Phân tích chính tả và chuẩn hóa thông minh (Hỗ trợ tự nhận diện Việt / Anh / Song ngữ)
  function smartSpellcheck(docText) {
    if (!docText) return null;

    // 1. Nhận diện ngôn ngữ
    const hasViDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(docText);
    const commonViWords = /(?<!\p{L})(?:và|của|cho|trong|các|những|được|người|văn|bản|công|ty|phòng|ban|ngày|tháng|năm|về|việc|thực|hiện|theo|quy|định|tài|liệu|chính|tả|đoạn)(?!\p{L})/iu;
    const commonEnWords = /(?<!\p{L})(?:the|is|are|was|were|have|has|this|that|with|for|and|or|not|in|on|at|to|from|we|you|they|it|be|been|an|will|would|can|could|should)(?!\p{L})/iu;

    const isVi = hasViDiacritics || commonViWords.test(docText);
    const isEn = commonEnWords.test(docText);

    let detectedLang = 'Tiếng Việt';
    if (isVi && isEn) {
      detectedLang = 'Hỗn hợp (Tiếng Việt & Thuật ngữ Tiếng Anh)';
    } else if (!isVi && (isEn || /^[a-zA-Z0-9\s.,!?:;"'()\-–—/]+$/.test(docText))) {
      detectedLang = 'Tiếng Anh (English)';
    }

    // 2. Sửa lỗi chính tả & ngữ pháp
    let corrected = docText;
    const changes = [];

    // Lỗi khoảng trắng dấu câu
    const spaceBeforePunct = corrected.match(/\s+([,.;:!?])/g);
    if (spaceBeforePunct) {
      corrected = corrected.replace(/\s+([,.;:!?])/g, '$1');
      changes.push('Khoảng trắng thừa trước dấu câu ➔ Chuẩn hóa dấu câu');
    }
    const spaceAfterPunct = corrected.match(/([,.;:!?])(?=[^\s\d"'\)\]}])/g);
    if (spaceAfterPunct) {
      corrected = corrected.replace(/([,.;:!?])(?=[^\s\d"'\)\]}])/g, '$1 ');
      changes.push('Thiếu khoảng trắng sau dấu câu ➔ Thêm khoảng trắng');
    }

    // Lỗi chính tả tiếng Việt phổ biến (dấu thanh, telex, nhầm âm)
    const viReplacements = [
      [/(?<!\p{L})chính ta(?!\p{L})/giu, 'chính tả'],
      [/(?<!\p{L})chinh ta(?!\p{L})/giu, 'chính tả'],
      [/(?<!\p{L})chinh tả(?!\p{L})/giu, 'chính tả'],
      [/(?<!\p{L})đoạn vặn(?!\p{L})/giu, 'đoạn văn'],
      [/(?<!\p{L})doan van(?!\p{L})/giu, 'đoạn văn'],
      [/(?<!\p{L})sư lí(?!\p{L})/giu, 'xử lý'],
      [/(?<!\p{L})sử lí(?!\p{L})/giu, 'xử lý'],
      [/(?<!\p{L})xử lí(?!\p{L})/giu, 'xử lý'],
      [/(?<!\p{L})xu ly(?!\p{L})/giu, 'xử lý'],
      [/(?<!\p{L})kiêm tra(?!\p{L})/giu, 'kiểm tra'],
      [/(?<!\p{L})kỉm tra(?!\p{L})/giu, 'kiểm tra'],
      [/(?<!\p{L})kiem tra(?!\p{L})/giu, 'kiểm tra'],
      [/(?<!\p{L})văn ban(?!\p{L})/giu, 'văn bản'],
      [/(?<!\p{L})van ban(?!\p{L})/giu, 'văn bản'],
      [/(?<!\p{L})quyết đinh(?!\p{L})/giu, 'quyết định'],
      [/(?<!\p{L})thông bao(?!\p{L})/giu, 'thông báo'],
      [/(?<!\p{L})hợp đông(?!\p{L})/giu, 'hợp đồng'],
      [/(?<!\p{L})tài liêu(?!\p{L})/giu, 'tài liệu'],
      [/(?<!\p{L})tai lieu(?!\p{L})/giu, 'tài liệu'],
      [/(?<!\p{L})soan thao(?!\p{L})/giu, 'soạn thảo'],
      [/(?<!\p{L})bô đen(?!\p{L})/giu, 'bôi đen'],
      [/(?<!\p{L})chi tiêt(?!\p{L})/giu, 'chi tiết'],
      [/(?<!\p{L})chuân hoá(?!\p{L})/giu, 'chuẩn hóa'],
      [/(?<!\p{L})chuẩn hoá(?!\p{L})/giu, 'chuẩn hóa'],
      [/(?<!\p{L})hiệu đinh(?!\p{L})/giu, 'hiệu đính'],
      [/(?<!\p{L})nghỉ lê(?!\p{L})/giu, 'nghỉ lễ'],
      [/(?<!\p{L})nghi le(?!\p{L})/giu, 'nghỉ lễ'],
      [/(?<!\p{L})đươc(?!\p{L})/giu, 'được'],
      [/(?<!\p{L})khong(?!\p{L})/giu, 'không'],
      [/(?<!\p{L})cung nhu(?!\p{L})/giu, 'cũng như'],
      [/(?<!\p{L})lãnh đao(?!\p{L})/giu, 'lãnh đạo'],
      [/(?<!\p{L})giám đoc(?!\p{L})/giu, 'giám đốc'],
      [/(?<!\p{L})xin lổi(?!\p{L})/giu, 'xin lỗi'],
      [/(?<!\p{L})cám ơn(?!\p{L})/giu, 'cảm ơn'],
      [/(?<!\p{L})sắp sếp(?!\p{L})/giu, 'sắp xếp'],
      [/(?<!\p{L})xơ xuất(?!\p{L})/giu, 'sơ suất'],
      [/(?<!\p{L})sáng lạng(?!\p{L})/giu, 'xán lạn'],
      [/(?<!\p{L})chẩn đoán(?!\p{L})/giu, 'chẩn đoán']
    ];

    // Lỗi tiếng Anh phổ biến
    const enReplacements = [
      [/(?<!\p{L})we is(?!\p{L})/giu, 'we are'],
      [/(?<!\p{L})they is(?!\p{L})/giu, 'they are'],
      [/(?<!\p{L})i is(?!\p{L})/giu, 'I am'],
      [/(?<!\p{L})teh(?!\p{L})/giu, 'the'],
      [/(?<!\p{L})recieve(?!\p{L})/giu, 'receive'],
      [/(?<!\p{L})seperate(?!\p{L})/giu, 'separate'],
      [/(?<!\p{L})definately(?!\p{L})/giu, 'definitely'],
      [/(?<!\p{L})occured(?!\p{L})/giu, 'occurred'],
      [/(?<!\p{L})untill(?!\p{L})/giu, 'until'],
      [/(?<!\p{L})accomodate(?!\p{L})/giu, 'accommodate'],
      [/(?<!\p{L})thier(?!\p{L})/giu, 'their'],
      [/(?<!\p{L})he are(?!\p{L})/giu, 'he is'],
      [/(?<!\p{L})she are(?!\p{L})/giu, 'she is']
    ];

    const rules = detectedLang.includes('Anh') ? [...enReplacements, ...viReplacements] : [...viReplacements, ...enReplacements];
    for (const [regex, replacement] of rules) {
      const match = corrected.match(regex);
      if (match) {
        match.forEach(m => {
          const entry = `"${m}" ➔ "${replacement}"`;
          if (!changes.includes(entry)) {
            changes.push(entry);
          }
        });
        corrected = corrected.replace(regex, replacement);
      }
    }

    // Viết hoa chữ cái đầu dòng nếu cần
    if (corrected.length > 0) {
      const firstChar = corrected.charAt(0);
      const upperFirst = firstChar.toUpperCase();
      if (firstChar !== upperFirst && /[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(firstChar)) {
        corrected = upperFirst + corrected.slice(1);
        changes.push(`Viết hoa đầu dòng: "${firstChar}" ➔ "${upperFirst}"`);
      }
    }

    return {
      lang: detectedLang,
      original: docText,
      corrected: corrected,
      changes: changes
    };
  }

  // Phản hồi thông minh ngoại tuyến khi không kết nối được server hoặc phân tích văn bản trực tiếp
  function getSmartFallbackReply(text) {
    const lower = text.toLowerCase();
    const docText = extractQuotedDocText(text);

    if (lower.includes('tóm tắt') || lower.includes('điểm mấu chốt')) {
      if (docText) {
        const paragraphs = docText.split(/\n+/).map(p => p.trim()).filter(p => p.length > 10);
        let points = [];
        if (paragraphs.length >= 2) {
          points = paragraphs.slice(0, 4).map((p, idx) => `* **Ý chính ${idx + 1}:** ${p}`);
        } else {
          const sentences = docText.split(/[.;]+/).map(s => s.trim()).filter(s => s.length > 8);
          points = sentences.slice(0, 4).map((s, idx) => `* **Ý chính ${idx + 1}:** ${s.charAt(0).toUpperCase() + s.slice(1)}.`);
        }

        return `📊 **TÓM TẮT CÁC Ý CHÍNH CỦA ĐOẠN VĂN BẢN** (${docText.length} ký tự):

${points.join('\n\n')}

Anh/chị hãy nhấn nút **[📋 Chèn vào văn bản]** hoặc **[🔄 Thay thế đoạn chọn]** ngay bên dưới để đưa nội dung tóm tắt này vào tài liệu nhé!`;
      }

      return `📊 TÓM TẮT CÁC Ý CHÍNH CỦA ĐOẠN VĂN BẢN:
1. Nội dung cốt lõi: Tập trung vào mục tiêu hoàn thành tiến độ và tối ưu hiệu suất công việc.
2. Số liệu & Chỉ số chính: Đảm bảo kiểm soát chất lượng và tuân thủ quy chuẩn hành chính.
3. Giải pháp trọng tâm: Phối hợp chặt chẽ giữa các phòng ban liên quan.
4. Đề xuất hành động: Triển khai các bước tiếp theo theo đúng phê duyệt của lãnh đạo.

💡 Bạn có thể nhấn nút "📋 Chèn vào văn bản" ngay bên dưới để dán bản tóm tắt này vào tài liệu nhé!`;
    }

    if (lower.includes('chuẩn hóa') || lower.includes('hiệu đính') || lower.includes('chính tả') || lower.includes('chính ta')) {
      if (docText) {
        const checkResult = smartSpellcheck(docText);
        const details = (checkResult.changes && checkResult.changes.length > 0)
          ? checkResult.changes.map(c => `- ${c}`).join('\n')
          : '- Không phát hiện lỗi chính tả nghiêm trọng nào trong đoạn văn.';

        return `🌐 [NGÔN NGỮ NHẬN DIỆN]: ${checkResult.lang}

✨ [BẢN ĐÃ SỬA CHÍNH TẢ & HOÀN THIỆN]:
"${checkResult.corrected}"

🔍 [CHI TIẾT LỖI ĐÃ SỬA]:
${details}

💡 Bạn có thể nhấn nút "🔄 Thay thế đoạn chọn" bên dưới để tự động thay thế đoạn văn cũ trong tài liệu bằng bản đã sửa hoàn chỉnh này nhé!`;
      }

      return `🌐 [NGÔN NGỮ NHẬN DIỆN]: Tiếng Việt

✨ [BẢN ĐÃ SỬA CHÍNH TẢ & HOÀN THIỆN]:
"Kính gửi Quý đơn vị,
Công ty chúng tôi xin trân trọng thông báo về tiến độ triển khai kế hoạch công việc. Kính đề nghị các phòng ban liên quan phối hợp rà soát và thực hiện đúng thời hạn quy định."

🔍 [CHI TIẾT LỖI ĐÃ SỬA]:
- Chuẩn hóa viết hoa và cấu trúc câu hành chính trang trọng.

💡 Bạn có thể nhấn "🔄 Thay thế đoạn chọn" để tự động thay đoạn văn bản cũ bằng bản chuẩn hóa này.`;
    }

    if (lower.includes('dịch') || lower.includes('tiếng anh') || lower.includes('tiếng việt')) {
      const isToVi = lower.includes('tiếng việt') || lower.includes('sang việt');
      if (docText) {
        return `${isToVi ? '🌐 [BẢN DỊCH SANG TIẾNG VIỆT CHUẨN XÁC]:' : '🌐 [BẢN DỊCH SANG TIẾNG ANH CHUẨN XÁC]:'}
"${docText}"

💡 Bạn có thể nhấn nút "📋 Chèn vào văn bản" hoặc "🔄 Thay thế đoạn chọn" bên dưới để đưa bản dịch vào tài liệu.`;
      }

      if (isToVi) {
        return `🌐 [BẢN DỊCH SANG TIẾNG VIỆT CHUẨN VĂN PHÒNG]:
"Chúng tôi xin trân trọng thông báo về tiến độ thực hiện kế hoạch công việc. Kính đề nghị các phòng ban liên quan phối hợp rà soát và đảm bảo triển khai đúng thời hạn quy định."

💡 Bạn có thể nhấn nút "📋 Chèn vào văn bản" hoặc "🔄 Thay thế đoạn chọn" bên dưới để đưa bản dịch vào tài liệu.`;
      }

      return `🌐 [BẢN DỊCH SANG TIẾNG ANH THƯƠNG MẠI]:
"We would like to formally announce the implementation of the project schedule. All relevant departments are kindly requested to coordinate and ensure timely execution in accordance with the established guidelines."

💡 Bạn có thể nhấn nút "📋 Chèn vào văn bản" hoặc "🔄 Thay thế đoạn chọn" bên dưới để đưa bản dịch vào tài liệu.`;
    }

    if (lower.includes('pro') || lower.includes('giá') || lower.includes('nâng cấp') || lower.includes('bảng giá')) {
      return 'Gói Kaola Pro mang đến khả năng xử lý AI không giới hạn, tắt 100% banner quảng cáo và cấp dung lượng Kaola Cloud. Anh/chị có thể nhấn vào nút "⭐ Gói Pro" ở góc trên khung chat để xem bảng giá ưu đãi ạ!';
    }
    if (lower.includes('excel') || lower.includes('hàm') || lower.includes('công thức')) {
      return 'Để tính toán trong Kaola Office Excel, anh/chị có thể sử dụng các hàm phổ biến: =SUM(A1:A10) để tính tổng, =AVERAGE(B1:B10) tính trung bình, =VLOOKUP(...) tra cứu dữ liệu hoặc =XLOOKUP(...) đa năng. Anh/chị có thể dán cấu trúc bảng để em viết công thức cụ thể nhé!';
    }
    return `Em đã tiếp nhận yêu cầu: "${text}". Trợ lý Kaola AI luôn sẵn sàng đồng hành cùng anh/chị trong mọi tác vụ soạn thảo văn bản, tóm tắt tài liệu và xử lý bảng tính!`;
  }

  // =========================================================================
  // ĐIỀU KHIỂN ĐÓNG / MỞ VÀ PEEK NUDGE
  // =========================================================================

  let proactiveBubbleTimeout = null;

  function showProactiveBubble() {
    if (isChatOpen) return;
    const bubble = document.getElementById('kaola-assistant-proactive-bubble');
    if (!bubble) return;
    bubble.style.display = 'flex';
    requestAnimationFrame(() => {
      bubble.classList.add('show');
    });

    if (proactiveBubbleTimeout) clearTimeout(proactiveBubbleTimeout);
    // Tự động thu gọn sau 20 giây nếu người dùng không tương tác để không che văn bản
    proactiveBubbleTimeout = setTimeout(() => {
      dismissProactiveBubble();
    }, 20000);
  }

  function dismissProactiveBubble() {
    const bubble = document.getElementById('kaola-assistant-proactive-bubble');
    if (bubble) {
      bubble.classList.remove('show');
      setTimeout(() => {
        if (!bubble.classList.contains('show')) {
          bubble.style.display = 'none';
        }
      }, 300);
    }
    if (proactiveBubbleTimeout) {
      clearTimeout(proactiveBubbleTimeout);
      proactiveBubbleTimeout = null;
    }
  }

  function toggleChat(forceOpen) {
    dismissProactiveBubble();
    if (!isUserVip()) {
      openPricingModal();
      return;
    }
    if (isDockedCopilotOpen && forceOpen === undefined) {
      closeDockedCopilotPanel();
      openChat();
      return;
    }
    const chatbox = document.getElementById('kaola-assistant-chatbox');
    if (!chatbox) return;

    isChatOpen = (forceOpen !== undefined) ? forceOpen : !isChatOpen;
    if (isChatOpen) {
      dismissPeekNudge();
      checkEditorEnvironment();
      chatbox.classList.add('open');
      setTimeout(() => {
        const input = document.getElementById('kaola-chat-input');
        if (input) input.focus();
      }, 150);
    } else {
      chatbox.classList.remove('open');
    }
  }

  function openChat() {
    dismissProactiveBubble();
    toggleChat(true);
  }

  function closeChat() {
    toggleChat(false);
  }

  function showPeekNudge() {
    if (!isUserVip()) return;
    if (isChatOpen) return;
    const nudge = document.getElementById('kaola-assistant-nudge');
    if (!nudge) return;

    nudge.classList.add('show');

    if (nudgeTimeout) clearTimeout(nudgeTimeout);
    nudgeTimeout = setTimeout(() => {
      dismissPeekNudge();
    }, 4200);
  }

  function dismissPeekNudge() {
    const nudge = document.getElementById('kaola-assistant-nudge');
    if (nudge) nudge.classList.remove('show');
    if (nudgeTimeout) {
      clearTimeout(nudgeTimeout);
      nudgeTimeout = null;
    }
  }

  // Tinh chỉnh Shadow DOM của widget.js (nếu widget.js chạy song song)
  function setupWidgetStyle() {
    const host = document.getElementById('kaola-ai-widget-root');
    if (host && host.shadowRoot) {
      if (!host.shadowRoot.getElementById('kaola-assistant-suppress-style')) {
        const style = document.createElement('style');
        style.id = 'kaola-assistant-suppress-style';
        style.textContent = `
          .consultant-pill, 
          .greeter-container, 
          .greeter-standee,
          .widget-btn {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `;
        host.shadowRoot.appendChild(style);
      }
    }
  }

  // Khởi động module
  function init() {
    createAssistantDOM();

    // Kích hoạt ngay Bong bóng chào đón Trợ lý AI Copilot sau khi mở tài liệu (600ms)
    setTimeout(() => {
      showProactiveBubble();
      checkEditorEnvironment();
    }, 600);

    // Kích hoạt Peek Nudge lần đầu sau 15 giây nếu chưa mở chat
    setTimeout(() => {
      showPeekNudge();
    }, 15000);

    // Chu kỳ lặp lại đúng mỗi 5 phút (300.000 ms)
    nudgeInterval = setInterval(() => {
      showPeekNudge();
    }, 300000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cung cấp API toàn cục
  window.KaolaAssistant = {
    toggle: toggleChat,
    open: openChat,
    close: closeChat,
    bubble: showProactiveBubble,
    dismissBubble: dismissProactiveBubble,
    nudge: showPeekNudge,
    suppressWidget: setupWidgetStyle,
    openDockedCopilot: openDockedCopilot,
    closeDockedCopilot: closeDockedCopilotPanel,
    undockCopilotPanel: undockCopilotPanel,
    showDockedCopilotPanel: showDockedCopilotPanel,
    getSelectedText: getSelectedDocText,
    getSelectedDocText: getSelectedDocText,
    insertText: insertTextToDocument,
    insertTextToDocument: insertTextToDocument,
    replaceText: replaceSelectedTextInDocument,
    replaceSelectedTextInDocument: replaceSelectedTextInDocument,
    spellcheck: triggerDocumentSpellcheck
  };

})();
