/**
 * Kaola AI Copilot - Universal AI Engine
 * Hỗ trợ: Kaolawork Gateway, Google Gemini, OpenAI, DeepSeek, Local Ollama và Simulation Mode
 */

class KaolaAIEngine {
  constructor() {
    this.loadSettings();
  }

  loadSettings() {
    this.provider = localStorage.getItem('kaola_ai_provider') || 'simulation';
    this.apiKey = localStorage.getItem('kaola_ai_key') || '';
    this.apiUrl = localStorage.getItem('kaola_ai_url') || 'https://work.kaola.vn/api/v1/office/ai/chat';
    this.model = localStorage.getItem('kaola_ai_model') || 'gpt-4o-mini';
  }

  saveSettings(provider, apiKey, apiUrl, model) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;

    localStorage.setItem('kaola_ai_provider', provider);
    localStorage.setItem('kaola_ai_key', apiKey);
    localStorage.setItem('kaola_ai_url', apiUrl);
    localStorage.setItem('kaola_ai_model', model);
  }

  async generate(promptText, onChunk = null) {
    if (this.provider === 'kaolaai') {
      try {
        return await this.callKaolaAI(promptText, onChunk);
      } catch (e) {
        console.warn("Lỗi gọi Kaola AI, dùng fallback:", e);
        return this.simulateResponse(promptText, onChunk);
      }
    }

    if (this.provider === 'simulation' || (!this.apiKey && this.provider !== 'ollama')) {
      try {
        return await this.callKaolaAI(promptText, onChunk);
      } catch (e) {
        return this.simulateResponse(promptText, onChunk);
      }
    }

    try {
      if (this.provider === 'gemini') {
        return await this.callGemini(promptText, onChunk);
      } else if (this.provider === 'ollama') {
        return await this.callOpenAICompatible(this.apiUrl || 'http://localhost:11434/v1/chat/completions', '', this.model || 'llama3', promptText, onChunk);
      } else if (this.provider === 'openai') {
        return await this.callOpenAICompatible('https://api.openai.com/v1/chat/completions', this.apiKey, this.model || 'gpt-4o-mini', promptText, onChunk);
      } else if (this.provider === 'deepseek') {
        return await this.callOpenAICompatible('https://api.deepseek.com/v1/chat/completions', this.apiKey, 'deepseek-chat', promptText, onChunk);
      } else if (this.provider === 'kaolawork') {
        return await this.callKaolaworkGateway(promptText, onChunk);
      }
    } catch (err) {
      console.warn("Lỗi gọi AI Provider, chuyển sang chế độ dự phòng:", err);
      if (onChunk) onChunk(`\n[Lưu ý: Kết nối máy chủ AI gặp lỗi (${err.message}). Đang kích hoạt phản hồi mô phỏng tiêu chuẩn]\n\n`);
      return this.simulateResponse(promptText, onChunk);
    }
  }

  async callKaolaAI(promptText, onChunk) {
    let sessId = localStorage.getItem('kaola_copilot_session_id');
    if (!sessId) {
      sessId = 'sess_copilot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      try {
        localStorage.setItem('kaola_copilot_session_id', sessId);
      } catch (e) {}
    }
    const params = new URLSearchParams({
      public_key: 'pk_admin_master_dae167d8d2cf75a5',
      bot_id: '6',
      session_id: sessId,
      message: promptText.substring(0, 1000)
    });
    const url = 'https://ai.kaola.vn/api/v1/widget/message?' + params.toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        public_key: 'pk_admin_master_dae167d8d2cf75a5',
        message: promptText,
        bot_id: 6,
        session_id: sessId
      })
    });
    if (!res.ok) throw new Error(`Kaola AI Status: ${res.status}`);
    const data = await res.json();
    let text = data.reply || '';
    if (!text && data.message && typeof data.message === 'string') {
      const lower = data.message.toLowerCase();
      if (!lower.includes('not supported') && !lower.includes('exception') && !lower.includes('error')) {
        text = data.message;
      }
    }
    if (!text) throw new Error('Phản hồi trống hoặc không hợp lệ');
    if (onChunk) onChunk(text);
    return text;
  }

  async callGemini(promptText, onChunk) {
    const modelName = this.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });
    if (!res.ok) throw new Error(`Gemini API Error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (onChunk) onChunk(text);
    return text;
  }

  async callOpenAICompatible(endpoint, key, model, promptText, onChunk) {
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['Authorization'] = `Bearer ${key}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.3
      })
    });
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (onChunk) onChunk(text);
    return text;
  }

  async callKaolaworkGateway(promptText, onChunk) {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ prompt: promptText })
    });
    if (!res.ok) throw new Error(`Kaolawork Gateway Error: ${res.status}`);
    const data = await res.json();
    const text = data.content || data.reply || '';
    if (onChunk) onChunk(text);
    return text;
  }

  // Phản hồi mô phỏng thông minh cho 4 nghiệp vụ
  async simulateResponse(promptText, onChunk) {
    let result = "";

    let docCompany = "[TÊN CƠ QUAN, DOANH NGHIỆP BAN HÀNH]";
    const compMatch = promptText.match(/Đơn vị ban hành:\s*([^\n\r]+)/);
    if (compMatch && compMatch[1] && compMatch[1].trim() && !compMatch[1].includes("[TÊN CƠ QUAN")) {
      docCompany = compMatch[1].trim();
    }

    if (promptText.includes("THÔNG BÁO") || promptText.includes("30/4") || promptText.includes("Nghị định 30")) {
      result = `${docCompany.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Số: 28/TB-KL                                Độc lập - Tự do - Hạnh phúc
                                            Hà Nội, ngày 14 tháng 10 năm 2026

                            THÔNG BÁO
      Về việc nghỉ lễ Ngày Chiến thắng (30/4) và Ngày Quốc tế Lao động (01/5)
                      kèm phân công lịch trực đơn vị

Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019 của Quốc hội;
Căn cứ Quy chế làm việc và nhu cầu hoạt động kinh doanh của đơn vị;

Ban Lãnh đạo / Ban Giám đốc thông báo đến toàn thể cán bộ, nhân viên lịch nghỉ lễ và kế hoạch trực như sau:

Điều 1. Thời gian nghỉ lễ
1. Toàn thể cán bộ, nhân viên được nghỉ lễ 02 ngày: từ ngày 30/4/2026 đến hết ngày 01/5/2026.
2. Ngày 02/5/2026 toàn thể cán bộ, nhân viên trở lại làm việc bình thường theo ca quy định.

Điều 2. Phân công lịch trực và bảo đảm vận hành
1. Phòng Kinh doanh và Bộ phận Hỗ trợ Kỹ thuật IT bố trí tối thiểu 02 nhân sự trực online/onsite trong các ngày nghỉ để giải quyết các yêu cầu khẩn cấp của khách hàng.
2. Danh sách nhân sự trực lễ gửi về Phòng Hành chính - Nhân sự trước ngày 25/4/2026.
3. Nhân viên tham gia trực lễ được hưởng chế độ làm thêm giờ theo đúng quy định của Pháp luật và Quy chế Công ty.

Điều 3. Trách nhiệm thi hành
Trưởng các phòng, ban, bộ phận và các cá nhân có tên chịu trách nhiệm thi hành Thông báo này. Đảm bảo an toàn phòng chống cháy nổ, niêm phong văn phòng trước khi nghỉ lễ./.

Nơi nhận:                                             TỔNG GIÁM ĐỐC
- Như Điều 3;                                           (Đã ký)
- Ban Giám đốc;
- Lưu: VT, HC-NS.                                    NGUYỄN VĂN A`;
    } else if (promptText.includes("5 ĐIỂM MẤU CHỐT") || promptText.includes("TÓM TẮT")) {
      result = `📊 TÓM TẮT 5 ĐIỂM MẤU CHỐT (EXECUTIVE SUMMARY):

1. DOANH THU & HIỆU QUẢ HOẠT ĐỘNG:
   - Doanh thu quý vừa qua đạt 128.5 tỷ VNĐ, tăng trưởng 18.2% so với cùng kỳ năm trước, đạt 95% kế hoạch đề ra.

2. CƠ CẤU SẢN PHẨM MŨI NHỌN:
   - Dòng sản phẩm phần mềm văn phòng Kaola Office Enterprise đóng góp 62% tỷ trọng doanh thu mới với hơn 140 khách hàng doanh nghiệp được kích hoạt.

3. VẤN ĐỀ & ĐIỂM NGHẼN CẦN XỬ LÝ:
   - Tỷ lệ chuyển đổi khách hàng từ giai đoạn dùng thử (Trial) sang hợp đồng trả phí tại khu vực miền Trung còn thấp (đạt 24% so với trung bình 41%).

4. CHI PHÍ VẬN HÀNH & BIÊN LỢI NHUẬN:
   - Tối ưu hóa được 12% chi phí hạ tầng máy chủ nhờ chuyển dịch sang mô hình xử lý phân tán cục bộ và nén dữ liệu.

5. ĐỀ XUẤT HÀNH ĐỘNG DÀNH CHO LÃNH ĐẠO:
   - Phê duyệt ngân sách bổ sung 15% cho chiến dịch tiếp thị số quý tới và mở rộng gói tích hợp AI Copilot cho phân khúc tài chính - ngân hàng.`;
    } else if (promptText.includes("Hiệu đính đoạn văn bản") || promptText.includes("chính tả")) {
      result = `[BẢN ĐÃ HIỆU ĐÍNH - CHUẨN VĂN PHONG DOANH NGHIỆP]:
"Kính gửi Quý đơn vị,
Công ty chúng tôi trân trọng thông báo về kế hoạch tổ chức chương trình tham quan, gắn kết nội bộ trong thời gian tới. Kính đề nghị các phòng ban phổ biến và hỗ trợ toàn thể nhân sự hoàn tất thủ tục đăng ký đúng hạn."

--------------------------------------------------
[CHI TIẾT ĐIỀU CHỈNH]:
1. Sửa lỗi viết tắt & tiếng lóng: "cty" -> "Công ty", "ae" -> "toàn thể nhân sự / các cán bộ", "sap toi" -> "trong thời gian tới".
2. Khắc phục lỗi thiếu dấu thanh tiếng Việt: "di choi" -> "chương trình tham quan, gắn kết", "chu y" -> "kính đề nghị lưu ý".
3. Nâng cấp văn phong: Chuyển từ lối nói chuyện phiếm sang văn phong hành chính trang trọng, lịch sự.`;
    } else {
      result = `[BẢN DỊCH SONG NGỮ DOANH NGHIỆP - ANH / VIỆT]:

Article 5. Terms of Payment
Điều 5. Điều khoản Thanh toán

1. The Purchaser shall settle the total contract amount within thirty (30) calendar days upon receipt of the valid Value Added Tax (VAT) invoice and acceptance certificate.
1. Bên Mua có trách nhiệm thanh toán toàn bộ giá trị hợp đồng trong vòng ba mươi (30) ngày theo lịch kể từ ngày nhận được hóa đơn Giá trị gia tăng (GTGT) hợp lệ và biên bản nghiệm thu.

2. Any delay in payment shall incur an interest penalty of 0.05% per day on the overdue amount until fully settled.
2. Mọi sự chậm trễ trong việc thanh toán sẽ phải chịu mức phạt lãi suất là 0,05% mỗi ngày trên số tiền quá hạn cho đến khi thanh toán dứt điểm.`;
    }

    // Hiệu ứng stream mượt mà
    if (onChunk) {
      const parts = result.split('\n');
      for (const line of parts) {
        onChunk(line + '\n');
        await new Promise(r => setTimeout(r, 40));
      }
    }
    return result;
  }
}

window.KaolaAIEngine = new KaolaAIEngine();
