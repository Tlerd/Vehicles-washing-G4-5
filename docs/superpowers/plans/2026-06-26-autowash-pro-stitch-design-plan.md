# AutoWash Pro Development Plan \& Task Assignments

Tài liệu này ghi nhận cơ cấu nhóm phát triển, bảng phân công tổng quát và phân chia chi tiết nhiệm vụ cho từng Yêu cầu Chức năng (Functional Requirements - FR) từ FR-001 đến FR-013 của dự án **AutoWash Pro**.

\---

## 1\. Cơ cấu Nhóm \& Phân chia Vai trò (Team Structure \& Roles)

Nhóm phát triển gồm 7 thành viên được tổ chức làm việc theo cặp (Pair Programming) để tăng hiệu quả và chất lượng mã nguồn:

*   **Quản lý & Lên kế hoạch (Planner / Reviewer)**: **Anh** (Đảm nhận lên kế hoạch chung, kiểm tra phê duyệt PR/mã nguồn, hỗ trợ code BE và phụ trách chính toàn bộ phần AI FR-013).
*   **Nhóm phát triển Back-end (BE)**:
    *   **Phat** (tài khoản GitHub: `PhatNguyen135xy`)
    *   **Binh** (tài khoản GitHub: `ooobinh`)
    *   **Anh** (Phụ trách chính toàn bộ phần AI FR-013, hỗ trợ lập trình BE cho FR-001, FR-002, FR-003)
*   **Nhóm phát triển Front-end (FE)**:
    *   **Nguyen** (tài khoản GitHub: `ThaiNguyen2508`)
    *   **Phong** (tài khoản GitHub: `phong` / `typhoon517`)
    *   **An** (tài khoản GitHub: `Dang Minh Binh An` / `vmbazoe`)

\---

## 2\. Bảng phân công tổng quát (FR Assignment Overview)

Bảng tổng hợp phân bổ thành viên cho từng FR (Đảm bảo các task phân chia rõ ràng theo 3 nhóm cốt lõi và có reviewer hỗ trợ):

| ID | Yêu cầu chức năng | Phụ trách FE (React + TS) | Phụ trách BE (Spring Boot) | Trạng thái triển khai |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Đăng ký & Xác thực OTP qua Twilio | **Nguyen & Phong** | **Phat & Binh & Anh** | Chưa bắt đầu |
| **FR-002** | Đăng nhập & Xác thực mật khẩu | **Phong & An** | **Phat & Binh & Anh** | Chưa bắt đầu |
| **FR-003** | Quản lý phương tiện CRUD | **An & Nguyen** | **Phat & Binh & Anh** | Chưa bắt đầu |
| **FR-004** | Luồng đặt lịch 6 bước | **Nguyen & Phong** | **Phat & Binh** | Chưa bắt đầu |
| **FR-005** | Thanh toán VietQR thủ công | **Phong & An** | **Phat & Binh** | Chưa bắt đầu |
| **FR-006** | Công thức tính điểm tích lũy | **An & Nguyen** | **Phat & Binh** | Chưa bắt đầu |
| **FR-007** | Thăng hạng & Hết hạn điểm (12-Month) | **Nguyen & Phong** | **Phat & Binh** | Chưa bắt đầu |
| **FR-008** | Cửa hàng đổi voucher bằng điểm | **Phong & An** | **Phat & Binh** | Chưa bắt đầu |
| **FR-009** | Quản lý hàng chờ (Check-in/Check-out) | **An & Nguyen** | **Phat & Binh** | Chưa bắt đầu |
| **FR-010** | Danh sách khách hàng & Chi tiết (Admin) | **Nguyen & Phong** | **Phat & Binh** | Chưa bắt đầu |
| **FR-011** | Danh sách đặt lịch Infinite Scroll (Admin) | **Phong & An** | **Phat & Binh** | Chưa bắt đầu |
| **FR-012** | Thống kê doanh thu & Audit logs (Admin) | **An & Nguyen** | **Phat & Binh** | Chưa bắt đầu |
| **FR-013** | AI Campaign Promotion Builder (Admin) | **Anh & An** | **Anh & Phat** | Chưa bắt đầu |

\---

## 3\. Phân rã chi tiết đầu việc (Detailed Sub-task Breakdowns)

### FR-001: Đăng ký & Xác thực OTP qua Twilio
*   **Phát triển Front-end (Nguyen & Phong)**:
    *   `[ ]` Thiết kế form đăng ký (tên, SĐT, email) và giao diện nhập OTP: **Nguyen** (Code chính) & **Phong** (Hỗ trợ/Review)
    *   `[ ]` Validate đầu vào SĐT, ràng buộc mật khẩu và kết nối API gửi/xác thực OTP: **Phong** (Code chính) & **Nguyen** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh & Anh)**:
    *   `[ ]` Database Schema & Entity mapping (bảng `customers` và `otp_tokens`): **Phat** (Code chính), **Binh** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` Viết service tích hợp Twilio gửi SMS OTP và logic kiểm tra khớp mã: **Phat** (Code chính), **Binh** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` Thiết lập REST Controllers `/api/v1/auth/register` và `/api/v1/auth/send-otp`: **Binh** (Code chính), **Phat** (Review) & **Anh** (Hỗ trợ)

### FR-002: Đăng nhập & Xác thực mật khẩu
*   **Phát triển Front-end (Phong & An)**:
    *   `[ ]` Thiết kế Form Đăng nhập thành viên & Form đặt nhanh cho khách vãng lai: **Phong** (Code chính) & **An** (Hỗ trợ/Review)
    *   `[ ]` Xử lý lưu JWT token vào LocalStorage và cấu hình Axios Interceptor tự động đính kèm Token vào Header: **An** (Code chính) & **Phong** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh & Anh)**:
    *   `[ ]` Cấu hình Spring Security & JWT Token Provider sinh mã: **Binh** (Code chính), **Phat** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` Viết service xác thực thông tin đăng nhập, mã hóa BCrypt mật khẩu: **Binh** (Code chính), **Phat** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` Triển khai API `/api/v1/auth/login` trả về token: **Phat** (Code chính), **Binh** (Review) & **Anh** (Hỗ trợ)

### FR-003: Quản lý phương tiện CRUD
*   **Phát triển Front-end (An & Nguyen)**:
    *   `[ ]` Thiết kế tab danh sách xe (biển số, dòng xe, kích cỡ) và các nút bấm Thêm/Sửa/Xóa: **An** (Code chính) & **Nguyen** (Hỗ trợ/Review)
    *   `[ ]` Xây dựng modal thao tác CRUD phương tiện, tích hợp mô phỏng quét biển số xe LPR: **Nguyen** (Code chính) & **An** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh & Anh)**:
    *   `[ ]` Thiết kế Entity `Vehicle` có quan hệ 1-N với `Customer`: **Phat** (Code chính), **Binh** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` Viết nghiệp vụ Service CRUD xe, kiểm tra biển số xe trùng lặp: **Binh** (Code chính), **Phat** (Review) & **Anh** (Hỗ trợ)
    *   `[ ]` API Controller `/api/v1/vehicles` xử lý các request: **Phat** (Code chính), **Binh** (Review) & **Anh** (Hỗ trợ)

### FR-004: Luồng đặt lịch 6 bước
*   **Phát triển Front-end (Nguyen & Phong)**:
    *   `[ ]` Code khung Wizard điều hướng (Stepper, quản lý state và nút Back/Continue): **Nguyen** (Code chính) & **Phong** (Hỗ trợ/Review)
    *   `[ ]` Xây dựng Step 1 (chọn cỡ xe), Step 2 (chọn chi nhánh D1/D7) và Step 3 (chọn Ngày/Giờ): **Phong** (Code chính) & **Nguyen** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` Thiết kế bảng Database & Entity `Booking` với các trường chi tiết: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` Viết service xử lý đặt lịch, kiểm tra xung đột khung giờ và ràng buộc 1 lịch hẹn hoạt động/khách: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` API Controller `/api/v1/bookings` tiếp nhận thông tin đặt lịch: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)

### FR-005: Thanh toán VietQR thủ công
*   **Phát triển Front-end (Phong & An)**:
    *   `[ ]` Giao diện bước 6 (Payment): Hiển thị thông tin tổng hợp, nút Sửa quay lại, và block QR Code: **Phong** (Code chính) & **An** (Hỗ trợ/Review)
    *   `[ ]` Xây dựng nút Sao chép thông tin chuyển khoản nhanh (Số tiền, Nội dung chuyển khoản): **An** (Code chính) & **Phong** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` Service tự động tạo link ảnh VietQR động chứa mã định danh đặt lịch và số tiền: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)
    *   `[ ]` API Controller cập nhật trạng thái đơn đặt sang `CONFIRMED` khi nhân viên phê duyệt: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)

### FR-006: Công thức tính điểm tích lũy
*   **Phát triển Front-end (An & Nguyen)**:
    *   `[ ]` Hiển thị số điểm dự kiến tích lũy ở phần Giỏ hàng (Cart Sidebar) và màn hình Xác nhận: **An** (Code chính) & **Nguyen** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` Cài đặt công thức tính điểm $P = (V / 1000) * K_h * K_{km}$ trong tầng Service: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` Hàm cộng điểm tích lũy vào tài khoản khách hàng khi trạng thái đơn đổi thành `COMPLETED`: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)

### FR-007: Thăng hạng & Hết hạn điểm (12-Month)
*   **Phát triển Front-end (Nguyen & Phong)**:
    *   `[ ]` Giao diện hiển thị tiến trình thăng hạng (Silver, Gold, Diamond) và cảnh báo điểm sắp hết hạn: **Nguyen** (Code chính) & **Phong** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` Thuật toán cập nhật hạng khách hàng dựa trên chi tiêu thực tế trong 12 tháng gần nhất: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)
    *   `[ ]` Scheduler chạy tự động hàng tháng quét và thu hồi điểm hết hạn / hạ hạng (Month Roll): **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)

### FR-008: Cửa hàng đổi voucher bằng điểm
*   **Phát triển Front-end (Phong & An)**:
    *   `[ ]` Thiết kế giao diện danh sách voucher, thẻ hiển thị điểm yêu cầu đổi và nút Đổi voucher: **Phong** (Code chính) & **An** (Hỗ trợ/Review)
    *   `[ ]` Module áp dụng mã voucher đã đổi vào bước chọn dịch vụ để giảm trừ tiền: **An** (Code chính) & **Phong** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` Entity `Voucher` & Service xử lý đổi điểm lấy Voucher (trừ điểm thành viên, sinh mã voucher): **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` Hàm xác thực và áp dụng voucher khi đặt lịch (kiểm tra hạn dùng, trạng thái ACTIVE): **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)

### FR-009: Quản lý hàng chờ (Check-in/Check-out)
*   **Phát triển Front-end (An & Nguyen)**:
    *   `[ ]` Thiết kế trang Washing Counter dành cho nhân viên rửa xe (hiển thị danh sách hàng chờ, trạng thái): **An** (Code chính) & **Nguyen** (Hỗ trợ/Review)
    *   `[ ]` Thiết lập các nút tương tác: Duyệt đơn (Approve), Check-in (Xe đến bay), Checkout & Tích điểm (Hoàn thành): **Nguyen** (Code chính) & **An** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` REST API cập nhật vòng đời trạng thái của lịch đặt (`PENDING` -> `CONFIRMED` -> `CHECKED_IN` -> `COMPLETED`): **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)
    *   `[ ]` Cơ chế tự động kích hoạt cộng điểm cho khách khi đơn chuyển sang `COMPLETED`: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)

### FR-010: Danh sách khách hàng & Chi tiết (Admin)
*   **Phát triển Front-end (Nguyen & Phong)**:
    *   `[ ]` Xây dựng bảng hiển thị danh sách khách hàng (Registry) kèm chức năng tìm kiếm & lọc theo hạng: **Nguyen** (Code chính) & **Phong** (Hỗ trợ/Review)
    *   `[ ]` Modal chi tiết hiển thị toàn bộ hồ sơ khách hàng, danh sách xe, lịch sử đặt lịch và biến động điểm: **Nguyen** (Code chính) & **Phong** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` API phân trang, tìm kiếm khách hàng theo tên, SĐT, biển số xe: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` API truy vấn chi tiết lịch sử điểm tích lũy của từng khách hàng: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)

### FR-011: Danh sách đặt lịch Infinite Scroll (Admin)
*   **Phát triển Front-end (Phong & An)**:
    *   `[ ]` Thiết kế danh sách lịch đặt và tích hợp kỹ thuật cuộn trang vô hạn (Infinite Scroll - tải thêm 10 mục): **Phong** (Code chính) & **An** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` API phân trang hỗ trợ Infinite Scroll lấy danh sách lịch đặt theo ngày: **Phat** (Code chính) & **Binh** (Hỗ trợ/Review)

### FR-012: Thống kê doanh thu & Audit logs (Admin)
*   **Phát triển Front-end (An & Nguyen)**:
    *   `[ ]` Thiết kế các khối hiển thị doanh thu (hỗ trợ nút lọc tổng hợp theo Ngày, Tháng, Năm): **An** (Code chính) & **Nguyen** (Hỗ trợ/Review)
    *   `[ ]` Bảng hiển thị danh sách nhật ký kiểm toán (Audit Logs) điểm tích lũy: **An** (Code chính) & **Nguyen** (Hỗ trợ/Review)
*   **Phát triển Back-end (Phat & Binh)**:
    *   `[ ]` API tổng hợp dữ liệu doanh thu của chi nhánh theo các mốc thời gian: **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)
    *   `[ ]` Entity & Service lưu trữ thông tin lịch sử thay đổi điểm (Points Audit Logs): **Binh** (Code chính) & **Phat** (Hỗ trợ/Review)

### FR-013: AI Campaign Promotion Builder (Admin)
*   **Phát triển Front-end (Anh & An)**:
    *   `[ ]` Thiết kế form nhập chiến dịch AI (Mục tiêu chiến dịch, Nhắm tới hạng khách hàng) và hiển thị kết quả tạo: **Anh** (Code chính) & **An** (Hỗ trợ/Review)
    *   `[ ]` Xây dựng tab Promotion phía khách hàng hiển thị các chiến dịch khuyến mãi đang hoạt động: **Anh** (Code chính) & **An** (Hỗ trợ/Review)
*   **Phát triển Back-end (Anh & Phat)**:
    *   `[ ]` Tích hợp mock-AI phân tích sinh nội dung ưu đãi và tự động lưu vào bảng `promotions` với hệ số $K_{km}$: **Anh** (Code chính) & **Phat** (Review/Hỗ trợ)
    *   `[ ]` API Controllers kích hoạt / công bố chiến dịch khuyến mãi mới: **Anh** (Code chính) & **Phat** (Review/Hỗ trợ)

\---

## 4\. Quy trình phát triển \& Kiểm thử của Nhóm (Team Workflow)

1.  **Phát triển Front-end**:
    - Sử dụng React Functional Components + Hooks + Tailwind CSS.
    - Không sử dụng kiểu dữ liệu `any`. Định nghĩa đầy đủ `interface` trong thư mục `types/`.
    - Triển khai mock-state local trước khi tích hợp với API.
2.  **Phát triển Back-end**:
    - Sử dụng Java Spring Boot theo kiến trúc phân tầng (`Controller -> Service -> Repository`).
    - Validation dữ liệu đầu vào bằng `Jakarta Validation` và DTO riêng biệt.
    - Global Exception Handler xử lý lỗi tập trung.
3.  **Tích hợp & Bàn giao**:
    - FE kết nối với API của BE bằng Axios.
    - Mọi mã nguồn cần được code trên nhánh tính năng tương ứng (ví dụ: `feat/fr-001`) và tạo PR để **Anh** kiểm tra phê duyệt.
