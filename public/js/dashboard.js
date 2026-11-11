/**
 * Kaola Office - Desktop-Matched Web Dashboard Controller
 * Quản lý giao diện màn hình chính, bộ tạo tài liệu, kho mẫu & kết nối máy chủ
 * Bắt buộc đăng nhập tài khoản Kaola ID để lưu trữ và bảo vệ tài liệu
 */

(function () {
  'use strict';

  const DEFAULT_DOC_SERVER = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'https://docs.kaola.vn'
    : 'http://localhost:8080';
  let allDocuments = [];

  // Danh mục 15+ Mẫu văn bản chuẩn Nghị định 30 & Nghiệp vụ Việt Nam
  const TEMPLATES = [
    { id: 'to-trinh-nd30', name: 'Tờ trình Phê duyệt Kế hoạch', type: 'word', file: 'To_trinh_ND30.docx', cat: 'nd30', badge: 'Chuẩn NĐ 30', desc: 'Mẫu Tờ trình phê duyệt dự án, kế hoạch công tác và ngân sách nội bộ.' },
    { id: 'quyet-dinh-nd30', name: 'Quyết định Ban hành Quy chế', type: 'word', file: 'Quyet_dinh_ND30.docx', cat: 'nd30', badge: 'Chuẩn NĐ 30', desc: 'Quyết định của Ban Giám đốc ban hành quy định, quy chế hoạt động.' },
    { id: 'cong-van-nd30', name: 'Công văn Điều hành Công việc', type: 'word', file: 'Cong_van_ND30.docx', cat: 'nd30', badge: 'Chuẩn NĐ 30', desc: 'Công văn gửi đối tác hoặc cơ quan quản lý nhà nước đúng thể thức.' },
    { id: 'bien-ban-hop-nd30', name: 'Biên bản Cuộc họp Ban Lãnh đạo', type: 'word', file: 'Bien_ban_hop_ND30.docx', cat: 'nd30', badge: 'Chuẩn NĐ 30', desc: 'Biên bản ghi nhận chi tiết ý kiến thảo luận và kết luận phân công.' },
    { id: 'giay-uy-quyen-nd30', name: 'Giấy Ủy quyền Đại diện Pháp luật', type: 'word', file: 'Giay_uy_quyen_ND30.docx', cat: 'nd30', badge: 'Chuẩn NĐ 30', desc: 'Giấy ủy quyền giải quyết công việc, ký kết văn bản và hợp đồng.' },
    { id: 'hop-dong-lao-dong', name: 'Hợp đồng Lao động 2026', type: 'word', file: 'Hop_dong_lao_dong_2026.docx', cat: 'contract', badge: 'Hợp đồng', desc: 'Chuẩn Bộ luật Lao động, đầy đủ quyền lợi, bảo hiểm, tiền lương.' },
    { id: 'hop-dong-dich-vu', name: 'Hợp đồng Cung cấp Dịch vụ', type: 'word', file: 'Hop_dong_cung_cap_dich_vu.docx', cat: 'contract', badge: 'Hợp đồng', desc: 'Hợp đồng cung ứng dịch vụ phần mềm, thương mại và chuyển giao công nghệ.' },
    { id: 'thoa-thuan-nda', name: 'Thỏa thuận Bảo mật Thông tin (NDA)', type: 'word', file: 'Thoa_thuan_bao_mat_NDA.docx', cat: 'contract', badge: 'Bảo mật', desc: 'Thỏa thuận Non-Disclosure Agreement bảo vệ bí mật kinh doanh và dữ liệu.' },
    { id: 'don-xin-nghi-phep', name: 'Đơn xin Nghỉ phép', type: 'word', file: 'Don_xin_nghi_phep.docx', cat: 'hr', badge: 'Nhân sự', desc: 'Mẫu đơn xin nghỉ phép năm, việc riêng có bàn giao công việc.' },
    { id: 'bang-tinh-doanh-thu', name: 'Báo cáo Doanh thu & Chi phí Q3', type: 'cell', file: 'Bang_tinh_doanh_thu.xlsx', cat: 'excel', badge: 'Excel', desc: 'Bảng tính tự động hóa công thức doanh thu, giá vốn, lãi gộp và biểu đồ.' },
    { id: 'bang-cham-cong', name: 'Bảng Chấm công & Tính lương', type: 'cell', file: 'Bang_cham_cong_tinh_luong.xlsx', cat: 'excel', badge: 'Excel', desc: 'Bảng theo dõi chấm công tháng, tính BHXH, thuế TNCN và thực lĩnh.' },
    { id: 'so-quy-tien-mat', name: 'Sổ Quỹ Thu Chi Tiền mặt', type: 'cell', file: 'So_quy_thu_chi_tien_mat.xlsx', cat: 'excel', badge: 'Excel', desc: 'Quản lý thu chi dòng tiền mặt hàng ngày, số dư tức thời.' },
    { id: 'ke-hoach-du-an', name: 'Kế hoạch Tiến độ Dự án (Gantt)', type: 'cell', file: 'Ke_hoach_tien_do_du_an.xlsx', cat: 'excel', badge: 'Excel', desc: 'Theo dõi tiến độ phân chia công việc, milestone và deadline theo tuần.' },
    { id: 'slide-gioi-thieu', name: 'Pitch Deck Giới thiệu Doanh nghiệp', type: 'slide', file: 'Slide_gioi_thieu.pptx', cat: 'ppt', badge: 'Slide', desc: 'Bộ slide thuyết trình năng lực công ty, sản phẩm và chiến lược tăng trưởng.' },
    { id: 'slide-pitch-deck', name: 'Slide Kêu gọi Vốn Đầu tư', type: 'slide', file: 'Slide_pitch_deck_kinh_doanh.pptx', cat: 'ppt', badge: 'Slide', desc: 'Bộ slide pitching chuyên nghiệp cho các cuộc gọi vốn nhà đầu tư.' }
  ];

  // Khởi động
  document.addEventListener('DOMContentLoaded', () => {
    initServerConfig();
    initAuthObserver();
    initModals();
    initTemplates();
    initTicker();
    setupEventListeners();
    renderConnectedClouds();
  });

  // 1. Quản lý Đăng nhập & Xác thực Kaola ID
  function getCurrentUser() {
    if (window.KaolaAccount && typeof window.KaolaAccount.getUser === 'function') {
      const u = window.KaolaAccount.getUser();
      if (u && (u.email || u.name || u.id)) return u;
    }
    try {
      const raw = localStorage.getItem('kaola_account_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.email || u.name || u.id)) return u;
      }
    } catch (e) {}
    return null;
  }

  function getUserId() {
    const u = getCurrentUser();
    if (!u) return '';
    return u.id ? String(u.id) : (u.email ? u.email.replace(/[^a-zA-Z0-9_\-]/g, '_') : '');
  }

  let lastAuthUserId = undefined;
  let lastAuthSnapshot = undefined;

  function updateAuthUI() {
    const user = getCurrentUser();
    const currentId = user ? (user.id ? String(user.id) : (user.email || 'user')) : null;
    const isVip = !!(user && user.is_vip);
    const authSnapshot = user ? `${currentId}|${user.name || ''}|${user.email || ''}|${isVip}` : 'guest';

    if (authSnapshot === lastAuthSnapshot) {
      return;
    }
    lastAuthSnapshot = authSnapshot;

    const btnLogin = document.getElementById('btn-header-login');
    const userBadge = document.getElementById('account-user-badge');
    const userName = document.getElementById('header-user-name');
    const userAvatar = document.getElementById('header-user-avatar');
    const recentTable = document.getElementById('recent-table');
    const authGateBox = document.getElementById('auth-gate-box');

    // Nút Tài khoản / Đăng nhập / Kaola Pro ở thanh Menu trái
    const navAuth = document.getElementById('nav-item-auth') || document.getElementById('nav-item-pro');
    const navAuthIcon = document.getElementById('nav-auth-icon-wrap');
    const navAuthLabel = document.getElementById('nav-auth-label');

      if (user) {
        // Đã đăng nhập: Chuyển nút góc trái sang tên người dùng (Icon 4 ô màu + tên tài khoản khớp Desktop)
        if (btnLogin) btnLogin.style.display = 'none';
        if (userBadge) userBadge.style.display = 'none';
        const displayName = user.name || (user.email ? user.email.split('@')[0] : 'admin');
        if (userName) userName.innerText = displayName;
        if (userAvatar) userAvatar.innerText = (user.name || user.email || 'K').charAt(0).toUpperCase();

        if (navAuth) {
          navAuth.classList.add('pro');
          const isVip = !!user.is_vip;
          navAuth.title = 'Tài khoản Kaola ID (' + displayName + ') - Nhấn để quản lý';
          if (navAuthLabel) navAuthLabel.innerText = displayName;
          if (navAuthIcon) {
          navAuthIcon.innerHTML = `
            <svg viewBox="0 0 28 28" fill="none" style="width:24px; height:24px;">
              <circle cx="14" cy="13" r="10.5" stroke="#f59e0b" stroke-width="1.8" fill="#ffffff"></circle>
              <rect x="8" y="7.5" width="4.5" height="4.5" rx="1" fill="#2563eb"></rect>
              <rect x="14.5" y="7.5" width="4.5" height="4.5" rx="1" fill="#16a34a"></rect>
              <rect x="8" y="13.5" width="4.5" height="4.5" rx="1" fill="#ea580c"></rect>
              <rect x="14.5" y="13.5" width="4.5" height="4.5" rx="1" fill="#dc2626"></rect>
              <polygon points="21,17 22.3,19.8 25.3,20.2 23.1,22.3 23.6,25.3 21,23.9 18.4,25.3 18.9,22.3 16.7,20.2 19.7,19.8" fill="#f59e0b" stroke="#ffffff" stroke-width="0.75"></polygon>
            </svg>
          `;
        }
      }

      if (authGateBox) authGateBox.style.display = 'none';
      if (recentTable) recentTable.style.display = 'table';

      // Chỉ tải lại tài liệu khi user thay đổi
      if (lastAuthUserId !== currentId) {
        lastAuthUserId = currentId;
        loadDocuments();
      }
    } else {
      // Chưa đăng nhập: Chuyển nút góc trái sang "Đăng nhập" (Icon User) & ẩn nút góc phải
      if (btnLogin) btnLogin.style.display = 'none';
      if (userBadge) userBadge.style.display = 'none';

      if (navAuth) {
        navAuth.classList.remove('pro');
        navAuth.title = 'Đăng nhập tài khoản Kaola ID';
        if (navAuthLabel) navAuthLabel.innerText = 'Tài khoản';
        if (navAuthIcon) {
          navAuthIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          `;
        }
      }

      if (authGateBox) authGateBox.style.display = 'block';
      if (recentTable) recentTable.style.display = 'none';
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.style.display = 'none';

      lastAuthUserId = null;
    }

    renderConnectedClouds();
  }

  function initAuthObserver() {
    updateAuthUI();
    window.addEventListener('storage', updateAuthUI);
    setInterval(updateAuthUI, 2000);
  }

  function requireLogin(callback) {
    const user = getCurrentUser();
    if (!user) {
      if (window.KaolaAccount && typeof window.KaolaAccount.openModal === 'function') {
        window.KaolaAccount.openModal('login');
      } else {
        alert("Vui lòng đăng nhập tài khoản Kaola ID để thực hiện chức năng này!");
      }
      return false;
    }
    if (typeof callback === 'function') {
      callback(user);
    }
    return true;
  }

  // 2. Cấu hình & Kiểm tra Máy chủ Document Server (Dùng fetch ngắt nhanh, không treo trình duyệt)
  function initServerConfig() {
    let serverUrl = localStorage.getItem('kaola_doc_server');
    if (!serverUrl) {
      serverUrl = DEFAULT_DOC_SERVER;
      localStorage.setItem('kaola_doc_server', serverUrl);
    }

    const input = document.getElementById('server-url-input');
    if (input) input.value = serverUrl;

    checkServerHealth(serverUrl);
  }

  function checkServerHealth(serverUrl) {
    const statusDot = document.getElementById('server-status-dot');
    const statusText = document.getElementById('server-status-text');

    if (!statusDot || !statusText) return;

    statusDot.className = 'server-dot warning';
    statusText.innerText = 'Kiểm tra...';

    const testUrl = serverUrl.replace(/\/+$/, '') + '/web-apps/apps/api/documents/api.js';

    // Dùng AbortController ngắt kết nối sau 1.2s thay vì chèn thẻ <script> làm treo tab trình duyệt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 1200);

    fetch(testUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    }).then(() => {
      clearTimeout(timeoutId);
      statusDot.className = 'server-dot';
      statusText.innerText = 'Máy chủ: Sẵn sàng';
    }).catch(() => {
      clearTimeout(timeoutId);
      statusDot.className = 'server-dot warning';
      statusText.innerText = 'Máy chủ: Docker Chưa Bật (Bấm cấu hình)';
    });
  }

  // 3. Tải danh sách tài liệu cá nhân của người dùng
  async function loadDocuments() {
    const userId = getUserId();
    const tableBody = document.getElementById('recent-table-body');
    const emptyState = document.getElementById('empty-state');
    if (!tableBody) return;

    if (!userId) {
      tableBody.innerHTML = '';
      return;
    }

    try {
      const res = await fetch(`/api/documents.php?action=list&user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.documents)) {
        allDocuments = data.documents;
        renderDocuments();
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách tài liệu:', err);
    }
  }

  function renderDocuments() {
    const tableBody = document.getElementById('recent-table-body');
    const emptyState = document.getElementById('empty-state');
    if (!tableBody) return;

    if (allDocuments.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = allDocuments.map(doc => {
      const iconInfo = getFormatIcon(doc.type);
      const relativeTime = formatRelativeTime(doc.updatedAt);
      const locationPath = getLocationPath(doc.name, doc.type);

      return `
        <tr class="recent-row" onclick="window.openEditor('${encodeURIComponent(doc.name)}', '${doc.type}')">
          <td>
            <div class="doc-name-cell">
              <div class="format-icon ${doc.type}">${iconInfo.text}</div>
              <span title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
            </div>
          </td>
          <td class="doc-location" title="${locationPath}">${locationPath}</td>
          <td class="doc-time">${relativeTime}</td>
          <td class="doc-actions-col" onclick="event.stopPropagation()">
            <div class="doc-actions-wrap">
              <button class="btn-table-action" title="Mở trong trình biên tập" onclick="window.openEditor('${encodeURIComponent(doc.name)}', '${doc.type}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <a class="btn-table-action" title="Tải xuống máy tính" href="${doc.url}" download="${doc.name}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </a>
              <button class="btn-table-action delete" title="Xóa tài liệu" onclick="window.deleteDoc('${encodeURIComponent(doc.name)}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getFormatIcon(type) {
    switch (type) {
      case 'word': return { text: 'W' };
      case 'cell': return { text: 'X' };
      case 'slide': return { text: 'P' };
      case 'pdf': return { text: 'PDF' };
      default: return { text: 'DOC' };
    }
  }

  function getLocationPath(fileName, type) {
    if (fileName.includes('ND30') || fileName.includes('Nghi_dinh')) {
      return 'Kaola Cloud / Văn bản Nghị định 30';
    }
    if (fileName.includes('Hop_dong') || fileName.includes('NDA')) {
      return 'Kaola Cloud / Hợp đồng & Pháp lý';
    }
    return 'Kaola Cloud / Lưu trữ cá nhân';
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Gần đây';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `Hôm nay, ${new Date(timestamp * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800) return 'Hôm qua';
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(timestamp * 1000).toLocaleDateString('vi-VN');
  }

  // 4. Tạo tài liệu mới (Bắt buộc kiểm tra Đăng nhập)
  window.createNewDoc = async function (type, template = '') {
    if (!requireLogin()) return;

    const defaultNames = {
      'word': 'Tai_lieu_moi.docx',
      'cell': 'Bang_tinh_moi.xlsx',
      'slide': 'Bai_trinh_chieu_moi.pptx',
      'pdf': 'Tai_lieu_moi.pdf'
    };

    let docName = prompt("Nhập tên tài liệu:", template ? template : (defaultNames[type] || 'Van_ban_moi.docx'));
    if (!docName) return;

    try {
      const formData = new FormData();
      formData.append('action', 'create');
      formData.append('type', type);
      formData.append('name', docName);
      formData.append('user_id', getUserId());
      if (template) formData.append('template', template);

      const res = await fetch('/api/documents.php', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success && data.document) {
        window.openEditor(encodeURIComponent(data.document.name), data.document.type);
      } else {
        alert("Lỗi tạo tài liệu: " + (data.message || "Không xác định"));
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    }
  };

  // 5. Mở Editor
  window.openEditor = function (fileName, type) {
    if (!requireLogin()) return;
    const serverUrl = localStorage.getItem('kaola_doc_server') || DEFAULT_DOC_SERVER;
    const userId = getUserId();
    window.location.href = `/editor.html?file=${fileName}&type=${type || 'word'}&user_id=${encodeURIComponent(userId)}&server=${encodeURIComponent(serverUrl)}`;
  };

  // 6. Xóa tài liệu
  window.deleteDoc = async function (fileName) {
    if (!requireLogin()) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${decodeURIComponent(fileName)}"?`)) return;

    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('filename', decodeURIComponent(fileName));
      formData.append('user_id', getUserId());

      const res = await fetch('/api/documents.php', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        loadDocuments();
      } else {
        alert("Lỗi khi xóa: " + data.message);
      }
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  // 7. Kho mẫu văn bản (Templates Modal)
  function initTemplates() {
    const grid = document.getElementById('templates-modal-grid');
    if (!grid) return;

    renderTemplateItems('all');

    const tabs = document.querySelectorAll('.tmpl-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-category');
        renderTemplateItems(cat);
      });
    });
  }

  function renderTemplateItems(category) {
    const grid = document.getElementById('templates-modal-grid');
    if (!grid) return;

    const filtered = category === 'all' 
      ? TEMPLATES 
      : TEMPLATES.filter(t => t.cat === category);

    grid.innerHTML = filtered.map(item => `
      <div class="tmpl-card" onclick="createFromTemplate('${item.type}', '${item.file}')">
        <span class="tmpl-badge ${item.cat}">${item.badge}</span>
        <div class="tmpl-name">${item.name}</div>
        <div class="tmpl-desc">${item.desc}</div>
      </div>
    `).join('');
  }

  window.createFromTemplate = function (type, file) {
    if (!requireLogin()) return;
    closeModal('templates-modal');
    window.createNewDoc(type, file);
  };

  // 8. Modals helper
  function initModals() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    const closeButtons = document.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });
  }

  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  // 9. Ticker Runner
  function initTicker() {
    const track = document.getElementById('topbar-ticker-track');
    if (!track) return;

    const announcements = [
      'Nâng cấp Kaola Pro: Mở khóa không giới hạn AI Copilot & đồng bộ đám mây Kaola Drive.',
      'Kaola AI Copilot: Tự động soạn thảo văn bản chuẩn Nghị định 30/2020/NĐ-CP & sửa lỗi chính tả.',
      'Đã cập nhật 15+ Mẫu văn bản chuẩn Nghị định 30, Hợp đồng & Báo cáo doanh nghiệp.',
      'Hệ sinh thái ứng dụng văn phòng Kaola Office - id.kaola.vn & kaolastore.vn.'
    ];

    let html = '';
    for (let r = 0; r < 2; r++) {
      announcements.forEach(text => {
        html += `
          <span class="ticker-item" onclick="window.KaolaAccount && window.KaolaAccount.openUpgradeModal && window.KaolaAccount.openUpgradeModal()">
            <span>${escapeHtml(text)}</span>
          </span>
          <span class="ticker-sep">★</span>
        `;
      });
    }

    track.innerHTML = html;
  }

  // 10. Event Listeners
  function setupEventListeners() {
    // Logo thương hiệu: Click để quay về trang chủ
    const brandLink = document.querySelector('.sidebar-brand');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.switchView('home');
      });
    }

    // Menu trái: Trang chủ
    const btnNavHome = document.getElementById('nav-item-home');
    if (btnNavHome) {
      btnNavHome.addEventListener('click', () => {
        window.switchView('home');
      });
    }

    // Menu trái: Mở file (Bắt buộc đăng nhập)
    const btnNavOpen = document.getElementById('nav-item-open');
    const fileInput = document.getElementById('file-upload-input');
    if (btnNavOpen && fileInput) {
      btnNavOpen.addEventListener('click', () => {
        if (requireLogin()) {
          fileInput.click();
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!requireLogin()) return;

        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('user_id', getUserId());

        try {
          const res = await fetch('/api/documents.php', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success && data.document) {
            loadDocuments();
            window.openEditor(encodeURIComponent(data.document.name), data.document.type);
          } else {
            alert("Lỗi tải lên: " + (data.message || ""));
          }
        } catch (err) {
          alert("Lỗi tải tệp: " + err.message);
        }
      });
    }

    // Menu trái: Mẫu văn bản (Chuyển sang giao diện Mẫu chuẩn Desktop)
    const btnNavTemplates = document.getElementById('nav-item-templates');
    if (btnNavTemplates) {
      btnNavTemplates.addEventListener('click', () => {
        window.switchView('templates');
      });
    }

    // Menu trái: Kết nối (Đám mây - Chuẩn bản gốc Desktop)
    const btnNavCloud = document.getElementById('nav-item-cloud');
    if (btnNavCloud) {
      btnNavCloud.addEventListener('click', () => {
        window.switchView('connect');
      });
    }

    // Menu trái: Kaola AI
    const btnNavAI = document.getElementById('nav-item-ai');
    if (btnNavAI) {
      btnNavAI.addEventListener('click', () => {
        if (window.KaolaAccount && typeof window.KaolaAccount.openUpgradeModal === 'function') {
          window.KaolaAccount.openUpgradeModal();
        } else {
          openModal('cloud-modal');
        }
      });
    }

    // Menu trái: Đăng nhập (khi chưa login) hoặc Kaola Pro / Quản lý tài khoản (khi đã login)
    const btnNavAuth = document.getElementById('nav-item-auth') || document.getElementById('nav-item-pro');
    if (btnNavAuth) {
      btnNavAuth.addEventListener('click', () => {
        const user = getCurrentUser();
        if (!user) {
          if (window.KaolaAccount && typeof window.KaolaAccount.openModal === 'function') {
            window.KaolaAccount.openModal('login');
          } else {
            requireLogin();
          }
        } else {
          if (window.KaolaAccount && typeof window.KaolaAccount.openUpgradeModal === 'function') {
            window.KaolaAccount.openUpgradeModal();
          } else if (window.KaolaAccount && typeof window.KaolaAccount.openModal === 'function') {
            window.KaolaAccount.openModal();
          }
        }
      });
    }

    // Menu trái: Cài đặt máy chủ
    const btnNavSettings = document.getElementById('nav-item-settings');
    const btnServerStatus = document.getElementById('btn-server-status');
    if (btnNavSettings) {
      btnNavSettings.addEventListener('click', () => openModal('server-modal'));
    }
    if (btnServerStatus) {
      btnServerStatus.addEventListener('click', () => openModal('server-modal'));
    }

    // Menu trái: Về ứng dụng
    const btnNavAbout = document.getElementById('nav-item-about');
    if (btnNavAbout) {
      btnNavAbout.addEventListener('click', () => openModal('about-modal'));
    }

    // Lưu cấu hình Server
    const btnSaveServer = document.getElementById('btn-save-server');
    if (btnSaveServer) {
      btnSaveServer.addEventListener('click', () => {
        const input = document.getElementById('server-url-input');
        if (input) {
          let url = input.value.trim().replace(/\/+$/, '');
          if (!url) url = DEFAULT_DOC_SERVER;
          localStorage.setItem('kaola_doc_server', url);
          checkServerHealth(url);
          closeModal('server-modal');
        }
      });
    }
  }

  // ==========================================
  // 11. Quản lý Kết nối Đám mây (Connect to Cloud View)
  // ==========================================
  const CLOUD_PROVIDERS = {
    box: {
      id: 'box',
      name: 'Box',
      type: 'oauth',
      domain: 'box.com',
      accountLabel: 'Tài khoản Box (Email):',
      accountPlaceholder: 'user@box.com',
      desc: 'Kết nối tài khoản Box để chỉnh sửa trực tuyến và lưu trữ tài liệu an toàn.',
      iconSvg: '<svg viewBox="0 0 40 22" fill="none" style="width:36px; height:20px;"><text x="0" y="17" fill="#0061d5" font-family="\'Roboto\', -apple-system, sans-serif" font-weight="900" font-size="20" letter-spacing="-0.5px">box</text></svg>'
    },
    dropbox: {
      id: 'dropbox',
      name: 'Dropbox',
      type: 'oauth',
      domain: 'dropbox.com',
      accountLabel: 'Tài khoản Dropbox (Email):',
      accountPlaceholder: 'user@dropbox.com',
      desc: 'Kết nối tài khoản Dropbox để đồng bộ và mở tệp tin tức thì.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="#0061fe" style="width:22px; height:22px;"><path d="M6 3.5L0 7.5L6 11.5L12 7.5L6 3.5ZM18 3.5L12 7.5L18 11.5L24 7.5L18 3.5ZM0 15.5L6 19.5L12 15.5L6 11.5L0 15.5ZM24 15.5L18 11.5L12 15.5L18 19.5L24 15.5ZM6 21L12 17L18 21L12 24.5L6 21Z"/></svg>'
    },
    nextcloud: {
      id: 'nextcloud',
      name: 'Nextcloud',
      type: 'server',
      domain: 'Nextcloud Hub',
      urlPlaceholder: 'https://nextcloud.yourdomain.com',
      accountLabel: 'Tên tài khoản Nextcloud:',
      accountPlaceholder: 'admin hoặc username',
      desc: 'Đồng bộ hóa với máy chủ lưu trữ Nextcloud On-Premise hoặc đám mây riêng của doanh nghiệp.',
      iconSvg: '<svg viewBox="0 0 28 24" fill="none" style="width:26px; height:22px;"><circle cx="14" cy="12" r="5.5" stroke="#0082c9" stroke-width="2.5"/><circle cx="4.5" cy="12" r="3.2" stroke="#0082c9" stroke-width="2.2"/><circle cx="23.5" cy="12" r="3.2" stroke="#0082c9" stroke-width="2.2"/></svg>'
    },
    owncloud: {
      id: 'owncloud',
      name: 'ownCloud',
      type: 'server',
      domain: 'ownCloud Infinite Scale',
      urlPlaceholder: 'https://owncloud.yourdomain.com',
      accountLabel: 'Tài khoản ownCloud:',
      accountPlaceholder: 'username',
      desc: 'Kết nối không gian lưu trữ bảo mật cao ownCloud.',
      iconSvg: '<svg viewBox="0 0 26 20" fill="#1f2d3d" style="width:24px; height:20px;"><path d="M19 6.2C18.4 2.6 15.3 0 11.7 0 8.9 0 6.4 1.5 5 3.8 2.3 4.2 0.2 6.5 0.2 9.3 0.2 12.5 2.7 15 5.9 15H19c2.8 0 5-2.2 5-5 0-2.6-1.9-4.7-4.5-4.9z"/><circle cx="9" cy="8" r="2" fill="#ffffff" opacity="0.9"/><circle cx="14" cy="8" r="3" fill="#ffffff" opacity="0.9"/><circle cx="18" cy="10" r="2.2" fill="#ffffff" opacity="0.9"/></svg>'
    },
    odoo: {
      id: 'odoo',
      name: 'Odoo',
      type: 'server',
      domain: 'Odoo ERP Documents',
      urlPlaceholder: 'https://erp.yourdomain.com',
      accountLabel: 'Tài khoản / Email Odoo:',
      accountPlaceholder: 'admin@company.com',
      desc: 'Tích hợp bộ phần mềm quản trị doanh nghiệp Odoo Documents.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" style="width:22px; height:22px;"><circle cx="12" cy="12" r="8.5" stroke="#714b67" stroke-width="3"/><circle cx="12" cy="12" r="2.8" fill="#714b67"/></svg>'
    },
    moodle: {
      id: 'moodle',
      name: 'Moodle',
      type: 'server',
      domain: 'Moodle LMS',
      urlPlaceholder: 'https://lms.university.edu.vn',
      accountLabel: 'Tài khoản Moodle:',
      accountPlaceholder: 'giangvien / hocvien',
      desc: 'Kết nối hệ thống quản lý học tập Moodle LMS để soạn bài giảng & văn bản môn học.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="#f98012" style="width:22px; height:22px;"><path d="M12 3L1 8.5L12 14L21 9.5V16H23V8.5L12 3ZM5 12.2V16.5C5 18.5 8.1 20.5 12 20.5C15.9 20.5 19 18.5 19 16.5V12.2L12 15.7L5 12.2Z"/><path d="M10 10.5c-.8 0-1.5.5-1.5 1.5v3h1.2v-2.2c0-.5.4-.8.8-.8s.8.3.8.8v2.2h1.2v-2.2c0-.5.4-.8.8-.8s.8.3.8.8v2.2h1.2v-3c0-1-.7-1.5-1.5-1.5-.7 0-1.2.4-1.5.9-.3-.5-.8-.9-1.5-.9z" fill="#ffffff"/></svg>'
    },
    kdrive: {
      id: 'kdrive',
      name: 'infomaniak kDrive',
      type: 'server',
      domain: 'kdrive.infomaniak.com',
      urlPlaceholder: 'https://kdrive.infomaniak.com',
      accountLabel: 'Tài khoản kDrive:',
      accountPlaceholder: 'user@domain.com',
      desc: 'Dịch vụ lưu trữ đám mây bảo mật chuẩn Thụy Sĩ infomaniak kDrive.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" style="width:22px; height:22px;"><path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" fill="#0098ff"/><path d="M10 10.5v5m3.5-5l-3.5 2.5 3.5 2.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    liferay: {
      id: 'liferay',
      name: 'Liferay',
      type: 'server',
      domain: 'Liferay Portal',
      urlPlaceholder: 'https://portal.yourdomain.com',
      accountLabel: 'Tài khoản Liferay:',
      accountPlaceholder: 'admin@portal.com',
      desc: 'Nền tảng cổng thông tin số doanh nghiệp Liferay Digital Experience Platform.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="#0b5fff" style="width:22px; height:22px;"><rect width="24" height="24" rx="4"/><rect x="4" y="4" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="10" y="4" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="16" y="4" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="4" y="10" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="10" y="10" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="16" y="10" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="4" y="16" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="10" y="16" width="4.2" height="4.2" rx="1" fill="#ffffff"/><rect x="16" y="16" width="4.2" height="4.2" rx="1" fill="#ffffff"/></svg>'
    },
    seafile: {
      id: 'seafile',
      name: 'Seafile',
      type: 'server',
      domain: 'Seafile Server',
      urlPlaceholder: 'https://seafile.yourdomain.com',
      accountLabel: 'Tài khoản Seafile:',
      accountPlaceholder: 'user@domain.com',
      desc: 'Hệ thống lưu trữ đám mây mã nguồn mở hiệu năng cao Seafile.',
      iconSvg: '<svg viewBox="0 0 24 24" fill="#fbb03b" style="width:22px; height:22px;"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 16.5l-3.2-3.2 1.3-1.3 1.9 1.9 4.6-4.6 1.3 1.3-5.9 5.9z"/></svg>'
    }
  };

  function getConnectedClouds() {
    try {
      const raw = localStorage.getItem('kaola_connected_clouds');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {}
    return [];
  }

  function saveConnectedClouds(list) {
    try {
      localStorage.setItem('kaola_connected_clouds', JSON.stringify(list));
    } catch (e) {}
  }

  function renderConnectedClouds() {
    const user = getCurrentUser();
    const driveSubtext = document.getElementById('kaola-drive-subtext');
    const driveAction = document.getElementById('kaola-drive-action');

    // Cập nhật card mặc định drive.kaola.vn
    if (driveSubtext && driveAction) {
      if (user) {
        const displayName = user.name || (user.email ? user.email.split('@')[0] : 'admin');
        const displayEmail = user.email || 'admin@kaola.vn';
        driveSubtext.innerText = `${displayName} (${displayEmail})`;
        driveAction.innerHTML = '<span class="cloud-badge-connected">Đã kết nối</span>';
      } else {
        driveSubtext.innerText = 'Chưa đăng nhập Kaola ID - Nhấn để liên kết tài khoản';
        driveAction.innerHTML = '<button type="button" class="btn-cloud-connect" onclick="window.KaolaAccount && window.KaolaAccount.openModal && window.KaolaAccount.openModal(\'login\');" style="color:#2563eb; font-weight:600;">Đăng nhập</button>';
      }
    }

    // Render các đám mây do người dùng tự kết nối thêm
    const container = document.getElementById('custom-connected-clouds');
    if (!container) return;

    const connectedList = getConnectedClouds();
    if (connectedList.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    connectedList.forEach(item => {
      const p = CLOUD_PROVIDERS[item.provider] || {
        name: item.name || item.provider,
        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>'
      };

      const domainDisplay = item.serverUrl ? item.serverUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : (p.name || 'Cloud');
      const accountDisplay = item.account ? `${escapeHtml(item.account)}` : 'Đã xác thực';

      html += `
        <div class="cloud-item-card connected" id="cloud-conn-${item.id}">
          <div class="cloud-item-main">
            <div class="cloud-icon-box">
              ${p.iconSvg}
            </div>
            <div class="cloud-details">
              <div class="cloud-domain">${escapeHtml(domainDisplay)}</div>
              <div class="cloud-subtext">${escapeHtml(accountDisplay)} (${p.name})</div>
            </div>
          </div>
          <div class="cloud-item-action" style="display:flex; align-items:center; gap:10px;">
            <span class="cloud-badge-connected">Đã kết nối</span>
            <button type="button" class="btn-cloud-disconnect" onclick="window.disconnectCloud('${item.id}')" title="Ngắt kết nối đám mây này">Ngắt kết nối</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.switchView = function (viewName) {
    const viewHome = document.getElementById('view-home');
    const viewConnect = document.getElementById('view-connect');
    const viewTemplates = document.getElementById('view-templates');
    const navHome = document.getElementById('nav-item-home');
    const navCloud = document.getElementById('nav-item-cloud');
    const navTemplates = document.getElementById('nav-item-templates');

    // Ẩn tất cả view
    if (viewHome) viewHome.style.display = 'none';
    if (viewConnect) viewConnect.style.display = 'none';
    if (viewTemplates) viewTemplates.style.display = 'none';

    // Bỏ active tất cả nav items
    if (navHome) navHome.classList.remove('active');
    if (navCloud) navCloud.classList.remove('active');
    if (navTemplates) navTemplates.classList.remove('active');

    if (viewName === 'connect') {
      if (viewConnect) viewConnect.style.display = 'block';
      if (navCloud) navCloud.classList.add('active');
      renderConnectedClouds();
    } else if (viewName === 'templates') {
      if (viewTemplates) viewTemplates.style.display = 'block';
      if (navTemplates) navTemplates.classList.add('active');
    } else {
      if (viewHome) viewHome.style.display = 'block';
      if (navHome) navHome.classList.add('active');
    }
  };

  // Lắng nghe lệnh mở template từ iframe Kho mẫu văn bản (templates/index.html)
  window.addEventListener('message', async function (e) {
    if (!e || !e.data) return;
    const data = e.data;
    if (data.type === 'openTemplate') {
      if (!requireLogin()) return;

      const templateFile = data.name || (data.file ? data.file.split('/').pop() : 'Tai_lieu_mau.docx');
      const ext = templateFile.split('.').pop().toLowerCase();
      let type = 'word';
      if (['xlsx', 'xls', 'ods', 'csv'].includes(ext)) type = 'cell';
      else if (['pptx', 'ppt', 'odp'].includes(ext)) type = 'slide';
      else if (['pdf'].includes(ext)) type = 'pdf';

      const defaultDocName = templateFile.replace(/\.[^/.]+$/, "") + "_" + (new Date().toISOString().slice(0, 10).replace(/-/g, "")) + "." + ext;
      let docName = prompt("Nhập tên tài liệu mới tạo từ mẫu này:", defaultDocName);
      if (!docName) return;

      try {
        const formData = new FormData();
        formData.append('action', 'create');
        formData.append('type', type);
        formData.append('name', docName);
        formData.append('user_id', getUserId());
        formData.append('template', templateFile);

        const res = await fetch('/api/documents.php', {
          method: 'POST',
          body: formData
        });
        const resData = await res.json();
        if (resData.success && resData.document) {
          window.openEditor(encodeURIComponent(resData.document.name), resData.document.type);
        } else {
          alert("Lỗi tạo tài liệu: " + (resData.message || "Không xác định"));
        }
      } catch (err) {
        alert("Lỗi kết nối máy chủ: " + err.message);
      }
    }
  });

  window.openCloudConnectDialog = function (providerId) {
    const p = CLOUD_PROVIDERS[providerId];
    if (!p) return;

    const modalId = 'cloud-connect-modal';
    const form = document.getElementById('cloud-connect-form');
    if (form) form.reset();

    const inpProvider = document.getElementById('conn-provider-id');
    const titleEl = document.getElementById('conn-modal-title');
    const iconEl = document.getElementById('conn-modal-icon');
    const descEl = document.getElementById('conn-modal-desc');
    const groupUrl = document.getElementById('group-conn-url');
    const inpUrl = document.getElementById('conn-input-url');
    const labelAccount = document.getElementById('label-conn-account');
    const inpAccount = document.getElementById('conn-input-account');
    const labelToken = document.getElementById('label-conn-token');
    const inpToken = document.getElementById('conn-input-token');

    if (inpProvider) inpProvider.value = providerId;
    if (titleEl) titleEl.innerText = `Kết nối với ${p.name}`;
    if (iconEl) iconEl.innerHTML = p.iconSvg;
    if (descEl) descEl.innerText = p.desc;

    if (p.type === 'oauth') {
      if (groupUrl) groupUrl.style.display = 'none';
      if (inpUrl) {
        inpUrl.required = false;
        inpUrl.value = '';
      }
      if (labelAccount) labelAccount.innerText = p.accountLabel || 'Tài khoản (Email):';
      if (inpAccount) inpAccount.placeholder = p.accountPlaceholder || 'name@example.com';
      if (labelToken) labelToken.innerText = 'Mã ủy quyền / Access Token (Tùy chọn):';
      if (inpToken) inpToken.placeholder = 'Nhập mã truy cập cá nhân nếu có...';
    } else {
      if (groupUrl) groupUrl.style.display = 'block';
      if (inpUrl) {
        inpUrl.required = true;
        inpUrl.placeholder = p.urlPlaceholder || 'https://cloud.example.com';
        inpUrl.value = p.urlPlaceholder && p.urlPlaceholder.startsWith('https://kdrive') ? p.urlPlaceholder : '';
      }
      if (labelAccount) labelAccount.innerText = p.accountLabel || 'Tên đăng nhập / Tài khoản:';
      if (inpAccount) inpAccount.placeholder = p.accountPlaceholder || 'admin / username';
      if (labelToken) labelToken.innerText = 'Mật khẩu ứng dụng / Token xác thực:';
      if (inpToken) inpToken.placeholder = 'Nhập mật khẩu ứng dụng...';
    }

    openModal(modalId);
  };

  window.submitCloudConnect = function () {
    const providerId = (document.getElementById('conn-provider-id')?.value || '').trim();
    const p = CLOUD_PROVIDERS[providerId];
    if (!p) return;

    const inpUrl = document.getElementById('conn-input-url');
    const inpAccount = document.getElementById('conn-input-account');
    const inpToken = document.getElementById('conn-input-token');

    const serverUrl = inpUrl ? inpUrl.value.trim() : '';
    const account = inpAccount ? inpAccount.value.trim() : '';
    const token = inpToken ? inpToken.value.trim() : '';

    if (!account) {
      alert('Vui lòng nhập tài khoản hoặc email!');
      inpAccount?.focus();
      return;
    }

    if (p.type === 'server' && !serverUrl) {
      alert('Vui lòng nhập địa chỉ máy chủ (Server URL)!');
      inpUrl?.focus();
      return;
    }

    const clouds = getConnectedClouds();
    // Kiểm tra xem đã kết nối cùng server/account chưa
    const existingIndex = clouds.findIndex(c => c.provider === providerId && (p.type === 'server' ? c.serverUrl === serverUrl : c.account === account));

    const cloudData = {
      id: existingIndex >= 0 ? clouds[existingIndex].id : 'cloud_' + Date.now(),
      provider: providerId,
      name: p.name,
      serverUrl: serverUrl,
      account: account,
      hasToken: !!token,
      connectedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      clouds[existingIndex] = cloudData;
    } else {
      clouds.push(cloudData);
    }

    saveConnectedClouds(clouds);
    closeModal('cloud-connect-modal');
    renderConnectedClouds();

    // Thông báo nhanh
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#16a34a; color:#fff; padding:12px 20px; border-radius:8px; font-size:13px; font-weight:500; box-shadow:0 4px 14px rgba(0,0,0,0.15); z-index:99999;';
    toast.innerText = `Đã kết nối thành công với ${p.name}!`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  };

  window.disconnectCloud = function (connId) {
    if (!confirm('Bạn có chắc muốn ngắt kết nối với dịch vụ đám mây này?')) return;

    let clouds = getConnectedClouds();
    clouds = clouds.filter(c => c.id !== connId);
    saveConnectedClouds(clouds);
    renderConnectedClouds();
  };

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

})();
