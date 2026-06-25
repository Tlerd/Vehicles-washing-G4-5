# HƯỚNG DẪN VÀ LOG DỰ ÁN CHO AGENT (AGENTS.md)

Tài liệu này chứa các quy định chung của dự án, bộ quy tắc phát triển chi tiết cho Front-end (FE) & Back-end (BE), cùng nhật ký cập nhật (log) của dự án để các Agent tiếp theo dễ dàng nắm bắt và phối hợp làm việc.

---

## 1. QUY ĐỊNH CHUNG
*   **Dự án chính thức:** Dự án phát triển chính của kho lưu trữ này là **Dự án rửa xe AutoWash Pro** (Hệ thống quản lý rửa tự động thông minh với đặt lịch trước và chương trình khách hàng thân thiết). Mọi đặc tả, logic, và thiết kế mã nguồn phải tập trung hoàn toàn vào dự án này.
*   **Người kiểm tra/phê duyệt chính (Reviewer):** Lập trình viên **Anh** là người kiểm tra và phê duyệt chính. Mọi đề xuất, kế hoạch và mã nguồn phải được thông báo và phê duyệt bởi **Anh**.
*   Mọi thay đổi liên quan đến cấu trúc, logic nghiệp vụ quan trọng đều phải được ghi nhận lại trong thư mục [learnings/](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/learnings/).
*   Tuân thủ nghiêm ngặt bộ quy tắc phát triển tương ứng cho từng phần (FE/BE) được đặc tả bên dưới.
*   **Bắt buộc thực hiện demo giao diện bằng Stitch để khách hàng và cố vấn thống nhất trước khi tiến hành code Front-end.**
*   **Hiểu rõ ngữ cảnh phát triển và tách biệt các lớp (decoupling). Khi chưa có dữ liệu/API thật từ Back-end, phải chạy Mock Data trước để kiểm thử độc lập.**

---

## 2. NHẬT KÝ CẬP NHẬT DỰ ÁN (PROJECT UPDATE LOG)

### Back-end (BE)
*   **2026-06-24**: Thiết lập bộ quy tắc phát triển BE bằng Java Spring Boot dành cho sinh viên.
    *   *Chi tiết thiết kế & quyết định*: Xem tại [2026-06-24-backend-rules-design.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/specs/2026-06-24-backend-rules-design.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-brainstorm-backend-rules.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/learnings/2026-06-24-brainstorm-backend-rules.md).

### Front-end (FE)
*   **2026-06-24**: Thiết lập bộ quy tắc phát triển FE bằng React, TypeScript và Tailwind CSS dành cho sinh viên.
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-brainstorm-frontend-rules.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/learnings/2026-06-24-brainstorm-frontend-rules.md).
*   **2026-06-24**: Hoàn thành thảo luận & thống nhất luồng đặt lịch (Booking Wizard Flow) và Đăng nhập cho AutoWash Pro.
    *   *Chi tiết thiết kế*: Xem tại [2026-06-24-autowash-pro-design.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/specs/2026-06-24-autowash-pro-design.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-autowash-pro-brainstorming.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/learnings/2026-06-24-autowash-pro-brainstorming.md).
*   **2026-06-24**: Hoàn thành nâng cấp Front-end với 6 bước Booking Wizard, Customer Dashboard, Washing Counter và Admin Portal chạy offline bằng Mock Data.
    *   *Chi tiết kế hoạch*: Xem tại [2026-06-24-autowash-pro-loyalty-admin-plan.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/plans/2026-06-24-autowash-pro-loyalty-admin-plan.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-autowash-pro-frontend-implementation.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md).

---

## 3. QUY ĐỊNH PHIÊN LÀM VIỆC & PHỐI HỢP NHÓM (DEVELOPMENT SESSION & TEAM WORKFLOW)
*   **Quy mô nhóm phát triển**: Dự án được phát triển bởi nhóm **6 người**.
*   **Xác nhận danh tính phiên làm việc**:
    *   **Hỏi tên 1 lần duy nhất**: Agent chỉ thực hiện **hỏi tên của lập trình viên 1 lần duy nhất** khi dự án vừa được tải (clone) từ GitHub về máy tính lần đầu để làm việc. Khi đã xác định được tên, các phiên sau không cần hỏi lại.
    *   **Nếu tên là Anh**: Tiếp tục sử dụng file nhật ký/cập nhật chung như cũ (tập tin `.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md` hoặc tệp cập nhật chung hiện tại).
    *   **Nếu tên khác**: Agent phải tạo một file nhật ký mới nằm trong thư mục `.agents/learnings/` có tên dạng `journal-[tên].md` (ví dụ: `journal-binh.md`) để bắt đầu lưu trữ thông tin và ghi chép hoạt động của phiên làm việc đó.
*   **Quy tắc đọc hiểu và ghi nhận log**:
    *   Khi lấy code hoặc tham chiếu logic từ phần việc của thành viên khác, Agent phải đọc tệp nguồn và file log của thành viên đó để hiểu đầy đủ ngữ cảnh.
    *   Tuyệt đối **KHÔNG ghi đè hoặc chỉnh sửa** vào tệp log của người khác. Lập trình viên nào thì chỉ ghi nhật ký vào tệp log mang tên người đó.
*   **Quy định xóa sạch Front-end (FE) để tái thiết kế/rebuild**:
    *   **CHÚ Ý QUAN TRỌNG**: Ở phiên tiếp theo bắt đầu viết code Front-end, Agent bắt buộc phải **xóa sạch toàn bộ thư mục/tệp tin Front-end hiện có** (trừ các file cấu hình quan trọng nếu cần) để xây dựng và biên dịch lại giao diện FE hoàn toàn mới từ đầu nhằm tránh xung đột code cũ.

---

## 4. BỘ QUY TẮC PHÁT TRIỂN FRONT-END (REACT + TS + TAILWIND)

### 4.1. Cấu Trúc Thư Mục Chuẩn (Vite hoặc Next.js)
Đối với dự án sử dụng React (Vite hoặc Next.js), cấu trúc thư mục trong gói `src/` (hoặc root đối với Next.js) được khuyến nghị như sau:
```text
src
├── assets                 # Tài nguyên tĩnh (Hình ảnh, SVG, Fonts, Icons...)
├── components             # Các React Component dùng chung cho toàn bộ dự án (Button, Input, Modal...)
├── config                 # Cấu hình hệ thống (Axios client, các biến môi trường env...)
├── context                # Quản lý trạng thái toàn cục (AuthContext, ThemeContext...)
├── hooks                  # Các custom hooks dùng chung (useAuth, useDebounce...)
├── layouts                # Các khung giao diện chung (AdminLayout, ClientLayout, AuthLayout...)
├── pages (hoặc app)       # Tầng hiển thị trang chính (Home, Login, Dashboard...)
├── services               # Lớp gọi API (Gửi request HTTP lên Spring Boot Backend)
├── types                  # Định nghĩa TypeScript interfaces/types
└── utils                  # Các hàm tiện ích (Format date, format tiền tệ, helper...)
```
*   **Chia nhỏ Component**: Khi một Component vượt quá 300 dòng code, bắt buộc phải chia nhỏ nó thành các Component con độc lập.
*   **Mock Data trước**: Thiết lập các Mock Data trong pages/components để kiểm tra giao diện trước khi kết nối API thật.
*   **Demo Stitch trước**: Thực hiện demo giao diện bằng công cụ Stitch để thống nhất thiết kế với người dùng trước khi tiến hành viết mã nguồn (code) Front-end.

### 4.2. Quy Tắc Viết Code HTML & CSS/Tailwind
*   **Sử Sử Dụng Semantic HTML**: Bắt buộc dùng các thẻ ngữ nghĩa của HTML5 thay vì lạm dụng `<div>` lồng nhau: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
*   **Cấm dùng Style nội tuyến (Inline Styles)**: Không dùng thuộc tính `style="..."` trực tiếp trên mã HTML, ngoại trừ các trường hợp giá trị cần tính toán động bằng JS (ví dụ: `style={{ width: `${progress}%` }}`).
*   **Định nghĩa Design System trong `tailwind.config.js`**: Cấu hình các màu sắc chủ đạo (`primary`, `secondary`, `accent`, `neutral`) và font chữ chính trong file config.
*   **Hạn chế Giá trị Tùy biến (Arbitrary Values)**: Hạn chế viết các class tự định nghĩa giá trị trực tiếp như `bg-[#1E3A8A]`, `text-[13px]`, `w-[342px]`. Sử dụng các class tiêu chuẩn dựa trên cấu hình: `bg-primary`, `text-sm`, `w-80`.
*   **Tái sử dụng style bằng React Component**: Nếu một cụm CSS Tailwind lặp lại nhiều lần, hãy tạo một React Component chuyên biệt (như `<Button />`) thay vì copy-paste class Tailwind nhiều nơi.

### 4.3. Quy Tắc Viết JavaScript / TypeScript
*   **Viết Code JS/TS Hiện Đại (ES6+)**: Sử dụng `const` và `let`, tuyệt đối không sử dụng `var`. Sử dụng Arrow Functions, Destructuring và Spread Operator. Sử dụng các hàm duyệt mảng ES6: `map()`, `filter()`, `reduce()`, `find()`.
*   **TypeScript Nghiêm Ngặt**: **Cấm sử dụng kiểu `any`**. Mọi biến, tham số hàm, thuộc tính props của Component và dữ liệu nhận về từ API đều phải định nghĩa `type` hoặc `interface` rõ ràng trong thư mục `src/types/`.
*   **React Hooks & Components**: Chỉ sử dụng **Functional Components** kết hợp với **Hooks**. Không sử dụng Class Components kiểu cũ. Luôn chỉ định rõ ràng mảng phụ thuộc (dependency array `[]`) cho `useEffect` để tránh lặp vô hạn.

### 4.4. Quy Trình Phối Hợp & Kết Nối API với Back-end
*   **Quy trình kết nối API**:
    1.  *Giao diện & Mock Data trước*: FE tạo giao diện và mockup các dữ liệu dạng tĩnh.
    2.  *Thống nhất API Contract*: Dựa vào Mock Data của FE, BE xây dựng các API khớp với định dạng dữ liệu đó và cung cấp tài liệu Swagger.
    3.  *Tích hợp*: FE sử dụng Axios (hoặc Fetch) cấu hình trong thư mục `services/` để gọi API thật.
*   **Cấu hình Authenticate JWT**: Lưu Access Token vào `LocalStorage` hoặc `SessionStorage`. Sử dụng Axios Interceptors để đính kèm token vào Header `Authorization: Bearer <token>`. Xử lý tự động chuyển người dùng về trang đăng nhập khi nhận lỗi `401/403`.
*   **Xử lý Ngày Tháng (Date & Time)**: Truyền nhận ngày tháng ở định dạng chuẩn **ISO 8601 UTC** (`yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`). FE nhận dữ liệu UTC từ BE và định dạng sang múi giờ địa phương (GMT+7) khi hiển thị.

---

## 5. BỘ QUY TẮC PHÁT TRIỂN BACK-END (SPRING BOOT)

### 5.1. Cấu Trúc Thư Mục / Gói (Package Structure) Chuẩn
Dự án Back-end Spring Boot phải được tổ chức theo cấu trúc phân tầng (Layered Architecture):
```text
com.example.project
├── config                 # Cấu hình hệ thống (Security, CORS, Swagger/OpenAPI, ModelMapper...)
├── controller             # Tầng Presentation - Tiếp nhận HTTP Request và gọi Service
├── service                # Tầng Business Logic - Chứa các Service Interfaces
│   └── impl               # Chứa các lớp Service Implementation (ServiceImpl)
├── repository             # Tầng Data Access - Giao tiếp với Database (Spring Data JPA)
├── entity                 # Các thực thể cơ sở dữ liệu (Database Entities)
├── dto                    # Lớp vận chuyển dữ liệu (Data Transfer Objects)
│   ├── request            # Chứa các DTO gửi từ client lên (ví dụ: CreateUserRequest)
│   └── response           # Chứa các DTO trả về cho client (ví dụ: UserResponse)
├── mapper                 # Ánh xạ giữa DTO <-> Entity (ModelMapper hoặc MapStruct)
├── exception              # Định nghĩa các Exception tùy chỉnh và Bộ xử lý lỗi tập trung
│   ├── custom             # Các Exception tự định nghĩa
│   └── handler            # Lớp GlobalExceptionHandler dùng @RestControllerAdvice
└── utils                  # Các lớp tiện ích chung (String helper, Date helper...)
```
*   **Phụ thuộc một chiều (One-way dependency)**: Luồng dữ liệu chỉ đi từ `Controller -> Service Interface -> ServiceImpl -> Repository -> Database`. Tuyệt đối không gọi ngược lại hoặc nhảy cóc.
*   **Cô lập Entity**: Tầng `Controller` chỉ làm việc với các class trong gói `dto`. Không nhận hoặc trả trực tiếp `Entity` ra ngoài API.

### 5.2. Thiết Kế Code (Coupling & Cohesion & SOLID)
*   **Giảm Liên Kết (Low Coupling)**: Lập trình hướng giao diện (Program to Interface). Tầng `Controller` chỉ được tham chiếu tới `Service Interface`. Sử dụng **Dependency Injection (DI)** thông qua `@Autowired` trực tiếp trên field hoặc constructor.
*   **Ánh xạ DTO và Entity**: Không viết thủ công các hàm `set/get`. Sử dụng thư viện hỗ trợ như **ModelMapper** hoặc **MapStruct** trong gói `mapper` để ánh xạ tự động.
*   **Tăng Sự Gắn Kết (High Cohesion) & Đơn Nhiệm (SRP)**:
    *   *Tầng Controller*: Chỉ nhận Request, kích hoạt Validation dữ liệu đầu vào (`@Valid`), gọi Service và trả về HTTP Status phù hợp. Không viết logic xử lý nghiệp vụ.
    *   *Tầng ServiceImpl*: Chứa toàn bộ logic nghiệp vụ. Không chứa các đối tượng HTTP hoặc các mã trạng thái HTTP. Ném ra các Custom Exception khi xảy ra lỗi nghiệp vụ.
    *   *Tầng Repository*: Chỉ đảm nhận nhiệm vụ truy vấn dữ liệu từ DB.

### 5.3. Validation Dữ Liệu & Xử Lý Lỗi Tập Trung
*   **Validation Đầu Vào (Input Validation)**: Sử dụng **Jakarta Validation** để kiểm tra tính hợp lệ ngay tại DTO: `@NotBlank`, `@NotNull`, `@Size`, `@Email`, `@Min`, `@Max`. Bắt buộc thêm annotation `@Valid` trước `@RequestBody` trong Controller.
*   **Bộ Xử Lý Lỗi Tập Trung (Global Exception Handling)**: Nghiêm cấm lạm dụng khối lệnh `try-catch` lồng nhau.
    *   Định nghĩa các lớp ngoại lệ riêng kế thừa từ `RuntimeException` đặt tại `exception.custom` (ví dụ: `ResourceNotFoundException`, `BadRequestException`).
    *   Tạo lớp `GlobalExceptionHandler` dùng `@RestControllerAdvice` trong gói `exception.handler` để định dạng dữ liệu trả về cho client một cách thống nhất. Lỗi validation trả về `400 Bad Request`. Các Custom Exception trả về mã tương ứng (ví dụ: 404 cho Not Found). Ngoại lệ chung `Exception.class` trả về `500 Internal Server Error` kèm thông điệp thân thiện với người dùng (ẩn đi chi tiết lỗi hệ thống hoặc stack trace).

### 5.4. Quy Tắc Đặt Tên RESTful API & Database
*   **Đặt Tên RESTful API**: Sử dụng danh từ số nhiều đại diện cho tài nguyên trong URI (ví dụ: `/api/v1/users`). Không sử dụng động từ. Áp dụng đúng HTTP Methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Sử dụng chữ thường và dấu gạch nối (kebab-case) cho URI. Luôn có tiền tố phiên bản `/api/v1/`.
*   **Thiết Kế và Đặt Tên Database**: Tên database & Tên bảng: Chữ thường, danh từ số nhiều, sử dụng `snake_case` (ví dụ: `users`, `product_categories`). Tên cột: Chữ thường, `snake_case`. Khóa chính: Luôn đặt tên cột là `id`. Khóa ngoại: Đặt tên theo định dạng `tên_bảng_số_ít_id`. Sử dụng rõ ràng các annotation `@Table(name = "...")` và `@Column(name = "...")` trong Entity mapping.

### 5.5. Tài Liệu Hóa Swagger / OpenAPI
*   Tích hợp dependency `springdoc-openapi-starter-webmvc-ui` phiên bản mới nhất vào `pom.xml`.
*   Sử dụng `@Tag(name = "...", description = "...")` ở cấp Controller để phân nhóm API.
*   Sử dụng `@Operation(summary = "...", description = "...")` ở cấp endpoint để mô tả chức năng của API.
*   Sử dụng `@Schema(description = "...", example = "...")` ở cấp thuộc tính của DTO để mô tả dữ liệu và cung cấp vị dụ mẫu.
*   Xem tài liệu bằng cách truy cập `http://localhost:8080/swagger-ui/index.html` sau khi chạy ứng dụng.

---

## 6. QUY TẮC CẤU HÌNH VÀ SỬ DỤNG STITCH MCP (STITCH MCP WORKFLOW)

### 6.1. Quy định Kiểm tra và Bảo mật Cấu hình
*   **Kiểm tra bắt buộc**: Mỗi khi bắt đầu một phiên làm việc liên quan đến Front-end (FE), Agent phải chủ động kiểm tra xem cấu hình Stitch MCP đã được thiết lập đúng cho IDE chưa. Nếu chưa, Agent **phải dừng lại và yêu cầu hoặc hướng dẫn lập trình viên hoàn tất việc cấu hình MCP**.
*   **Bảo mật cấu hình cá nhân**: File cấu hình thật (`.gemini/mcp-settings.json` hoặc file cấu hình MCP của IDE khác) chứa thông tin đường dẫn tuyệt đối của từng máy lập trình viên. File này đã được thêm vào `.gitignore` để không bị đẩy lên Git.
*   **Tuyệt đối KHÔNG commit** file cấu hình thật lên Git repo chung để tránh gây xung đột trên 6 máy của nhóm. Chỉ thay đổi và lưu trữ cục bộ.

### 6.2. Yêu cầu Hiển thị & Đồng bộ trên Trình duyệt
*   Khi sử dụng các công cụ Stitch MCP để sinh màn hình hoặc chỉnh sửa giao diện, Agent **bắt buộc phải hướng dẫn hoặc nhắc nhở lập trình viên mở trình duyệt web** tại URL tương ứng (ví dụ: dashboard của Stitch hoặc cổng chạy cục bộ của dự án) để trực quan hóa thiết kế, kiểm tra tính đúng đắn và đồng bộ hóa trải nghiệm.

### 6.3. Bộ Hướng dẫn Kết nối và Cài đặt Stitch MCP

#### Cách 1: Tự động cấu hình bằng cách Copy mã JSON từ Stitch (Khuyên dùng)
1. Lập trình viên truy cập giao diện Stitch trên trình duyệt.
2. Tìm mục cấu hình MCP hoặc tích hợp, sao chép (copy) đoạn mã JSON cấu hình được cung cấp sẵn.
3. Gửi đoạn mã JSON vừa copy vào khung chat cho Agent.
4. Agent sẽ tự động phân tích cấu trúc, tự động thay đổi đường dẫn dự án (`STITCH_PROJECT_PATH`) cho khớp với máy hiện tại, sau đó tự tạo/ghi đè file `.gemini/mcp-settings.json` cho lập trình viên mà không làm ảnh hưởng đến Git.

#### Cách 2: Cài đặt và cấu hình thủ công qua file mẫu
1. Nhân bản file cấu hình mẫu [.gemini/mcp-settings.json.example](file:///d:/demoSWP/Vehicles-washing-G4-5/.gemini/mcp-settings.json.example) thành file thực tế `.gemini/mcp-settings.json` (đường dẫn tương đối: `.gemini/mcp-settings.json`).
2. Mở file `.gemini/mcp-settings.json` và thay thế các giá trị mẫu bằng đường dẫn thực tế trên máy tính của bạn:
   *   Thay thế đường dẫn đến file thực thi của Stitch MCP (`args`).
   *   Thay thế đường dẫn đến thư mục dự án (`STITCH_PROJECT_PATH` trong phần `env`).
3. Khởi động lại hoặc làm mới (Reload) MCP servers trong IDE để áp dụng cấu hình mới.
