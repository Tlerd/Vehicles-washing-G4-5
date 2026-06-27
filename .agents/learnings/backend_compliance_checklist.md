# BẢNG KIỂM ĐỊNH QUY CHUẨN BACK-END (CHECKLIST & REVIEW)

Tài liệu này được lập ra để lập trình viên Back-end (**Phát, Bình, Anh**) tự kiểm tra và sửa đổi mã nguồn cho đúng quy chuẩn dự án trước khi thực hiện commit và gửi Pull Request (PR) cho **Anh** duyệt.

Các quy tắc dưới đây được đối chiếu trực tiếp từ tài liệu [AGENTS.md](file:///d:/demoSWP/Vehicles-washing-G4-5/.agents/AGENTS.md).

---

## 1. BẢNG CHECKLIST KIỂM ĐỊNH NHANH (QUICK CHECKLIST)

| Hạng mục | Quy tắc kiểm định | Trạng thái | Hành động cần làm trước khi commit / PR |
| :--- | :--- | :---: | :--- |
<<<<<<< HEAD
| **Dependencies** | Không dùng mapping thủ công. Cần sử dụng thư viện tự động (ModelMapper/MapStruct). | **Đạt** | Đã cấu hình MapStruct trong `pom.xml` và viết interface `CustomerMapper`. |
| **Validation** | Bắt buộc dùng `@Valid` trước `@RequestBody` trong Controller. | **Đạt** | Đã thêm `@Valid` vào `CustomerController`. |
| **DTO Validation**| Các class DTO Request phải khai báo các kiểm tra validation (như `@NotBlank`, `@Size`, `@Email`). | **Đạt** | Đã thêm đầy đủ validation annotations vào `CustomerRequest`. |
| **HTTP status** | Controller trả về đúng HTTP Status (`201 Created` khi tạo mới, `204 No Content` khi xóa, v.v.). | **Đạt** | Đã sửa đổi tất cả các endpoint của `CustomerController` sử dụng `ResponseEntity`. |
| **Khóa chính (Entities)** | Đặt tên cột khóa chính là `id`. | ⚠️ **Độ lệch nhẹ** | Giữ nguyên theo SQL Schema thực tế (dạng `<entity>_id`) để tương thích DB. |
=======
| **Dependencies** | Không dùng mapping thủ công. Cần sử dụng thư viện tự động (ModelMapper/MapStruct). | ✅ **Đạt** (Bình, 2026-06-27) | Đã thêm MapStruct vào `pom.xml`; `CustomerMapper` + `AuthMapper` dùng MapStruct. |
| **Validation** | Bắt buộc dùng `@Valid` trước `@RequestBody` trong Controller. | ✅ **Đạt** (Bình, 2026-06-27) | `@Valid` đã có trên `AuthController` và `CustomerController`. |
| **DTO Validation**| Các class DTO Request phải khai báo các kiểm tra validation (như `@NotBlank`, `@Size`, `@Email`). | ✅ **Đạt** (Bình, 2026-06-27) | Validation + `@Schema` đã bổ sung trên Auth DTOs và `CustomerRequest`. |
| **HTTP status** | Controller trả về đúng HTTP Status (`201 Created` khi tạo mới, `204 No Content` khi xóa, v.v.). | ✅ **Đạt** (Bình, 2026-06-27) | `CustomerController` và `AuthController` dùng `ResponseEntity` với status phù hợp. |
| **Khóa chính (Entities)** | Đặt tên cột khóa chính là `id`. | ⚠️ **Độ lệch nhẹ** | Giữ `customer_id` theo SQL Schema hiện tại; thảo luận nhóm trước khi đổi toàn bộ sang `id`. |
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
| **Liên kết phân tầng** | Controller chỉ gọi Service Interface; ServiceImpl triển khai logic; DB không phơi Entity. | **Đạt** | Không chỉnh sửa gì ở luồng Layered. |
| **Xử lý lỗi tập trung**| Không lạm dụng khối `try-catch` lồng nhau. Sử dụng Global Exception Handler. | ✅ **Đạt** (Bình, 2026-06-27) | `CustomerServiceImpl` dùng `ResourceNotFoundException` thay `RuntimeException`. |

---

## 2. HƯỚNG DẪN CHI TIẾT CÁC ĐIỂM CẦN SỬA ĐỔI NGAY

### 2.1. Cài đặt Thư viện Ánh xạ Tự động (MapStruct hoặc ModelMapper)
**Hiện trạng**: [CustomerMapper.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/mapper/CustomerMapper.java) đang thực hiện thủ công set/get từng thuộc tính. Điều này vi phạm quy tắc: *"Không viết thủ công các hàm set/get. Sử dụng thư viện hỗ trợ..."*

**Giải pháp đề xuất**:
1. Thêm dependency MapStruct vào [pom.xml](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/pom.xml):
```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>1.5.5.Final</version>
    <scope>provided</scope>
</dependency>
```
2. Chuyển đổi class [CustomerMapper.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/mapper/CustomerMapper.java) thành interface của MapStruct:
```java
package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerMapper INSTANCE = Mappers.getMapper(CustomerMapper.class);

    Customer toEntity(CustomerRequest request);
    CustomerResponse toResponse(Customer customer);
}
```

### 2.2. Bổ sung Validation vào Customer API
**Hiện trạng**: Các endpoint trong [CustomerController.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/controller/CustomerController.java) nhận dữ liệu từ client nhưng thiếu kiểm tra dữ liệu hợp lệ (`@Valid`).

**Giải pháp**:
1. Sửa [CustomerController.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/controller/CustomerController.java):
```java
// Sửa
@PostMapping
public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
    CustomerResponse response = customerService.createCustomer(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}

@PutMapping("/{id}")
public ResponseEntity<CustomerResponse> updateCustomer(
        @PathVariable Long id,
        @Valid @RequestBody CustomerRequest request) {
    CustomerResponse response = customerService.updateCustomer(id, request);
    return ResponseEntity.ok(response);
}
```
2. Cập nhật các ràng buộc trong [CustomerRequest.java](file:///d:/demoSWP/Vehicles-washing-G4-5/Back-end/src/main/java/com/autowashpro/dto/request/CustomerRequest.java):
```java
@NotBlank(message = "Họ tên không được để trống")
@Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
private String fullName;

@NotBlank(message = "Số điện thoại không được để trống")
@Size(max = 20, message = "Số điện thoại không hợp lệ")
private String phone;
```

### 2.3. Khóa chính Entity (Lưu ý thảo luận nhóm)
**Quy tắc AGENTS.md**: *"Khóa chính: Luôn đặt tên cột là id."*
*   Hiện tại: `@Column(name = "customer_id") private Long customerId;`
*   Đề xuất: Nếu database thực tế sử dụng định dạng `id`, hãy cập nhật trong các Entity để đúng 100% chuẩn:
```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(name = "id")
private Long id;
```

---

## 3. QUY TRÌNH KIỂM TRA TRƯỚC KHI PULL REQUEST (PRE-PR VERIFICATION)

Trước khi gửi code lên nhánh để tạo PR, hãy chạy các lệnh sau ở thư mục `Back-end/` để đảm bảo code không có lỗi biên dịch:

1. Chạy Clean và Compile dự án:
```powershell
mvn clean compile -DskipTests
```
2. Chạy thử nghiệm các unit tests (nếu có):
```powershell
mvn test
```
3. Truy cập Swagger UI kiểm tra tài liệu API:
Chạy dự án và truy cập đường dẫn: `http://localhost:8080/swagger-ui/index.html` để kiểm duyệt cách hiển thị API.
