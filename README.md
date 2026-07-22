# AutoWash Pro

AutoWash Pro là hệ thống hỗ trợ đặt lịch và quản lý dịch vụ chăm sóc **ô tô**. Dự án gồm ứng dụng khách hàng React và API Spring Boot sử dụng SQL Server. Xe máy không thuộc phạm vi dự án.

> Trạng thái: mã nguồn frontend đã được refactor sang React 19/Vite 6 và một phần đã kết nối API thật. Đây chưa phải bản triển khai đầy đủ của toàn bộ thiết kế v2; các giới hạn hiện tại được ghi rõ bên dưới.

## Những phần đã có

- Landing page, giao diện đặt lịch 6 bước và trang đăng nhập khách hàng.
- Giao diện tiếng Việt/tiếng Anh, chế độ sáng/tối và thiết kế đáp ứng.
- Đăng nhập bằng số điện thoại + mật khẩu qua backend JWT.
- Đăng ký xác minh số điện thoại bằng Firebase Phone OTP, sau đó tạo tài khoản tại backend.
- Customer console: dashboard, garage, điểm, voucher, lịch sử và chi tiết lịch hẹn/đánh giá.
- Garage đã kết nối API thật: tạo, sửa, xoá xe và chọn xe mặc định theo JWT.
- Backend có API xác thực, xe, catalog, booking, loyalty, quầy rửa và quản trị; tài liệu OpenAPI/Swagger được cung cấp khi backend chạy.

## Giới hạn đang biết

- Wizard đặt lịch đã gọi API catalog, availability, vehicle và tạo booking hiện có.
- Dashboard, điểm, voucher, lịch sử và chi tiết booking hiện vẫn dùng mock data; chỉ Garage đã nối API thật, nên dữ liệu hiển thị có thể không khớp phiên đăng nhập.
- Check-in, hoàn tất và feedback ở frontend vẫn là mock flow.
- Chưa có tích hợp cổng thanh toán, webhook/IPN, đối soát hoặc xác thực thanh toán. Không coi trạng thái thanh toán là đã được xác minh cho đến khi tích hợp cổng thanh toán thật hoàn tất.
- Luồng booking và cơ chế giữ chỗ/phân bổ khoang đang được hoàn thiện theo thiết kế v2; xem các kế hoạch Phase 3C và PayOS trước khi mở rộng frontend.
- Google Sign-In không có trong giao diện hiện tại vì chưa tương thích với hợp đồng đăng ký backend.
- Frontend chưa có script test hoặc lint. Backend có test tree; lần chạy đầy đủ gần nhất đạt 237/246 test, với 1 failure và 8 errors cần xử lý.

## Luồng nghiệp vụ mục tiêu v2

Thứ tự wizard mục tiêu là: **Chi nhánh → Dịch vụ → Ngày giờ → Xe → Xem lại → Xác nhận**. Thiết kế v2 còn mô tả booking cho khách/khách hàng, cọc thanh toán, quản lý khoang, loyalty và các cổng staff/admin. Đây là tài liệu định hướng, không phải cam kết rằng mọi chức năng đã được hiện thực trong source hiện tại.

Xem chi tiết tại [yêu cầu chức năng](docs/srs/functional_requirements.md), [luồng v2](docs/design/01-LUONG-CHAY-MOI.md) và [báo cáo refactor tài liệu](docs/reports/milestone/REFACTOR-REPORT.md).

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| UI và trạng thái | React Router 7, TanStack Query, Zustand, React Hook Form, Zod |
| Trải nghiệm | i18next (vi/en), Motion, GSAP, Lucide, date-fns/date-fns-tz |
| Backend | Java 17, Spring Boot 3.5.6, Spring Web/Security/JPA/Validation |
| Dữ liệu và xác thực | SQL Server, JWT, Firebase Admin/Phone OTP |
| API docs | springdoc OpenAPI / Swagger |

## Yêu cầu môi trường

- Node.js 18+ và npm.
- JDK 17 và Apache Maven (repository không có Maven Wrapper).
- SQL Server đang chạy, có database `autowash_pro` tại cổng `1433`, cùng schema/migration trong `Back-end/database/`.
- Cấu hình Firebase hợp lệ nếu cần đăng ký bằng Phone OTP.

Không commit file `.env`, JWT secret, mật khẩu database hoặc Firebase service account.

## Cấu hình biến môi trường

Tạo các file local (đều phải được gitignore):

```powershell
Copy-Item Front-end/.env.example Front-end/.env
Copy-Item Back-end/.env.example Back-end/.env
```

Điền tối thiểu `DB_PASSWORD` và `JWT_SECRET` trong `Back-end/.env`. File `Front-end/.env.example` hiện đặt ví dụ `VITE_API_BASE_URL=http://localhost:8080/api/v1`; hãy giữ biến này khi tạo `Front-end/.env`. Khi biến này vắng mặt, frontend hiện tại cũng fallback về URL localhost đó.

Để dùng luồng đăng ký Phone OTP, đặt Firebase Admin service-account JSON do quản trị viên Firebase cấp tại `Back-end/src/main/resources/firebase-service-account.json`. File này phải luôn không được theo dõi bởi Git. Nếu chưa có service account hoặc cấu hình `VITE_FIREBASE_*`, backend vẫn có thể chạy và người dùng hiện có vẫn đăng nhập bằng số điện thoại/mật khẩu, nhưng không thể hoàn tất đăng ký OTP.

> Hai file `.env.example` đang là cấu hình khởi tạo trong worktree hiện tại. Nếu branch/clone của bạn chưa có chúng, hãy tạo các file `.env` theo các biến được nêu ở trên, không chép bí mật vào source hoặc Git.

## Chạy dự án

Từ thư mục gốc repository:

```powershell
# Cài dependencies frontend
npm --prefix Front-end ci

# Chạy frontend (Vite sẽ in URL, thường là http://localhost:5173)
npm --prefix Front-end run dev
```

Mở một terminal khác để chạy backend:

```powershell
# Nạp Back-end/.env vào đúng PowerShell đang chạy Maven.
# .env là file cấu hình, không phải lệnh có thể chạy trực tiếp.
Get-Content .\Back-end\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $parts = $_ -split '=', 2
  $key = $parts[0].Trim()
  $value = $parts[1].Trim()
  if (-not [string]::IsNullOrWhiteSpace($value)) {
    Set-Item -Path ("Env:" + $key) -Value $value
  }
}

Set-Location .\Back-end
mvn spring-boot:run
```

`Back-end/run-local.ps1` đã được quan sát thất bại với lỗi thiếu `JWT_SECRET`
dù file `.env` có giá trị; dùng khối trên cho đến khi script được điều tra và
xác minh lại. Hoặc, chỉ khi `DB_PASSWORD` và `JWT_SECRET` đã tồn tại trong
environment của terminal hiện tại:

```powershell
mvn -f Back-end/pom.xml spring-boot:run
```

Backend mặc định chạy tại `http://localhost:8080`. Khi đã khởi động, Swagger UI có tại `http://localhost:8080/swagger-ui/index.html`.

## Kiểm tra chất lượng

```powershell
# Frontend
npm --prefix Front-end run typecheck
npm --prefix Front-end run build

# Backend (hiện không có Back-end/src/test; kết quả 0 test không phải bằng chứng hành vi)
mvn -f Back-end/pom.xml test
```

Không có lệnh `npm test` hoặc `npm run lint` trong frontend hiện tại.

## Tài liệu tham khảo

- [Tiến độ, bằng chứng và các blocker](PROGRESS.md)
- [Yêu cầu chức năng](docs/srs/functional_requirements.md)
- [Quy tắc nghiệp vụ v2](docs/srs/business_rules.md)
- [Luồng booking v2](docs/design/01-LUONG-CHAY-MOI.md)
- [Kế hoạch refactor frontend](docs/plans/PLAN-V2-LAM-LAI-FE.md)
- [Báo cáo refactor tài liệu](docs/reports/milestone/REFACTOR-REPORT.md)

## Lưu ý bảo mật

Đây chưa nên được coi là cấu hình production. Ngoài việc hoàn thiện thanh toán và concurrency, cần xử lý các hạng mục hardening đã ghi trong `PROGRESS.md`, gồm seed password trong source và chính sách CORS quá rộng.
