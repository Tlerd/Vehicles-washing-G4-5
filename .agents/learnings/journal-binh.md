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
