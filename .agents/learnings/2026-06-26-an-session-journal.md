# Developer Journal: Đặng Minh Bình An

## Tổng hợp tiến độ công việc (FR-001 đến FR-005)

Đây là tài liệu tổng hợp toàn bộ các tính năng và công việc mà **An** đã đảm nhiệm code chính trong dự án AutoWash Pro.

### 1. FR-001: Xác thực & Đăng ký (Registration + OTP)
- **Thiết kế giao diện:** Hoàn thiện form đăng ký người dùng (thu thập Tên, SĐT, Email) và giao diện nhập mã xác thực OTP.
- **Xử lý logic (Validation & API):**
  - Viết logic validate đầu vào cho số điện thoại và các ràng buộc mật khẩu an toàn.
  - Xây dựng luồng kết nối API để gửi và xác thực OTP.

### 2. FR-002: Đăng nhập & Quản lý phiên (Login + JWT)
- **Giao diện đa luồng:** Thiết kế Form Đăng nhập cho khách hàng thành viên và Form Đặt lịch nhanh (Quick Order) dành cho khách vãng lai (Guest).
- **Cấu hình Axios & JWT:**
  - Xử lý lưu trữ an toàn JWT Token vào `LocalStorage`.
  - Cấu hình Axios Interceptor để tự động đính kèm Token vào Header `Authorization: Bearer <token>` cho mọi request gọi API có yêu cầu xác thực.

### 3. FR-003: Quản lý phương tiện (Vehicle CRUD)
- **Danh sách xe:** Hiển thị danh sách phương tiện của người dùng đang đăng nhập (gồm biển số, loại xe, kích thước).
- **Thêm mới phương tiện:**
  - Xây dựng Modal "Thêm Xe" với các trường nhập liệu biển số (ràng buộc duy nhất), loại xe, và phân khúc xe.
  - Tích hợp validate dữ liệu trước khi submit và tích hợp với luồng đặt lịch (Booking).

### 4. FR-004: Luồng đặt lịch 6 bước (Booking Flow)
- **Cấu trúc Stepper:** Xây dựng và duy trì state xuyên suốt cho luồng đặt lịch gồm 6 bước.
- **Tích hợp dữ liệu:** Liên kết dữ liệu chọn xe (Step 1) từ FR-003, chọn chi nhánh (Step 2), và thời gian đặt lịch.
- **Thiết kế Step 3 (Service Selection UI):**
  - Đảm nhiệm hoàn toàn việc tái cấu trúc giao diện chọn dịch vụ sang tiếng Anh, tuân thủ nghiêm ngặt dữ liệu gốc.
  - Nhóm động các dịch vụ thành các danh mục (Wash & Combo, Interior Cleaning, v.v.) bằng giao diện Accordion tiện dụng.
  - Tích hợp logic tính điểm Loyalty Point ngay trong thời gian thực: `P = (V / 1000) * Kh * Kkm`.
- **Tách biệt Guest & Member:** Ẩn hoàn toàn giao diện và logic tính toán điểm thưởng Loyalty đối với khách vãng lai (Guest) để đảm bảo không bị lỗi dữ liệu và giao diện.

### 5. FR-005: Thanh toán (Payment Integration)
- **VietQR UI:** Hoàn thành giao diện Step 6 tích hợp thanh toán VietQR.
- **Trải nghiệm người dùng (UX):**
  - Cấu hình hiển thị QR Code cùng với các thông tin chuyển khoản.
  - Code chức năng Copy-to-clipboard cho Số tài khoản, Số tiền và Nội dung chuyển khoản.
  - Gắn nhãn trạng thái "PENDING PAYMENT" và tóm tắt toàn bộ thông tin Booking trước khi hoàn tất.

---
*Ghi chú: Toàn bộ quá trình triển khai đều tuân thủ kiến trúc React + TypeScript, không làm phá vỡ các quy tắc chung, và sử dụng CSS Modules (BEM) để đảm bảo tính đóng gói.*
