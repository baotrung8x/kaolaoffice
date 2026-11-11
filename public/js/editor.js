/**
 * Kaola Office - Editor Controller
 * Nhúng ONLYOFFICE Docs API và kích hoạt Plugin Kaola AI Copilot
 */

(function () {
  'use strict';

  let docEditor = null;
  let currentFile = "";
  let currentType = "word";
  let serverUrl = "";

  let currentUserId = "";

  document.addEventListener('DOMContentLoaded', () => {
    parseUrlParams();
    initEditor();
  });

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    currentFile = decodeURIComponent(params.get('file') || 'Tai_lieu_moi.docx');
    currentType = params.get('type') || 'word';
    const defaultDocServer = typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'https://docs.kaola.vn'
      : 'http://localhost:8080';
    serverUrl = decodeURIComponent(params.get('server') || localStorage.getItem('kaola_doc_server') || defaultDocServer);

    // Cập nhật giao diện topbar
    const titleInput = document.getElementById('doc-title-input');
    if (titleInput) titleInput.value = currentFile;

    const badgeIcon = document.getElementById('doc-badge-icon');
    if (badgeIcon) {
      badgeIcon.className = `doc-badge-icon ${currentType}`;
      badgeIcon.innerText = currentType === 'word' ? '📄' : currentType === 'cell' ? '📊' : currentType === 'pdf' ? '📑' : '📽️';
    }

    document.title = `${currentFile} - Kaola Office`;
  }

  function initEditor() {
    const cleanServer = serverUrl.replace(/\/+$/, '');
    const apiScriptUrl = `${cleanServer}/web-apps/apps/api/documents/api.js`;

    console.log(`[Kaola Office] Đang tải ONLYOFFICE Docs API từ: ${apiScriptUrl}`);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = apiScriptUrl;

    let timeoutId = setTimeout(() => {
      showOfflineOverlay(cleanServer);
    }, 5000);

    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('[Kaola Office] Đã nạp thành công DocsAPI. Khởi tạo Editor...');
      launchDocEditor();
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      console.warn(`[Kaola Office] Không thể kết nối Document Server tại ${cleanServer}`);
      showOfflineOverlay(cleanServer);
    };

    document.head.appendChild(script);
  }

  function launchDocEditor() {
    if (typeof DocsAPI === 'undefined' || !DocsAPI.DocEditor) {
      showOfflineOverlay(serverUrl);
      return;
    }

    const host = window.location.origin;
    const fileUrl = currentUserId
      ? `${host}/storage/users/${encodeURIComponent(currentUserId)}/${encodeURIComponent(currentFile)}`
      : `${host}/storage/${encodeURIComponent(currentFile)}`;
    const callbackUrl = currentUserId
      ? `${host}/api/track.php?file=${encodeURIComponent(currentFile)}&user_id=${encodeURIComponent(currentUserId)}`
      : `${host}/api/track.php?file=${encodeURIComponent(currentFile)}`;
    const pluginUrl = `${host}/app/editors/sdkjs-plugins/{A1B2C3D4-E5F6-47A8-9B0C-1D2E3F4A5B6C}/config.json`;
    const logoUrl = `${host}/app/kaola_logo.png`;

    const ext = currentFile.split('.').pop().toLowerCase();
    const docKey = 'kaola_' + Math.abs(hashCode(currentFile + '_' + Date.now()));

    const config = {
      document: {
        fileType: ext,
        key: docKey,
        title: currentFile,
        url: fileUrl,
        permissions: {
          download: true,
          edit: true,
          print: true,
          review: true,
          copy: true
        }
      },
      documentType: (currentType === 'pdf' ? 'word' : currentType),
      editorConfig: {
        mode: 'edit',
        lang: 'vi',
        location: 'vi',
        callbackUrl: callbackUrl,
        user: {
          id: 'kaola_user_' + (localStorage.getItem('kaola_user_id') || '1'),
          name: localStorage.getItem('kaola_user_name') || 'Người dùng Kaola'
        },
        customization: {
          customer: {
            name: 'Kaola Office',
            info: 'Bộ ứng dụng văn phòng thông minh chuẩn 99% Microsoft Office',
            logo: logoUrl,
            mail: 'support@kaola.vn',
            www: 'https://kaola.vn'
          },
          logo: {
            image: logoUrl,
            imageDark: logoUrl,
            url: host
          },
          goback: {
            url: '/',
            text: 'Về Kaola Office'
          },
          plugins: true,
          macros: true,
          autosave: true,
          forcesave: true,
          uiTheme: 'default-light'
        },
        plugins: {
          autostart: [
            'asc.{A1B2C3D4-E5F6-47A8-9B0C-1D2E3F4A5B6C}' // Tự động nạp Kaola AI Copilot
          ],
          pluginsData: [
            pluginUrl
          ]
        }
      },
      height: '100%',
      width: '100%',
      events: {
        'onAppReady': onAppReady,
        'onDocumentStateChange': onDocumentStateChange,
        'onError': onError
      }
    };

    try {
      docEditor = new DocsAPI.DocEditor('iframeEditor', config);
    } catch (e) {
      console.error('Lỗi khi gọi new DocsAPI.DocEditor:', e);
      showOfflineOverlay(serverUrl);
    }
  }

  function onAppReady() {
    console.log('[Kaola Office] Trình soạn thảo ONLYOFFICE đã sẵn sàng.');
    const statusText = document.getElementById('save-status-text');
    if (statusText) statusText.innerText = 'Đã kết nối máy chủ';
  }

  function onDocumentStateChange(event) {
    const statusText = document.getElementById('save-status-text');
    if (!statusText) return;

    if (event.data) {
      statusText.innerText = 'Đang chỉnh sửa (tự động lưu)...';
    } else {
      statusText.innerText = 'Đã lưu tất cả thay đổi';
    }
  }

  function onError(event) {
    console.error('[Kaola Office] Lỗi Editor:', event);
  }

  function showOfflineOverlay(server) {
    const overlay = document.getElementById('connection-overlay');
    const targetUrl = document.getElementById('target-server-url');
    if (targetUrl) targetUrl.innerText = server;
    if (overlay) overlay.style.display = 'flex';
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

})();
