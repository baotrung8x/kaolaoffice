# Kaola Office (Windows Edition)

Bộ ứng dụng văn phòng hiện đại dành cho người dùng cá nhân và doanh nghiệp, xây dựng trên nền tảng mã nguồn mở **ONLYOFFICE Desktop Editors (GNU AGPL v3)**, tích hợp cổng quản lý định danh tài khoản tập trung **Kaola ID (`id.kaola.vn`)** và **Trợ lý Trí tuệ Nhân tạo Kaola AI Copilot**.

---

## 1. Tính Pháp Lý & Nguyên Tắc Hoạt Động (AGPL v3 Compliance)

1. **Hoàn toàn Miễn phí & Mã nguồn mở:**
   - Ứng dụng Desktop chạy tự do, không chứa cơ chế khóa cứng phần cứng (HWID) hay DRM hạn chế tính năng.
   - Người dùng được toàn quyền sử dụng để tạo, chỉnh sửa tài liệu Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`) và PDF ngoại tuyến mà không bị giới hạn thời gian.
2. **Ghi nhận Bản quyền Tác giả gốc (Attribution):**
   - Lõi công nghệ phần mềm được phát triển dựa trên ONLYOFFICE Desktop Editors thuộc bản quyền của Ascensio System SIA, phát hành theo giấy phép GNU Affero General Public License v3 (AGPL v3).
3. **Cổng Dịch vụ Kaola ID (`id.kaola.vn`):**
   - Toàn bộ việc đăng nhập tài khoản, quản lý gói dịch vụ và gọi các tính năng điện toán đám mây (Cloud) / Trí tuệ nhân tạo (AI Assistant) được kết nối độc lập qua cổng xác thực `id.kaola.vn`.

---

## 2. Cấu trúc Thư mục Dự án

```
C:\laragon\www\kaolaoffice\
├── public\                      # Giao diện Web Portal (office.kaola.test & kaolaoffice.test)
│   ├── index.html               # Dashboard quản lý tệp Microsoft 365 style
│   ├── editor.html              # Trình soạn thảo nhúng ONLYOFFICE DocsAPI + Kaola AI
│   ├── api\                     # Backend API (documents.php, track.php webhook)
│   ├── storage\                 # Thư mục lưu trữ tệp tài liệu của người dùng
│   ├── templates\               # Mẫu văn bản chuẩn NĐ 30, Báo cáo tài chính, Slide
│   ├── css\ & js\               # Giao diện và mã điều phối
├── app\                         # Bộ runtime Kaola Office Desktop & Web Editors
│   ├── DesktopEditors.exe       # File thực thi chính của ứng dụng
│   ├── index.html               # Trang chủ đã rebrand chuẩn Kaola Office
│   ├── kaola_account.css        # Giao diện hộp thoại tài khoản Kaola ID
│   ├── kaola_account.js         # Module quản lý tài khoản & SSO id.kaola.vn
│   └── editors\                 # Lõi ONLYOFFICE Web Client (web-apps & sdkjs)
│       └── sdkjs-plugins\       # Thư mục Plugins mở rộng
│           └── {A1B2C3D4-...}\  # Plugin Kaola AI Copilot tích hợp
├── package\
│   ├── kaola_setup.iss          # Cấu hình đóng gói Inno Setup (Kaola Office)
│   └── build_installer.ps1      # Script tự động build file KaolaOffice_Setup.exe
├── tools\
├── KaolaOffice_Web.bat          # Phím tắt mở nhanh Kaola Office Web Portal
└── KaolaOffice.bat              # Phím tắt khởi động nhanh Kaola Office Desktop
```

---

## 3. Khởi Động Nền Tảng Web (office.kaola.test & kaolaoffice.test)

Người dùng có thể truy cập trực tiếp trên trình duyệt qua tên miền cục bộ:
* **Địa chỉ truy cập:** `http://kaolaoffice.test` hoặc `http://office.kaola.test`
* **Phím tắt nhanh:** Chạy file `KaolaOffice_Web.bat`

### Kết nối ONLYOFFICE Document Server:
Để trình soạn thảo ONLYOFFICE hoạt động trực tuyến trên web, chỉ cần chạy 1 lệnh Docker duy nhất:
```bash
docker run -i -t -d -p 8080:80 --restart=always onlyoffice/documentserver
```
*(Bản Community Edition hoàn toàn miễn phí 0đ bản quyền theo giấy phép AGPLv3).*

---

## 4. Cách Khởi động & Sử dụng Ứng dụng Desktop

Chạy file:
```cmd
KaolaOffice.bat
```
Hoặc mở trực tiếp file `app\DesktopEditors.exe`.

Khi ứng dụng mở:
* Ở góc trên bên phải thanh tiêu đề có nút trạng thái **"Đăng nhập Kaola ID"**.
* Khi nhấn vào nút:
  * Nút chính **"Đăng nhập qua id.kaola.vn"** sẽ mở trình duyệt đưa người dùng tới cổng xác thực tập trung `https://id.kaola.vn`.
  * Hỗ trợ liên kết nhanh tài khoản bằng Email để chuẩn bị sử dụng Trợ lý Kaola AI.
  * Khi đã kết nối, nút chuyển thành chấm xanh hiển thị tên tài khoản, cho phép quản lý tài khoản hoặc đăng xuất.

---

## 4. Trợ lý Trí tuệ Nhân tạo Kaola AI Copilot

Trong giao diện soạn thảo văn bản, người dùng có thể kích hoạt thanh công cụ **Kaola AI Copilot** (nằm tại tab Plugins hoặc Sidebar bên phải):
* **Soạn thảo văn bản hành chính** chuẩn Nghị định 30/2020/NĐ-CP.
* **Tóm tắt báo cáo 5 điểm mấu chốt** dành cho Lãnh đạo.
* **Hiệu đính ngữ pháp, chính tả & nâng chuẩn văn phong** doanh nghiệp Việt Nam.
* **Dịch thuật hợp đồng song ngữ** Anh - Việt chuyên nghiệp.

---

## 5. Đóng gói Bộ cài đặt Windows (.exe)

Chạy file:
```powershell
powershell -ExecutionPolicy Bypass -File package\build_installer.ps1
```
File cài đặt hoàn chỉnh sẽ được tạo tại:
`package\Output\KaolaOffice_Setup.exe`

Bộ cài đặt tự động:
* Thiết lập biểu tượng Desktop & Start Menu mang tên **Kaola Office**.
* Đăng ký liên kết định dạng file (`.docx`, `.xlsx`, `.pptx`, `.pdf`) với Kaola Office.
* Đăng ký thông tin nhà phát hành và liên kết website chính thức `https://id.kaola.vn`.
