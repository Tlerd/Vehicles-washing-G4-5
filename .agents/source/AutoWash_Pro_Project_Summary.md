# TỔNG HỢP NỘI DUNG DỰ ÁN: AUTOWASH PRO

## 1. Thông Tin Chung (General Information)
* **Mã dự án:** 1SU26SWP01TV
* **Tên dự án (Tiếng Việt):** Hệ thống quản lý rửa tự động thông minh với đặt lịch trước và chương trình khách hàng thân thiết
* **Tên dự án (Tiếng Anh):** Smart Automated Car Wash Management System with Advance Booking & Loyalty Program
* **Đối tượng tham gia:** Sinh viên Software Engineering (SE), Cố vấn học tập (Academic Counselor), Cố vấn doanh nghiệp (Industry Mentor).
* **GVHD/Người phụ trách:** VanTTN2

---

## 2. Bối Cảnh & Lý Do Hình Thành Dự Án (Context & Problem Statement)
* **Bối cảnh thị trường:** Việt Nam hiện có hơn 7.7 triệu phương tiện (xe máy, ô tô) với nhu cầu rửa xe tăng trưởng 25% qua từng năm (YoY). Trong bối cảnh đó, việc giữ chân khách hàng cũ (customer retention) là yếu tố sống còn. Nghiên cứu chỉ ra rằng khách hàng trung thành chi tiêu nhiều hơn 67% và tần suất ghé thăm cao gấp 3 lần khách hàng vãng lai.
* **Hạn chế của hệ thống hiện tại:**
  * Thiếu cơ chế phần thưởng cá nhân hóa (chỉ dừng lại ở mức cơ bản như "rửa 5 lần tặng 1 lần").
  * Chưa phân cấp quyền lợi khách hàng rõ ràng (Hạng Bạc/Vàng/Kim cương).
  * Thiếu hệ thống kỹ thuật số để theo dõi tích điểm, lịch sử sử dụng và các đặc quyền.
* **Giải pháp từ AutoWash Pro:** Tích hợp chương trình khách hàng thân thiết đa tầng (Multi-tier Loyalty) kết hợp đặt lịch trước, tự động hóa nhận diện biển số xe (LPR) và cá nhân hóa trải nghiệm bằng AI.
* **Hiệu quả kỳ vọng:** Tăng tỷ lệ khách hàng quay lại 45%, tăng giá trị vòng đời khách hàng (LTV) lên 60%, hỗ trợ triển khai các chiến dịch khuyến mãi dựa trên dữ liệu thực tế.

---

## 3. Tổng Quan Hệ Thống (System Overview)
**AutoWash Pro** là hệ thống quản lý rửa xe tự động thông minh, tích hợp công nghệ AI và CRM nhằm tối ưu hóa trải nghiệm khách hàng, tinh gọn quy trình vận hành và tối đa hóa doanh thu cho doanh nghiệp.

### Các Tính Năng Hỗ Trợ Chính:
1. Đặt lịch trước với quyền ưu tiên dựa trên hạng thành viên (Tier-based priority booking).
2. Tương tác và cá nhân hóa trải nghiệm khách hàng bằng AI *(Tùy chọn - Optional)*.
3. Chương trình khách hàng thân thiết đa tầng (Multi-tier loyalty program) giúp giữ chân và tri ân khách hàng.
4. **Lưu ý giới hạn kỹ thuật:** Đội ngũ phát triển **KHÔNG** triển khai dịch vụ thanh toán trực tuyến (online payment) và không quản lý quy trình hoàn tiền (refund).

---

## 4. Các Chức Năng Cốt Lõi (Core Functions)

### 4.1. Bộ Máy Quản Lý Thành Viên (Loyalty Engine)
* **Theo dõi dữ liệu:** Tự động ghi nhận điểm thưởng (points), số tiền chi tiêu (spend), và số lần đến rửa xe (visits).
* **Cơ chế xét hạng:** Tự động nâng hạng hoặc hạ hạng thành viên dựa trên kết quả đánh giá định kỳ hàng tháng (monthly review).
* **Quy đổi phần thưởng:** Điểm thưởng có thể đổi thành mã giảm giá (discount), suất rửa xe miễn phí (free wash), hoặc các dịch vụ gia tăng đi kèm (add-on).
* **Hạn dùng của điểm:** Điểm thưởng có giá trị sử dụng và sẽ tự động hết hạn sau 12 tháng kể từ ngày tích lũy.

### 4.2. Phân Hệ Khách Hàng (Customer Module)
* **Định danh tài khoản:** Tài khoản khách hàng được liên kết trực tiếp với Số điện thoại + Biển số xe (License plate).
* **Tra cứu thông tin:** Khách hàng có thể tự xem số dư điểm hiện tại và lịch sử các lần rửa xe trước đó.
* **Thời hạn đặt lịch theo hạng (Tier-based booking window):**
  * **Hạng mặc định (Member):** Được đặt trước tối đa **7 ngày**.
  * **Hạng Bạc (Silver):** Được đặt trước tối đa **10 ngày**.
  * **Hạng Vàng (Gold):** Được đặt trước tối đa **12 ngày**.
  * **Hạng Bạch Kim (Platinum):** Được đặt trước tối đa **14 ngày**.
* **Hàng đợi ưu tiên (Priority queue):** Khách hàng có hạng thành viên cao hơn sẽ được ưu tiên xếp lịch và phục vụ sớm hơn.
* **Tự động áp dụng ưu đãi:** Hệ thống tự động tính toán và áp dụng các đặc quyền của hạng thành viên ngay tại bước thanh toán (checkout).

### 4.3. Phân Hệ Quản Trị Viên (Admin Module)
* **Cấu hình hệ thống:** Thiết lập quy định phân hạng, tỷ lệ quy đổi điểm thưởng, và các đặc quyền đi kèm cho từng hạng.
* **Chiến dịch marketing:** Tạo và chạy các chương trình khuyến mãi nhắm trúng đích (Ví dụ: Chỉ gửi thông báo khuyến mãi cho nhóm khách hàng từ hạng Bạc trở lên - "Send to Silver+ only").

---

## 5. Danh Mục Dữ Liệu Quản Lý (Managed Data Entities)
Hệ thống chịu trách nhiệm quản lý các thực thể dữ liệu chính bao gồm:
* Thông tin Khách hàng (Customer)
* Lịch sử Đặt lịch / Lịch sử Rửa xe (Booking/Wash history)
* Các Chương trình Khuyến mãi của Hệ thống (System's Promotion)
* Điểm thưởng của Khách hàng (Customer's point)
* Thông tin Phương tiện của Khách hàng (Customer's Vehicles)

---

## 6. Kịch Bản Demo Đánh Giá (Demo Flows)
Nhóm sinh viên cần thực hiện demo trọn vẹn 3 luồng nghiệp vụ sau để phục vụ đánh giá dự án:

### Luồng 1: Quản lý tài khoản & Phương tiện
* Thực hiện đăng ký tài khoản mới, đăng nhập hệ thống.
* Thực hiện đầy đủ các thao tác Thêm, Sửa, Xóa, Xem (CRUD) thông tin xe của khách hàng.
* *Lưu ý quan trọng:* Tất cả các tài khoản sau khi đăng ký thành công đều có hạng thành viên mặc định là **'member'**.

### Luồng 2: Luồng đặt lịch và tính điểm thưởng (End-to-End Booking)
* **2.1. Quản lý trạng thái:** Admin/Hệ thống phải quản lý và cập nhật được toàn bộ các trạng thái của một lượt đặt lịch (Booking) từ lúc tạo cho đến khi hoàn thành.
* **2.2. Check-in:** Khi khách hàng đến cửa hàng và thực hiện check-in, hệ thống phải hiển thị rõ chi phí rửa xe quy đổi ra điểm (hoặc số phí/điểm cần thanh toán).
* **2.3. Checkout & Tích điểm:** * Sau khi hoàn thành dịch vụ (checkout), điểm thưởng của khách hàng sẽ được cộng tăng thêm. 
  * Nếu thời điểm đó đang có chương trình khuyến mãi, điểm thưởng sẽ được tính toán cộng thêm theo quy định của chương trình đó (áp dụng cho toàn bộ các hạng hoặc áp dụng riêng cho một nhóm hạng cụ thể).
  * Nếu số điểm tích lũy sau khi cộng đạt đủ hạn mức quy định, hệ thống sẽ tự động nâng hạng thành viên của khách hàng lên mức cao hơn.

### Luồng 3: Xem lịch sử & Quản trị hệ thống
* **Giao diện Khách hàng (As a member):** Khách hàng có thể vào xem chi tiết lịch sử đặt lịch (booking history), lịch sử các lần rửa xe thực tế, số dư điểm thưởng hiện tại và danh sách các chương trình khuyến mãi đang chạy trên hệ thống.
* **Giao diện Quản trị (As an admin):** * Xem toàn bộ danh sách đặt lịch (all bookings) của toàn hệ thống.
  * Thực hiện các thao tác Thêm, Sửa, Xóa, Xem (CRUD) đối với tất cả các chương trình khuyến mãi của hệ thống.
  * Tra cứu và theo dõi được toàn bộ lịch sử giao dịch/lịch sử điểm của khách hàng.
