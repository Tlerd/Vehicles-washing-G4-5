# AutoWash Pro - Hệ Thống Quản Lý Rửa Xe Thông Minh & Khách Hàng Thân Thiết

**AutoWash Pro** là một giải pháp công nghệ toàn diện giúp tối ưu hóa quy trình đặt lịch rửa xe ô tô thông minh, tích hợp công cụ tính điểm thành viên tự động và quản lý chiến dịch marketing định hướng AI.

> [!IMPORTANT]
> **Giới hạn phạm vi**: Hệ thống được thiết kế độc quyền phục vụ xe ô tô (Cars). **Xe máy (Motorbikes) hoàn toàn bị loại bỏ khỏi phạm vi thiết kế và nghiệp vụ của hệ thống này.**

---

## 📌 Các Phân Hệ Chính & Vai Trò (Roles)

Hệ thống được chia thành 3 cổng thông tin (portals) chính tương tác thời gian thực:

1. **Khách hàng (Customer Portal)**:
   * **Đăng ký & Đăng nhập**: Xác thực bằng số điện thoại và mã OTP.
   * **Đặt lịch 6 bước (Booking Wizard)**:
     1. Chọn kích cỡ xe (Small, Medium, Large) - tự động nhân hệ số giá dịch vụ.
     2. Chọn chi nhánh (Quận 1 / Quận 7) kèm trạng thái chỗ trống.
     3. Chọn ngày & giờ (múi giờ GMT+7, nhắc nhở tự động trước 1 ngày).
     4. Chọn dịch vụ (chi tiết combo hiển thị chuyên nghiệp).
     5. Cung cấp thông tin liên hệ.
     6. Xác nhận đặt lịch & hiển thị mã VietQR chuyển khoản (thanh toán 100%).
   * **Bảng điều khiển khách hàng (Customer Dashboard)**: Quản lý thông tin cá nhân, CRUD danh sách xe cá nhân, theo dõi lịch sử rửa xe, tích điểm thăng hạng và đổi điểm nhận Voucher giảm giá.

2. **Quầy Rửa xe (Washing Counter Portal - LPR)**:
   * Tiếp nhận danh sách xe đặt lịch theo ngày.
   * Phê duyệt trạng thái đặt lịch (`PENDING` ➔ `CONFIRMED`).
   * Điểm danh xe vào tiệm (`CHECKED-IN`).
   * Xác nhận hoàn thành thanh toán và rửa xe (`COMPLETED`), kích hoạt công cụ tự động tích điểm cho khách hàng.

3. **Quản trị viên (Admin Portal)**:
   * **Quản lý Khách hàng**: Tra cứu, tìm kiếm, lọc theo hạng thẻ thành viên, sắp xếp và xem lịch sử rửa xe chi tiết của khách.
   * **Quản lý Lịch đặt**: Giao diện cuộn vô hạn (Infinite Scroll) hỗ trợ tải dữ liệu mượt mà, phân loại theo ngày và trạng thái.
   * **Báo cáo doanh thu & Log giao dịch**: Thống kê doanh thu động theo Ngày/Tháng/Năm; lưu vết lịch sử giao dịch điểm thẻ.
   * **AI Campaign Builder**: Công cụ AI gợi ý và tạo chiến dịch khuyến mãi, tích lũy điểm thưởng dựa trên mục tiêu chiến dịch và hạng thành viên.

---

## 🛠️ Công Nghệ Phát Triển (Tech Stack)

### 1. Front-end (React + TS + CSS Modules / Tailwind)
* **Framework**: React 18, TypeScript, Vite.
* **Styling**: CSS Modules (Vanilla CSS) kết hợp Tailwind CSS với phong cách tối giản, hiện đại và tối ưu trên **Giao diện sáng (Light Mode)**.
* **Thư viện icon**: Lucide React.
* **Quản lý State**: Context API dùng chung.

### 2. Back-end (Spring Boot)
* **Ngôn ngữ**: Java 17 (LTS).
* **Framework**: Spring Boot 3.x, Spring Data JPA.
* **Cấu trúc**: Layered Architecture (`Controller -> Service -> Repository`).
* **Tài liệu hóa API**: Swagger / OpenAPI 3.

### 3. Database (MS SQL Server)
* Hệ quản trị cơ sở dữ liệu: Microsoft SQL Server local.
* **Cấu hình mặc định chung cho cả nhóm**:
  * **Cổng kết nối**: `1433`
  * **Tài khoản**: `sa`
  * **Mật khẩu**: `123456`
  * **Tên database**: `autowash_pro`

---

## 🚀 Hướng Dẫn Thiết Lập & Chạy Dự Án

### 💻 1. Front-end Setup

Yêu cầu cài đặt sẵn Node.js (v18 trở lên).

```bash
# Di chuyển vào thư mục Front-end
cd Front-end

# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển (Dev server)
npm run dev

# Kiểm tra biên dịch và build thử dự án
npm run build
```

### ☕ 2. Back-end Setup

Yêu cầu cài đặt sẵn JDK 17 và Apache Maven.

```bash
# Di chuyển vào thư mục Back-end
cd Back-end

# Build dự án bằng Maven
mvn clean install

# Khởi chạy dịch vụ Spring Boot
mvn spring-boot:run
```

### 🗄️ 3. Cơ Sở Dữ Liệu SQL Server (Docker Compose)

Nếu bạn đã cài đặt Docker Desktop, bạn có thể khởi động nhanh cơ sở dữ liệu SQL Server với cấu hình kết nối chuẩn của dự án bằng lệnh:

```bash
# Tại thư mục gốc dự án (chứa docker-compose.yml)
docker compose up -d
```

Lệnh trên sẽ khởi chạy container SQL Server lắng nghe trên cổng `1433` với tài khoản `sa` / mật khẩu `123456` và tự động tạo cơ sở dữ liệu `autowash_pro`.

---

## 👥 Nhóm Phát Triển (SU26SWP08 - Group 4 & 5)
Dự án được xây dựng và duy trì bởi nhóm 6 thành viên lớp SWP391. Vui lòng tuân thủ nghiêm ngặt các quy tắc phát triển Front-end & Back-end được ghi cụ thể trong file [.agents/AGENTS.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/AGENTS.md).
