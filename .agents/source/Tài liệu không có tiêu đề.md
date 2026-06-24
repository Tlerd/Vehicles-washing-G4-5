Chủ đề: Xây dựng Giao diện Đặt lịch Chăm sóc xe ô tô (Car Care Booking UI) tích hợp Logic State hoàn chỉnh.

Hãy đóng vai là một Chuyên gia Frontend Developer và UI/UX Senior. Tôi cần bạn xây dựng một ứng dụng Single Page Web có tính tương tác cực kỳ cao dựa trên cấu trúc dữ liệu và quy trình nghiệp vụ dưới đây. Tất cả các phần (Menu, Gói dịch vụ, Chi tiết quy trình, Giỏ hàng, Hệ số giá theo Size xe) phải được nối (stitch) liền mạch thông qua một State quản lý tập trung.

\---

\#\#\# 1\. CẤU TRÚC DỮ LIỆU ĐẦU VÀO (DATA SCHEMA)

Sử dụng đối tượng JSON sau đây làm Nguồn dữ liệu gốc (Single Source of Truth) để render động giao diện:

const vinawashMenu \= {

  "rua\_xe\_and\_combo": {

    "title": "Rửa xe & combo",

    "items": \[

      { "id": "vw\_basic", "name": "VW Basic Wash", "price": 180000, "duration": "20 phút", "detail": "Bao gồm rửa xe ngoài, rửa gầm, hút bụi và lau nội thất." },

      { "id": "vw\_detail", "name": "VW Detail Wash", "price": 280000, "duration": "20 phút", "detail": "Detail Wash là gói rửa xe kỹ hơn Basic Wash, phù hợp cho xe cần làm sạch sâu hơn ở cả ngoại thất, gầm xe và khu vực nội thất cơ bản. Bao gồm: Rửa xe ngoài, Rửa gầm, Hút bụi nội thất, Lau nội thất cơ bản, Vệ sinh mặt sau lazang, Vệ sinh khe kẽ nội thất, Dưỡng nhựa nhám/đen ngoại thất và dưỡng ron cửa nội thất bằng dung dịch Boronax VRP cao cấp." },

      { "id": "vw\_ultimate", "name": "VW Ultimate Wash", "price": 640000, "duration": "40 phút", "detail": "Ultimate Wash là gói rửa và chăm sóc xe toàn diện hơn, kết hợp làm sạch ngoại thất, gầm, nội thất cơ bản, khử mùi và tăng độ bóng bề mặt sơn. Bao gồm toàn bộ quy trình Detail Wash kết hợp khử mùi bằng công nghệ C-AirFog và Wax sáp bóng Carnauba cao cấp." },

      { "id": "rua\_ngoai", "name": "Rửa xe ngoài", "price": 90000, "duration": "20 phút", "detail": "Làm sạch ngoại thất cơ bản." },

      { "id": "rua\_gam", "name": "Rửa gầm", "price": 50000, "duration": "20 phút", "detail": "Xịt áp lực cao vệ sinh bùn đất khung gầm." }

    \]

  },

  "ve\_sinh\_trong": {

    "title": "Vệ sinh trong",

    "items": \[

      { "id": "interior\_super", "name": "Vệ sinh nội thất Super Clean", "price": 1400000, "duration": "Linh hoạt", "detail": "Gói dọn nội thất chuyên sâu cơ bản. Bao gồm: Giặt ghế da/nỉ, vệ sinh trần, vệ sinh mặt taplo, vệ sinh tapi cửa, vệ sinh khe kẽ nội thất/cửa, vệ sinh cửa gió máy lạnh, khử mùi bằng máy ozone, dưỡng ghế da và chi tiết nhựa." },

      { "id": "interior\_ultimate", "name": "Vệ sinh nội thất Ultimate Clean", "price": 1900000, "duration": "Linh hoạt", "detail": "Gói dọn nội thất cao cấp. Thực hiện tháo toàn bộ ghế xe để làm sạch sâu, giặt trần sàn, vệ sinh taplo, khe kẽ, khe điều hòa, khử mùi máy ozone và dưỡng chi tiết nhựa/da." },

      { "id": "interior\_plus", "name": "Vệ sinh nội thất Ultimate Clean Plus", "price": 2300000, "duration": "Linh hoạt", "detail": "Phiên bản nâng cấp tối đa. Tháo rời toàn bộ ghế và tháo toàn bộ thảm sàn xe để giặt sàn và khử mùi sàn chuyên biệt, xử lý triệt để xe bị ngập nước, ẩm mốc hoặc đổ thức ăn nước uống." },

      { "id": "ghe\_le", "name": "Xử lý vị trí ngồi trên nội thất (1 vị trí)", "price": 350000, "duration": "Linh hoạt", "detail": "Xử lý vết bẩn cục bộ trên từng vị trí ghế." },

      { "id": "noi\_soi\_1", "name": "Vệ sinh nội soi / dàn lạnh", "price": 1200000, "duration": "Linh hoạt", "detail": "Làm sạch dàn lạnh bằng công nghệ nội soi camera." }

    \]

  },

  "ve\_sinh\_ngoai": {

    "title": "Vệ sinh ngoài",

    "items": \[

      { "id": "khoang\_may", "name": "Vệ sinh khoang máy", "price": 800000, "duration": "Linh hoạt", "detail": "Dọn dẹp bụi bẩn, dầu mỡ khoang động cơ bằng hơi nước nóng." },

      { "id": "tay\_nhua\_duong", "name": "Tẩy nhựa đường", "price": 400000, "duration": "Linh hoạt", "detail": "Tẩy sạch các vết nhựa đường bám quanh sườn xe." }

    \]

  },

  "xu\_ly\_be\_mat": {

    "title": "Xử lý bề mặt",

    "items": \[

      { "id": "polish\_basic", "name": "Đánh bóng sơn xe Basic", "price": 1500000, "duration": "Linh hoạt", "detail": "Đánh bóng hiệu năng 1 bước, clay bề mặt và tẩy keo nhựa đường. Xóa xước quầng xoáy nhẹ 60-70%." },

      { "id": "polish\_hieu\_chinh", "name": "Đánh bóng sơn xe hiệu chỉnh", "price": 2200000, "duration": "Linh hoạt", "detail": "Hiệu chỉnh khuyết tật sơn chuyên sâu 3 bước tiêu chuẩn 3M. Xóa xước dăm và quầng xoáy nặng từ 90-98%." }

    \]

  },

  "bao\_ve": {

    "title": "Bảo vệ",

    "items": \[

      { "id": "ceramic\_2", "name": "Pro Coating (Ceramic 2 lớp)", "price": 8500000, "duration": "Linh hoạt", "detail": "Phủ ceramic bảo vệ sơn độ bền cao." },

      { "id": "ppf\_dopon", "name": "PPF Dopon Save Protection 7.5 mil", "price": 21000000, "duration": "7.5 mil", "detail": "Dán phim bảo vệ chống trầy xước đá văng." },

      { "id": "film\_3m", "name": "Phim cách nhiệt 3M Crystalline", "price": 15600000, "duration": "Linh hoạt", "detail": "Dán phim cách nhiệt quang học cao cấp nhất của 3M." }

    \]

  }

};

\---

\#\#\# 2\. CÁC THÀNH PHẦN GIAO DIỆN CẦN KẾT NỐI (STITCHING UI COMPONENTS)

1\. \*\*Thanh trạng thái / Tiến trình (Step Progress Header):\*\*

   \- Thiết kế thanh tiến trình 5 bước: 1\. Chi nhánh \-\> 2\. Ngày & Giờ \-\> 3\. Dịch vụ (Trạng thái Active màu cam nổi bật) \-\> 4\. Thông tin \-\> 5\. Xác nhận.

2\. \*\*Hộp chọn Nhóm Dịch Vụ lớn (Accordion Container):\*\*

   \- Mỗi nhóm danh mục lớn (Rửa xe, Vệ sinh trong, Vệ sinh ngoài...) là một thẻ Accordion độc lập.

   \- Khi click vào tiêu đề nhóm, danh sách các dịch vụ con bên trong sẽ trượt mở ra hoặc thu ẩn lại một cách mượt mà (smooth transition). Mặc định khi tải trang, nhóm "Rửa xe & combo" tự động mở sẵn.

   \- Hiển thị badge số lượng dịch vụ hiện có trong nhóm (Ví dụ: "5 dịch vụ") ở góc phải thanh tiêu đề.

3\. \*\*Danh sách dịch vụ con (Service Item Row):\*\*

   \- Mỗi hàng gồm: Cột trái chứa Checkbox lớn \+ Tên dịch vụ \+ Dòng text phụ ("Dịch vụ slot • Thời gian • Tên nhóm"). Cột phải hiển thị Đơn giá chữ đậm màu cam.

   \- Thêm một nút bấm nhỏ dạng tag tròn: \*\*"Xem chi tiết"\*\* (kèm icon mũi tên hướng xuống). Khi click vào nút này, một hộp thoại mô tả chi tiết quy trình (nền vàng kem nhẹ \`\#fffbeb\`, viền bo góc) sẽ hạ xuống ngay dưới dịch vụ đó. Nút chuyển trạng thái thành \*\*"Ẩn chi tiết"\*\* (icon mũi tên quay lên). Việc ẩn/hiện chi tiết này không làm ảnh hưởng tới trạng thái tick chọn checkbox.

4\. \*\*Bộ lọc kích thước xe (Car Size Multiplier State):\*\*

   \- Đặt một hộp chọn Select Dropdown cố định ở góc trên trang cho phép chọn loại xe:

     \* Hatchback: Hệ số giá x0.9 (Giảm 10%)

     \* Sedan: Hệ số giá x1.0 (Mặc định)

     \* SUV / CUV: Hệ số giá x1.2 (Tăng 20%)

     \* Bán tải / Luxury: Hệ số giá x1.4 (Tăng 40%)

   \- Khi người dùng thay đổi Size xe, hệ thống phải \*\*"nối" lập tức\*\* để cập nhật lại toàn bộ hiển thị giá tiền của tất cả các gói dịch vụ trong menu theo thời gian thực (Giá hiển thị \= Giá gốc \* Hệ số xe).

5\. \*\*Thanh tóm tắt Đơn hàng & Giỏ hàng tự động (Cart Sidebar):\*\*

   \- Trên Máy tính: Nằm ở cột phải (Sticky Sidebar). Trên Điện thoại: Biến thành một thanh Dock nổi dưới đáy màn hình.

   \- Tự động thống kê: Số lượng dịch vụ đang chọn, Tổng thời gian thi công dự kiến (tính bằng cách cộng dồn số phút của các mục đã chọn), và Tổng số tiền thanh toán cuối cùng (sau khi nhân hệ số loại xe).

   \- Liệt kê trực quan tên các gói đang chọn dưới dạng thẻ nhỏ để người dùng dễ theo dõi.

6\. \*\*Hộp thoại xác nhận (Checkout Modal):\*\*

   \- Khi bấm "Tiếp tục đặt lịch" / "Đặt lịch", hiển thị một popup modal phủ mờ nền (backdrop blur).

   \- Hiển thị tóm tắt đầy đủ thông tin: Loại xe đã cấu hình, danh sách các dịch vụ kèm đơn giá tương ứng sau khi nhân hệ số, và tổng chi phí. Bấm "Xác nhận hoàn tất" sẽ kích hoạt hiệu ứng thông báo thành công dạng toast mượt mà và reset giỏ hàng.

\---

\#\#\# 3\. YÊU CẦU KỸ THUẬT & THẨM MỸ (TECH STACK & STYLING)

\- \*\*Công nghệ khuyến khích:\*\* Sử dụng HTML5, Tailwind CSS và JavaScript thuần (hoặc React/Vue tùy theo kiến trúc framework hiện tại của Stitch).

\- \*\*Màu sắc chủ đạo:\*\* Sử dụng tông nền trắng/xám sáng tinh tế (\`\#f8fafc\`), chữ xám đậm tinh tế (\`\#1e293b\`), các điểm nhấn tương tác (Nút bấm, đơn giá, checkbox kích hoạt) đồng bộ màu cam sáng (\`\#f97316\`) chuẩn nhận diện VinaWash trong ảnh.

\- \*\*Tính phản hồi (Responsive):\*\* Tối ưu giao diện mobile-first tuyệt đối, các vùng bấm chọn (hitbox) của checkbox và nút chi tiết phải đủ lớn, dễ thao tác bằng ngón tay.

Hãy triển khai toàn bộ mã nguồn hợp nhất (mã sạch, có chú thích rõ ràng bằng tiếng Việt các phân đoạn nối state) để tôi có thể chạy thử nghiệm ngay lập tức.

