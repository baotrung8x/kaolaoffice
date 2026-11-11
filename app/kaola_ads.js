/**
 * Kaola Office Enterprise - Central Initialization, Real-Time Ad Banner & Auto-Update Engine
 * Kết nối đồng bộ thời gian thực với KaolaWork SaaS
 * - Tự động cập nhật tức thì mẫu quảng cáo mới nhất ngay khi admin thay đổi trên SaaS
 * - Dò tìm phiên bản mới và nhắc khách hàng nâng cấp
 * - Tự động ẩn quảng cáo khi kích hoạt bản quyền Kaola Pro
 * - Lắng nghe đa sự kiện: Polling 15s, Window Focus, Visibility Change, Route Change
 */

(function () {
  'use strict';

  const APP_CURRENT_VERSION = '2.0.0';
  const API_ENDPOINTS = [
    'https://work.kaola.vn/api/v1/office/init',
    'https://kaola.vn/api/v1/office/init',
    'https://kaola.vn/wp-json/kaola-rm/v1/releases/kaola-office/latest',
    'http://kaolawork.test/api/v1/office/init'
  ];
  const TRACK_ENDPOINTS = [
    'https://work.kaola.vn/api/v1/ads/track',
    'https://kaola.vn/api/v1/ads/track',
    'http://kaolawork.test/api/v1/ads/track'
  ];
  const STORAGE_CONFIG_KEY = 'kaola_office_remote_config';
  const DISMISS_AD_SESSION_KEY = 'kaola_ad_dismissed';
  const DISMISS_AD_ID_KEY = 'kaola_ad_dismissed_id';
  const DISMISS_UPDATE_SESSION_KEY = 'kaola_update_dismissed';
  const DEVICE_ID_STORAGE_KEY = 'kaola_office_device_id';
  const ACTIVE_ENDPOINT_KEY = 'kaola_office_active_endpoint';
  const SYNC_INTERVAL_MS = 15 * 60 * 1000; // Định kỳ kiểm tra cập nhật mỗi 15 phút (thay vì 15 giây)

  // Dữ liệu Quảng cáo mặc định khi offline hoặc chưa kết nối máy chủ
  const DEFAULT_AD = {
    id: 'ad_bank_enterprise_01',
    badge: 'ƯU ĐÃI DOANH NGHIỆP',
    icon: '🏦',
    iconImg: '',
    title: 'Tài khoản Doanh nghiệp Số đẹp — Miễn 100% phí chuyển tiền',
    desc: 'Mở tài khoản thanh toán online trong 5 phút. Tặng gói tín dụng ưu đãi độc quyền cho khách hàng Kaola Office.',
    ctaText: 'Xem ưu đãi',
    ctaUrl: 'https://kaola.vn/partners/promo',
    active: true,
    customHtml: ''
  };

  let remoteConfig = null;
  let bannerElement = null;
  let updateBannerElement = null;
  let pendingUpdateData = null;
  let currentRenderedAd = null;
  let isSyncing = false;
  let syncTimer = null;
  let activeApiUrl = null;

  // 1. Kiểm tra tài khoản Pro / Ad-Free
  function isAdFreeUser() {
    try {
      if (window.KaolaAccount && typeof window.KaolaAccount.getUser === 'function') {
        const user = window.KaolaAccount.getUser();
        if (user && (user.is_vip || user.plan === 'pro' || user.plan === 'enterprise' || user.ad_free)) {
          return true;
        }
      }
      const raw = localStorage.getItem('kaola_account_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user && (user.is_vip || user.plan === 'pro' || user.plan === 'enterprise' || user.ad_free)) {
          return true;
        }
      }
      if (window.KaolaLicense && typeof window.KaolaLicense.isLicensed === 'function') {
        if (window.KaolaLicense.isLicensed()) return true;
      }
    } catch (e) {}
    return false;
  }

  // 2. So sánh 2 chuỗi phiên bản (v1 > v2 => 1, v1 < v2 => -1, bằng nhau => 0)
  function compareVersion(v1, v2) {
    if (!v1 || !v2) return 0;
    const p1 = String(v1).replace(/^v/i, '').split('.').map(Number);
    const p2 = String(v2).replace(/^v/i, '').split('.').map(Number);
    const len = Math.max(p1.length, p2.length);
    for (let i = 0; i < len; i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }

  // 3. Lấy hoặc tạo mã định danh thiết bị ẩn danh duy nhất (UUID v4)
  function getDeviceId() {
    try {
      let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (!id) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          id = crypto.randomUUID();
        } else {
          id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 12);
        }
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return 'anonymous_device';
    }
  }

  // 4. Tạo chuỗi tham số telemetry gửi về máy chủ
  function buildTelemetryQuery() {
    const devId = getDeviceId();
    let query = `?app=office&v=${encodeURIComponent(APP_CURRENT_VERSION)}&device_id=${encodeURIComponent(devId)}&os=Windows`;
    try {
      if (window.KaolaAccount && typeof window.KaolaAccount.getUser === 'function') {
        const u = window.KaolaAccount.getUser();
        if (u) {
          if (u.email) query += `&email=${encodeURIComponent(u.email)}`;
          if (u.is_vip || u.plan === 'pro') query += `&is_vip=1`;
        }
      }
    } catch (e) {}
    return query;
  }

  // 5. Tải cấu hình từ Server với cơ chế thử luân phiên siêu tốc và chống cache
  async function fetchRemoteConfig() {
    const queryParams = buildTelemetryQuery() + '&_t=' + Date.now();
    const headers = { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' };

    // Ưu tiên endpoint đã từng kết nối thành công trước đó
    try {
      if (!activeApiUrl) {
        activeApiUrl = localStorage.getItem(ACTIVE_ENDPOINT_KEY);
      }
    } catch (e) {}

    const endpointsToTry = [];
    if (activeApiUrl && API_ENDPOINTS.includes(activeApiUrl)) {
      endpointsToTry.push(activeApiUrl);
    }
    API_ENDPOINTS.forEach(ep => {
      if (!endpointsToTry.includes(ep)) endpointsToTry.push(ep);
    });

    for (const ep of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(ep + queryParams, {
          signal: controller.signal,
          cache: 'no-store',
          headers: headers
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'success') {
            activeApiUrl = ep;
            try {
              localStorage.setItem(ACTIVE_ENDPOINT_KEY, ep);
              localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(data));
            } catch (e) {}
            return data;
          } else if (data && data.release && data.release.version) {
            // Hỗ trợ trực tiếp định dạng Kaola Release Manager từ WordPress REST API
            const rel = data.release;
            const normalizedData = {
              status: 'success',
              app_code: 'office',
              update: {
                current_stable_version: rel.version,
                latest_version: rel.version,
                download_url: rel.download_url || 'https://kaola.vn/download/KaolaOffice_Setup.exe',
                release_notes: rel.changelog || 'Đã có bản cập nhật mới cho Kaola Office.',
                force_update: false
              },
              ad: DEFAULT_AD
            };
            activeApiUrl = ep;
            try {
              localStorage.setItem(ACTIVE_ENDPOINT_KEY, ep);
              localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(normalizedData));
            } catch (e) {}
            return normalizedData;
          } else if (data) {
            // Hỗ trợ cả file riêng (kaolaoffice_version.json) lẫn file tổng multi-app (apps.json)
            const appSection = (data.office || data.kaolaoffice) ? (data.office || data.kaolaoffice) : data;
            if (appSection && (appSection.version || appSection.latest_version)) {
              const latestVer = appSection.version || appSection.latest_version;
              const normalizedData = {
                status: 'success',
                app_code: 'office',
                update: {
                  current_stable_version: latestVer,
                  latest_version: latestVer,
                  download_url: appSection.download_url || 'https://kaola.vn/download/KaolaOffice_Setup.exe',
                  release_notes: appSection.release_notes || appSection.changelog || 'Đã có bản cập nhật mới cho Kaola Office.',
                  force_update: !!appSection.force_update
                },
                ad: DEFAULT_AD
              };
              activeApiUrl = ep;
              try {
                localStorage.setItem(ACTIVE_ENDPOINT_KEY, ep);
                localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(normalizedData));
              } catch (e) {}
              return normalizedData;
            }
          }
        }
      } catch (e) {
        // Thử endpoint tiếp theo
      }
    }

    // Dùng cache đã lưu trước đó nếu offline
    try {
      const cached = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data && data.status === 'success') return data;
      }
    } catch (e) {}

    // Dữ liệu mặc định
    return {
      status: 'success',
      ad: DEFAULT_AD,
      update: {
        latest_version: APP_CURRENT_VERSION,
        download_url: 'https://kaola.vn/download/KaolaOffice_Setup.exe',
        release_notes: ''
      }
    };
  }

  // 6. So sánh 2 mẫu quảng cáo xem có sự thay đổi nội dung không
  function isAdDifferent(a, b) {
    if (!a && !b) return false;
    if (!a || !b) return true;
    return a.id !== b.id ||
           a.title !== b.title ||
           a.desc !== b.desc ||
           a.badge !== b.badge ||
           a.icon !== b.icon ||
           a.iconImg !== b.iconImg ||
           a.ctaText !== b.ctaText ||
           a.ctaUrl !== b.ctaUrl ||
           a.active !== b.active ||
           a.customHtml !== b.customHtml;
  }

  // 7. Đồng bộ tức thì mẫu quảng cáo mới nhất từ SaaS
  async function checkAndSyncAds(immediate = false) {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const newConfig = await fetchRemoteConfig();
      if (!newConfig) return;

      remoteConfig = newConfig;

      // 7.1. Cập nhật thông báo phiên bản mới
      if (newConfig.update) {
        renderUpdateNotification(newConfig.update);
        if (newConfig.update.download_url) {
          const aboutBtn = document.getElementById('kaola-about-download-btn');
          if (aboutBtn) aboutBtn.href = newConfig.update.download_url;
        }
      }

      // 7.1b. Đồng bộ thanh thông báo Announcement Bar từ SaaS
      if (newConfig.broadcasts && window.KaolaBroadcast && typeof window.KaolaBroadcast.setBroadcasts === 'function') {
        window.KaolaBroadcast.setBroadcasts(newConfig.broadcasts);
      }

      // 7.2. Kiểm tra thay đổi nội dung quảng cáo
      const newAd = newConfig.ad;
      if (isAdDifferent(currentRenderedAd, newAd)) {
        console.log('[Kaola Ads] Phát hiện mẫu quảng cáo mới từ SaaS, đang cập nhật thời gian thực...');

        // Nếu mẫu quảng cáo đổi ID mới, xóa cờ tạm ẩn để người dùng nhìn thấy chiến dịch mới
        const dismissedAdId = sessionStorage.getItem(DISMISS_AD_ID_KEY);
        if (newAd && newAd.id && newAd.id !== dismissedAdId) {
          sessionStorage.removeItem(DISMISS_AD_SESSION_KEY);
          sessionStorage.removeItem(DISMISS_AD_ID_KEY);
        }

        if (!newAd || newAd.active === false) {
          hideBannerImmediately();
          currentRenderedAd = null;
        } else {
          renderAdBanner(newAd);
          currentRenderedAd = Object.assign({}, newAd);
        }
      }
    } catch (err) {
      console.warn('[Kaola Ads] Lỗi đồng bộ quảng cáo:', err);
    } finally {
      isSyncing = false;
    }
  }

  // 8. Quản lý thông báo Cập nhật Phiên bản mới:
  // Thay vì hiển thị banner nổi chiếm chỗ màn hình chính, đưa vào màn hình "Cài đặt" và gắn chấm đỏ lên icon "Cài đặt"
  function renderUpdateNotification(updateData) {
    if (!updateData || !updateData.latest_version) return;

    if (compareVersion(updateData.latest_version, APP_CURRENT_VERSION) <= 0) {
      pendingUpdateData = null;
      updateSettingsBadge();
      removeSettingsUpdateCard();
      return;
    }

    pendingUpdateData = updateData;

    // Gỡ bỏ banner nổi cũ nếu còn tồn tại để không chiếm chỗ
    if (updateBannerElement) {
      updateBannerElement.remove();
      updateBannerElement = null;
    }
    const oldFloating = document.getElementById('kaola-update-banner');
    if (oldFloating) oldFloating.remove();

    // Hiển thị chấm đỏ trên icon Cài đặt & render thẻ cập nhật nếu đang ở trang Cài đặt
    updateSettingsBadge();
    renderSettingsUpdateCard();
  }

  // Cập nhật chấm đỏ thông báo (badge) trên icon "Cài đặt" ở thanh menu bên trái
  function updateSettingsBadge() {
    const existingDots = document.querySelectorAll('.kaola-settings-update-dot');

    if (!pendingUpdateData || compareVersion(pendingUpdateData.latest_version, APP_CURRENT_VERSION) <= 0) {
      existingDots.forEach(dot => dot.remove());
      return;
    }

    // Tìm nút/menu item Cài đặt trong .tool-menu
    const settingsBtn = document.querySelector('.tool-menu [action="settings"], .tool-menu [href*="settings"], .tool-menu .cls-btn[action="settings"]');
    if (!settingsBtn) return;

    const iconBox = settingsBtn.querySelector('.icon-inner-box') || settingsBtn;
    if (window.getComputedStyle(iconBox).position === 'static') {
      iconBox.style.position = 'relative';
    }

    if (!iconBox.querySelector('.kaola-settings-update-dot')) {
      const dot = document.createElement('span');
      dot.className = 'kaola-settings-update-dot';
      dot.title = `Có bản cập nhật mới: Kaola Office v${escapeHtml(pendingUpdateData.latest_version)}`;
      iconBox.appendChild(dot);
    }
  }

  // Render thẻ thông tin cập nhật nằm gọn trong trang Cài đặt (Settings View)
  function renderSettingsUpdateCard() {
    if (!pendingUpdateData || compareVersion(pendingUpdateData.latest_version, APP_CURRENT_VERSION) <= 0) {
      removeSettingsUpdateCard();
      return;
    }

    const hash = window.location.hash || '';
    if (!hash.includes('/settings')) return;

    // Tìm form/page cài đặt
    const container = document.querySelector('.mIUnDq_form, [class*="_form"], .cls-settings-page, main > div, main');
    if (!container) return;

    if (document.getElementById('kaola-settings-update-card')) return;

    const card = document.createElement('div');
    card.id = 'kaola-settings-update-card';
    card.className = 'kaola-settings-update-card';

    const note = pendingUpdateData.release_notes || 'Phiên bản tiêu chuẩn tích hợp AI Copilot và Hệ sinh thái KaolaWork.';
    const downloadUrl = pendingUpdateData.download_url || 'https://download.kaola.vn/KaolaOffice_Setup.exe';

    card.innerHTML = `
      <div class="kaola-update-card-left">
        <div class="kaola-update-pill-row">
          <span class="kaola-update-pill">BẢN CẬP NHẬT MỚI</span>
          <span class="kaola-update-ver">Kaola Office v${escapeHtml(pendingUpdateData.latest_version)}</span>
        </div>
        <p class="kaola-update-desc">${escapeHtml(note)}</p>
        <div class="kaola-update-cur-ver">Phiên bản hiện tại trên máy của bạn: <strong>v${APP_CURRENT_VERSION}</strong></div>
      </div>
      <div class="kaola-update-card-right">
        <a href="${escapeHtml(downloadUrl)}" target="_blank" class="kaola-update-dl-btn" title="Bấm để tải bộ cài đặt mới nhất">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Tải bản cập nhật
        </a>
      </div>
    `;

    container.prepend(card);
  }

  function removeSettingsUpdateCard() {
    const card = document.getElementById('kaola-settings-update-card');
    if (card) card.remove();
  }

  // 8.5. Gửi sự kiện đo lường quảng cáo (Impression / Click) về máy chủ
  async function trackAdEvent(eventType, adId) {
    if (!adId || !eventType) return;

    const payload = {
      app: 'office',
      ad_id: adId,
      event_type: eventType,
      device_id: getDeviceId(),
      os: 'Windows'
    };

    try {
      if (window.KaolaAccount && typeof window.KaolaAccount.getUser === 'function') {
        const u = window.KaolaAccount.getUser();
        if (u && u.email) payload.email = u.email;
      }
    } catch (e) {}

    // Xác định endpoint ưu tiên
    let primaryEndpoint = 'https://work.kaola.vn/api/v1/ads/track';
    if (activeApiUrl) {
      try {
        const urlObj = new URL(activeApiUrl);
        primaryEndpoint = `${urlObj.origin}/api/v1/ads/track`;
      } catch (e) {}
    }

    const endpoints = [primaryEndpoint];
    TRACK_ENDPOINTS.forEach(ep => {
      if (!endpoints.includes(ep)) endpoints.push(ep);
    });

    const bodyStr = JSON.stringify(payload);

    for (const ep of endpoints) {
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([bodyStr], { type: 'application/json' });
          const sent = navigator.sendBeacon(ep, blob);
          if (sent) return;
        }

        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr,
          keepalive: true
        });
        if (res.ok) return;
      } catch (err) {
        // Thử endpoint tiếp theo
      }
    }
  }

  // 9. Render Thẻ Quảng cáo căn giữa đáy màn hình
  function renderAdBanner(adData) {
    if (isAdFreeUser()) {
      hideBannerImmediately();
      return;
    }

    if (sessionStorage.getItem(DISMISS_AD_SESSION_KEY) === 'true') {
      return;
    }

    if (!adData || adData.active === false) {
      hideBannerImmediately();
      return;
    }

    if (bannerElement) {
      bannerElement.remove();
    }

    const container = document.createElement('div');
    container.id = 'kaola-ad-root';
    container.className = 'kaola-ad-container';

    // Hỗ trợ mã script đối tác tùy chỉnh nếu có
    if (adData.customHtml && adData.customHtml.trim() !== '') {
      container.innerHTML = `
        <div class="kaola-ad-card kaola-ad-custom-card">
          <button id="kaola-ad-btn-close" class="kaola-ad-close" title="Tắt quảng cáo">&times;</button>
          <div class="kaola-ad-custom-content">${adData.customHtml}</div>
        </div>
      `;
    } else {
      const defaultIcon = escapeHtml(adData.icon || '🏦');
      const iconHtml = adData.iconImg 
        ? `<img src="${escapeHtml(adData.iconImg)}" class="kaola-ad-icon-img" alt="Ad" onerror="this.onerror=null;this.parentElement.innerHTML='<span>${defaultIcon}</span>';"/>`
        : `<span>${defaultIcon}</span>`;

      container.innerHTML = `
        <div class="kaola-ad-card">
          <div class="kaola-ad-left">
            <div class="kaola-ad-icon-box">
              ${iconHtml}
            </div>
            <div class="kaola-ad-info">
              <div class="kaola-ad-header-row">
                <span class="kaola-ad-badge">${escapeHtml(adData.badge || 'ƯU ĐÃI DOANH NGHIỆP')}</span>
                <h4 class="kaola-ad-title">${escapeHtml(adData.title || '')}</h4>
              </div>
              <p class="kaola-ad-desc">${escapeHtml(adData.desc || '')}</p>
            </div>
          </div>

          <div class="kaola-ad-right">
            <a id="kaola-ad-btn-action" href="${escapeHtml(adData.ctaUrl || '#')}" target="_blank" class="kaola-ad-btn">
              <span>${escapeHtml(adData.ctaText || 'Xem ưu đãi')}</span>
              <span>➔</span>
            </a>
            <button id="kaola-ad-btn-close" class="kaola-ad-close" title="Tắt quảng cáo">&times;</button>
          </div>
        </div>

        <div class="kaola-ad-subbar">
          <span>Kaola Office Miễn phí • Tài trợ duy trì hệ sinh thái</span>
          <a id="kaola-ad-btn-upgrade" class="kaola-ad-upgrade-link">⭐ Nâng cấp Kaola Pro để tắt quảng cáo</a>
        </div>
      `;
    }

    document.body.appendChild(container);
    bannerElement = container;
    currentRenderedAd = Object.assign({}, adData);

    bindBannerEvents(adData);
    checkRouteAndToggle();

    // Đo lường lượt hiển thị thực tế (Impression) với chống spam 10 phút / session
    if (adData && adData.id) {
      try {
        const impSessionKey = 'kaola_ad_imp_' + adData.id;
        const lastImp = sessionStorage.getItem(impSessionKey);
        const now = Date.now();
        if (!lastImp || (now - parseInt(lastImp, 10)) > 600000) {
          trackAdEvent('impression', adData.id);
          sessionStorage.setItem(impSessionKey, now.toString());
        }
      } catch (e) {}
    }
  }

  // 10. Gán các sự kiện tương tác của Banner
  function bindBannerEvents(adData) {
    if (!bannerElement) return;

    // Đo lường lượt nhấp chuột (Clicks) vào nút CTA
    const btnAction = bannerElement.querySelector('#kaola-ad-btn-action');
    if (btnAction) {
      btnAction.addEventListener('click', function () {
        trackAdEvent('click', adData ? adData.id : null);
      });
    }

    const customLinks = bannerElement.querySelectorAll('.kaola-ad-custom-content a');
    customLinks.forEach(link => {
      link.addEventListener('click', function () {
        trackAdEvent('click', adData ? adData.id : null);
      });
    });

    const btnClose = bannerElement.querySelector('#kaola-ad-btn-close');
    const btnUpgrade = bannerElement.querySelector('#kaola-ad-btn-upgrade');

    if (btnClose) {
      btnClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideBanner(adData ? adData.id : null);
        showToast('Quảng cáo đã được tạm ẩn trong phiên này. Đăng nhập Kaola Pro để tắt vĩnh viễn.');
      });
    }

    if (btnUpgrade) {
      btnUpgrade.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.KaolaAccount && typeof window.KaolaAccount.openUpgradeModal === 'function') {
          window.KaolaAccount.openUpgradeModal();
        } else {
          const pill = document.getElementById('kaola-account-pill');
          if (pill) {
            pill.click();
          } else {
            window.open('https://id.kaola.vn', '_blank');
          }
        }
      });
    }
  }

  // Ẩn banner quảng cáo khi người dùng nhấn nút đóng
  function hideBanner(adId) {
    if (bannerElement) {
      bannerElement.classList.add('hidden');
      setTimeout(() => {
        if (bannerElement) bannerElement.style.display = 'none';
      }, 300);
    }
    try {
      sessionStorage.setItem(DISMISS_AD_SESSION_KEY, 'true');
      if (adId) {
        sessionStorage.setItem(DISMISS_AD_ID_KEY, adId);
      }
    } catch (e) {}
  }

  // Ẩn ngay lập tức không lưu cờ dismiss
  function hideBannerImmediately() {
    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
    }
  }

  // Hiển thị thông báo Toast
  function showToast(msg) {
    let toast = document.getElementById('kaola-ad-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kaola-ad-toast';
      toast.className = 'kaola-ad-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  // Escape HTML an toàn
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Quản lý hiển thị theo Hash Route & Web Views (Chỉ hiển thị khi đang ở trang chủ Open/Recent)
  function checkRouteAndToggle() {
    const isConnectView = document.getElementById('view-connect')?.style.display !== 'none';
    const isEditor = window.location.pathname.includes('editor.html');
    const hasActiveModal = !!document.querySelector('.modal-overlay.active, .kaola-modal-overlay.active');
    const hash = window.location.hash || '#/';
    const isSettingsOrDialog = hash.includes('settings') || 
                               hash.includes('about') || 
                               hash.includes('templates') || 
                               hash.includes('clouds');
    const isHome = (hash === '#/' || hash === '' || hash.startsWith('#/open')) && !isSettingsOrDialog && !isConnectView;

    // Kiểm tra xem trên trang hiện tại có panel/nút của Settings không
    const hasSettingsUI = !!document.querySelector('.settings-page, .settings-buttons');

    if (bannerElement) {
      if (isHome && !hasSettingsUI && !isEditor && !hasActiveModal && !isAdFreeUser() && sessionStorage.getItem(DISMISS_AD_SESSION_KEY) !== 'true') {
        bannerElement.style.display = 'flex';
        bannerElement.classList.remove('hidden');
      } else {
        bannerElement.style.display = 'none';
        bannerElement.classList.add('hidden');
      }
    }

    // Luôn kiểm tra và cập nhật icon Cài đặt & thẻ cập nhật trong trang Cài đặt
    updateSettingsBadge();
    renderSettingsUpdateCard();
  }

  // Khởi động Engine và kích hoạt lắng nghe sự kiện (Tối ưu hóa Event-Driven, không nghẽn CPU)
  function init() {
    // 1. Render ngay từ Cache cục bộ hoặc mặc định (tức thì 0ms, không chờ mạng)
    try {
      const cached = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (cached) {
        if (cached.includes('Enterprise')) {
          localStorage.removeItem(STORAGE_CONFIG_KEY);
          localStorage.removeItem(ACTIVE_ENDPOINT_KEY);
        } else {
          const data = JSON.parse(cached);
          if (data && data.ad) {
            remoteConfig = data;
            renderAdBanner(data.ad);
            currentRenderedAd = Object.assign({}, data.ad);
            if (data.update) {
              renderUpdateNotification(data.update);
              if (data.update.download_url) {
                const aboutBtn = document.getElementById('kaola-about-download-btn');
                if (aboutBtn) aboutBtn.href = data.update.download_url;
              }
            }
          }
        }
      }
    } catch (e) {}

    // 2. Đồng bộ với máy chủ (ngay 100ms trên môi trường test/local, hoặc 1.5s trên production)
    const isLocalDev = typeof window !== 'undefined' && (
      window.location.hostname.includes('.test') || 
      window.location.hostname === 'localhost' || 
      window.location.protocol === 'file:'
    );
    setTimeout(() => {
      checkAndSyncAds();
    }, isLocalDev ? 100 : 1500);

    // 3. Định kỳ kiểm tra cập nhật mỗi 15 phút (tiết kiệm tài nguyên)
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(() => {
      checkAndSyncAds();
    }, SYNC_INTERVAL_MS);

    // 4. Sự kiện đổi route: Chỉ kiểm tra khi có điều hướng
    window.addEventListener('hashchange', checkRouteAndToggle);
    window.addEventListener('popstate', checkRouteAndToggle);

    // Hook pushState và replaceState để phát hiện điều hướng route trong SolidJS
    const origPush = history.pushState;
    if (origPush) {
      history.pushState = function () {
        origPush.apply(this, arguments);
        setTimeout(checkRouteAndToggle, 50);
      };
    }
    const origReplace = history.replaceState;
    if (origReplace) {
      history.replaceState = function () {
        origReplace.apply(this, arguments);
        setTimeout(checkRouteAndToggle, 50);
      };
    }

    // 6. Sự kiện Storage: Đồng bộ tức thì giữa các tab/cửa sổ soạn thảo đang mở
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_CONFIG_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.ad && isAdDifferent(currentRenderedAd, data.ad)) {
            renderAdBanner(data.ad);
          }
        } catch (err) {}
      }
    });

    // 7. Khởi tạo kiểm tra badge trên icon Cài đặt & cập nhật tự động khi DOM thay đổi
    updateSettingsBadge();
    renderSettingsUpdateCard();

    try {
      const observer = new MutationObserver(() => {
        if (pendingUpdateData) {
          updateSettingsBadge();
          renderSettingsUpdateCard();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (err) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export API toàn cục
  window.KaolaAds = {
    hide: hideBanner,
    reload: async () => {
      await checkAndSyncAds(true);
    },
    syncNow: checkAndSyncAds,
    getConfig: () => remoteConfig,
    getCurrentVersion: () => APP_CURRENT_VERSION
  };

})();
