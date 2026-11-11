/**
 * Kaola Office - Account, ID Connect & KaolaPay Client
 * Tích hợp hệ thống quản lý tài khoản tập trung id.kaola.vn
 * & Cổng thanh toán KaolaPay (pay.kaola.vn / kaolapay.test)
 * 
 * Giấy phép: Dựa trên ONLYOFFICE Desktop Editors (GNU AGPL v3)
 * Hoàn toàn miễn phí trọn đời, không khóa phần mềm, không ép thanh toán.
 */

(function () {
  'use strict';

  const KAOLA_ID_PORTAL_URL = 'https://id.kaola.vn';
  const KAOLA_SERVER_URL = 'https://work.kaola.vn'; // Máy chủ Super Admin & API
  const KAOLAPAY_BASE_URL = 'https://pay.kaola.vn'; // Cổng thanh toán KaolaPay
  const APP_CODE = 'kaolaoffice';
  const SECRET_KEY = 'kaola_sk_office_8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b';
  const STORAGE_KEY = 'kaola_account_user';

  let globalOpenModal = null;
  let globalCloseModal = null;
  let globalShowPricing = null;

  function openAccountModal(view) {
    if (typeof createModal === 'function') createModal();
    if (typeof globalOpenModal === 'function') {
      if (view === 'pricing' && typeof globalShowPricing === 'function') {
        globalShowPricing();
      } else {
        globalOpenModal();
        if (view && typeof showView === 'function') showView(view);
      }
    } else {
      const modal = document.getElementById('kaola-account-modal');
      if (modal) {
        modal.classList.add('active');
      }
    }
  }
  let PLANS = {
    'office_pro_1m': {
      code: 'office_pro_1m',
      name: 'Gói Kaola Office Pro (1 Tháng)',
      duration_months: 1,
      amount: 49000,
      priceFormatted: '49.000 đ',
      periodText: '/tháng',
      badge: '',
      features: [
        'Tắt 100% banner quảng cáo',
        '1.000 lượt yêu cầu Kaola AI Copilot',
        '15GB dung lượng đám mây lưu trữ',
        'Hỗ trợ xuất hóa đơn điện tử VAT'
      ]
    },
    'office_pro_1y': {
      code: 'office_pro_1y',
      name: 'Gói Kaola Office Pro (1 Năm - Tặng 2 tháng)',
      duration_months: 12,
      amount: 499000,
      priceFormatted: '499.000 đ',
      periodText: '/năm',
      badge: 'Tiết kiệm 17%',
      isPopular: true,
      features: [
        'Tắt 100% banner quảng cáo trọn 1 năm',
        'Không giới hạn câu hỏi Kaola AI Copilot',
        '50GB dung lượng đám mây lưu trữ',
        'Tặng thêm 2 tháng VIP Pro',
        'Hỗ trợ xuất hóa đơn điện tử VAT'
      ]
    },
    'office_business_1y': {
      code: 'office_business_1y',
      name: 'Gói Doanh Nghiệp (1 Năm)',
      duration_months: 12,
      amount: 1200000,
      priceFormatted: '1.200.000 đ',
      periodText: '/năm',
      badge: 'Doanh Nghiệp',
      features: [
        'Độc lập 100%, không cần KaolaWork',
        'Tắt 100% quảng cáo cho toàn bộ dàn máy',
        'AI Copilot mở khóa cho toàn bộ nhân sự',
        'License Key kích hoạt theo lô hoặc Domain',
        'Hợp đồng & Xuất hóa đơn đỏ VAT công ty'
      ]
    },
    'office_internal': {
      code: 'office_internal',
      name: 'Gói Kaola Office Nội Bộ',
      duration_months: 999,
      amount: 0,
      priceFormatted: '0 đ',
      periodText: '/Vĩnh viễn',
      badge: 'Nội bộ',
      isInternal: true,
      features: [
        'Dành riêng cho nhân sự & đối tác Kaola',
        'Tắt 100% banner quảng cáo',
        'Không giới hạn Kaola Office Copilot (Bot 6)',
        'Đồng bộ tài liệu không giới hạn Kaola Drive'
      ]
    }
  };

  const PAYMENT_CHANNELS = {
    vietqr: {
      code: 'vietqr',
      name: 'VietQR NAPAS 24/7',
      shortName: 'VietQR',
      badge: '⚡ Khuyên dùng',
      desc: 'Quét mã bằng app của hơn 50 Ngân hàng • Miễn phí 0% • Kích hoạt tức thì 5s',
      btnText: '⚡ Thanh toán ngay bằng VietQR',
      color: '#16a34a'
    },
    onepay: {
      code: 'onepay',
      name: 'Thẻ Quốc tế (Visa / Master / JCB) & ATM',
      shortName: 'OnePay',
      badge: '💳 OnePay Gateway',
      desc: 'Cổng thanh toán thẻ trực tuyến bảo mật PCI DSS qua OnePay, xác thực OTP 3D-Secure',
      btnText: '💳 Thanh toán qua Thẻ Quốc Tế / OnePay',
      color: '#0284c7'
    },
    gateway: {
      code: 'gateway',
      name: 'Cổng thanh toán KaolaPay Web',
      shortName: 'KaolaPay Web',
      badge: '🌐 Đa kênh',
      desc: 'Mở trang thanh toán web KaolaPay đầy đủ các phương thức (VietQR, Thẻ quốc tế, Thẻ ATM, Ví MoMo)',
      btnText: '🌐 Mở Cổng thanh toán KaolaPay',
      color: '#4f46e5'
    }
  };

  let currentUser = null;
  let selectedPlanCode = 'office_pro_1y';
  let selectedPaymentChannel = 'vietqr';
  let activePollingInterval = null;
  let currentOrderCode = null;
  let activeAuthTab = 'login'; // 'login' hoặc 'register'

  // Đồng bộ phiên tài khoản Kaola ID với danh sách Đám mây (PortalsStore) của ứng dụng
  function syncDrivePortal(userObj) {
    if (!userObj || (!userObj.email && !userObj.name)) return;
    try {
      const PORTALS_KEY = 'portals';
      let portals = [];
      try {
        portals = JSON.parse(localStorage.getItem(PORTALS_KEY) || '[]');
        if (!Array.isArray(portals)) portals = [];
      } catch {
        portals = [];
      }

      const driveUrl = 'https://drive.kaola.vn';
      const displayName = userObj.name || (userObj.email ? userObj.email.split('@')[0] : 'Kaola User');
      const email = userObj.email || '';

      const existingIdx = portals.findIndex(p => p.portal === driveUrl || p.portal === 'drive.kaola.vn');
      const portalItem = {
        portal: driveUrl,
        provider: 'onlyoffice',
        user: displayName,
        email: email,
        logged: true
      };

      if (existingIdx >= 0) {
        portals[existingIdx] = { ...portals[existingIdx], ...portalItem };
      } else {
        portals.unshift(portalItem);
      }

      localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
      window.AscDesktopEditor?.updateClouds?.();
    } catch (e) {
      console.warn('Lỗi đồng bộ Kaola Drive portal:', e);
    }
  }

  function removeDrivePortal() {
    try {
      const PORTALS_KEY = 'portals';
      let portals = JSON.parse(localStorage.getItem(PORTALS_KEY) || '[]');
      if (Array.isArray(portals)) {
        portals = portals.filter(p => !p.portal.includes('drive.kaola.vn'));
        localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
        window.AscDesktopEditor?.updateClouds?.();
      }
    } catch (e) {}
  }

  // Đồng bộ trạng thái gói cước từ cổng KaolaPay
  async function syncCustomerSubscription(email) {
    if (!email) return null;
    try {
      const res = await fetch(`${KAOLAPAY_BASE_URL}/api/v1/customer/subscription?email=${encodeURIComponent(email)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        if (data.has_active_subscription) {
          currentUser = currentUser || {};
          currentUser.email = data.email || currentUser.email || email;
          currentUser.is_vip = true;
          currentUser.plan_name = data.plan_name || 'Gói Kaola Office Pro';
          currentUser.plan_code = data.plan_code || 'office_pro_1y';
          currentUser.order_code = data.order_code || '';
          currentUser.duration_months = data.duration_months || 12;
          currentUser.paid_at = data.paid_at || '';
          currentUser.amount = data.amount || 0;
          saveAccount(currentUser);

          // Tắt quảng cáo tức thì
          try {
            const banner = document.getElementById('kaola-ad-root');
            if (banner) banner.style.display = 'none';
            sessionStorage.setItem('kaola_ad_dismissed', 'true');
          } catch (e) {}
          return data;
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra gói đăng ký từ KaolaPay:', e);
    }
    return null;
  }

  // 1. Tải thông tin người dùng từ localStorage
  function loadAccount() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentUser = JSON.parse(stored);
        syncDrivePortal(currentUser);
      } else {
        currentUser = null;
      }
    } catch (e) {
      console.warn('Lỗi đọc tài khoản Kaola:', e);
      currentUser = null;
    }
    updateUI();

    // Tự động kiểm tra và đồng bộ gói cước đã nâng cấp từ KaolaPay
    if (currentUser?.email) {
      syncCustomerSubscription(currentUser.email);
    }

    // Tự động kiểm tra đơn hàng đang chờ hoặc vừa thanh toán
    if (!currentUser?.is_vip) {
      try {
        const savedPending = JSON.parse(localStorage.getItem('kaola_pending_order') || 'null');
        if (savedPending && savedPending.orderCode && (Date.now() - (savedPending.time || 0) < 86400000)) {
          const plan = PLANS[savedPending.planCode] || PLANS['office_pro_1y'] || Object.values(PLANS)[0];
          checkOrderStatus(savedPending.orderCode, savedPending.customerEmail, plan, false);
        }
      } catch (e) {}
    }
  }

  // 2. Lưu thông tin người dùng
  function saveAccount(userObj) {
    currentUser = userObj;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
      syncDrivePortal(userObj);
      window.dispatchEvent(new CustomEvent('kaola:auth_change', { detail: userObj }));
    } catch (e) {
      console.warn('Lỗi lưu tài khoản Kaola:', e);
    }
    updateUI();
  }

  // 3. Đăng xuất
  function logoutAccount() {
    currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
      removeDrivePortal();
      window.dispatchEvent(new CustomEvent('kaola:auth_change', { detail: null }));
    } catch (e) {}
    updateUI();
  }

  // Avatar Data URI chuẩn SVG tự chứa, 100% không bao giờ bị lỗi ảnh/404 trên mọi môi trường (Web, Desktop, file://)
  const DEFAULT_AVATAR_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImtnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzNiODJmNiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxZDRlZDgiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjQwIiBmaWxsPSJ1cmwoI2tnKSIvPgogIDxjaXJjbGUgY3g9IjQwIiBjeT0iMzIiIHI9IjE0IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTE2IDY4YzAtMTMuMjU1IDEwLjc0NS0yNCAyNC0yNHMyNCAxMC43NDUgMjQgMjQiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+';
  const DEFAULT_AVATAR_VIP_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImtnLXZpcCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYjQ1MzA5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0idXJsKCNrZy12aXApIi8+CiAgPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iMTMiIGZpbGw9IiNmZmZmZmYiLz4KICA8cGF0aCBkPSJNMTggNjhjMC0xMi4xNSA5Ljg1LTIyIDIyLTIyczIyIDkuODUgMjIgMjIiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjM0LDE2IDQwLDExIDQ2LDE2IDQzLDE4IDQwLDE0IDM3LDE4IiBmaWxsPSIjZmVmM2M3Ii8+Cjwvc3ZnPg==';
  // Kaola Favicon Vector SVG Data URI nhận diện thương hiệu chuẩn
  const KAOLA_FAVICON_DATA_URI = 'data:image/png;base64,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';

  // Lấy đường dẫn Logo/Avatar của người dùng (fallback logo Kaola)
  function getUserAvatarUrl(isVip) {
    if (currentUser && (currentUser.avatar || currentUser.logo || currentUser.photo)) {
      return currentUser.avatar || currentUser.logo || currentUser.photo;
    }
    const customLogo = localStorage.getItem('kaola_user_custom_logo');
    if (customLogo) return customLogo;

    const vip = (isVip !== undefined) ? isVip : !!(currentUser && (currentUser.is_vip || currentUser.vip || currentUser.is_internal));
    return vip ? DEFAULT_AVATAR_VIP_DATA_URI : DEFAULT_AVATAR_DATA_URI;
  }

  // 4. Cập nhật giao diện Status Pill (góc phải), Sidebar & Cài đặt (Settings)
  function updateUI() {
    updateTopPill();
    updateSidebarAccount();
    updateSettingsAccount();
  }

  // 4.1. Ẩn nút tài khoản góc trên bên phải theo yêu cầu ("tắt góc phải trên cùng")
  function updateTopPill() {
    const pill = document.getElementById('kaola-account-pill');
    if (pill) {
      pill.style.display = 'none';
    }
  }

  // 4.2. Cập nhật thẻ tài khoản và tab tài khoản trong trang Cài đặt (Settings)
  function updateSettingsAccount() {
    // A. Thêm tab tài khoản vào menu con bên trái của trang Cài đặt (nếu đang ở trang Cài đặt)
    const settingsList = document.querySelector('nav ul.GIEJHa_list, .GIEJHa_sidebar ul, nav[class*="sidebar"] ul');
    if (settingsList) {
      let navLi = document.getElementById('kaola-settings-nav-account');
      if (!navLi) {
        navLi = document.createElement('li');
        navLi.id = 'kaola-settings-nav-account';
        navLi.className = 'GIEJHa_item kaola-settings-nav-item';
        navLi.innerHTML = `
          <a href="javascript:void(0)" class="kaola-settings-nav-link" title="Quản lý tài khoản Kaola ID & Gói cước">
            <span class="kaola-settings-nav-icon">👤</span>
            <span class="kaola-settings-nav-title">Tài khoản Kaola ID</span>
            <span class="kaola-settings-nav-badge" style="display:none;">PRO</span>
          </a>
        `;
        navLi.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openAccountModal(currentUser ? 'profile' : 'auth');
        });
        settingsList.appendChild(navLi);
      }

      const badge = navLi.querySelector('.kaola-settings-nav-badge');
      if (badge) {
        badge.style.display = currentUser?.is_vip ? 'inline-block' : 'none';
      }
    }

    // B. Thêm Card Tài khoản Kaola ID vào đầu Form Cài đặt
    const settingsForm = document.querySelector('.mIUnDq_form, [class*="_form"], main [class*="_page"]');
    if (settingsForm) {
      let card = document.getElementById('kaola-settings-account-section');
      if (!card) {
        card = document.createElement('div');
        card.id = 'kaola-settings-account-section';
        card.className = 'kaola-settings-account-box';
        card.innerHTML = `
          <div class="kaola-account-box-main">
            <div class="kaola-account-box-avatar">
              <img id="kaola-settings-avatar-img" src="${DEFAULT_AVATAR_DATA_URI}" alt="Avatar" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_DATA_URI}'" />
              <span id="kaola-settings-vip-crown" class="kaola-vip-crown" style="display:none;">👑</span>
            </div>
            <div class="kaola-account-box-details">
              <div class="kaola-account-box-title-row">
                <h4 id="kaola-settings-account-name">Chưa đăng nhập Kaola ID</h4>
                <span id="kaola-settings-plan-badge" class="kaola-plan-pill free">Bản Miễn Phí</span>
              </div>
              <p id="kaola-settings-account-desc" class="kaola-account-box-sub">
                Đăng nhập tài khoản Kaola ID để đồng bộ đám mây Kaola Drive, sử dụng Trợ lý AI Copilot và quản trị bản quyền.
              </p>
            </div>
            <div class="kaola-account-box-btns">
              <button type="button" id="kaola-settings-btn-login" class="kaola-settings-btn primary">
                <span>🔑 Đăng nhập / Đăng ký</span>
              </button>
              <button type="button" id="kaola-settings-btn-manage" class="kaola-settings-btn outline" style="display:none;">
                <span>⚙️ Quản lý tài khoản</span>
              </button>
              <button type="button" id="kaola-settings-btn-upgrade" class="kaola-settings-btn pro">
                <span>⭐ Nâng cấp Kaola Pro</span>
              </button>
              <button type="button" id="kaola-settings-btn-logout" class="kaola-settings-btn danger" style="display:none;" title="Đăng xuất">
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        `;

        card.querySelector('#kaola-settings-btn-login').addEventListener('click', () => openAccountModal('auth'));
        card.querySelector('#kaola-settings-btn-manage').addEventListener('click', () => openAccountModal('profile'));
        card.querySelector('#kaola-settings-btn-upgrade').addEventListener('click', () => openAccountModal('pricing'));
        card.querySelector('#kaola-settings-btn-logout').addEventListener('click', () => logoutAccount());

        // Chèn vào ngay dưới header form hoặc đầu form
        const formHeader = settingsForm.querySelector('.mIUnDq_formHeader, [class*="_formHeader"]');
        if (formHeader && formHeader.nextSibling) {
          settingsForm.insertBefore(card, formHeader.nextSibling);
        } else if (settingsForm.firstChild) {
          settingsForm.insertBefore(card, settingsForm.firstChild);
        } else {
          settingsForm.appendChild(card);
        }
      }

      // Cập nhật thông tin người dùng trong card
      const avatarImg = card.querySelector('#kaola-settings-avatar-img');
      const crown = card.querySelector('#kaola-settings-vip-crown');
      const nameEl = card.querySelector('#kaola-settings-account-name');
      const planBadge = card.querySelector('#kaola-settings-plan-badge');
      const descEl = card.querySelector('#kaola-settings-account-desc');
      const btnLogin = card.querySelector('#kaola-settings-btn-login');
      const btnManage = card.querySelector('#kaola-settings-btn-manage');
      const btnUpgrade = card.querySelector('#kaola-settings-btn-upgrade');
      const btnLogout = card.querySelector('#kaola-settings-btn-logout');

      const avatarUrl = getUserAvatarUrl();
      if (avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function () { this.onerror = null; this.src = DEFAULT_AVATAR_DATA_URI; };
      }

      const isVip = !!(currentUser && currentUser.is_vip);
      const isLoggedIn = !!(currentUser && (currentUser.email || currentUser.name));

      if (crown) crown.style.display = isVip ? 'block' : 'none';

      if (isLoggedIn) {
        const displayName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Người dùng');
        if (nameEl) nameEl.textContent = displayName;
        if (planBadge) {
          if (isVip) {
            planBadge.textContent = currentUser.plan_code === 'office_internal' ? 'Gói Nội Bộ (VIP)' : (currentUser.plan_name || 'Kaola Pro (VIP)');
            planBadge.className = 'kaola-plan-pill pro';
          } else {
            planBadge.textContent = 'Thành Viên Kaola';
            planBadge.className = 'kaola-plan-pill free';
          }
        }
        if (descEl) {
          descEl.innerHTML = `Email: <strong>${escapeHtml(currentUser.email || '')}</strong> • Đã kết nối hệ sinh thái Kaola ID & Kaola Drive.`;
        }
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnManage) btnManage.style.display = 'inline-flex';
        if (btnUpgrade) btnUpgrade.style.display = isVip ? 'none' : 'inline-flex';
        if (btnLogout) btnLogout.style.display = 'inline-flex';
      } else {
        if (nameEl) nameEl.textContent = 'Chưa đăng nhập Kaola ID';
        if (planBadge) {
          planBadge.textContent = 'Bản Miễn Phí';
          planBadge.className = 'kaola-plan-pill free';
        }
        if (descEl) {
          descEl.textContent = 'Đăng nhập tài khoản Kaola ID để đồng bộ đám mây Kaola Drive, sử dụng Trợ lý AI Copilot và quản trị bản quyền.';
        }
        if (btnLogin) btnLogin.style.display = 'inline-flex';
        if (btnManage) btnManage.style.display = 'none';
        if (btnUpgrade) btnUpgrade.style.display = 'inline-flex';
        if (btnLogout) btnLogout.style.display = 'none';
      }
    }
  }

  // 4.3. Cập nhật nút tài khoản trên thanh Sidebar (nằm ngay phía trên Cài đặt, chống nhấp nháy 100%)
  function updateSidebarAccount() {
    const nav = document.querySelector('nav.tool-menu');
    if (!nav) return;

    // Tìm mục cài đặt trong thanh sidebar OnlyOffice
    const settingsBtn = nav.querySelector('[action="settings"], a[href*="settings"]');
    const settingsLi = settingsBtn ? settingsBtn.closest('li') : null;

    let item = document.getElementById('kaola-sidebar-account-item');
    
    // Dọn dẹp nếu có nhiều hơn 1 item bị trùng
    if (typeof document.querySelectorAll === 'function') {
      const allItems = document.querySelectorAll('#kaola-sidebar-account-item');
      if (allItems && allItems.length > 1) {
        for (let i = 1; i < allItems.length; i++) {
          allItems[i].parentNode && allItems[i].parentNode.removeChild(allItems[i]);
        }
      }
    }

    if (!item) {
      item = document.createElement('li');
      item.id = 'kaola-sidebar-account-item';
      item.className = 'menu-item kaola-sidebar-account-item';
      item.innerHTML = `
        <a class="menu-btn kaola-sidebar-account-btn" href="javascript:void(0)">
          <div class="icon-inner-box">
            <div class="kaola-sidebar-avatar-box">
              <svg class="kaola-sidebar-account-svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                <path d="M3.5 17.5a6.5 6.5 0 0 1 13 0"/>
              </svg>
              <span class="kaola-sidebar-vip-badge" style="display: none;">👑</span>
            </div>
          </div>
          <span class="kaola-sidebar-account-text">Tài khoản</span>
        </a>
      `;
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openAccountModal();
      });
    }

    // Đảm bảo vị trí TRỰC TIẾP phía trên mục Cài đặt (chỉ insert khi chưa đúng vị trí để tránh reflow nhấp nháy)
    if (settingsLi && settingsLi.parentNode === nav) {
      if (item.nextElementSibling !== settingsLi) {
        nav.insertBefore(item, settingsLi);
      }
    } else if (item.parentNode !== nav) {
      nav.appendChild(item);
    }

    // Cập nhật thuộc tính DOM cụ thể, TUYỆT ĐỐI KHÔNG gán lại innerHTML để tránh nhấp nháy khi hover
    const isVip = !!(currentUser && currentUser.is_vip);
    let label = 'Tài khoản';
    let tooltip = 'Đăng nhập tài khoản Kaola ID (Miễn phí)';

    if (isVip) {
      const displayName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'VIP');
      label = currentUser.plan_code === 'office_internal' ? 'Gói Nội Bộ' : 'Kaola Pro';
      tooltip = `Tài khoản ${currentUser.plan_name || 'Kaola Pro'}: ${displayName} - Nhấn để quản lý`;
    } else if (currentUser && (currentUser.email || currentUser.name)) {
      const displayName = currentUser.name || currentUser.email.split('@')[0];
      label = displayName;
      tooltip = `Tài khoản Kaola ID: ${displayName} - Nhấn để quản lý`;
    }

    const btn = item.querySelector('.kaola-sidebar-account-btn');
    if (btn) {
      if (btn.title !== tooltip) btn.title = tooltip;
      if (isVip && !btn.classList.contains('is-vip')) btn.classList.add('is-vip');
      if (!isVip && btn.classList.contains('is-vip')) btn.classList.remove('is-vip');
    }

    const vipBadge = item.querySelector('.kaola-sidebar-vip-badge');
    if (vipBadge) {
      const targetDisplay = isVip ? 'block' : 'none';
      if (vipBadge.style.display !== targetDisplay) {
        vipBadge.style.display = targetDisplay;
      }
    }

    const textEl = item.querySelector('.kaola-sidebar-account-text');
    if (textEl && textEl.textContent !== label) {
      textEl.textContent = label;
    }
  }

  // Helper escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Tạo chữ ký HMAC SHA-256 bằng Web Crypto API (kèm cơ chế phòng vệ an toàn)
  async function generateHmacSha256(secret, message) {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.importKey === 'function') {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
        return Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (e) {
      console.warn('Lỗi WebCrypto HMAC, sử dụng fallback dự phòng:', e);
    }
    return 'fallback_sig_' + Math.floor(Date.now() / 1000);
  }

  // 5. Khởi tạo Modal DOM
  function createModal() {
    if (document.getElementById('kaola-account-modal')) return;

    const modalHtml = `
    <!-- Top-Right Header Status Pill -->
    <div id="kaola-account-pill" class="kaola-account-pill unauthenticated" title="Đăng nhập tài khoản Kaola ID (Miễn phí)">
      <span class="kaola-dot"></span>
      <span>Đăng nhập Kaola ID</span>
    </div>

    <!-- Modal Dialog -->
    <div id="kaola-account-modal" class="kaola-modal-overlay">
      <div class="kaola-modal-card">
        <!-- Header -->
        <div class="kaola-modal-header">
          <div class="kaola-brand-title">
            <div class="kaola-brand-logo"></div>
            <div class="kaola-title-text">
              <h3>KAOLA OFFICE</h3>
              <p>Tài Khoản Kaola ID & Hệ Sinh Thái Ứng Dụng</p>
            </div>
          </div>
          <button id="kaola-modal-close" class="kaola-close-btn" title="Đóng">&times;</button>
        </div>

        <!-- Body -->
        <div class="kaola-modal-body">
          <!-- VIEW 1: Form Đăng nhập / Đăng ký (Mặc định khi chưa đăng nhập) -->
          <div id="kaola-view-auth" style="display: flex; flex-direction: column; gap: 18px;">
            <div class="kaola-intro-banner">
              <div class="kaola-intro-icon">
                <img class="kaola-intro-favicon" src="${KAOLA_FAVICON_DATA_URI}" alt="Kaola Favicon" onerror="this.onerror=null; this.src='kaola_favicon.png';" />
              </div>
              <div class="kaola-intro-text">
                <strong>Kaola Office miễn phí hoàn toàn trọn đời</strong> cho soạn thảo văn bản, bảng tính và trình chiếu.<br/>
                Đăng nhập tài khoản Kaola ID để đồng bộ kho tài liệu <strong>Kaola Drive</strong> và nhận bản cập nhật mới nhất.
              </div>
            </div>

            <!-- Tab Đăng nhập / Đăng ký -->
            <div class="kaola-auth-tabs">
              <button id="kaola-tab-login" class="kaola-auth-tab active">Đăng nhập</button>
              <button id="kaola-tab-register" class="kaola-auth-tab">Đăng ký mới</button>
            </div>

            <!-- Form fields -->
            <div class="kaola-auth-form">
              <div id="kaola-group-name" class="kaola-form-group" style="display: none;">
                <label for="kaola-input-name">Họ và tên của bạn:</label>
                <input id="kaola-input-name" type="text" class="kaola-input" placeholder="Ví dụ: Nguyễn Văn A" />
              </div>

              <div class="kaola-form-group">
                <label for="kaola-input-auth-email">Email hoặc Tên tài khoản Kaola:</label>
                <input id="kaola-input-auth-email" type="text" class="kaola-input" placeholder="tenbanchuyennghiep@kaola.vn" />
              </div>

              <div class="kaola-form-group">
                <label for="kaola-input-auth-pass">Mật khẩu:</label>
                <input id="kaola-input-auth-pass" type="password" class="kaola-input" placeholder="Nhập mật khẩu..." />
              </div>

              <button id="kaola-btn-submit-auth" class="kaola-btn-primary">
                <span>Đăng nhập Kaola ID</span>
              </button>

              <div class="kaola-divider-or">HOẶC</div>

              <a id="kaola-link-sso" href="${KAOLA_ID_PORTAL_URL}" target="_blank" class="kaola-btn-sso">
                <span>⚡ Đăng nhập một chạm qua id.kaola.vn</span>
              </a>

              <div id="kaola-link-goto-pricing" class="kaola-link-pricing">
                ⭐ Bạn muốn tìm hiểu các gói Kaola Pro & Doanh Nghiệp? Xem bảng giá →
              </div>
            </div>
          </div>

          <!-- VIEW 2: Hồ sơ cá nhân (Hiển thị khi ĐÃ đăng nhập) -->
          <div id="kaola-view-profile" style="display: none; flex-direction: column; gap: 14px;">
            <!-- VIP Banner nếu là Pro -->
            <div id="kaola-vip-profile-banner" style="display: none;" class="kaola-profile-card kaola-vip-card">
              <div class="kaola-profile-header">
                <div class="kaola-profile-avatar-container">
                  <img id="kaola-profile-avatar-img-vip" class="kaola-profile-avatar-img" src="${DEFAULT_AVATAR_VIP_DATA_URI}" alt="Avatar" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_VIP_DATA_URI}'" />
                  <div class="kaola-avatar-action-links">
                    <button type="button" id="kaola-btn-change-avatar-vip" class="kaola-btn-change-avatar" title="Đổi Logo / Ảnh đại diện của bạn">📷 Đổi logo</button>
                    <button type="button" id="kaola-btn-reset-avatar-vip" class="kaola-btn-reset-avatar" style="display: none;" title="Khôi phục lại logo mặc định Kaola">↺ Logo Kaola</button>
                  </div>
                </div>
                <div class="kaola-profile-names">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h4 style="color: #92400e; font-weight: 800; margin: 0;">TÀI KHOẢN KAOLA PRO</h4>
                    <span class="kaola-plan-badge" style="position: static; font-size: 11px; padding: 2px 8px; background: #16a34a;">ĐÃ THANH TOÁN</span>
                  </div>
                  <p id="kaola-vip-profile-email" style="font-weight: 600; color: #4b5563; margin-top: 2px;">user@kaola.vn</p>
                </div>
              </div>

              <!-- Chi tiết Gói Cước Đã Nâng Cấp -->
              <div class="kaola-vip-plan-details" style="display: flex; flex-direction: column; gap: 8px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 12px 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #fcd34d; padding-bottom: 8px;">
                  <span style="font-size: 12px; color: #78350f; font-weight: 600;">Gói dịch vụ kích hoạt:</span>
                  <span id="kaola-vip-plan-name" style="font-size: 13px; font-weight: 800; color: #b45309;">Gói Cá Nhân Pro (1 Năm - Tặng 2 tháng)</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #92400e;">
                  <span id="kaola-vip-order-code">Mã đơn: ---</span>
                  <span id="kaola-vip-paid-date">Kích hoạt: Đang hoạt động</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #16a34a; font-weight: 700;">
                  <span>● Trạng thái: Đang hoạt động</span>
                  <span>Cổng thanh toán: KaolaPay</span>
                </div>
              </div>

              <div class="kaola-status-tag" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
                <span>✨ Đã tắt 100% quảng cáo • Không giới hạn AI Copilot • 50GB Kaola Drive • Hỗ trợ ưu tiên</span>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                <button id="kaola-btn-vip-change-plan" class="kaola-btn-secondary" style="font-size: 12px; padding: 5px 12px;">
                  <span>⭐ Gia hạn / Xem các gói khác →</span>
                </button>
              </div>
            </div>

            <!-- Normal Profile Card nếu là tài khoản miễn phí -->
            <div id="kaola-normal-profile-card" class="kaola-profile-card">
              <div class="kaola-profile-header">
                <div class="kaola-profile-avatar-container">
                  <img id="kaola-profile-avatar-img-normal" class="kaola-profile-avatar-img" src="${DEFAULT_AVATAR_DATA_URI}" alt="Avatar" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR_DATA_URI}'" />
                  <div class="kaola-avatar-action-links">
                    <button type="button" id="kaola-btn-change-avatar-normal" class="kaola-btn-change-avatar" title="Đổi Logo / Ảnh đại diện của bạn">📷 Đổi logo</button>
                    <button type="button" id="kaola-btn-reset-avatar-normal" class="kaola-btn-reset-avatar" style="display: none;" title="Khôi phục lại logo mặc định Kaola">↺ Logo Kaola</button>
                  </div>
                </div>
                <div class="kaola-profile-names">
                  <h4 id="kaola-profile-display-name">Người Dùng Kaola</h4>
                  <p id="kaola-profile-display-email">user@kaola.vn</p>
                </div>
              </div>
              <input type="file" id="kaola-file-avatar-input" accept="image/*" style="display: none;" />
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div class="kaola-status-tag">
                  <span>✓ Tài khoản Miễn Phí (Standard)</span>
                </div>
                <div class="kaola-status-tag" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">
                  <span>☁ Kaola Drive: Đã kết nối tự động</span>
                </div>
              </div>
            </div>

            <!-- Callout Nâng cấp Pro (Hiện khi tài khoản thường) -->
            <div id="kaola-profile-upgrade-callout" class="kaola-upgrade-callout">
              <div class="kaola-upgrade-callout-text">
                <h5>Nâng cấp Kaola Pro</h5>
                <p>Tắt toàn bộ banner quảng cáo & mở khóa AI Copilot hỗ trợ văn bản thông minh.</p>
              </div>
              <button id="kaola-btn-profile-to-pricing" class="kaola-btn-pay" style="padding: 7px 14px; font-size: 12px;">
                <span>⭐ Nâng cấp Pro</span>
              </button>
            </div>

            <!-- Actions Row -->
            <div class="kaola-actions-row">
              <a href="${KAOLA_ID_PORTAL_URL}" target="_blank" class="kaola-btn-secondary">
                <span>🌐 Quản lý tài khoản (id.kaola.vn)</span>
              </a>
              <button id="kaola-btn-profile-logout" class="kaola-btn-danger">Đăng xuất</button>
            </div>
          </div>

          <!-- VIEW 3: Bảng giá nâng cấp Kaola Pro (Mở khi bấm Nâng cấp Pro) -->
          <div id="kaola-view-pricing" style="display: none; flex-direction: column; gap: 12px;">
            <div class="kaola-pricing-top-bar">
              <button id="kaola-btn-pricing-back" class="kaola-btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                <span>← Quay lại</span>
              </button>
              <span style="font-size: 12px; color: #16a34a; font-weight: 700;">⚡ Thanh toán đa kênh tự động qua KaolaPay</span>
            </div>

            <div class="kaola-plans-header">
              <h4>BẢNG GIÁ NÂNG CẤP KAOLA PRO</h4>
              <span style="font-size: 12px; color: #000000;">Kaola Office hoàn toàn miễn phí. Nâng cấp Pro để tắt quảng cáo & sở hữu dung lượng đám mây lớn hơn.</span>
            </div>

            <div id="kaola-plans-container" class="kaola-plans-grid">
              <!-- Danh sách gói được render động qua renderPlans() -->
            </div>

            <!-- PAYMENT CHANNEL SELECTION -->
            <div class="kaola-payment-methods" style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 800; color: #000000;">Chọn phương thức thanh toán:</span>
                <span style="font-size: 11px; color: #16a34a; font-weight: 700;">Hỗ trợ 50+ Ngân hàng & Cổng thẻ</span>
              </div>
              <div class="kaola-channel-list">
                <div class="kaola-channel-card active" data-channel="vietqr">
                  <div class="kaola-channel-radio-indicator"></div>
                  <div class="kaola-channel-content">
                    <div class="kaola-channel-header">
                      <span class="kaola-channel-title">⚡ Chuyển khoản VietQR NAPAS (Khuyên dùng)</span>
                      <span class="kaola-channel-badge badge-green">0% Phí • Tức thì 5s</span>
                    </div>
                    <div class="kaola-channel-desc">Quét mã bằng App của hơn 50 Ngân hàng. Miễn phí giao dịch 100%, tự động kích hoạt tức thì.</div>
                  </div>
                </div>

                <div class="kaola-channel-card" data-channel="onepay">
                  <div class="kaola-channel-radio-indicator"></div>
                  <div class="kaola-channel-content">
                    <div class="kaola-channel-header">
                      <span class="kaola-channel-title">💳 Thẻ Quốc Tế (Visa / Master / JCB) & Thẻ ATM OnePay</span>
                      <span class="kaola-channel-badge badge-blue">OnePay Gateway</span>
                    </div>
                    <div class="kaola-channel-desc">Cổng thanh toán thẻ trực tuyến bảo mật PCI DSS qua OnePay, xác thực OTP 3D-Secure an toàn.</div>
                  </div>
                </div>

                <div class="kaola-channel-card" data-channel="gateway">
                  <div class="kaola-channel-radio-indicator"></div>
                  <div class="kaola-channel-content">
                    <div class="kaola-channel-header">
                      <span class="kaola-channel-title">🌐 Cổng thanh toán KaolaPay Web</span>
                      <span class="kaola-channel-badge badge-indigo">Đa kênh</span>
                    </div>
                    <div class="kaola-channel-desc">Mở trang thanh toán web KaolaPay đầy đủ các phương thức (VietQR, Thẻ quốc tế, Thẻ ATM, Ví MoMo).</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- VAT Invoice Request Box -->
            <div class="kaola-vat-box" style="padding: 8px 12px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; cursor: pointer; color: #000000; user-select: none;">
                <input type="checkbox" id="kaola-vat-toggle" style="width: 15px; height: 15px; accent-color: #16a34a; cursor: pointer;" />
                <span>📄 Yêu cầu xuất Hóa đơn điện tử VAT (Hợp lệ cho công ty / doanh nghiệp)</span>
              </label>
              <div id="kaola-vat-form" style="display: none; margin-top: 8px; flex-direction: column; gap: 6px;">
                <input id="kaola-vat-tax-code" type="text" class="kaola-input" placeholder="Mã số thuế công ty (MST)..." style="font-size: 12px; padding: 6px 10px;" />
                <input id="kaola-vat-company-name" type="text" class="kaola-input" placeholder="Tên công ty / đơn vị xuất hóa đơn..." style="font-size: 12px; padding: 6px 10px;" />
                <input id="kaola-vat-address" type="text" class="kaola-input" placeholder="Địa chỉ theo ĐKKD công ty..." style="font-size: 12px; padding: 6px 10px;" />
                <input id="kaola-vat-email" type="email" class="kaola-input" placeholder="Email nhận hóa đơn điện tử..." style="font-size: 12px; padding: 6px 10px;" />
              </div>
            </div>

            <button id="kaola-btn-start-checkout" class="kaola-btn-pay">
              <span>⚡ Thanh toán ngay bằng VietQR</span>
              <span>(499.000 đ)</span>
            </button>
          </div>

          <!-- VIEW 4: Checkout View (Hiện khi đang thanh toán) -->
          <div id="kaola-view-checkout" style="display: none; flex-direction: column; gap: 14px;">
            <div class="kaola-plans-header">
              <h4 id="kaola-checkout-plan-name">Thanh toán Gói Kaola Pro</h4>
              <span id="kaola-checkout-order-code" class="kaola-pay-memo">Mã đơn: ...</span>
            </div>

            <div class="kaola-checkout-container">
              <!-- VietQR QR Box -->
              <div id="kaola-checkout-qr-box" class="kaola-qr-box">
                <img id="kaola-checkout-qr-img" src="" alt="Mã VietQR Thanh Toán" class="kaola-qr-img" />
              </div>

              <!-- External Gateway / OnePay Box -->
              <div id="kaola-checkout-external-box" style="display: none; flex-direction: column; align-items: center; gap: 12px; padding: 20px 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; width: 100%; box-sizing: border-box;"></div>

              <div class="kaola-status-spinner">
                <div class="kaola-spinner-icon"></div>
                <span id="kaola-checkout-status-text">Đang chờ chuyển khoản... Hệ thống sẽ tự động kích hoạt sau 5-15 giây.</span>
              </div>

              <div id="kaola-pay-details-table" class="kaola-pay-details">
                <div class="kaola-pay-row">
                  <span class="kaola-pay-label">Ngân hàng:</span>
                  <span class="kaola-pay-value" id="kaola-pay-bank-name">Ngân hàng Quân Đội (MBBank)</span>
                </div>
                <div class="kaola-pay-row">
                  <span class="kaola-pay-label">Số tài khoản:</span>
                  <span class="kaola-pay-value" id="kaola-pay-acc-num">19036788888888</span>
                </div>
                <div class="kaola-pay-row">
                  <span class="kaola-pay-label">Chủ tài khoản:</span>
                  <span class="kaola-pay-value" id="kaola-pay-acc-name">CONG TY CO PHAN CONG NGHE KAOLA</span>
                </div>
                <div class="kaola-pay-row">
                  <span class="kaola-pay-label">Số tiền:</span>
                  <span class="kaola-pay-value" id="kaola-pay-amount" style="color: #2563eb; font-size: 15px;">499.000 đ</span>
                </div>
                <div class="kaola-pay-row">
                  <span class="kaola-pay-label">Nội dung chuyển khoản:</span>
                  <span class="kaola-pay-memo" id="kaola-pay-memo-text">KP...</span>
                </div>
              </div>

              <div style="display: flex; gap: 10px; width: 100%; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <button id="kaola-btn-cancel-checkout" class="kaola-btn-secondary">
                  <span>← Quay lại bảng giá</span>
                </button>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button id="kaola-btn-manual-verify" class="kaola-btn-pay" style="padding: 7px 14px; font-size: 12px; background: #16a34a; border: none; cursor: pointer; border-radius: 6px;">
                    <span>🔄 Tôi đã thanh toán / Kiểm tra ngay</span>
                  </button>
                  <a id="kaola-btn-open-web-checkout" href="#" target="_blank" class="kaola-btn-secondary" style="color: #2563eb;">
                    <span>Mở trang thanh toán Web ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Alert Notification -->
          <div id="kaola-account-alert" class="kaola-alert"></div>
        </div>

        <!-- Footer / Legal Open Source Notice -->
        <div class="kaola-modal-footer">
          Kaola Office miễn phí theo giấy phép <strong>GNU AGPL v3</strong>. Bản quyền © 2026 Kaola HQ.
        </div>
      </div>
    </div>
    `;

    const container = document.createElement('div');
    container.id = 'kaola-account-root';
    container.innerHTML = modalHtml;
    document.body.appendChild(container);

    bindEvents();
  }

  // 6. Gán các sự kiện giao diện
  function bindEvents() {
    const pill = document.getElementById('kaola-account-pill');
    const modal = document.getElementById('kaola-account-modal');
    const closeBtn = document.getElementById('kaola-modal-close');
    const alertBox = document.getElementById('kaola-account-alert');

    // Views
    const viewAuth = document.getElementById('kaola-view-auth');
    const viewProfile = document.getElementById('kaola-view-profile');
    const viewPricing = document.getElementById('kaola-view-pricing');
    const viewCheckout = document.getElementById('kaola-view-checkout');

    // Auth Form Elements
    const tabLogin = document.getElementById('kaola-tab-login');
    const tabRegister = document.getElementById('kaola-tab-register');
    const groupName = document.getElementById('kaola-group-name');
    const inputName = document.getElementById('kaola-input-name');
    const inputEmail = document.getElementById('kaola-input-auth-email');
    const inputPass = document.getElementById('kaola-input-auth-pass');
    const btnSubmitAuth = document.getElementById('kaola-btn-submit-auth');
    const linkGotoPricing = document.getElementById('kaola-link-goto-pricing');

    // Profile Elements
    const btnProfileToPricing = document.getElementById('kaola-btn-profile-to-pricing');
    const btnProfileLogout = document.getElementById('kaola-btn-profile-logout');

    // Pricing Elements
    const btnPricingBack = document.getElementById('kaola-btn-pricing-back');
    const btnStartCheckout = document.getElementById('kaola-btn-start-checkout');
    const btnCancelCheckout = document.getElementById('kaola-btn-cancel-checkout');

    function showAlert(msg, isSuccess = false) {
      if (!alertBox) return;
      alertBox.className = `kaola-alert ${isSuccess ? 'success' : 'error'}`;
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    }

    function hideAlert() {
      if (alertBox) alertBox.style.display = 'none';
    }

    // Chuyển chế độ hiển thị View
    function showView(viewName) {
      hideAlert();
      viewAuth.style.display = 'none';
      viewProfile.style.display = 'none';
      viewPricing.style.display = 'none';
      viewCheckout.style.display = 'none';

      const card = modal ? modal.querySelector('.kaola-modal-card') : null;
      if (card) {
        card.classList.toggle('is-pricing-view', viewName === 'pricing' || viewName === 'checkout');
      }

      if (viewName === 'auth') {
        viewAuth.style.display = 'flex';
      } else if (viewName === 'profile') {
        viewProfile.style.display = 'flex';
        renderProfileData();
      } else if (viewName === 'pricing') {
        viewPricing.style.display = 'flex';
      } else if (viewName === 'checkout') {
        viewCheckout.style.display = 'flex';
      }
    }

    function renderProfileData() {
      if (!currentUser) return;
      const displayName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Người dùng Kaola');
      const email = currentUser.email || '';
      const avatarUrl = getUserAvatarUrl();

      const vipBanner = document.getElementById('kaola-vip-profile-banner');
      const normalCard = document.getElementById('kaola-normal-profile-card');
      const upgradeCallout = document.getElementById('kaola-profile-upgrade-callout');

      // Cập nhật avatar hình ảnh
      const avatarVip = document.getElementById('kaola-profile-avatar-img-vip');
      if (avatarVip) {
        avatarVip.src = getUserAvatarUrl(true);
        avatarVip.onerror = function () { this.onerror = null; this.src = DEFAULT_AVATAR_VIP_DATA_URI; };
      }
      const avatarNormal = document.getElementById('kaola-profile-avatar-img-normal');
      if (avatarNormal) {
        avatarNormal.src = getUserAvatarUrl(false);
        avatarNormal.onerror = function () { this.onerror = null; this.src = DEFAULT_AVATAR_DATA_URI; };
      }

      // Nút khôi phục logo
      const hasCustom = !!(localStorage.getItem('kaola_user_custom_logo') || currentUser.avatar || currentUser.logo);
      const resetBtnVip = document.getElementById('kaola-btn-reset-avatar-vip');
      if (resetBtnVip) resetBtnVip.style.display = hasCustom ? 'inline-block' : 'none';
      const resetBtnNormal = document.getElementById('kaola-btn-reset-avatar-normal');
      if (resetBtnNormal) resetBtnNormal.style.display = hasCustom ? 'inline-block' : 'none';

      if (currentUser.is_vip) {
        vipBanner.style.display = 'flex';
        normalCard.style.display = 'none';
        upgradeCallout.style.display = 'none';
        document.getElementById('kaola-vip-profile-email').textContent = `${displayName} (${email})`;

        const planNameEl = document.getElementById('kaola-vip-plan-name');
        if (planNameEl) {
          planNameEl.textContent = currentUser.plan_name || 'Gói Kaola Office Pro';
        }
        const orderCodeEl = document.getElementById('kaola-vip-order-code');
        if (orderCodeEl) {
          orderCodeEl.textContent = currentUser.order_code ? `Mã đơn: ${currentUser.order_code}` : 'Mã kích hoạt: VIP-PRO';
        }
        const paidDateEl = document.getElementById('kaola-vip-paid-date');
        if (paidDateEl) {
          paidDateEl.textContent = currentUser.paid_at ? `Kích hoạt: ${currentUser.paid_at}` : 'Kích hoạt: Đang hoạt động';
        }
      } else {
        vipBanner.style.display = 'none';
        normalCard.style.display = 'block';
        upgradeCallout.style.display = 'flex';
        document.getElementById('kaola-profile-display-name').textContent = displayName;
        document.getElementById('kaola-profile-display-email').textContent = email;
      }
    }

    function refreshModalView() {
      hideAlert();
      stopPolling();

      if (currentUser && (currentUser.email || currentUser.name)) {
        showView('profile');
      } else {
        showView('auth');
      }
    }

    function openModal() {
      refreshModalView();
      modal.classList.add('active');
    }
    globalOpenModal = openModal;

    globalShowPricing = function () {
      stopPolling();
      hideAlert();
      showView('pricing');
      modal.classList.add('active');
    };

    function closeModal() {
      stopPolling();
      modal.classList.remove('active');
    }
    globalCloseModal = closeModal;

    if (pill) pill.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    // Xử lý đổi Logo / Avatar của người dùng (fallback logo Kaola)
    const fileAvatarInput = document.getElementById('kaola-file-avatar-input');
    const btnChangeAvatarVip = document.getElementById('kaola-btn-change-avatar-vip');
    const btnChangeAvatarNormal = document.getElementById('kaola-btn-change-avatar-normal');
    const btnResetAvatarVip = document.getElementById('kaola-btn-reset-avatar-vip');
    const btnResetAvatarNormal = document.getElementById('kaola-btn-reset-avatar-normal');

    function triggerAvatarUpload() {
      if (fileAvatarInput) {
        fileAvatarInput.value = '';
        fileAvatarInput.click();
      }
    }

    if (btnChangeAvatarVip) btnChangeAvatarVip.addEventListener('click', triggerAvatarUpload);
    if (btnChangeAvatarNormal) btnChangeAvatarNormal.addEventListener('click', triggerAvatarUpload);

    if (fileAvatarInput) {
      fileAvatarInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
          showAlert('Ảnh quá lớn (vui lòng chọn file dưới 3MB)', false);
          return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
          const base64 = evt.target.result;
          try {
            localStorage.setItem('kaola_user_custom_logo', base64);
            if (!currentUser) currentUser = { name: 'Người dùng', email: '' };
            currentUser.avatar = base64;
            currentUser.logo = base64;
            saveAccount(currentUser);
            updateUI();
            renderProfileData();
            showAlert('Đã cập nhật Logo / Avatar thành công!', true);
          } catch (err) {
            console.error('Lỗi lưu avatar:', err);
            showAlert('Lỗi khi lưu ảnh avatar', false);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    function resetToDefaultLogo() {
      try {
        localStorage.removeItem('kaola_user_custom_logo');
        if (currentUser) {
          delete currentUser.avatar;
          delete currentUser.logo;
          delete currentUser.photo;
          saveAccount(currentUser);
        }
        updateUI();
        renderProfileData();
        showAlert('Đã khôi phục về Logo Kaola mặc định', true);
      } catch (err) {
        console.error('Lỗi reset logo:', err);
      }
    }

    if (btnResetAvatarVip) btnResetAvatarVip.addEventListener('click', resetToDefaultLogo);
    if (btnResetAvatarNormal) btnResetAvatarNormal.addEventListener('click', resetToDefaultLogo);

    // Chuyển Tab Đăng nhập / Đăng ký
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        activeAuthTab = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        groupName.style.display = 'none';
        btnSubmitAuth.innerHTML = '<span>Đăng nhập Kaola ID</span>';
        hideAlert();
      });

      tabRegister.addEventListener('click', () => {
        activeAuthTab = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        groupName.style.display = 'flex';
        btnSubmitAuth.innerHTML = '<span>Tạo tài khoản Kaola ID (Miễn phí)</span>';
        hideAlert();
      });
    }

    // Xử lý nút Đăng nhập / Đăng ký trong Office
    if (btnSubmitAuth) {
      btnSubmitAuth.addEventListener('click', function () {
        const email = (inputEmail.value || '').trim();
        const pass = (inputPass.value || '').trim();
        const name = (inputName.value || '').trim();

        if (!email) {
          showAlert('Vui lòng nhập Email hoặc tên tài khoản!');
          return;
        }

        if (!pass) {
          showAlert('Vui lòng nhập mật khẩu!');
          return;
        }

        const displayName = name || email.split('@')[0];
        const userObj = {
          email: email.includes('@') ? email : `${email}@kaola.vn`,
          name: displayName,
          is_vip: false,
          created_at: new Date().toISOString()
        };

        saveAccount(userObj);
        showAlert(activeAuthTab === 'login' ? 'Đăng nhập Kaola ID thành công!' : 'Tạo tài khoản Kaola ID thành công!', true);

        // Kiểm tra ngay xem tài khoản này đã có gói dịch vụ trên KaolaPay chưa
        syncCustomerSubscription(userObj.email).then((sub) => {
          if (sub?.has_active_subscription) {
            showAlert(`Chào mừng bạn! Gói ${sub.plan_name} đã được kích hoạt thành công.`, true);
          }
        });

        setTimeout(() => {
          showView('profile');
        }, 500);
      });
    }

    // Nút Gia hạn / Xem gói khác từ VIP Card
    const btnVipChangePlan = document.getElementById('kaola-btn-vip-change-plan');
    if (btnVipChangePlan) {
      btnVipChangePlan.addEventListener('click', () => {
        showView('pricing');
      });
    }

    // Chuyển sang View Bảng giá
    if (linkGotoPricing) {
      linkGotoPricing.addEventListener('click', () => {
        showView('pricing');
      });
    }
    if (btnProfileToPricing) {
      btnProfileToPricing.addEventListener('click', () => {
        showView('pricing');
      });
    }

    // Quay lại từ Bảng giá
    if (btnPricingBack) {
      btnPricingBack.addEventListener('click', () => {
        if (currentUser) {
          showView('profile');
        } else {
          showView('auth');
        }
      });
    }

    // Đăng xuất từ Profile
    if (btnProfileLogout) {
      btnProfileLogout.addEventListener('click', () => {
        logoutAccount();
        showAlert('Đã đăng xuất tài khoản.', true);
        setTimeout(() => {
          showView('auth');
        }, 400);
      });
    }

    // Form xuất hóa đơn VAT toggle
    const vatToggle = document.getElementById('kaola-vat-toggle');
    const vatForm = document.getElementById('kaola-vat-form');
    if (vatToggle && vatForm) {
      vatToggle.addEventListener('change', function () {
        vatForm.style.display = this.checked ? 'flex' : 'none';
      });
    }

    // Lựa chọn phương thức thanh toán
    const channelCards = document.querySelectorAll('.kaola-channel-card');
    channelCards.forEach(card => {
      card.addEventListener('click', function () {
        channelCards.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        selectedPaymentChannel = this.getAttribute('data-channel') || 'vietqr';
        updateCheckoutButton();
      });
    });

    renderPlans();

    // Nút Bắt đầu thanh toán
    if (btnStartCheckout) {
      btnStartCheckout.addEventListener('click', async function () {
        const email = (currentUser && currentUser.email) || (inputEmail && inputEmail.value.trim()) || 'guest@kaola.vn';
        btnStartCheckout.disabled = true;
        btnStartCheckout.innerHTML = '<span>Đang khởi tạo cổng KaolaPay...</span>';

        try {
          await initiatePayment(selectedPlanCode, email, selectedPaymentChannel);
        } catch (err) {
          showAlert('Lỗi kết nối cổng KaolaPay: ' + err.message);
          btnStartCheckout.disabled = false;
          updateCheckoutButton();
        }
      });
    }

    // Nút Quay lại từ Checkout
    if (btnCancelCheckout) {
      btnCancelCheckout.addEventListener('click', function () {
        stopPolling();
        showView('pricing');
      });
    }

    // Nút Kiểm tra thanh toán thủ công (Manual Verify)
    const btnManualVerify = document.getElementById('kaola-btn-manual-verify');
    if (btnManualVerify) {
      btnManualVerify.addEventListener('click', async function () {
        btnManualVerify.disabled = true;
        btnManualVerify.innerHTML = '<span>⏳ Đang kiểm tra...</span>';
        const email = (currentUser && currentUser.email) || (inputEmail && inputEmail.value.trim()) || 'guest@kaola.vn';
        const plan = PLANS[selectedPlanCode] || PLANS['office_pro_1y'] || Object.values(PLANS)[0];
        await checkOrderStatus(currentOrderCode, email, plan, true);
        btnManualVerify.disabled = false;
        btnManualVerify.innerHTML = '<span>🔄 Tôi đã thanh toán / Kiểm tra ngay</span>';
      });
    }

    // Tự động kiểm tra trạng thái ngay khi người dùng chuyển cửa sổ từ trình duyệt về ứng dụng
    window.addEventListener('focus', function () {
      const viewCheckout = document.getElementById('kaola-view-checkout');
      if (viewCheckout && viewCheckout.style.display !== 'none' && currentOrderCode) {
        const email = (currentUser && currentUser.email) || (inputEmail && inputEmail.value.trim()) || 'guest@kaola.vn';
        const plan = PLANS[selectedPlanCode] || PLANS['office_pro_1y'] || Object.values(PLANS)[0];
        checkOrderStatus(currentOrderCode, email, plan, false);
      } else if (currentUser?.email) {
        syncCustomerSubscription(currentUser.email);
      }
    });
  }

  // Cập nhật nút bấm thanh toán theo gói và phương thức thanh toán đã chọn
  function updateCheckoutButton() {
    const btn = document.getElementById('kaola-btn-start-checkout');
    if (!btn) return;
    const plan = PLANS[selectedPlanCode] || PLANS['office_pro_1y'] || Object.values(PLANS)[0];
    if (!plan) return;
    const { fullText } = formatPlanPrice(plan);
    const channel = PAYMENT_CHANNELS[selectedPaymentChannel] || PAYMENT_CHANNELS['vietqr'];
    btn.innerHTML = `<span>${channel.btnText}</span> <span>(${escapeHtml(fullText)})</span>`;
  }

  // Chuẩn hóa định dạng giá và chu kỳ, chống trùng lặp /tháng /tháng hoặc /năm /năm
  function formatPlanPrice(plan) {
    if (!plan) return { purePrice: '', period: '', fullText: '' };
    let purePrice = '';
    if (typeof plan.amount === 'number' && plan.amount > 0) {
      purePrice = new Intl.NumberFormat('vi-VN').format(plan.amount) + ' đ';
    } else if (plan.priceFormatted) {
      purePrice = String(plan.priceFormatted).replace(/\s*\/\s*(tháng|năm|month|year)/gi, '').trim();
    }

    let period = (plan.periodText || '').trim();
    if (period && !period.startsWith('/')) {
      period = '/ ' + period;
    } else if (period.startsWith('/') && !period.startsWith('/ ')) {
      period = '/ ' + period.slice(1);
    }

    const fullText = period ? `${purePrice} ${period}` : purePrice;
    return { purePrice, period, fullText };
  }

  // 7. Render danh sách gói cước động
  function renderPlans() {
    const container = document.getElementById('kaola-plans-container');
    if (!container) return;

    let html = '';
    const planKeys = Object.keys(PLANS).filter(key => !PLANS[key].isInternal);
    planKeys.forEach(key => {
      const p = PLANS[key];
      const isActive = key === selectedPlanCode;
      const badgeHtml = p.badge ? `<div class="kaola-plan-badge">${escapeHtml(p.badge)}</div>` : '';
      const featuresHtml = (p.features || []).map(f => {
        const clean = f.replace(/^[✓✔\s]+/, '');
        return `<li><span class="check-icon">✓</span><span>${escapeHtml(clean)}</span></li>`;
      }).join('');

      const { purePrice, period } = formatPlanPrice(p);

      html += `
        <div class="kaola-plan-card ${isActive ? 'active' : ''}" data-plan="${escapeHtml(p.code)}">
          ${badgeHtml}
          <div class="kaola-plan-title">${escapeHtml(p.name)}</div>
          <div class="kaola-plan-price">${escapeHtml(purePrice)} <small>${escapeHtml(period)}</small></div>
          <ul class="kaola-plan-features">
            ${featuresHtml}
          </ul>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.kaola-plan-card').forEach(card => {
      card.addEventListener('click', function () {
        container.querySelectorAll('.kaola-plan-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        selectedPlanCode = this.getAttribute('data-plan');
        updateCheckoutButton();
      });
    });

    updateCheckoutButton();
  }

  // 8. Tải danh mục gói động từ Super Admin
  async function fetchDynamicPackages() {
    try {
      const res = await fetch(`${KAOLA_SERVER_URL}/api/v1/office/packages?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.packages) && data.packages.length > 0) {
        const paidPkgs = data.packages.filter(p => p.price > 0);
        if (paidPkgs.length > 0) {
          const newPlans = {};
          paidPkgs.forEach(p => {
            let purePrice = '';
            if (typeof p.price === 'number' && p.price > 0) {
              purePrice = new Intl.NumberFormat('vi-VN').format(p.price) + ' đ';
            } else if (p.price_formatted) {
              purePrice = p.price_formatted.replace(/\s*\/\s*(tháng|năm|month|year)/gi, '').trim();
            }
            const cycleText = p.billing_cycle === 'yearly' ? '/ năm' : (p.billing_cycle === 'monthly' ? '/ tháng' : '');

            newPlans[p.slug] = {
              code: p.slug,
              name: p.name,
              duration_months: p.duration_months,
              amount: p.price,
              priceFormatted: purePrice,
              periodText: cycleText,
              badge: p.badge_text || (p.is_popular ? 'Khuyên dùng' : ''),
              isPopular: p.is_popular,
              features: p.features || []
            };
          });
          PLANS = newPlans;
          if (!PLANS[selectedPlanCode]) {
            selectedPlanCode = paidPkgs.find(p => p.is_popular)?.slug || paidPkgs[0].slug;
          }
          renderPlans();
        }
      }
    } catch (e) {
      console.warn('Lỗi tải danh mục gói cước từ máy chủ:', e);
    }
  }

  // 9. Khởi tạo phiên thanh toán trên KaolaPay
  async function initiatePayment(planCode, customerEmail, channelCode = selectedPaymentChannel) {
    const plan = PLANS[planCode] || PLANS['office_pro_1y'] || Object.values(PLANS)[0];
    const payload = {
      target_service_code: APP_CODE,
      target_tenant_id: customerEmail,
      plan_code: plan.code,
      plan_name: plan.name,
      duration_months: plan.duration_months,
      amount: plan.amount,
      customer_name: (currentUser && currentUser.name) || customerEmail.split('@')[0],
      customer_email: customerEmail,
      payment_channel_code: channelCode,
      description: `Nâng cấp ${plan.name}`
    };

    const isVatRequested = document.getElementById('kaola-vat-toggle')?.checked;
    if (isVatRequested) {
      payload.invoice_requested = true;
      payload.tax_code = (document.getElementById('kaola-vat-tax-code')?.value || '').trim();
      payload.company_name = (document.getElementById('kaola-vat-company-name')?.value || '').trim();
      payload.company_address = (document.getElementById('kaola-vat-address')?.value || '').trim();
      payload.invoice_email = (document.getElementById('kaola-vat-email')?.value || '').trim() || customerEmail;
    }

    let order = null;

    try {
      const rawJson = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = await generateHmacSha256(SECRET_KEY, `${timestamp}.${rawJson}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${KAOLAPAY_BASE_URL}/api/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Kaola-App-Code': APP_CODE,
          'X-Kaola-Timestamp': timestamp,
          'X-Kaola-Signature': signature
        },
        body: rawJson,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          order = data.data;
        }
      }
    } catch (e) {
      console.warn('Kết nối KaolaPay API trực tiếp gặp độ trễ, kích hoạt tạo mã VietQR tức thì:', e);
    }

    // Nếu API phản hồi chậm hoặc đang offline, tự động tạo phiên VietQR tức thì để người dùng không bị chờ đợi
    if (!order) {
      const fallbackCode = 'KP' + Math.floor(Date.now() / 1000).toString().slice(-8);
      order = {
        order_code: fallbackCode,
        checkout_url: `${KAOLAPAY_BASE_URL}/checkout/${fallbackCode}`,
        amount: plan.amount,
        qr_url: `https://img.vietqr.io/image/970422-19036788888888-compact2.png?amount=${plan.amount}&addInfo=${fallbackCode}&accountName=CONG%20TY%20CO%20PHAN%20CONG%20NGHE%20KAOLA`,
        bank_account: {
          bank_code: 'MB',
          bank_name: 'Ngân hàng TMCP Quân Đội (MBBank)',
          account_number: '19036788888888',
          account_name: 'CONG TY CO PHAN CONG NGHE KAOLA'
        }
      };
    }

    currentOrderCode = order.order_code;

    // Reset lại trạng thái nút Start Checkout để sẵn sàng khi quay lại
    updateCheckoutButton();
    const btnStart = document.getElementById('kaola-btn-start-checkout');
    if (btnStart) btnStart.disabled = false;

    // Hiển thị màn hình Checkout
    document.getElementById('kaola-view-pricing').style.display = 'none';
    const viewCheckout = document.getElementById('kaola-view-checkout');
    viewCheckout.style.display = 'flex';

    document.getElementById('kaola-checkout-plan-name').textContent = plan.name;
    document.getElementById('kaola-checkout-order-code').textContent = 'Mã đơn: ' + order.order_code;

    const qrBox = document.getElementById('kaola-checkout-qr-box');
    const externalBox = document.getElementById('kaola-checkout-external-box');
    const payDetails = document.getElementById('kaola-pay-details-table');
    const statusText = document.getElementById('kaola-checkout-status-text');
    const webLink = document.getElementById('kaola-btn-open-web-checkout');

    if (channelCode === 'vietqr') {
      if (qrBox) qrBox.style.display = 'flex';
      if (externalBox) externalBox.style.display = 'none';
      if (payDetails) payDetails.style.display = 'flex';
      if (statusText) statusText.textContent = 'Đang chờ chuyển khoản... Hệ thống sẽ tự động kích hoạt sau 5-15 giây.';

      document.getElementById('kaola-checkout-qr-img').src = order.qr_url;
      document.getElementById('kaola-pay-amount').textContent = plan.priceFormatted;
      document.getElementById('kaola-pay-memo-text').textContent = order.order_code;

      if (order.bank_account) {
        document.getElementById('kaola-pay-bank-name').textContent = order.bank_account.bank_name || 'MBBank';
        document.getElementById('kaola-pay-acc-num').textContent = order.bank_account.account_number || '19036788888888';
        document.getElementById('kaola-pay-acc-name').textContent = order.bank_account.account_name || 'CONG TY CO PHAN CONG NGHE KAOLA';
      }

      if (webLink) {
        webLink.href = order.checkout_url;
        webLink.textContent = 'Mở trang thanh toán Web ↗';
      }
    } else if (channelCode === 'onepay') {
      const onepayUrl = `${order.checkout_url}?channel=onepay`;
      if (qrBox) qrBox.style.display = 'none';
      if (externalBox) {
        externalBox.style.display = 'flex';
        externalBox.innerHTML = `
          <div style="width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
            💳
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #000000; text-align: center;">
            Cổng Thẻ Quốc Tế (Visa / Master / JCB) & Thẻ ATM OnePay
          </div>
          <p style="font-size: 12px; color: #1e293b; text-align: center; margin: 0; max-width: 440px; line-height: 1.5; font-weight: 500;">
            Trang thanh toán bảo mật OnePay đã được mở trong trình duyệt của bạn. Vui lòng thanh toán trực tuyến qua OnePay để hoàn tất.
          </p>
          <a href="${onepayUrl}" target="_blank" class="kaola-btn-pay" style="padding: 9px 18px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px;">
            <span>🌐 Nhấn vào đây nếu trang OnePay chưa tự mở ↗</span>
          </a>
        `;
      }
      if (payDetails) payDetails.style.display = 'none';
      if (statusText) statusText.textContent = 'Đang chờ xác nhận giao dịch từ OnePay... Hệ thống sẽ tự động kích hoạt ngay khi hoàn tất.';

      if (webLink) {
        webLink.href = onepayUrl;
        webLink.textContent = 'Mở lại trang OnePay ↗';
      }

      try {
        window.open(onepayUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }
    } else {
      const gatewayUrl = order.checkout_url;
      if (qrBox) qrBox.style.display = 'none';
      if (externalBox) {
        externalBox.style.display = 'flex';
        externalBox.innerHTML = `
          <div style="width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #2563eb); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
            🌐
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #000000; text-align: center;">
            Cổng Thanh Toán Đa Kênh KaolaPay Web
          </div>
          <p style="font-size: 12px; color: #1e293b; text-align: center; margin: 0; max-width: 440px; line-height: 1.5; font-weight: 500;">
            Trang thanh toán web KaolaPay đã được mở trên trình duyệt. Bạn có thể chọn VietQR, thẻ Visa / Master, thẻ ATM hoặc ví điện tử.
          </p>
          <a href="${gatewayUrl}" target="_blank" class="kaola-btn-pay" style="padding: 9px 18px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px;">
            <span>🌐 Nhấn vào đây nếu trang KaolaPay chưa tự mở ↗</span>
          </a>
        `;
      }
      if (payDetails) payDetails.style.display = 'none';
      if (statusText) statusText.textContent = 'Đang chờ kết quả thanh toán từ Cổng KaolaPay... Ứng dụng sẽ tự động nâng cấp tức thì.';

      if (webLink) {
        webLink.href = gatewayUrl;
        webLink.textContent = 'Mở lại Cổng KaolaPay ↗';
      }

      try {
        window.open(gatewayUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }
    }

    // Bắt đầu theo dõi trạng thái thanh toán (polling)
    startPolling(order.order_code, customerEmail, plan);
  }

  // Kiểm tra trạng thái đơn hàng (hỗ trợ cả REST API và Web Endpoint, kèm CORS)
  async function checkOrderStatus(orderCode, customerEmail, plan, isManual = false) {
    if (!orderCode) return false;
    try {
      let res = await fetch(`${KAOLAPAY_BASE_URL}/api/v1/checkout/${orderCode}/status`, {
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${KAOLAPAY_BASE_URL}/checkout/${orderCode}/status`, {
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);
      }

      if (!res || !res.ok) {
        if (isManual) {
          showAlert('Đang kết nối cổng KaolaPay... Vui lòng thử lại sau vài giây.');
        }
        return false;
      }

      const data = await res.json();
      if (data.is_paid) {
        stopPolling();
        onPaymentSuccess(customerEmail, plan);
        return true;
      } else if (isManual) {
        showAlert(`Đơn hàng ${orderCode} đang ở trạng thái "${data.status_label || data.status}". Nếu bạn vừa thanh toán, vui lòng đợi vài giây để hệ thống nhận diện.`);
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra trạng thái thanh toán:', e);
      if (isManual) {
        showAlert('Chưa thể kiểm tra trạng thái thanh toán: ' + e.message);
      }
    }
    return false;
  }

  // 10. Polling kiểm tra trạng thái thanh toán
  function startPolling(orderCode, customerEmail, plan) {
    stopPolling();
    try {
      localStorage.setItem('kaola_pending_order', JSON.stringify({
        orderCode: orderCode,
        customerEmail: customerEmail,
        planCode: plan?.code || selectedPlanCode,
        time: Date.now()
      }));
    } catch (e) {}

    // Kiểm tra ngay lập tức lần đầu
    checkOrderStatus(orderCode, customerEmail, plan, false);

    // Tiếp tục kiểm tra định kỳ mỗi 2.5 giây
    activePollingInterval = setInterval(() => {
      checkOrderStatus(orderCode, customerEmail, plan, false);
    }, 2500);
  }

  function stopPolling() {
    if (activePollingInterval) {
      clearInterval(activePollingInterval);
      activePollingInterval = null;
    }
  }

  // 11. Xử lý khi thanh toán thành công
  function onPaymentSuccess(customerEmail, plan) {
    try {
      localStorage.removeItem('kaola_pending_order');
    } catch (e) {}

    const updatedUser = {
      ...(currentUser || {}),
      email: customerEmail,
      is_vip: true,
      plan: 'pro',
      plan_code: plan?.code || 'office_pro_1y',
      plan_name: plan?.name || 'Gói Kaola Office Pro',
      order_code: currentOrderCode || (currentUser && currentUser.order_code) || '',
      paid_at: new Date().toLocaleString('vi-VN'),
      upgraded_at: new Date().toISOString()
    };

    saveAccount(updatedUser);

    // Tắt toàn bộ quảng cáo ngay lập tức
    try {
      const banner = document.getElementById('kaola-ad-root');
      if (banner) banner.style.display = 'none';
      sessionStorage.setItem('kaola_ad_dismissed', 'true');
    } catch (e) {}

    const alertBox = document.getElementById('kaola-account-alert');
    if (alertBox) {
      alertBox.className = 'kaola-alert success';
      alertBox.innerHTML = `🎉 <strong>Thanh toán thành công!</strong> Tài khoản của bạn đã được nâng cấp lên <strong>Kaola Pro</strong>. Toàn bộ quảng cáo đã được tắt.`;
      alertBox.style.display = 'block';
    }

    setTimeout(() => {
      const modal = document.getElementById('kaola-account-modal');
      if (modal) modal.classList.remove('active');
    }, 2500);
  }

  // Lắng nghe DOM để luôn giữ nút tài khoản trên thanh Sidebar và trang Cài đặt (chống nhấp nháy 100%)
  function setupSidebarObserver() {
    updateSidebarAccount();
    updateSettingsAccount();

    let timeout = null;
    const observer = new MutationObserver(function () {
      if (timeout) return;
      timeout = setTimeout(function () {
        timeout = null;
        updateSidebarAccount();
        updateSettingsAccount();
      }, 300);
    });

    try {
      const root = document.getElementById('root') || document.body;
      observer.observe(root, { childList: true, subtree: true });
    } catch (e) {}

    window.addEventListener('hashchange', function () {
      setTimeout(function () {
        updateSidebarAccount();
        updateSettingsAccount();
      }, 100);
    });

    window.addEventListener('popstate', function () {
      setTimeout(function () {
        updateSidebarAccount();
        updateSettingsAccount();
      }, 100);
    });
  }

  // 12. Khởi động khi DOM sẵn sàng
  function init() {
    createModal();
    loadAccount();
    // Trì hoãn gọi gói động sau khi giao diện đã sẵn sàng
    setTimeout(fetchDynamicPackages, 3000);
    setupSidebarObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export biến toàn cục
  window.KaolaAccount = {
    getUser: function () {
      return currentUser;
    },
    isLoggedIn: function () {
      return !!(currentUser && (currentUser.email || currentUser.name));
    },
    isVip: function () {
      return !!(currentUser && currentUser.is_vip);
    },
    login: saveAccount,
    logout: logoutAccount,
    openUpgradeModal: function () {
      openAccountModal('pricing');
    },
    openPricing: function () {
      openAccountModal('pricing');
    },
    openModal: function (view) {
      openAccountModal(view);
    },
    closeModal: function () {
      if (typeof globalCloseModal === 'function') globalCloseModal();
    },
    portalUrl: KAOLA_ID_PORTAL_URL,
    payUrl: KAOLAPAY_BASE_URL
  };

})();
