# Nhật ký phiên làm việc — Danh

> File log riêng theo quy định AGENTS.md. Chỉ Danh (hoặc agent làm việc cùng Danh) ghi vào file này.

---

## Phiên 2026-07-16 — Thiết lập môi trường dev trên WSL2 & fix kết nối DB

- **Date**: 2026-07-16
- **Author**: Danh
- **Agent**: Claude Code

### Summary
Máy dev chạy WSL2 (Ubuntu 26.04) trên Windows. Ban đầu môi trường WSL không có Node.js/Java/Maven native (chỉ có PATH kế thừa trỏ vào binary Windows, không dùng được vì đường dẫn có khoảng trắng và thiếu file thực thi Linux). Đã cài đặt toàn bộ toolchain ở user-space (không cần sudo):

- **Node v24.18.0 / npm 11.16.0** qua `nvm` (`~/.nvm`)
- **Temurin JDK 17.0.19** và **Maven 3.9.16** giải nén trực tiếp từ tarball vào `~/opt` (bỏ qua `sdkman` vì cần `unzip` → cần sudo password không có sẵn)
- Thêm biến môi trường (`JAVA_HOME`, `MAVEN_HOME`, `PATH`, nvm init) vào `~/.bashrc` để tự động có hiệu lực ở các shell mới.

### Front-end
- `npm install` báo lỗi `ERESOLVE`: `package.json` khai `vite: ^8.1.4` nhưng `@vitejs/plugin-react: ^4.3.1` — bản 4.x của plugin chỉ hỗ trợ vite tới v7 (bản 5.x/6.x mới hỗ trợ v8).
- Đã cài tạm bằng `npm install --legacy-peer-deps` để không tự ý đổi version đã khai báo.
- **Cần fix thật**: bump `@vitejs/plugin-react` lên `^6.0.0` trong `package.json`.
- `npm run build` (`tsc && vite build`) — **PASS**, chỉ có warning deprecation, không lỗi.

### Back-end
- `mvn clean install -DskipTests` — **PASS**.
- `firebase-service-account.json` thiếu (đúng như kỳ vọng, file không commit) → app log warning và tiếp tục chạy không có Firebase.
- **Phát hiện quan trọng**: `application.properties` dùng `spring.datasource.url=jdbc:sqlserver://localhost:1433;...`. Khi chạy Back-end **từ trong WSL**, `localhost` trỏ vào chính WSL VM, không phải Windows host, nên **không kết nối được** SQL Server (SQLEXPRESS đang chạy trên Windows, lắng nghe `0.0.0.0:1433`, Windows Firewall đã có rule `SQL Server 1433 WSL` cho phép).
- Địa chỉ đúng để WSL gọi tới Windows host là gateway mặc định của WSL: `172.24.48.1` (lấy từ `ip route show | grep default`, ổn định vì lấy từ default gateway chứ không phải `/etc/resolv.conf`).

### Technical Decisions
- Thay vì sửa trực tiếp `application.properties` (sẽ phá cấu hình cho ai chạy Back-end trên Windows thật), đã tạo **Spring profile riêng** `application-wsl.properties` chỉ override `spring.datasource.url` sang `172.24.48.1`. Cấu hình mặc định (`localhost`) giữ nguyên cho máy Windows.
- Kích hoạt profile khi chạy trong WSL:
  ```bash
  mvn spring-boot:run -Dspring-boot.run.profiles=wsl
  # hoặc
  SPRING_PROFILES_ACTIVE=wsl mvn spring-boot:run
  ```
- Đã verify end-to-end: chạy `mvn spring-boot:run -Dspring-boot.run.profiles=wsl`, HikariPool kết nối thành công vào SQL Server 16.0, Tomcat start trên port 8080, gọi thử API xác nhận hoạt động.

### Files Created/Modified
- `Back-end/src/main/resources/application-wsl.properties` (mới) — override DB URL cho môi trường WSL.
- `~/.bashrc` (máy local, không thuộc repo) — thêm `JAVA_HOME`, `MAVEN_HOME`, PATH, nvm init.

### Next Steps
- Cân nhắc bump `@vitejs/plugin-react` lên bản hỗ trợ vite 8 để bỏ cờ `--legacy-peer-deps`.
- Nếu team member khác cũng dev qua WSL2, dùng chung profile `wsl`; nếu gateway IP khác `172.24.48.1` trên máy họ, cần cập nhật lại giá trị trong `application-wsl.properties` hoặc lấy qua `ip route show | grep default`.
