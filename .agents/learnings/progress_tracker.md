# TIẾN ĐỘ DỰ ÁN AUTOWASH PRO

Báo cáo tiến độ chi tiết của cả hai phần Front-end (FE) và Back-end (BE) tính đến thời điểm hiện tại.

---

## 1. TỔNG QUAN TIẾN ĐỘ (OVERALL SUMMARY)
*   **Front-end (React + TS + Tailwind)**: **Hoàn thành ~90% giao diện & Mock Data**.
    *   Tất cả các màn hình (Đăng ký/Đăng nhập, Luồng đặt lịch 6 bước, Customer Dashboard, Washing Counter, Admin Portal) đã được triển khai hoàn chỉnh và chạy thử nghiệm ngoại tuyến (offline) bằng Mock Data được lưu giữ tập trung tại [BookingContext.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/context/BookingContext.tsx).
*   **Back-end (Spring Boot 3 + Java 17)**: **Hoàn thành ~30% cơ sở dữ liệu & nghiệp vụ cơ bản**.
    *   Thiết lập hoàn tất cấu trúc dự án chuẩn, ánh xạ ORM cho 11 bảng thực thể database, và hoàn thành xong phân hệ Xác thực (Auth + Spring Security + JWT + Mock OTP).
*   **Tích hợp (Integration)**: **Chưa bắt đầu**. FE hiện tại đang chạy offline hoàn toàn để kiểm thử giao diện & luồng nghiệp vụ trước khi kết nối trực tiếp với API thật của BE.

---

## 2. CHI TIẾT TIẾN ĐỘ THEO TỪNG CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

| FR ID | Chức năng chi tiết | Trạng thái Front-end (FE) | Trạng thái Back-end (BE) | Trạng thái Tích hợp |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Đăng ký & Xác thực OTP | **Hoàn thành** (Form nhập + Gửi mock OTP) | **Hoàn thành** (Tích hợp Firebase Phone Authentication xác thực OTP) | Chưa tích hợp |
| **FR-002** | Đăng nhập & Quản lý phiên | **Hoàn thành** (Giao diện Member/Guest + Axios config) | **Hoàn thành** (BCrypt + Sinh JWT + filter bảo mật) | Chưa tích hợp |
| **FR-003** | Quản lý phương tiện CRUD | **Hoàn thành** (Giao diện CRUD + Modal Thêm Xe) | **Hoàn thành** (Controller/Service/Repo đầy đủ) | Chưa tích hợp |
| **FR-004** | Luồng đặt lịch 6 bước | **Hoàn thành** (Stepper 6 bước hoàn chỉnh) | **Hoàn thành** (Booking API: create/list/available-slots, verify với DB thật 2026-07-12, nhánh `ooobinh`) | Chưa tích hợp |
| **FR-005** | Thanh toán VietQR thủ công | **Hoàn thành** (VietQR UI + Sao chép thông tin) | **Chưa bắt đầu** (Chưa có dịch vụ sinh link QR động, chưa khóa voucher khi đặt) | Chưa tích hợp |
| **FR-006** | Công thức tính điểm tích lũy | **Hoàn thành** (Tính điểm theo công thức thực tế tại client) | **Phần lớn hoàn thành** (`PointServiceImpl` tính điểm + ghi `PointHistory`, nhánh `ooobinh`; chưa có endpoint/luồng gọi khi booking Completed) | Chưa tích hợp |
| **FR-007** | Thăng hạng & Hết hạn điểm | **Hoàn thành** (Thanh tiến trình thăng hạng + cảnh báo) | **Chưa bắt đầu** (Chưa có Scheduler quét nâng/hạ hạng) | Chưa tích hợp |
| **FR-008** | Cửa hàng đổi voucher | **Hoàn thành** (Giao diện đổi điểm lấy voucher + áp dụng) | **Chưa bắt đầu** (Chưa có logic trừ điểm sinh mã voucher) | Chưa tích hợp |
| **FR-009** | Quản lý hàng chờ (Counter) | **Hoàn thành** (Màn hình Approve / Check-in / Checkout) | **Chưa bắt đầu** (Chưa có API chuyển trạng thái booking) | Chưa tích hợp |
| **FR-010** | Danh sách khách hàng (Admin) | **Hoàn thành** (Bảng tìm kiếm, lọc theo hạng + Modal chi tiết) | **Chưa bắt đầu** (Chưa có API phân trang & tìm kiếm) | Chưa tích hợp |
| **FR-011** | Đặt lịch Infinite Scroll (Admin) | **Hoàn thành** (Cuộn trang vô hạn tải thêm 10 bản ghi) | **Chưa bắt đầu** (Chưa có API phân trang đặt lịch theo ngày) | Chưa tích hợp |
| **FR-012** | Thống kê & Audit logs (Admin) | **Hoàn thành** (Biểu đồ doanh thu D/M/Y + Point Audit logs) | **Chưa bắt đầu** (Chưa có API thống kê và ghi nhật ký điểm) | Chưa tích hợp |
| **FR-013** | AI Campaign Builder (Admin) | **Hoàn thành** (Form nhập mục tiêu + Hiển thị kết quả) | **Chưa bắt đầu** (Chưa có API phân tích sinh chiến dịch) | Chưa tích hợp |

---

## 3. BẢN ĐỒ MÃ NGUỒN (SOURCE CODE MAP)

### 3.1. Các file mã nguồn Back-end quan trọng đã triển khai:
*   **Cơ sở dữ liệu**:
    *   [AutoWashPro.sql](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/database/AutoWashPro.sql): File SQL cấu trúc database.
    *   [docker-compose.yml](file:///d:/demoSWP/Vehicles-washing-G4-5/docker-compose.yml): Cấu hình chạy DB SQL Server bằng Docker.
*   **Security & JWT**:
    *   [SecurityConfig.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/config/SecurityConfig.java): Cấu hình phân quyền stateless.
    *   [JwtTokenProvider.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/config/JwtTokenProvider.java): Sinh và giải mã JWT token.
    *   [JwtAuthenticationFilter.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/config/JwtAuthenticationFilter.java): Bộ lọc chặn request kiểm tra JWT.
*   **Nghiệp vụ Đăng ký & Đăng nhập**:
    *   [AuthController.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/controller/AuthController.java): Tiếp nhận API authentication.
    *   [AuthServiceImpl.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java): Xử lý mã hóa mật khẩu và đăng nhập.
    *   [FirebaseConfig.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/config/FirebaseConfig.java): Khởi tạo Firebase Admin SDK để giải mã ID Token.

### 3.2. Các file mã nguồn Front-end quan trọng đã triển khai:
*   **Tâm điểm quản lý dữ liệu (Mock DB)**:
    *   [BookingContext.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/context/BookingContext.tsx): Đóng vai trò như một Client-side Database quản lý danh sách Xe, Lịch đặt, Khách hàng, Điểm tích lũy, Lịch sử giao dịch và các hàm thao tác CRUD.
*   **Các trang giao diện**:
    *   [AuthPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/auth/AuthPage.tsx): Form Login / Register / Guest Checkout.
    *   [BookingPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/booking/BookingPage.tsx): Điều hướng luồng đặt lịch 6 bước qua các component trong thư mục [components](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/booking/components/).
    *   [CustomerDashboard.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/dashboard/CustomerDashboard.tsx): Quản lý thông tin cá nhân, xe cá nhân, điểm thưởng, đổi voucher và ưu đãi.
    *   [WashingCounterPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/washing-counter/WashingCounterPage.tsx): Portal dành cho thợ rửa xe check-in và check-out hoàn thành dịch vụ tích điểm.
    *   [AdminPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/admin/AdminPage.tsx): Portal quản trị viên quản lý khách hàng, đặt lịch, doanh thu và tạo chiến dịch quảng cáo AI.

---

## 4. KẾ HOẠCH TRIỂN KHAI TIẾP THEO (NEXT STEPS)

1.  **Phát**:
    *   Hỗ trợ Bình viết API cho Booking (FR-004) và cập nhật trạng thái đơn (FR-009).
2.  **Bình**:
    *   Tiến hành code phân hệ **FR-003 (Vehicle CRUD)** trên Back-end (tạo Controller, Service xử lý CRUD phương tiện cho khách hàng).
    *   Tiến hành code tiếp **FR-004 (Booking API)** để lưu trữ lịch hẹn thực tế xuống SQL Server.
    *   Tạo nhánh `feat/fr-001-auth` và gửi PR cho Anh review phần đăng ký/đăng nhập.
3.  **Tích hợp (FE + BE)**:
    *   Chuyển cấu hình Axios trong Front-end từ việc chạy hoàn toàn bằng dữ liệu tĩnh (Mock) sang kết nối đến `http://localhost:8080/api/v1/auth/*` để chạy thực tế luồng Login & Register.
