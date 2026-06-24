# BỘ QUY TẮC PHÁT TRIỂN BACK-END (SPRING BOOT) CHO SINH VIÊN

Tài liệu này định nghĩa các tiêu chuẩn thiết kế cấu trúc thư mục, quy tắc viết code, đặt tên API, đặt tên database và tài liệu hóa Swagger nhằm đảm bảo dự án có **tính liên kết lỏng (Low Coupling)**, **độ gắn kết cao (High Cohesion)**, dễ bảo trì và hạn chế tối đa lỗi khi thay đổi code.

---

## 1. Cấu Trúc Thư Mục / Gói (Package Structure) Chuẩn

Dự án Back-end Spring Boot phải được tổ chức theo cấu trúc phân tầng (Layered Architecture) dưới đây:

```text
com.example.project
│
├── config                 # Cấu hình hệ thống (Security, CORS, Swagger/OpenAPI, ModelMapper...)
│
├── controller             # Tầng Presentation - Tiếp nhận HTTP Request và gọi Service
│
├── service                # Tầng Business Logic - Chứa các Service Interfaces
│   └── impl               # Chứa các lớp Service Implementation (ServiceImpl)
│
├── repository             # Tầng Data Access - Giao tiếp với Database (Spring Data JPA)
│
├── entity                 # Các thực thể cơ sở dữ liệu (Database Entities)
│
├── dto                    # Lớp vận chuyển dữ liệu (Data Transfer Objects)
│   ├── request            # Chứa các DTO gửi từ client lên (ví dụ: CreateUserRequest)
│   └── response           # Chứa các DTO trả về cho client (ví dụ: UserResponse)
│
├── mapper                 # Ánh xạ giữa DTO <-> Entity (Dùng ModelMapper hoặc MapStruct)
│
├── exception              # Định nghĩa các Exception tùy chỉnh và Bộ xử lý lỗi tập trung
│   ├── custom             # Các Exception tự định nghĩa (ResourceNotFoundException, BadRequestException...)
│   └── handler            # Lớp GlobalExceptionHandler dùng @RestControllerAdvice
│
└── utils                  # Các lớp tiện ích chung (String helper, Date helper...)
```

### Quy tắc bắt buộc:
1. **Phụ thuộc một chiều (One-way dependency)**: Luồng dữ liệu chỉ đi từ `Controller -> Service Interface -> ServiceImpl -> Repository -> Database`. Tuyệt đối không gọi ngược lại hoặc nhảy cóc (ví dụ: Controller không được gọi trực tiếp Repository).
2. **Cô lập Entity**: Tầng `Controller` chỉ làm việc với các class trong gói `dto`. Không nhận hoặc trả trực tiếp `Entity` ra ngoài API để tránh lộ cấu trúc cơ sở dữ liệu.

---

## 2. Thiết Kế Code (Coupling & Cohesion & SOLID)

### 2.1. Giảm Liên Kết (Low Coupling)
*   **Lập trình hướng giao diện (Program to Interface)**:
    *   Tầng `Controller` chỉ được tham chiếu tới `Service Interface`.
    *   *Ví dụ*: Khai báo `private UserService userService;` thay vì `private UserServiceImpl userService;`.
*   **Dependency Injection (DI)**:
    *   Được phép sử dụng `@Autowired` trực tiếp trên các field của Controller/Service để code ngắn gọn và trực quan cho sinh viên.
*   **Ánh xạ DTO và Entity**:
    *   Không viết thủ công các hàm `set/get` để chuyển đổi qua lại giữa Entity và DTO.
    *   Sử dụng thư viện hỗ trợ như **ModelMapper** hoặc **MapStruct** trong gói `mapper` để ánh xạ tự động.

### 2.2. Tăng Sự Gắn Kết (High Cohesion) & Đơn Nhiệm (SRP)
*   **Tầng Controller**: Chỉ nhận Request, kích hoạt Validation dữ liệu đầu vào (`@Valid`), gọi Service tương ứng và trả về HTTP Status phù hợp (`OK`, `CREATED`, `NO_CONTENT`). Không viết logic xử lý nghiệp vụ hoặc tính toán tại đây.
*   **Tầng ServiceImpl**: Chứa toàn bộ logic nghiệp vụ của ứng dụng. Không chứa các đối tượng HTTP (như `HttpServletRequest`, `HttpSession`) hoặc các mã trạng thái HTTP. Khi xảy ra lỗi nghiệp vụ, hãy ném (`throw`) ra các Custom Exception.
*   **Tầng Repository**: Chỉ đảm nhận nhiệm vụ truy vấn dữ liệu từ DB. Không chứa logic nghiệp vụ.

---

## 3. Validation Dữ Liệu & Xử Lý Lỗi Tập Trung

### 3.1. Validation Đầu Vào (Input Validation)
Sử dụng **Jakarta Validation** để kiểm tra tính hợp lệ của dữ liệu ngay tại DTO, tránh kiểm tra bằng `if-else` thủ công trong Service.

*   Sử dụng các annotation chuẩn trên các thuộc tính của DTO Request:
    *   `@NotBlank(message = "...")`: Cho kiểu String, không được rỗng hoặc chỉ chứa khoảng trắng.
    *   `@NotNull(message = "...")`: Cho các kiểu dữ liệu khác, không được phép null.
    *   `@Size(min = ..., max = ..., message = "...")`: Giới hạn độ dài chuỗi hoặc mảng.
    *   `@Email(message = "...")`: Kiểm tra định dạng email hợp lệ.
    *   `@Min`, `@Max`: Giới hạn giá trị số tối thiểu/tối đa.
*   Bắt buộc thêm annotation `@Valid` trước `@RequestBody` trong Controller.

### 3.2. Bộ Xử Lý Lỗi Tập Trung (Global Exception Handling)
Nghiêm cấm lạm dụng khối lệnh `try-catch` lồng nhau trong Controller/Service để bắt lỗi hệ thống hoặc tự định nghĩa kết quả trả về.

1.  **Tạo Custom Exception**: Định nghĩa các lớp ngoại lệ riêng kế thừa từ `RuntimeException` đặt tại `exception.custom`. Ví dụ: `ResourceNotFoundException`, `BadRequestException`.
2.  **Sử dụng `@RestControllerAdvice`**: Tạo lớp `GlobalExceptionHandler` trong gói `exception.handler` để bắt tất cả các ngoại lệ và định dạng dữ liệu trả về cho client một cách thống nhất.
    *   Lỗi validation (`MethodArgumentNotValidException`) phải được bắt và trả về mã lỗi `400 Bad Request` kèm theo danh sách các trường bị lỗi và thông điệp tương ứng.
    *   Các lỗi Custom Exception như `ResourceNotFoundException` trả về `404 Not Found`.
    *   Ngoại lệ chung `Exception.class` trả về mã lỗi `500 Internal Server Error` kèm thông điệp thân thiện với người dùng (ẩn đi chi tiết lỗi hệ thống hoặc stack trace).

---

## 4. Quy Tắc Đặt Tên RESTful API & Database

### 4.1. Đặt Tên RESTful API
*   **Sử dụng danh từ số nhiều** đại diện cho tài nguyên trong URI (ví dụ: `/api/v1/users`, `/api/v1/orders`). Không sử dụng động từ (như `/api/v1/createUser`).
*   **Áp dụng đúng HTTP Methods**:
    *   `GET`: Truy vấn/Đọc dữ liệu.
    *   `POST`: Tạo mới tài nguyên.
    *   `PUT`: Cập nhật toàn bộ thuộc tính của tài nguyên.
    *   `PATCH`: Cập nhật một số thuộc tính cụ thể của tài nguyên.
    *   `DELETE`: Xóa tài nguyên.
*   **Định dạng**:
    *   Sử dụng chữ thường và dấu gạch nối (kebab-case) cho URI (ví dụ: `/api/v1/order-details`).
    *   Luôn có tiền tố phiên bản `/api/v1/`.

### 4.2. Thiết Kế và Đặt Tên Database
*   **Tên database & Tên bảng**: Chữ thường, danh từ số nhiều, sử dụng `snake_case` (ví dụ: `users`, `product_categories`).
*   **Tên cột**: Chữ thường, `snake_case` (ví dụ: `created_at`, `phone_number`).
*   **Khóa chính (Primary Key)**: Luôn đặt tên cột là `id`.
*   **Khóa ngoại (Foreign Key)**: Đặt tên theo định dạng `tên_bảng_số_ít_id` (ví dụ: `user_id`, `category_id`).
*   **Spring Boot Entity Mapping**: Sử dụng rõ ràng các annotation `@Table(name = "...")` và `@Column(name = "...")` để đảm bảo ánh xạ chính xác với database mà không phụ thuộc vào quy tắc tự sinh của Hibernate.

---

## 5. Tài Liệu Hóa Swagger / OpenAPI

Để tự động xuất bản tài liệu API cho việc tích hợp Front-end và Back-end dễ dàng, sinh viên cần thực hiện:

1.  **Tích hợp dependency**: Thêm thư viện `springdoc-openapi-starter-webmvc-ui` phiên bản mới nhất vào `pom.xml`.
2.  **Ghi chú mã nguồn (API Documentation annotations)**:
    *   Sử dụng `@Tag(name = "...", description = "...")` ở cấp Controller để phân nhóm API.
    *   Sử dụng `@Operation(summary = "...", description = "...")` ở cấp endpoint để mô tả chức năng của API.
    *   Sử dụng `@Schema(description = "...", example = "...")` ở cấp thuộc tính của DTO để mô tả dữ liệu và cung cấp ví dụ mẫu.
3.  **Xem tài liệu**: Truy cập đường dẫn `http://localhost:8080/swagger-ui/index.html` sau khi chạy ứng dụng để kiểm tra tài liệu và chạy thử các API trực tiếp trên trình duyệt.

---

## 6. Quy Định Phiên Làm Việc Nhóm (6 Người) & Quản Lý Logs
*   **Số lượng thành viên**: Nhóm phát triển có **6 thành viên**.
*   **Hỏi tên 1 lần duy nhất**: Agent chỉ hỏi tên của lập trình viên **1 lần duy nhất** khi dự án vừa được tải (clone) từ GitHub về máy tính lần đầu để làm việc. Khi đã xác định được tên, các phiên sau không cần hỏi lại.
    *   **Nếu là Anh**: Tiếp tục ghi nhận các chỉnh sửa vào file cập nhật chung như cũ (`.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md` hoặc file log chung hiện có).
    *   **Nếu là thành viên khác**: Agent tạo thêm file nhật ký mới tên dạng `.agents/learnings/journal-[tên].md` để lưu lại quá trình làm việc của cá nhân đó.
*   **Quy tắc tham chiếu chéo**: Khi mượn code hoặc tham chiếu logic từ tệp của người khác, phải đọc kỹ file nguồn và file log của họ để nắm rõ ngữ cảnh. Tuyệt đối không ghi đè log của người khác, chỉ ghi vào log của mình.

