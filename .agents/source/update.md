Dưới đây là toàn bộ các ý từ các hình ảnh image\_6feafb.png, image\_6fedff.png, image\_6fee22.png, và image\_6fee3e.png đã được tổng hợp và phân loại theo từng cụm chức năng chính để bạn dễ theo dõi và triển khai:

## **1\. Phân hệ Khách hàng & Đăng ký tài khoản**

* **Form Đăng ký tài khoản:** Yêu cầu các thông tin gồm Họ tên, password, re-password, Số điện thoại (xác thực qua OTP), và Gmail (tùy chọn) (image\_6feafb.png).  
* **Thông tin phương tiện:** Biển số xe (cho phép nhập thủ công hoặc tải ảnh biển số lên) và Loại xe; cả hai mục này đều có thể bổ sung sau (image\_6feafb.png).  
* **Hiển thị giao diện:** Bổ sung thêm danh sách hiển thị thông tin khách hàng (bao gồm Họ tên và Xe) (image\_6feafb.png).

## **2\. Tính năng Đặt lịch (Booking) & Thanh toán**

* **Giao diện Đặt lịch:**  
  * Bổ sung phần chọn Chi nhánh (image\_6feafb.png).  
  * Phần chọn Dịch vụ: Cho phép chọn combo hoặc gói riêng lẻ, hiển thị dưới dạng một cửa sổ (pop-up) để chọn (image\_6feafb.png).  
  * Phần chọn khung giờ: Thêm tính năng gửi thông báo nhắc lịch cho thành viên trước 1 ngày (image\_6feafb.png) và thông báo xác nhận đặt lịch (image\_6fee22.png).  
* **Quy trình và Quy định đặt lịch:**  
  * Khách hàng được quyền chỉnh sửa thông tin ở bước xác nhận cuối cùng. Sau khi đã bấm xác nhận thì **không được hủy** (image\_6fee22.png).  
  * Nếu booking đang ở trạng thái chờ hoặc đã đặt xong, khách muốn đặt tiếp lịch mới thì bắt buộc phải **hủy request cũ** (image\_6fee22.png).  
* **Chính sách Thanh toán:** Yêu cầu khách hàng **chuyển khoản 100%** (đã bỏ phương án đặt cọc % cũ) (image\_6fee22.png).

## **3\. Hệ thống Khuyến mãi (Promotions)**

* Thêm phần hiển thị và lựa chọn chương trình khuyến mãi trên giao diện của khách hàng (image\_6feafb.png, image\_6fedff.png).  
* **Chính sách cho người mới (Tùy chọn \- Advanced):** Nếu chọn dịch vụ có tổng hóa đơn trên 300k sẽ được tặng voucher 50k; hóa đơn trên 500k sẽ được tặng voucher 100k (image\_6fedff.png).

## **4\. Vận hành tại Quầy rửa xe (Check-in)**

* **Cơ chế check-in:** Chỉnh sửa hệ thống thành check-in thủ công (image\_6fedff.png).  
* **Tính năng nâng cao (Advanced):** Tích hợp camera (công nghệ IoT) để tự động nhận diện và check-in (image\_6fedff.png).  
* Thực hiện chỉnh sửa lại các hệ thống phân hạng (image\_6fedff.png).

## **5\. Phân hệ Quản trị viên (Admin Dashboard)**

* **Quản lý Khách hàng:** Thêm khu vực xem danh sách khách hàng đăng ký. Thiết lập nút "View" để xem chi tiết từng khách, tích hợp thêm bộ lọc (filter), thanh tìm kiếm (search) và tính năng cập nhật thông tin (image\_6fedff.png).  
* **Quản lý Đặt lịch (Booking):** Giao diện hiển thị danh sách booking gần đây theo dạng cuộn vô hạn (lướt tới đâu hiện tới đó bằng JavaScript giống như các trang MXH). Mặc định hiển thị theo ngày hiện tại và hỗ trợ lọc theo trạng thái (status) (image\_6fee3e.png).  
* **Thống kê & Nhật ký:**  
  * Tích hợp bảng thống kê thu nhập: Mặc định hiển thị thời gian hiện tại, có bộ lọc tổng hợp theo Ngày, Tháng, Năm (image\_6fee3e.png).  
  * Nhật ký giao dịch: Mặc định hiển thị dữ liệu của ngày hiện tại (image\_6fee3e.png).  
* **Tối ưu hệ thống:** Bổ sung các hàm sắp xếp (sort) cho các danh mục dữ liệu cần thiết (image\_6fee3e.png).

