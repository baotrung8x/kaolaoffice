/**
 * Kaola Office - Customer Announcement Ticker Engine (Dòng thông báo chạy chữ)
 * Hiển thị thông báo, tin tức và cập nhật cho khách hàng trên 1 dòng duy nhất di chuyển qua lại
 * Không phải quảng cáo - thiết kế thanh lịch, tự động chạy chữ, rê chuột tạm dừng
 */

(function () {
  'use strict';

  const DEFAULT_BROADCASTS = [
    {
      id: 'templates_nd30',
      text: 'Đã cập nhật 15+ Mẫu văn bản chuẩn Nghị định 30, Hợp đồng & Báo cáo doanh nghiệp.',
      url: 'https://id.kaola.vn',
      active: true
    },
    {
      id: 'ai_copilot',
      text: 'Kaola AI Copilot: Tự động soạn thảo văn bản, tóm tắt báo cáo & sửa lỗi ngữ pháp.',
      url: 'https://id.kaola.vn',
      active: true
    },
    {
      id: 'kaola_pro',
      text: 'Nâng cấp Kaola Pro: Mở khóa không giới hạn AI Copilot & đồng bộ đám mây Kaola Drive.',
      url: 'https://id.kaola.vn',
      active: true
    },
    {
      id: 'hotline_support',
      text: 'Hệ sinh thái ứng dụng văn phòng Kaola Office - id.kaola.vn & kaolastore.vn.',
      url: 'https://id.kaola.vn',
      active: true
    }
  ];

  let broadcasts = [...DEFAULT_BROADCASTS];
  let container = null;
  let trackEl = null;

  function createBroadcastUI() {
    if (document.getElementById('kaola-top-broadcast')) {
      container = document.getElementById('kaola-top-broadcast');
      trackEl = document.getElementById('kaola-broadcast-track');
      return;
    }

    container = document.createElement('div');
    container.id = 'kaola-top-broadcast';
    container.className = 'kaola-top-broadcast';
    container.innerHTML = `
      <div class="kaola-broadcast-bar" id="kaola-broadcast-bar" title="Rê chuột để dừng đọc, nhấn để mở liên kết">
        <div class="kaola-broadcast-label">
          <span class="kaola-broadcast-icon">📢</span>
          <span class="kaola-broadcast-tag">THÔNG BÁO</span>
        </div>
        <div class="kaola-broadcast-viewport" id="kaola-broadcast-viewport">
          <div class="kaola-broadcast-track" id="kaola-broadcast-track"></div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    trackEl = document.getElementById('kaola-broadcast-track');

    bindTrackEvents();
    renderTickerItems();
  }

  function renderTickerItems() {
    if (!trackEl) return;

    const activeList = broadcasts.filter(b => b.active !== false && (b.text || '').trim().length > 0);

    if (activeList.length === 0) {
      if (container) container.classList.add('hidden');
      return;
    }

    if (container) container.classList.remove('hidden');

    // Để dòng chữ chạy liên tục vô tận (seamless 50% translation loop), nhân đôi danh sách
    // Nếu danh sách ngắn (1-2 mục), nhân 3 hoặc 4 để dải băng đủ dài và mượt mà
    let repeatCount = 2;
    if (activeList.length === 1) repeatCount = 4;
    else if (activeList.length === 2) repeatCount = 3;

    let totalChars = 0;
    let html = '';

    for (let r = 0; r < repeatCount; r++) {
      activeList.forEach((item) => {
        const text = escapeHtml(item.text || '');
        const url = escapeHtml(item.url || '');
        totalChars += (item.text || '').length;

        html += `
          <span class="kaola-broadcast-item" data-url="${url}" title="${text}">
            <span>${text}</span>
          </span>
          <span class="kaola-broadcast-sep">★</span>
        `;
      });
    }

    trackEl.innerHTML = html;

    // Tính toán thời gian animation dựa trên độ dài nội dung (tốc độ đọc thoải mái ~35-45px/giây)
    const baseDuration = Math.max(18, Math.round(totalChars * 0.18));
    trackEl.style.animationDuration = baseDuration + 's';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function handleAction(url) {
    try {
      const targetUrl = url && url.startsWith('http') ? url : 'https://id.kaola.vn';
      window.open(targetUrl, '_blank');
    } catch (e) {
      if (window.KaolaAccount && typeof window.KaolaAccount.openModal === 'function') {
        window.KaolaAccount.openModal();
      }
    }
  }

  function bindTrackEvents() {
    if (!trackEl) return;

    trackEl.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.kaola-broadcast-item');
      if (!itemEl) return;
      const url = itemEl.getAttribute('data-url');
      handleAction(url);
    });
  }

  // Tải cấu hình thông báo thời gian thực từ máy chủ SaaS (chung điểm đến với banner)
  async function fetchRemoteBroadcasts() {
    try {
      const endpoints = [
        'https://work.kaola.vn/api/v1/office/init',
        'https://kaola.vn/api/v1/office/init'
      ];
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { 
            method: 'GET', 
            cache: 'no-cache',
            signal: AbortSignal.timeout ? AbortSignal.timeout(1200) : undefined
          });
          if (resp.ok) {
            const data = await resp.json();
            const list = data.broadcasts || (Array.isArray(data) ? data : null);
            if (Array.isArray(list) && list.length > 0) {
              const activeItems = list.filter(b => b.active !== false);
              if (activeItems.length > 0) {
                broadcasts = activeItems;
                renderTickerItems();
                break;
              }
            } else if (data.announcement && data.announcement.message) {
              broadcasts = [{
                id: 'announcement_main',
                badge: 'THÔNG BÁO',
                icon: '📢',
                text: data.announcement.message,
                action: 'portal',
                active: data.announcement.enabled !== false
              }];
              renderTickerItems();
              break;
            }
          }
        } catch (err) {}
      }
    } catch (e) {}
  }

  function init() {
    createBroadcastUI();
    // Trì hoãn gọi mạng sau khi giao diện đã sẵn sàng
    setTimeout(fetchRemoteBroadcasts, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API điều khiển toàn cục cho phép đồng bộ tức thì từ kaola_ads.js hoặc SaaS
  window.KaolaBroadcast = {
    setBroadcasts: function (items) {
      if (Array.isArray(items)) {
        broadcasts = items.filter(b => b.active !== false);
        renderTickerItems();
      }
    },
    setAnnouncement: function (text) {
      if (text && typeof text === 'string') {
        broadcasts = [{
          id: 'manual_notice',
          badge: 'THÔNG BÁO',
          icon: '📢',
          text: text,
          action: 'portal',
          active: true
        }];
        renderTickerItems();
      }
    },
    hide: function () {
      if (container) container.classList.add('hidden');
    },
    show: function () {
      if (container) container.classList.remove('hidden');
    }
  };
})();

