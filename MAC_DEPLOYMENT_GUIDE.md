# HƯỚNG DẪN TRIỂN KHAI & CÀI ĐẶT KAOLA OFFICE CHO MÁY MAC (macOS)

Tài liệu này cung cấp toàn bộ giải pháp kỹ thuật, công cụ đóng gói và hướng dẫn sử dụng **Kaola Office** trên hệ điều hành **macOS** (hỗ trợ cả dòng chip **Apple Silicon M1/M2/M3/M4** và chip **Intel x86_64**).

---

## I. TỔNG QUAN KIẾN TRÚC BẢN MAC

* **Lõi ứng dụng (Engine):** ONLYOFFICE Desktop Editors macOS Core (C++ / Chromium Embedded Framework / Qt5 for Cocoa).
* **Tầng thương hiệu & Nghiệp vụ Kaola:**
  * Đồng bộ 100% giao diện đã rebrand thuần Việt (`Kaola Office`).
  * Tích hợp cổng định danh tập trung **Kaola ID (`id.kaola.vn`)** & **Kaola Drive (`drive.kaola.vn`)**.
  * Trợ lý trí tuệ nhân tạo **Kaola AI Copilot** (Nghị định 30, tóm tắt 5 điểm, sửa lỗi chính tả và dịch thuật).
  * Bộ icon Retina chuẩn macOS: `package/mac/KaolaOffice.icns`.
  * Định dạng gói phân phối: **`.dmg` (Apple Disk Image)** kéo-thả vào thư mục `/Applications`.

---

## II. 3 CÁCH CÀI ĐẶT & SỬ DỤNG TRÊN MÁY MAC

### Cách 1: Cài đặt Native App qua file `.dmg` (Khuyến nghị)
1. Tải file `KaolaOffice_macOS_arm64.dmg` (cho chip M1/M2/M3/M4) hoặc `KaolaOffice_macOS_x86_64.dmg` (cho chip Intel).
2. Mở file `.dmg` vừa tải:
   * Kéo biểu tượng **Kaola Office** thả vào thư mục **Applications**.
3. **Mở ứng dụng lần đầu:**
   * Vì ứng dụng sử dụng chữ ký mã nội bộ (Ad-hoc signature) chưa mua chứng chỉ Apple Developer $99/năm, macOS sẽ hiển thị cơ chế bảo vệ **Gatekeeper** (*"Không thể mở ứng dụng vì Apple không thể kiểm tra phần mềm độc hại"* hoặc *"App is damaged"*).
   * **Cách xử lý cực nhanh (1 click):** Double-click vào file **`Kích_Hoạt_Mở_App.command`** có sẵn trong đĩa `.dmg` (hoặc mở Terminal gõ lệnh bên dưới):
     ```bash
     xattr -cr "/Applications/Kaola Office.app"
     ```
   * Sau đó bạn có thể mở **Kaola Office** từ Launchpad hoặc Spotlight bình thường vĩnh viễn.

---

### Cách 2: Sử dụng Web App / PWA qua Safari (Không cần cài đặt .dmg)
Nếu bạn đang dùng macOS Sonoma trở lên (hoặc Google Chrome / Edge trên Mac):
1. Mở Safari trên Mac, truy cập trang: `https://office.kaola.vn` (hoặc `http://office.kaola.test`).
2. Trên thanh menu Safari: Bấm **Tệp (File)** $\rightarrow$ Chọn **"Thêm vào Dock..." (Add to Dock...)** (hoặc bấm nút Chia sẻ $\rightarrow$ Thêm vào Dock).
3. Biểu tượng **Kaola Office** sẽ xuất hiện ngay trên thanh Dock của macOS:
   * Mở dưới dạng cửa sổ độc lập, không có thanh địa chỉ web.
   * Hoạt động như một ứng dụng Mac thực thụ, hỗ trợ Kaola ID và Copilot mượt mà.

---

### Cách 3: Tích hợp Plugin Kaola AI Copilot vào ONLYOFFICE gốc
Nếu người dùng Mac đã cài sẵn ONLYOFFICE Desktop Editors từ App Store hoặc trang chủ:
1. Mở ONLYOFFICE trên Mac $\rightarrow$ Vào tab **Plugins** $\rightarrow$ Chọn **Settings** (Cài đặt).
2. Thêm thư mục plugin `app/editors/sdkjs-plugins/{A1B2C3D4-...}`.
3. Thanh công cụ **Kaola AI Copilot** sẽ xuất hiện ngay trong sidebar để hỗ trợ soạn thảo.

---

## III. HƯỚNG DẪN ĐÓNG GÓI BỘ CÀI `.DMG` (BUILD PACKAGER)

Toàn bộ công cụ đóng gói cho macOS đã được tạo sẵn tại thư mục `package/mac/`:

```
package/mac/
├── KaolaOffice.icns          # Icon chuẩn macOS kích thước Retina
├── generate_icns.py          # Script tạo file .icns từ icon.png
├── patch_mac_app.py          # Script nhúng mã nguồn Kaola vào ONLYOFFICE.app
├── build_mac.sh              # Script tải base app, patch và đóng gói ra file .dmg
└── fix_gatekeeper.command    # Công cụ kích hoạt mở app 1-click cho người dùng Mac
```

### 1. Đóng gói trên máy tính Mac
Mở Terminal trên máy Mac và chạy:
```bash
# Cấp quyền thực thi
chmod +x package/mac/build_mac.sh
chmod +x package/mac/fix_gatekeeper.command

# Build cho chip Apple Silicon (M1/M2/M3/M4):
./package/mac/build_mac.sh arm64

# Hoặc build cho chip Intel:
./package/mac/build_mac.sh x86_64

# Hoặc build cả 2 phiên bản:
./package/mac/build_mac.sh all
```
File `.dmg` hoàn chỉnh sẽ được tạo tại thư mục `package/mac/Output/`:
* `KaolaOffice_macOS_arm64.dmg`
* `KaolaOffice_macOS_x86_64.dmg`

---

### 2. Tự động Build bằng GitHub Actions (Không cần máy Mac)
Dự án đã cấu hình sẵn workflow CI tại `.github/workflows/build_mac.yml`:
1. Đẩy code lên GitHub repository của bạn.
2. Vào tab **Actions** $\rightarrow$ Chọn workflow **Build Kaola Office for macOS**.
3. Bấm **Run workflow** (Chọn kiến trúc `all`, `arm64` hoặc `x86_64`).
4. GitHub Actions sẽ tự động khởi chạy máy ảo macOS runner (`macos-14`), tải base app, gắn nhận diện Kaola Office, đóng gói file `.dmg` và đưa vào mục **Artifacts** để bạn tải về ngay.
5. Khi bạn tạo release tag (ví dụ `v1.0.0`), hệ thống sẽ tự động đính kèm file `.dmg` vào GitHub Release.

---

## IV. BẢNG SO SÁNH GIỮA CÁC PHIÊN BẢN KAOLA OFFICE

| Tính năng | Bản Windows (`.exe`) | Bản macOS Native (`.dmg`) | Bản Web PWA (`office.kaola.vn`) |
| :--- | :---: | :---: | :---: |
| **Hệ điều hành** | Windows 10, 11 (64-bit) | macOS 11+ (Apple Silicon & Intel) | Mọi hệ điều hành (qua trình duyệt) |
| **Soạn thảo Offline** | 100% không cần mạng | 100% không cần mạng | Cần kết nối mạng / Document Server |
| **Đăng nhập Kaola ID** | Có | Có | Có |
| **Kaola AI Copilot** | Tích hợp sẵn | Tích hợp sẵn | Tích hợp sẵn |
| **Định vị thanh Dock/Taskbar** | Pin Taskbar Windows | Pin Dock macOS | Pin Dock macOS |
| **Trọng lượng bộ cài** | ~286 MB | ~310 MB | 0 MB (chạy tức thì) |
