# Nhật ký phiên làm việc — Bình (GitHub: ooobinh)

> File log riêng theo quy định AGENTS.md. Chỉ Bình (hoặc agent làm việc cùng Bình) ghi vào file này.

---

## Phiên 2026-06-26 — Khởi tạo & nắm bắt dự án

- **Date**: 2026-06-26
- **Author**: Bình (ooobinh)
- **Agent**: Cursor

### Summary
- Xác nhận danh tính lập trình viên: **Bình**, GitHub **ooobinh**.
- Đọc hiểu tổng quan dự án **AutoWash Pro** (SU26SWP08 • Group 4 & 5).
- Nắm bắt quy tắc trong `.agents/AGENTS.md`, bộ skills `.agents/skills/`, và trạng thái codebase hiện tại.

### Trạng thái dự án (tại thời điểm phiên)
- **Front-end**: Đã reset về boilerplate (React + Vite + TS + Tailwind). Chưa có Booking Wizard / Dashboard.
- **Back-end**: Spring Boot 3.5.6 + Java 17 + SQL Server. Đã có entities và API Customer CRUD cơ bản.
- **Tài liệu**: Spec FR-001 → FR-013 trong `docs/superpowers/results/`.

### Technical Notes
- Reviewer chính: **Anh**.
- DB mặc định: SQL Server port 1433, database `autowash_pro` (có `docker-compose.yml`).
- Quy trình FE: Stitch MCP demo → Mock Data → API Contract → tích hợp BE.

### Next Steps
- Chọn task/FR cụ thể để bắt đầu (FE hoặc BE).
- Thiết lập môi trường local nếu chưa có (Node, JDK 17, SQL Server hoặc Docker).

---

## Phiên 2026-06-26 — FR-001 & FR-002 Back-end (Binh / ooobinh)

- **Date**: 2026-06-26
- **Author**: Bình (ooobinh)
- **Agent**: Cursor
- **Plan reference**: `docs/superpowers/plans/2026-06-26-autowash-pro-stitch-design-plan.md`

### Summary of Changes
Triển khai nhiệm vụ **Code chính** của Bình cho FR-001 và FR-002:

**FR-001 — Auth Controllers (Lead: Binh)**
- `AuthController` tại `/api/v1/auth`:
  - `POST /send-otp` — gửi OTP (local dev mode, log mã OTP)
  - `POST /verify-otp` — xác thực mã 6 số
  - `POST /register` — đăng ký sau khi OTP verified, mật khẩu BCrypt
- DTO request/response + validation Jakarta
- `OtpServiceImpl` — rate limit 3 OTP/giờ, hết hạn 5 phút

**FR-002 — Spring Security & JWT (Lead: Binh)**
- `SecurityConfig` — stateless JWT, permit `/api/v1/auth/**`
- `JwtTokenProvider` — token 24h, claims: customerId, phone, role
- `JwtAuthenticationFilter` — Bearer token trên các API protected
- `AuthServiceImpl` — login BCrypt + trả JWT + profile khách hàng
- `POST /api/v1/auth/login`

**Hỗ trợ thêm**
- `PhoneNormalizer` — chuẩn hóa SĐT VN sang E.164
- `ConflictException`, `UnauthorizedException`
- Cập nhật `CustomerRepository`, `OtpTokenRepository`
- Dependencies: spring-security, validation, jjwt

### Files Created/Modified
- `Back-end/pom.xml`
- `Back-end/src/main/resources/application.properties`
- `Back-end/src/main/java/com/autowashpro/config/*`
- `Back-end/src/main/java/com/autowashpro/controller/AuthController.java`
- `Back-end/src/main/java/com/autowashpro/service/OtpService.java`, `AuthService.java`
- `Back-end/src/main/java/com/autowashpro/service/impl/OtpServiceImpl.java`, `AuthServiceImpl.java`
- `Back-end/src/main/java/com/autowashpro/dto/request/*`, `dto/response/*`
- `Back-end/src/main/java/com/autowashpro/utils/PhoneNormalizer.java`
- `Back-end/src/main/java/com/autowashpro/exception/custom/ConflictException.java`, `UnauthorizedException.java`
- `Back-end/src/main/java/com/autowashpro/exception/handler/GlobalExceptionHandler.java`

### Technical Decisions
- OTP hiện dùng **local dev mode** (sinh mã 6 số, log ra console). **Phat** sẽ thay bằng Twilio SMS khi tích hợp.
- API prefix `/api/v1/` theo AGENTS.md (plan + FR spec).
- `/api/v1/customers` yêu cầu JWT sau khi bật Security.

### Verification
- `mvn compile -DskipTests` — **PASS**

### Next Steps (cho Bình / nhóm)
- **Phat**: Review OTP service, tích hợp Twilio thay local mode
- **Phat**: Review login API (Phat lead trên plan)
- **FR-003**: Vehicle CRUD Service — Bình code chính
- Tạo nhánh `feat/fr-001-auth` và PR cho Anh review

---

## Phiên 2026-06-27 — Xác nhận danh tính & nắm bắt lại dự án

- **Date**: 2026-06-27
- **Author**: Bình (ooobinh)
- **Agent**: Cursor

### Summary
- Xác nhận lại danh tính: **Bình**, GitHub **ooobinh**.
- Đọc lại `AGENTS.md`, `README.md`, `progress_tracker.md`, bộ skills `.agents/skills/`.
- Trạng thái mới nhất: FE ~90% (Mock Data), BE ~30% (Auth xong), chưa tích hợp FE↔BE.

### Next Steps
- FR-003 Vehicle CRUD (BE) — nhiệm vụ chính của Bình.
- FR-004 Booking API (BE).
- PR `feat/fr-001-auth` cho Anh review.

---

## Phiên 2026-06-27 — Sửa compliance BE (Binh / ooobinh)

- **Date**: 2026-06-27
- **Author**: Bình (ooobinh)
- **Agent**: Cursor
- **Reference**: `.agents/learnings/backend_compliance_checklist.md`

### Summary
Sửa mã Back-end của Bình cho đúng quy chuẩn AGENTS.md theo checklist compliance:

- Thêm **MapStruct** vào `pom.xml` (+ lombok-mapstruct-binding).
- Chuyển `CustomerMapper` từ class thủ công sang **MapStruct interface**.
- Tạo **`AuthMapper`** (MapStruct) — thay mapping thủ công trong `AuthServiceImpl`.
- `CustomerController`: `@Valid`, `ResponseEntity`, `201 Created` / `204 No Content`.
- `CustomerRequest` + Auth DTOs: validation Jakarta + message tiếng Việt + `@Schema`.
- `CustomerServiceImpl`: inject `CustomerMapper`, dùng `ResourceNotFoundException`.

### Verification
- `mvn clean compile -DskipTests` — **PASS**

### Next Steps
- Tạo nhánh `feat/fr-001-auth` và gửi PR cho Anh review.
- Tiếp tục FR-003 Vehicle CRUD API.

---

## Phiên 2026-07-12 — Cài đặt Database local & Verify FR-004 Booking API (Binh / ooobinh)

- **Date**: 2026-07-12
- **Author**: Bình (ooobinh)
- **Agent**: Claude Code
- **Nhánh làm việc**: `ooobinh`

### Summary

**1. Cài đặt Database local (không dùng Docker)**
- Máy có sẵn SQL Server instance local tên **`OOOBINH`**, đã bật TCP/IP port `1433` từ trước. Docker Desktop cài nhưng daemon không chạy nên chọn dùng instance local thay vì `docker compose up`.
- Mật khẩu `sa` thực tế trên máy này khớp với giá trị đang có sẵn trong `application.properties` (không phải chuẩn `AutoWash@123456` ghi trong AGENTS.md) — chỉ áp dụng cho máy này, không phải quy ước chung. **Không ghi giá trị mật khẩu thật vào log này** vì repo là public.
- Tạo database `autowash_pro`, chạy `Back-end/database/AutoWashPro_Fixed.sql` để dựng schema (9 bảng + FK). **Phát hiện lỗi trong file**: có 2 dòng `ALTER TABLE otp_tokens ...` (dòng 247–249) tham chiếu bảng `otp_tokens` chưa từng được `CREATE TABLE` trong file — rác còn sót lại từ thời còn OTP nội bộ, trước khi chuyển sang Firebase Phone Auth (không còn `OtpToken` entity nào trong code Java). Đã bỏ qua 2 dòng đó khi chạy; **chưa sửa file gốc trong repo** (cần nhóm thống nhất trước khi dọn file dùng chung).
- Lưu ý: `Back-end/database/AutoWashPro.sql` (bản gốc, không phải `_Fixed`) tạo DB tên `AutoWashPro` với đường dẫn hardcode `D:\SQL\MSSQL16.SQLEXPRESS\...` — không dùng được trên máy khác, nên dùng `AutoWashPro_Fixed.sql`.
- Chạy thử `mvn spring-boot:run` → Backend start OK, `http://localhost:8080/swagger-ui/index.html` trả 200.

**2. Verify & fix FR-004 Booking API**
- Phát hiện trên nhánh `ooobinh` đã có sẵn code hoàn chỉnh cho **FR-004 (Booking API)** và cả **FR-006 (Loyalty Point Accumulation)**, commit từ trước trong ngày (`47c50cc`, `4974079`) — không phải làm mới, mà **verify + test lại với DB thật**:
  - `POST /api/v1/bookings` — tạo booking (check double-booking, check slot collision theo tổng thời lượng dịch vụ, tính giá theo hệ số kích cỡ xe BR-001, sinh `bookingRef` dạng `AWP-XXXX` duy nhất).
  - `GET /api/v1/bookings?customerId=` — danh sách booking theo khách hàng.
  - `GET /api/v1/bookings/available-slots?branchId=&date=` — khung giờ trống 30 phút (08:00–20:00).
  - `service/PointService` + `PointServiceImpl` (FR-006): tính điểm tích lũy theo công thức `(totalPrice/1000) × hệ số hạng × hệ số campaign`, cộng `PointHistory`, cập nhật `totalSpent`/`totalWashes` khi booking `COMPLETED`. **Chưa có Controller/endpoint gọi tới** — cần nối với luồng cập nhật trạng thái booking (FR-009) ở bước sau.
- **Bug tìm thấy & đã sửa**: `BookingServiceImpl` trả `409 Conflict` cho cả 2 trường hợp lỗi nghiệp vụ (khách đã có booking active VÀ khung giờ đã bị chiếm chỗ), trong khi spec FR-005 mục 3.3 quy định rõ: `409` chỉ dành cho double-booking, còn khung giờ bị chiếm phải là `400 Bad Request`. Đã sửa dòng throw exception từ `ConflictException` sang `BadRequestException` cho case slot collision.

### Verification (test thật với SQL Server, không phải mock)
- Seed thủ công qua `sqlcmd`/`Invoke-Sqlcmd`: 1 branch, 1 service (base_price 100k, 30 phút), 3 customer + 3 vehicle (đều size SEDAN).
- `mvn clean compile -DskipTests` — **PASS**.
- `POST /api/v1/auth/login` → nhận JWT thật, dùng cho các request Booking (route yêu cầu Bearer token theo `SecurityConfig`).
- `POST /api/v1/bookings` (customer 1, 10:00 13/07) → **201 Created**, `totalPrice=100000` (đúng multiplier SEDAN x1.0), verify trực tiếp bằng SQL thấy có row thật trong `bookings` + `booking_services`.
- `GET /api/v1/bookings/available-slots` sau khi đặt → slot `10:00` chuyển `available:false`, các slot khác vẫn `true`.
- `GET /api/v1/bookings?customerId=1` → trả đúng booking vừa tạo.
- Customer 1 đặt thêm booking thứ 2 (ngày khác) → **409 Conflict** "đã có lịch đặt đang hoạt động" (đúng BR-012).
- Customer 3 (mới, chưa có booking nào) đặt trùng đúng khung giờ 10:00/13-07 tại cùng branch với customer 1 → **400 Bad Request** "khung giờ không đủ chỗ trống" (đúng sau khi fix, đúng AC-3).

### Technical Decisions
- Không implement guest booking (customerId `"guest"` trong mock FE) vì Booking entity yêu cầu FK `customer_id` thật xuống DB — cần bàn thêm với nhóm nếu muốn hỗ trợ khách vãng lai thật sự ở tầng BE.
- Chưa động vào voucher locking (BR-011) và sinh VietQR (FR-005) — nằm ngoài phạm vi FR-004, để lại cho task FR-005 (Phát lead).

### Next Steps
- Bàn với nhóm về việc dọn 2 dòng `otp_tokens` mồ côi trong `AutoWashPro_Fixed.sql`.
- FR-005: nối `PointServiceImpl.creditPointsForCompletedBooking` vào luồng cập nhật trạng thái booking (Checked-in → Completed), sinh VietQR, khóa voucher khi áp dụng.
- Tạo PR từ nhánh `ooobinh` cho Anh review FR-004 + FR-006.
