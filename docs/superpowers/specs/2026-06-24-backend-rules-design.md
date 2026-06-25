# Thiết Kế Bộ Quy Tắc Phát Triển Back-End Cho Sinh Viên (Java Spring Boot)

Tài liệu này ghi nhận quá trình thảo luận và thiết kế bộ quy tắc lập trình Back-end bằng Spring Boot dành cho đối tượng sinh viên.

---

## 1. Bối Cảnh & Mục Tiêu

*   **Mục tiêu**: Xây dựng bộ hướng dẫn tiêu chuẩn cho sinh viên khi phát triển ứng dụng Java Spring Boot, giúp dự án dễ tiếp cận, dễ bảo trì, có tính **liên kết lỏng (Low Coupling)** và **độ gắn kết cao (High Cohesion)**.
*   **Đối tượng**: Sinh viên làm đồ án môn học hoặc khóa luận tốt nghiệp.
*   **Công nghệ sử dụng**: Java, Spring Boot 3, Spring Data JPA, Jakarta Validation, ModelMapper/MapStruct, Springdoc OpenAPI (Swagger).

---

## 2. Các Quyết Định Thiết Kế (Design Decisions)

### 2.1. Kiến Trúc Hệ Thống (Architecture Style)
*   **Lựa chọn**: Kiến trúc phân tầng truyền thống (Layered Architecture) với luồng đi: `Controller -> Service Interface -> Service Impl -> Repository -> Database`.
*   **Lý do**: Đây là mô hình kinh điển, có tài liệu hỗ trợ phong phú nhất trên internet, phù hợp với thời gian thực hành ngắn của sinh viên. Bằng cách sử dụng **Service Interfaces**, dự án vẫn đạt được sự độc lập giữa tầng Controller và tầng nghiệp vụ (ServiceImpl).

### 2.2. Phân Tách Dữ Liệu (DTO & Entity Separation)
*   **Lựa chọn**: Bắt buộc sử dụng DTO riêng biệt cho Request và Response. Ánh xạ tự động bằng các thư viện như ModelMapper hoặc MapStruct.
*   **Lý do**: Ngăn chặn việc phơi bày trực tiếp Entity ra ngoài API. Giúp giảm thiểu tối đa coupling giữa cơ sở dữ liệu và API contract. Khi DB thay đổi, API đầu ra vẫn giữ nguyên cấu trúc nếu không cần thiết.

### 2.3. Xử Lý Lỗi Tập Trung & Validation
*   **Lựa chọn**: Sử dụng `@RestControllerAdvice` cho Global Exception Handling và sử dụng các annotation của Jakarta Validation trong DTO.
*   **Lý do**: Giúp loại bỏ các khối lệnh `try-catch` lặp đi lặp lại hoặc các câu lệnh kiểm tra `if-else` thủ công trong tầng Service, giúp code sạch hơn và phân tách rõ ràng trách nhiệm của từng hàm (Single Responsibility).

### 2.4. Cấu Hình Dependency Injection (DI)
*   **Lựa chọn**: Cho phép dùng `@Autowired` trực tiếp trên field.
*   **Lý do**: Dù Constructor Injection là best-practice để viết unit test tốt hơn, đối với sinh viên, `@Autowired` trực tiếp trên field giúp mã nguồn gọn gàng, trực quan và dễ tiếp cận hơn.

### 2.5. Đặt Tên & Swagger UI
*   **Lựa chọn**: 
    *   RESTful API: Nouns, plural, lowercase kebab-case, sử dụng đúng HTTP methods.
    *   Database: Lowercase snake_case, bảng ở dạng số nhiều.
    *   Tích hợp `springdoc-openapi-starter-webmvc-ui` để tự động hóa Swagger UI tại `/swagger-ui/index.html`.
*   **Lý do**: Thống nhất giao tiếp giữa Front-end và Back-end nhanh chóng, không tốn thời gian viết tài liệu thủ công.

