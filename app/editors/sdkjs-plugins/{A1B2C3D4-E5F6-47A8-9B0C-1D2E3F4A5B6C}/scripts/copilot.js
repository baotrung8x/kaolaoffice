/**
 * Kaola AI Copilot - Controller
 * Điều phối giao diện người dùng và tương tác với ONLYOFFICE Document API
 */

(function (window, undefined) {
  'use strict';

  let currentSelectedText = "";
  let lastGeneratedResult = "";

  // 1. Khởi tạo cầu nối giao tiếp với Trình soạn thảo (ONLYOFFICE Native hoặc Kaola Assistant Host)
  function initBridge() {
    const getKaolaParent = () => {
      try {
        if (window.parent && window.parent !== window && window.parent.KaolaAssistant) {
          return window.parent.KaolaAssistant;
        }
      } catch (e) {}
      return null;
    };

    const kaolaParent = getKaolaParent();
    if (kaolaParent) {
      if (!window.Asc) window.Asc = {};
      if (!window.Asc.plugin) window.Asc.plugin = {};

      const originalExecuteMethod = window.Asc.plugin.executeMethod;
      window.Asc.plugin.executeMethod = function (method, args, callback) {
        if (method === "GetSelectedText") {
          const parentObj = getKaolaParent();
          const selText = (parentObj && typeof parentObj.getSelectedDocText === 'function') ? parentObj.getSelectedDocText() : "";
          if (typeof callback === 'function') {
            callback(selText || "");
          }
          return;
        }
        if (method === "PasteText") {
          const parentObj = getKaolaParent();
          const insertText = (args && args[0]) || "";
          if (parentObj && typeof parentObj.replaceSelectedTextInDocument === 'function') {
            parentObj.replaceSelectedTextInDocument(insertText);
          } else if (parentObj && typeof parentObj.insertTextToDocument === 'function') {
            parentObj.insertTextToDocument(insertText);
          }
          return;
        }
        if (typeof originalExecuteMethod === 'function') {
          originalExecuteMethod.apply(this, arguments);
        }
      };

      try {
        const initialText = kaolaParent.getSelectedDocText ? kaolaParent.getSelectedDocText() : "";
        if (initialText) {
          currentSelectedText = initialText.trim();
          onSelectionChanged(currentSelectedText);
        }
      } catch (e) {}
    }
  }

  // Tương tác với ONLYOFFICE Plugin Lifecycle
  if (!window.Asc) window.Asc = {};
  if (!window.Asc.plugin) window.Asc.plugin = {};

  window.Asc.plugin.init = function (text) {
    if (text) {
      currentSelectedText = text.trim();
      onSelectionChanged(currentSelectedText);
    } else {
      getSelectionFromEditor(function (data) {
        if (data) {
          currentSelectedText = data.trim();
          onSelectionChanged(currentSelectedText);
        }
      });
    }
  };

  window.Asc.plugin.button = function (id) {
    if (typeof this.executeCommand === 'function') {
      this.executeCommand("close", "");
    }
  };

  function onSelectionChanged(text) {
    if (!text) return;
    
    // Tự động điền vào tab đang mở nếu khung trống
    const activeTab = document.querySelector('.copilot-panel.active');
    if (!activeTab) return;

    if (activeTab.id === 'tab-summary') {
      const el = document.getElementById('summary-input');
      if (!el.value) el.value = text;
    } else if (activeTab.id === 'tab-grammar') {
      const el = document.getElementById('grammar-input');
      if (!el.value) el.value = text;
    } else if (activeTab.id === 'tab-translate') {
      const el = document.getElementById('trans-input');
      if (!el.value) el.value = text;
    }
  }

  // 2. Chèn hoặc thay thế văn bản vào tài liệu (hỗ trợ cả Native Plugin và Docked Host)
  function pasteToDocument(text) {
    if (!text) return;
    try {
      if (window.parent && window.parent !== window && window.parent.KaolaAssistant) {
        if (typeof window.parent.KaolaAssistant.replaceSelectedTextInDocument === 'function') {
          window.parent.KaolaAssistant.replaceSelectedTextInDocument(text);
          return;
        }
      }
    } catch (e) {}

    if (window.Asc?.plugin && typeof window.Asc.plugin.executeMethod === 'function') {
      window.Asc.plugin.executeMethod("PasteText", [text]);
    }
  }

  function getSelectionFromEditor(callback) {
    try {
      if (window.parent && window.parent !== window && window.parent.KaolaAssistant) {
        if (typeof window.parent.KaolaAssistant.getSelectedDocText === 'function') {
          const text = (window.parent.KaolaAssistant.getSelectedDocText() || '').trim();
          currentSelectedText = text;
          if (typeof callback === 'function') callback(text);
          return;
        }
      }
    } catch (e) {}

    if (window.Asc?.plugin && typeof window.Asc.plugin.executeMethod === 'function') {
      window.Asc.plugin.executeMethod("GetSelectedText", [{ Numbering: false }], function (data) {
        if (data) {
          currentSelectedText = data.trim();
        }
        if (typeof callback === 'function') callback(currentSelectedText);
      });
    } else {
      if (typeof callback === 'function') callback(currentSelectedText);
    }
  }

  // 3. Tab switching
  function initTabs() {
    const tabBtns = document.querySelectorAll('.copilot-tab-btn');
    const panels = document.querySelectorAll('.copilot-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
          if (currentSelectedText) {
            onSelectionChanged(currentSelectedText);
          }
        }
      });
    });
  }

  // Quick fill helper
  window.quickFillAdmin = function (text) {
    document.getElementById('admin-prompt').value = text;
  };

  // 4. Khởi tạo sự kiện cho các tính năng
  function initFeatures() {
    // --- TAB 1: SOẠN THẢO VĂN BẢN HÀNH CHÍNH NĐ 30 ---
    const btnGenAdmin = document.getElementById('btn-generate-admin');
    const outBoxAdmin = document.getElementById('admin-output-box');
    const outTextAdmin = document.getElementById('admin-output-text');
    const btnInsertAdmin = document.getElementById('btn-insert-admin');
    const btnCopyAdmin = document.getElementById('btn-copy-admin');
    const btnInsertAdminTop = document.getElementById('btn-insert-admin-top');
    const btnCopyAdminTop = document.getElementById('btn-copy-admin-top');
    const inpCompany = document.getElementById('admin-company-name');

    if (btnInsertAdminTop) btnInsertAdminTop.addEventListener('click', () => btnInsertAdmin.click());
    if (btnCopyAdminTop) btnCopyAdminTop.addEventListener('click', () => btnCopyAdmin.click());

    // Tự động nạp tên cơ quan / doanh nghiệp đã lưu hoặc từ tài khoản Kaola ID
    if (inpCompany) {
      const savedCompany = localStorage.getItem('kaola_copilot_company');
      if (savedCompany !== null) {
        inpCompany.value = savedCompany;
      } else {
        try {
          const user = JSON.parse(localStorage.getItem('kaola_account_user') || '{}');
          if (user && (user.company || user.organization)) {
            inpCompany.value = user.company || user.organization;
          }
        } catch (e) {}
      }

      // Tự động ghi nhớ cho những lần soạn thảo tiếp theo
      inpCompany.addEventListener('input', () => {
        const val = inpCompany.value.trim();
        localStorage.setItem('kaola_copilot_company', val);
      });
    }

    btnGenAdmin.addEventListener('click', async () => {
      const docType = document.getElementById('admin-doc-type').value;
      const company = document.getElementById('admin-company-name').value.trim();
      const prompt = document.getElementById('admin-prompt').value.trim();

      if (!prompt) {
        alert("Vui lòng nhập nội dung yêu cầu soạn thảo văn bản.");
        return;
      }

      btnGenAdmin.disabled = true;
      btnGenAdmin.innerHTML = '<span class="copilot-loading"></span> Đang tạo văn bản chuẩn...';
      outBoxAdmin.style.display = 'block';
      outBoxAdmin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      outTextAdmin.textContent = '';

      const fullPrompt = KAOLA_PROMPTS.ND30_ADMIN(company, docType, prompt);
      
      let generated = "";
      await window.KaolaAIEngine.generate(fullPrompt, (chunk) => {
        generated += chunk;
        outTextAdmin.textContent = generated;
        outTextAdmin.scrollTop = outTextAdmin.scrollHeight;
      });

      lastGeneratedResult = generated;
      btnGenAdmin.disabled = false;
      btnGenAdmin.innerHTML = '<span>✨ Tạo văn bản chuẩn thể thức</span>';
      outBoxAdmin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    btnInsertAdmin.addEventListener('click', () => {
      pasteToDocument(outTextAdmin.textContent);
    });

    btnCopyAdmin.addEventListener('click', () => {
      navigator.clipboard.writeText(outTextAdmin.textContent);
      btnCopyAdmin.textContent = 'Đã chép!';
      setTimeout(() => { btnCopyAdmin.textContent = 'Sao chép'; }, 1500);
    });

    // --- TAB 2: TÓM TẮT BÁO CÁO DÀI ---
    const btnFetchSummary = document.getElementById('btn-fetch-selection-summary');
    const btnGenSummary = document.getElementById('btn-generate-summary');
    const outBoxSummary = document.getElementById('summary-output-box');
    const outTextSummary = document.getElementById('summary-output-text');
    const btnInsertSummary = document.getElementById('btn-insert-summary');
    const btnCopySummary = document.getElementById('btn-copy-summary');
    const btnInsertSummaryTop = document.getElementById('btn-insert-summary-top');
    const btnCopySummaryTop = document.getElementById('btn-copy-summary-top');

    if (btnInsertSummaryTop) btnInsertSummaryTop.addEventListener('click', () => btnInsertSummary.click());
    if (btnCopySummaryTop) btnCopySummaryTop.addEventListener('click', () => btnCopySummary.click());

    btnFetchSummary.addEventListener('click', () => {
      getSelectionFromEditor((text) => {
        if (text) {
          document.getElementById('summary-input').value = text;
        } else {
          alert("Chưa có đoạn văn bản nào được bôi đen trong tài liệu.");
        }
      });
    });

    btnGenSummary.addEventListener('click', async () => {
      const mode = document.getElementById('summary-mode').value;
      const text = document.getElementById('summary-input').value.trim();

      if (!text) {
        alert("Vui lòng bôi đen đoạn văn trong tài liệu hoặc dán vào khung.");
        return;
      }

      btnGenSummary.disabled = true;
      btnGenSummary.innerHTML = '<span class="copilot-loading"></span> Đang phân tích tóm tắt...';
      outBoxSummary.style.display = 'block';
      outBoxSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      outTextSummary.textContent = '';

      const fullPrompt = KAOLA_PROMPTS.EXECUTIVE_SUMMARY(mode, text);
      let generated = "";
      await window.KaolaAIEngine.generate(fullPrompt, (chunk) => {
        generated += chunk;
        outTextSummary.textContent = generated;
        outTextSummary.scrollTop = outTextSummary.scrollHeight;
      });

      btnGenSummary.disabled = false;
      btnGenSummary.innerHTML = '<span>✨ Trích xuất tóm tắt</span>';
      outBoxSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    btnInsertSummary.addEventListener('click', () => {
      pasteToDocument(outTextSummary.textContent);
    });

    btnCopySummary.addEventListener('click', () => {
      navigator.clipboard.writeText(outTextSummary.textContent);
      btnCopySummary.textContent = 'Đã chép!';
      setTimeout(() => { btnCopySummary.textContent = 'Sao chép'; }, 1500);
    });

    // --- TAB 3: SỬA LỖI & CHUẨN HÓA VĂN PHONG ---
    const btnFetchGrammar = document.getElementById('btn-fetch-selection-grammar');
    const btnGenGrammar = document.getElementById('btn-generate-grammar');
    const outBoxGrammar = document.getElementById('grammar-output-box');
    const outTextGrammar = document.getElementById('grammar-output-text');
    const btnReplaceGrammar = document.getElementById('btn-replace-grammar');
    const btnCopyGrammar = document.getElementById('btn-copy-grammar');
    const btnReplaceGrammarTop = document.getElementById('btn-replace-grammar-top');
    const btnCopyGrammarTop = document.getElementById('btn-copy-grammar-top');

    if (btnReplaceGrammarTop) btnReplaceGrammarTop.addEventListener('click', () => btnReplaceGrammar.click());
    if (btnCopyGrammarTop) btnCopyGrammarTop.addEventListener('click', () => btnCopyGrammar.click());

    btnFetchGrammar.addEventListener('click', () => {
      getSelectionFromEditor((text) => {
        if (text) {
          document.getElementById('grammar-input').value = text;
        } else {
          alert("Chưa có đoạn văn bản nào được bôi đen.");
        }
      });
    });

    btnGenGrammar.addEventListener('click', async () => {
      const mode = document.getElementById('grammar-mode').value;
      const text = document.getElementById('grammar-input').value.trim();

      if (!text) {
        alert("Vui lòng bôi đen hoặc nhập câu cần sửa lỗi.");
        return;
      }

      btnGenGrammar.disabled = true;
      btnGenGrammar.innerHTML = '<span class="copilot-loading"></span> Đang hiệu đính...';
      outBoxGrammar.style.display = 'block';
      outBoxGrammar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      outTextGrammar.textContent = '';

      const fullPrompt = KAOLA_PROMPTS.GRAMMAR_STYLE(mode, text);
      let generated = "";
      await window.KaolaAIEngine.generate(fullPrompt, (chunk) => {
        generated += chunk;
        outTextGrammar.textContent = generated;
        outTextGrammar.scrollTop = outTextGrammar.scrollHeight;
      });

      btnGenGrammar.disabled = false;
      btnGenGrammar.innerHTML = '<span>✨ Hiệu đính & Chuẩn hóa</span>';
      outBoxGrammar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    btnReplaceGrammar.addEventListener('click', () => {
      // Trích xuất phần văn bản đã hiệu đính nếu có cấu trúc
      let textToInsert = outTextGrammar.textContent;
      const match = textToInsert.match(/\[BẢN ĐÃ HIỆU ĐÍNH.*?\]:\s*\"?([^\"]+?)\"?\s*(\n\n|---|$)/s);
      if (match && match[1]) {
        textToInsert = match[1].trim();
      }
      pasteToDocument(textToInsert);
    });

    btnCopyGrammar.addEventListener('click', () => {
      navigator.clipboard.writeText(outTextGrammar.textContent);
      btnCopyGrammar.textContent = 'Đã chép!';
      setTimeout(() => { btnCopyGrammar.textContent = 'Sao chép'; }, 1500);
    });

    // --- TAB 4: DỊCH THUẬT ĐA NGÔN NGỮ ---
    const btnGenTrans = document.getElementById('btn-generate-translate');
    const outBoxTrans = document.getElementById('trans-output-box');
    const outTextTrans = document.getElementById('trans-output-text');
    const btnInsertTrans = document.getElementById('btn-insert-trans');
    const btnCopyTrans = document.getElementById('btn-copy-trans');
    const btnInsertTransTop = document.getElementById('btn-insert-trans-top');
    const btnCopyTransTop = document.getElementById('btn-copy-trans-top');

    if (btnInsertTransTop) btnInsertTransTop.addEventListener('click', () => btnInsertTrans.click());
    if (btnCopyTransTop) btnCopyTransTop.addEventListener('click', () => btnCopyTrans.click());

    btnGenTrans.addEventListener('click', async () => {
      const fromLang = document.getElementById('trans-from').value;
      const toLang = document.getElementById('trans-to').value;
      const mode = document.getElementById('trans-mode').value;
      const text = document.getElementById('trans-input').value.trim();

      if (!text) {
        alert("Vui lòng bôi đen hoặc nhập văn bản cần dịch.");
        return;
      }

      btnGenTrans.disabled = true;
      btnGenTrans.innerHTML = '<span class="copilot-loading"></span> Đang dịch thuật...';
      outBoxTrans.style.display = 'block';
      outBoxTrans.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      outTextTrans.textContent = '';

      const fullPrompt = KAOLA_PROMPTS.TRANSLATION(fromLang, toLang, mode, text);
      let generated = "";
      await window.KaolaAIEngine.generate(fullPrompt, (chunk) => {
        generated += chunk;
        outTextTrans.textContent = generated;
        outTextTrans.scrollTop = outTextTrans.scrollHeight;
      });

      btnGenTrans.disabled = false;
      btnGenTrans.innerHTML = '<span>✨ Dịch thuật bảo toàn định dạng</span>';
      outBoxTrans.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    btnInsertTrans.addEventListener('click', () => {
      pasteToDocument(outTextTrans.textContent);
    });

    btnCopyTrans.addEventListener('click', () => {
      navigator.clipboard.writeText(outTextTrans.textContent);
      btnCopyTrans.textContent = 'Đã chép!';
      setTimeout(() => { btnCopyTrans.textContent = 'Sao chép'; }, 1500);
    });

    // --- TAB 5: CÀI ĐẶT & KẾT NỐI AI ---
    const selProvider = document.getElementById('settings-provider');
    const boxApiKey = document.getElementById('box-api-key');
    const boxApiUrl = document.getElementById('box-api-url');
    const boxModel = document.getElementById('box-model');
    const inpApiKey = document.getElementById('settings-api-key');
    const inpApiUrl = document.getElementById('settings-api-url');
    const inpModel = document.getElementById('settings-model');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    function updateSettingsVisibility() {
      const p = selProvider.value;
      if (p === 'simulation') {
        boxApiKey.style.display = 'none';
        boxApiUrl.style.display = 'none';
        boxModel.style.display = 'none';
      } else if (p === 'ollama') {
        boxApiKey.style.display = 'none';
        boxApiUrl.style.display = 'block';
        boxModel.style.display = 'block';
      } else if (p === 'kaolawork') {
        boxApiKey.style.display = 'block';
        boxApiUrl.style.display = 'block';
        boxModel.style.display = 'none';
      } else {
        boxApiKey.style.display = 'block';
        boxApiUrl.style.display = 'none';
        boxModel.style.display = 'block';
      }
    }

    selProvider.value = window.KaolaAIEngine.provider;
    inpApiKey.value = window.KaolaAIEngine.apiKey;
    inpApiUrl.value = window.KaolaAIEngine.apiUrl;
    inpModel.value = window.KaolaAIEngine.model;
    updateSettingsVisibility();

    selProvider.addEventListener('change', updateSettingsVisibility);

    btnSaveSettings.addEventListener('click', () => {
      window.KaolaAIEngine.saveSettings(
        selProvider.value,
        inpApiKey.value.trim(),
        inpApiUrl.value.trim(),
        inpModel.value.trim()
      );
      alert("Đã lưu cấu hình AI Copilot thành công!");
    });
  }

  // Lắng nghe cập nhật lựa chọn từ cửa sổ cha (Kaola Assistant)
  window.addEventListener('message', (event) => {
    try {
      if (event.data && event.data.type === 'kaola_selection_update' && typeof event.data.text === 'string') {
        currentSelectedText = event.data.text.trim();
        onSelectionChanged(currentSelectedText);
      }
    } catch (e) {}
  });

  // Khởi động khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', () => {
    initBridge();
    initTabs();
    initFeatures();
  });

})(window);
