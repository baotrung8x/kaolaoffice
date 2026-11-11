// Kaola Office - Vietnamese Templates Repository Script
(function() {
  'use strict';

  // Master Templates Data
  const TEMPLATES = [
    // --- Nghi dinh 30 (Word) ---
    {
      id: "cong-van-nd30",
      title: "Công văn Hành chính Chuẩn NĐ 30",
      desc: "Mẫu Công văn gửi đối tác hoặc cơ quan quản lý. Chuẩn Quốc hiệu, Tiêu ngữ, số hiệu, trích yếu theo Nghị định 30/2020/NĐ-CP.",
      format: "docx",
      category: "nd30",
      file: "files/Cong_van_ND30.docx",
      thumb: "thumbnails/word_nd30.svg",
      tags: ["Nghị định 30", "Công văn", "Hành chính", "Word"]
    },
    {
      id: "quyet-dinh-nd30",
      title: "Quyết định Ban hành Quy chế NĐ 30",
      desc: "Mẫu Quyết định của Tổng Giám đốc về việc ban hành quy chế nội bộ hoặc bổ nhiệm cán bộ, đầy đủ căn cứ pháp lý và các điều khoản.",
      format: "docx",
      category: "nd30",
      file: "files/Quyet_dinh_ND30.docx",
      thumb: "thumbnails/word_nd30.svg",
      tags: ["Nghị định 30", "Quyết định", "Pháp lý", "Word"]
    },
    {
      id: "to-trinh-nd30",
      title: "Tờ trình Phê duyệt Chủ trương NĐ 30",
      desc: "Mẫu Tờ trình Ban Lãnh đạo đề xuất kinh phí, dự án hoặc kế hoạch công tác. Bố cục 4 phần chuẩn: Sự cần thiết, Mục tiêu, Dự toán, Đề xuất.",
      format: "docx",
      category: "nd30",
      file: "files/To_trinh_ND30.docx",
      thumb: "thumbnails/word_nd30.svg",
      tags: ["Nghị định 30", "Tờ trình", "Dự án", "Word"]
    },
    {
      id: "bien-ban-hop-nd30",
      title: "Biên bản Cuộc họp Ban Giám Đốc",
      desc: "Biên bản ghi nhận chi tiết thời gian, địa điểm, thành phần, ý kiến thảo luận và kết luận phân công nhiệm vụ của Chủ tọa.",
      format: "docx",
      category: "nd30",
      file: "files/Bien_ban_hop_ND30.docx",
      thumb: "thumbnails/word_nd30.svg",
      tags: ["Biên bản", "Cuộc họp", "Nội bộ", "Word"]
    },
    {
      id: "giay-uy-quyen-nd30",
      title: "Giấy Ủy quyền Đại diện Pháp luật",
      desc: "Mẫu Giấy ủy quyền xử lý công việc, ký hợp đồng và đại diện doanh nghiệp làm việc với cơ quan đối tác theo Bộ luật Dân sự.",
      format: "docx",
      category: "nd30",
      file: "files/Giay_uy_quyen_ND30.docx",
      thumb: "thumbnails/word_nd30.svg",
      tags: ["Ủy quyền", "Pháp lý", "Đại diện", "Word"]
    },

    // --- Hop dong ---
    {
      id: "hop-dong-lao-dong",
      title: "Hợp đồng Lao động Xác định Thời hạn 2026",
      desc: "Chuẩn Bộ luật Lao động mới nhất. Đầy đủ quyền lợi, nghĩa vụ, mức lương, phụ cấp, bảo hiểm xã hội và thời giờ làm việc.",
      format: "docx",
      category: "contract",
      file: "files/Hop_dong_lao_dong_2026.docx",
      thumb: "thumbnails/word_contract.svg",
      tags: ["Hợp đồng", "Lao động", "Nhân sự", "Word"]
    },
    {
      id: "hop-dong-dich-vu",
      title: "Hợp đồng Kinh tế Cung ứng Dịch vụ",
      desc: "Mẫu Hợp đồng cung cấp dịch vụ thương mại, phần mềm và giải pháp công nghệ. Điều khoản nghiệm thu, thanh toán và bảo hành.",
      format: "docx",
      category: "contract",
      file: "files/Hop_dong_cung_cap_dich_vu.docx",
      thumb: "thumbnails/word_contract.svg",
      tags: ["Hợp đồng", "Dịch vụ", "Thương mại", "Word"]
    },
    {
      id: "thoa-thuan-nda",
      title: "Thỏa thuận Bảo mật Thông tin (NDA)",
      desc: "Bản thỏa thuận Non-Disclosure Agreement bảo vệ bí mật công nghệ, mã nguồn, danh sách khách hàng và dữ liệu tài chính nội bộ.",
      format: "docx",
      category: "contract",
      file: "files/Thoa_thuan_bao_mat_NDA.docx",
      thumb: "thumbnails/word_contract.svg",
      tags: ["NDA", "Bảo mật", "Pháp lý", "Word"]
    },

    // --- Nhan su & Ca nhan ---
    {
      id: "don-xin-nghi-phep",
      title: "Đơn xin Nghỉ phép Nhân sự",
      desc: "Mẫu đơn xin nghỉ phép năm, việc riêng, có phần bàn giao công việc cụ thể và 3 chữ ký duyệt: Ban Giám đốc, Quản lý, Người làm đơn.",
      format: "docx",
      category: "hr",
      file: "files/Don_xin_nghi_phep.docx",
      thumb: "thumbnails/word_hr.svg",
      tags: ["Nghỉ phép", "Nhân sự", "Mẫu đơn", "Word"]
    },
    {
      id: "cv-tieng-viet",
      title: "CV / Sơ yếu Lý lịch Ứng tuyển Chuyên nghiệp",
      desc: "Mẫu CV thiết kế hiện đại, bố cục rõ ràng: Mục tiêu nghề nghiệp, Kinh nghiệm làm việc, Học vấn, Kỹ năng và dự án tiêu biểu.",
      format: "docx",
      category: "hr",
      file: "files/CV_tieng_viet_chuyen_nghiep.docx",
      thumb: "thumbnails/word_cv.svg",
      tags: ["CV", "Tuyển dụng", "Ứng tuyển", "Word"]
    },

    // --- Excel ---
    {
      id: "bang-luong-cham-cong",
      title: "Bảng Chấm Công & Tính Lương Tự Động",
      desc: "File Excel hoàn chỉnh với công thức tự động tính: Lương theo ngày công, Phụ cấp, Thưởng, trừ BHXH (10.5%) và Thực lĩnh.",
      format: "xlsx",
      category: "excel",
      file: "files/Bang_cham_cong_tinh_luong.xlsx",
      thumb: "thumbnails/excel_salary.svg",
      tags: ["Bảng lương", "Chấm công", "Kế toán", "Excel"]
    },
    {
      id: "so-quy-tien-mat",
      title: "Sổ Theo dõi Thu - Chi Quỹ Tiền Mặt",
      desc: "Sổ quỹ kế toán chuẩn mực, theo dõi chi tiết số chứng từ, diễn giải, người giao dịch và tự động cộng dồn số dư tồn quỹ.",
      format: "xlsx",
      category: "excel",
      file: "files/So_quy_thu_chi_tien_mat.xlsx",
      thumb: "thumbnails/excel_cash.svg",
      tags: ["Sổ quỹ", "Thu chi", "Tài chính", "Excel"]
    },
    {
      id: "ke-hoach-tien-do-gantt",
      title: "Quản lý Kế hoạch & Tiến độ Dự án (Gantt)",
      desc: "Theo dõi đầu việc (Tasks), người phụ trách, thời gian bắt đầu/kết thúc, tỷ lệ % hoàn thành và trạng thái màu sắc trực quan.",
      format: "xlsx",
      category: "excel",
      file: "files/Ke_hoach_tien_do_du_an.xlsx",
      thumb: "thumbnails/excel_gantt.svg",
      tags: ["Dự án", "Tiến độ", "Gantt", "Excel"]
    },

    // --- PowerPoint ---
    {
      id: "slide-company-profile",
      title: "Hồ sơ Năng lực Công ty (Company Profile)",
      desc: "Bộ slide 16:9 widescreen giới thiệu doanh nghiệp, tầm nhìn, sứ mệnh, giá trị cốt lõi, đội ngũ nhân sự và hệ sinh thái giải pháp.",
      format: "pptx",
      category: "ppt",
      file: "files/Slide_gioi_thieu_cong_ty.pptx",
      thumb: "thumbnails/ppt_profile.svg",
      tags: ["Company Profile", "Giới thiệu", "Slide", "PowerPoint"]
    },
    {
      id: "slide-pitch-deck",
      title: "Slide Pitch Deck Kế hoạch Gọi vốn Kinh doanh",
      desc: "Thiết kế chuẩn pitching quốc tế: Vấn đề thị trường, Giải pháp đột phá, Quy mô thị trường, Mô hình doanh thu và Kế hoạch tăng trưởng.",
      format: "pptx",
      category: "ppt",
      file: "files/Slide_pitch_deck_kinh_doanh.pptx",
      thumb: "thumbnails/ppt_pitch.svg",
      tags: ["Pitch Deck", "Gọi vốn", "Kinh doanh", "PowerPoint"]
    }
  ];

  let currentCategory = "all";
  let searchQuery = "";

  // Helper to determine document type code for Kaola Office (Word: 65, Slide: 129, Excel: 257, PDF: 513)
  function getDocType(fileName) {
    var ext = (fileName || '').split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'ods', 'csv', 'xltx'].indexOf(ext) !== -1) return 257;
    if (['pptx', 'ppt', 'odp', 'ppsx', 'potx'].indexOf(ext) !== -1) return 129;
    if (['pdf', 'oform'].indexOf(ext) !== -1) return 513;
    return 65; // default docx / word
  }

  // Helper to open template directly in Kaola Office
  window.openTemplateDocument = function(relativeFileUrl, defaultFileName) {
    // Build absolute URL
    const fullUrl = new URL(relativeFileUrl, window.location.href).href;
    const docType = getDocType(defaultFileName || relativeFileUrl);
    showToast("Đang mở mẫu trong Kaola Office...");

    var localPath = '';
    if (fullUrl.indexOf('file:///') === 0) {
      localPath = decodeURIComponent(fullUrl.replace(/^file:\/\/\//, '').replace(/\//g, '\\'));
    }

    // 1. PostMessage to parent window (Top-level Kaola Office window: app/index.html)
    // Works reliably whether running offline or online from office.kaola.vn
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: "openTemplate",
        file: relativeFileUrl,
        url: fullUrl,
        localPath: localPath,
        name: defaultFileName,
        docType: docType
      }, "*");
      return;
    }

    // 2. Direct native call if running standalone in CEF desktop
    var desktopSdk = window.AscDesktopEditor;
    if (desktopSdk && typeof desktopSdk.execCommand === 'function' && localPath) {
      desktopSdk.execCommand("create:new", JSON.stringify({
        template: {
          type: docType,
          path: localPath
        }
      }));
      return;
    }

    // 3. Browser fallback (Chrome/Edge/Firefox outside Kaola Office): trigger download
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper for download
  window.downloadTemplateFile = function(relativeFileUrl, defaultFileName, e) {
    if (e) e.stopPropagation();
    const fullUrl = new URL(relativeFileUrl, window.location.href).href;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Đang tải file mẫu về máy...");
  };

  // Toast
  function showToast(message) {
    let t = document.getElementById("action-toast");
    if (!t) return;
    t.innerText = message;
    t.className = "toast success show";
    setTimeout(() => {
      t.className = "toast";
    }, 2800);
  }

  // Render Grid
  function renderTemplates() {
    const grid = document.getElementById("template-grid");
    const countEl = document.getElementById("template-count");
    if (!grid) return;

    const filtered = TEMPLATES.filter(item => {
      // Category filter
      if (currentCategory !== "all" && item.category !== currentCategory) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.desc.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        const inFormat = item.format.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTags && !inFormat) {
          return false;
        }
      }
      return true;
    });

    if (countEl) {
      countEl.innerText = `Hiển thị ${filtered.length} / ${TEMPLATES.length} văn bản mẫu`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <h3>Không tìm thấy văn bản mẫu phù hợp</h3>
          <p>Hãy thử tìm bằng từ khóa khác như "công văn", "hợp đồng", "bảng lương", "slide" hoặc chọn lại danh mục.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const fileName = item.file.split('/').pop();
      const catLabels = {
        nd30: "Nghị định 30",
        contract: "Hợp đồng",
        hr: "Nhân sự",
        excel: "Bảng tính",
        ppt: "Thuyết trình"
      };
      const catName = catLabels[item.category] || "Mẫu";
      return `
        <div class="tmpl-card" data-id="${item.id}">
          <div class="card-thumb-wrap">
            <img src="${item.thumb}" alt="${item.title}" class="card-thumb-img" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
            <div class="card-fallback-thumb" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; flex-direction:column; background:var(--${item.format === 'docx' ? 'word' : item.format === 'xlsx' ? 'excel' : 'ppt'}-bg); color:var(--${item.format === 'docx' ? 'word' : item.format === 'xlsx' ? 'excel' : 'ppt'}-color);">
              <span style="font-size:2.2rem; margin-bottom:4px;">${item.format === 'docx' ? '📄' : item.format === 'xlsx' ? '📊' : '📽️'}</span>
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase;">${item.format.toUpperCase()} MẪU CHUẨN</span>
            </div>
            <span class="format-badge badge-${item.format}">.${item.format.toUpperCase()}</span>
            <span class="cat-pill">${catName}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${item.title}</h3>
            <p class="card-desc">${item.desc}</p>
            <div class="card-tags">
              ${item.tags.map(t => `<span class="card-tag">#${t}</span>`).join('')}
            </div>
            <div class="card-actions">
              <button class="btn-open" onclick="openTemplateDocument('${item.file}', '${fileName}')">
                <span>⚡</span>
                <span>Sử dụng mẫu này</span>
              </button>
              <button class="btn-download" title="Tải về máy (.${item.format})" onclick="downloadTemplateFile('${item.file}', '${fileName}', event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Theme support
  function applyTheme(theme) {
    if (!theme) return;
    const isDark = theme.includes("dark");
    if (isDark) {
      document.body.classList.add("theme-type-dark");
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("theme-type-dark");
      document.body.classList.remove("dark-mode");
    }
  }

  // Listen to postMessage from parent (Kaola Office)
  window.addEventListener("message", function(e) {
    if (!e || !e.data) return;
    if (e.data.type === "theme") {
      applyTheme(e.data.value);
    }
  });

  // Init
  document.addEventListener("DOMContentLoaded", function() {
    // Check url params for theme
    const params = new URLSearchParams(window.location.search);
    const uitheme = params.get("uitheme") || params.get("theme");
    if (uitheme) applyTheme(uitheme);

    // Setup Category Tabs
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", function() {
        tabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        currentCategory = this.dataset.category || "all";
        renderTemplates();
      });
    });

    // Setup Search
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        searchQuery = this.value;
        renderTemplates();
      });
    }

    // Render initially
    renderTemplates();

    // Notify parent window that templates store is ready
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "ready" }, "*");
    }
  });
})();
