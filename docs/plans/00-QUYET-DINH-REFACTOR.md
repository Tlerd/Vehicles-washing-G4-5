# 00 — NHẬT KÝ QUYẾT ĐỊNH REFACTOR (Decision Log)

> **Ngày chốt**: 2026-07-20 · **Người quyết định**: Đức Anh (Product Owner / Reviewer)
> **Bối cảnh**: Đồ án bị "CHƯA REVIEW", phải chấm lại vào **Tuần 10** sau khi fix 17 lỗi.
> **Mục đích file này**: ghi lại *cái gì đổi*, *đổi thành gì*, *vì sao* — để 6 thành viên không cãi nhau và không code theo tài liệu cũ.

---

## 1. Bảng quyết định

| # | Chủ đề | Quyết định cũ (tài liệu hiện tại) | Quyết định MỚI | Tài liệu bị ảnh hưởng |
| :-- | :-- | :-- | :-- | :-- |
| D-01 | Vòng đời booking | Staff `Approve/Reject` → Staff check-in → Staff checkout | **Auto-confirm** sau khi cọc thành công. **Customer** tự check-in và tự xác nhận hoàn thành. Staff chỉ vận hành + xử lý ngoại lệ | FR-005, FR-009, FR-011, BR-013 |
| D-02 | Thanh toán | Chuyển khoản thủ công **100%** trước (BR-014) | **Đặt cọc giữ chỗ theo bậc** qua VNPAY, phần còn lại thanh toán tại quầy | FR-005, BR-014 |
| D-03 | Giá theo size xe | Hệ số nhân BR-001 (0.9 / 1.0 / 1.2 / 1.4) | **Giữ nguyên BR-001**, bổ sung cờ `is_size_dependent` cho dịch vụ đồng giá | BR-001, FR-004 |
| D-04 | Phạm vi dịch vụ | 5 nhóm chăm sóc xe (VinaWash) | **7 nhóm**: thêm *Thay dầu* và *Thay lốp* | Toàn bộ catalog |
| D-05 | UI chọn dịch vụ | Danh sách accordion | **Lưới icon** kiểu timy → bấm icon mở **modal**. Tách riêng icon **GÓI COMBO** và icon **DỊCH VỤ ĐƠN** | FR-004 |
| D-06 | Tùy chọn thêm (add-on) | Không có | Dùng **dịch vụ đơn** sẵn có + bảng `combo_includes` để **cảnh báo trùng** | FR-004 |
| D-07 | Chọn ngày giờ | Slider ngang | **Dải ngày ngang** (mặc định) + nút mở **lịch tháng** đầy đủ | FR-004 |
| D-08 | Thứ tự wizard | Size → Chi nhánh → Dịch vụ → Ngày giờ → Thông tin → Xác nhận | **Chi nhánh → Dịch vụ → Ngày giờ → Chọn xe → Xem lại → Xác nhận**. Giá hiển thị *"từ X đ"* ở bước 2, **tính lại chính xác ở bước 5** | FR-004 |
| D-09 | Khách vãng lai | Cho phép guest | **Vẫn cho guest đặt**, nhưng **không tích điểm / không voucher / không feedback**. Có chiến lược khuyến khích tạo tài khoản | FR-001, FR-004, FR-006 |
| D-10 | Hủy lịch | Khách tuyệt đối không hủy được (BR-013) | Khách **không tự hủy**, nhưng có nút **"Yêu cầu đổi lịch"** → tạo ticket cho staff | BR-013 |
| D-11 | Trễ hẹn | Không có luật | **Quá 10 phút** chưa check-in → tự chuyển `NO_SHOW`, giải phóng slot, mất cọc | Mới |
| D-12 | Size xe sai | Không có luật | **Staff được sửa size tại quầy** → hệ thống tính lại số dư phải trả (không phát sinh hoàn tiền vì mới chỉ thu cọc) | Mới |
| D-13 | Thứ tự fix 17 lỗi | — | Sắp theo **luồng demo end-to-end** để buổi chấm không đứt đoạn | 05-KE-HOACH-FIX |

---

## 1b. Bảng quyết định — Vòng 2 (2026-07-20, sau khi xác nhận làm lại FE)

| # | Chủ đề | Quyết định cũ | Quyết định MỚI | Tài liệu bị ảnh hưởng |
| :-- | :-- | :-- | :-- | :-- |
| D-14 | Độ chia slot | 30 phút | **15 phút**. Tách `duration_min` (làm thật) khỏi `buffer_min` (dọn khoang) vì 20′ và 40′ không chia hết cho 15 | `02`, `04`, `06` |
| D-15 | UI chọn ngày giờ | Dải ngày ngang + grid slot | **Lưới tuần 8 cột × 44 hàng**, cuộn dọc, header dính. Mobile giữ nguyên lưới, cuộn 2 chiều | `04` |
| D-16 | Sau khi chọn dịch vụ | Đóng modal là xong | Quay về trang chọn, hiện **nhắc inline** *"Chọn thêm dịch vụ khác?"* — **không dùng dialog** | `04` |
| D-17 | Sức chứa chi nhánh | Không có khái niệm | **4 khoang**: 2 `QUICK` + 1 `DETAIL` + 1 `UNIVERSAL`. Dịch vụ khai báo `required_bay_type` | `01`, `02`, `06` |
| D-18 | Chống 2 người đặt cùng slot | Không có | **Soft-hold 15 phút + unique index `(bay_id, slot_time)`**. Không dùng Redis | `01`, `06` |
| D-19 | Auto-confirm | Không có | Tự `COMPLETED` sau **+15 phút**, nhưng **chỉ khi đã thu đủ tiền** | `01`, `03`, `06` |
| D-20 | Đăng ký | Firebase OTP | Firebase **OTP hoặc Google Sign-In**, bắt buộc 1 trong 2. Có account linking | `01`, `05`, `06` |
| D-21 | Mô hình guest | Không có bản ghi | **Bảng `guests` riêng**, gộp vào `users` khi khách đăng ký | `01`, `06`, `07` |
| D-22 | Quyền Admin | Chỉ CRUD staff | CRUD **combo · dịch vụ · staff · guest** | `07` |
| D-23 | Admin đổi lịch | Không có | Admin đổi được lịch bất kỳ. **Mọi thay đổi tự thông báo cho khách** + bắt buộc ghi lý do vào `audit_logs` | `03`, `06`, `07` |
| D-24 | Design system | Sky Blue + Tailwind | **Làm lại FE từ đầu.** Hướng *B Fresh* cho khách, *C Utility* cho admin, cài bằng `data-density` | `04` |
| D-25 | Bảng màu | Cố định trong tài liệu | **Kiến trúc token 3 lớp.** Màu lấy từ landing page, chỉ sửa `palette.css` | `04`, `PLAN-V2` |
| D-26 | Mức cọc | `[GIẢ ĐỊNH]` chờ duyệt | **Chốt cứng**: 50k / 200k / 500k theo bậc, kèm 3 luật đi kèm | `06`, `PLAN-V2 §12` |
| D-27 | Cổng thanh toán | VNPAY (D-02) | **payOS (VietQR PRO)** thay cho VNPAY. Cấu hình `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY` chỉ trong biến môi trường, không commit; credential đã lộ trong ảnh phải xoay vòng. Bảng `payments` khóa theo `orderCode` + idempotency webhook thay cho IPN VNPAY | `01`, `06`, `PLAN-V2 §4/§5`, spec 2026-07-21 |
| D-28 | FR-013 | Campaign CRUD do admin quản lý | **Giữ FR-013** — admin CRUD campaign thủ công + hệ số nhân điểm | `07`, `FR-013` |

> 📄 Kế hoạch thực thi chi tiết cho vòng 2: [PLAN-V2-LAM-LAI-FE.md](PLAN-V2-LAM-LAI-FE.md)
> 📄 Thiết kế rebuild FE khách hàng: [../superpowers/specs/2026-07-21-customer-fe-rebuild-design.md](../superpowers/specs/2026-07-21-customer-fe-rebuild-design.md)

---

## 2. Ba mâu thuẫn trong feedback chấm điểm — và cách gỡ

### 2.1. Lỗi #10 vs lỗi #12 (nghiêm trọng nhất)

* **#10**: "BỎ REJECT/APPROVE BOOKING (STAFF)"
* **#12**: "CUSTOMER PHẢI LÀ NGƯỜI CHECKIN/COMPLETE SERVICE"

Hai lỗi này **xóa sổ toàn bộ FR-009** đang có. FR-009 hiện tại được xây trên giả định staff là chủ thể của mọi chuyển trạng thái, và AC-3 còn quy định customer gọi endpoint đổi trạng thái thì trả `403 Forbidden` — tức là **đúng ngược** với yêu cầu mới.

**Cách gỡ (D-01)**: đảo chủ thể. Xem chi tiết state machine tại [01-LUONG-CHAY-MOI.md](01-LUONG-CHAY-MOI.md).

> **Lập luận bảo vệ khi thuyết trình**: chính tài liệu phân tích của nhóm (`source/Phân Tích Dự Án AutoWash.md`, mục "Thách thức Vận hành") đã chỉ ra rủi ro *"Nhân viên có thể thu tiền mặt của khách hàng nhưng không nhấn hoàn thành trên hệ thống để trục lợi cá nhân"*. Việc chuyển quyền `COMPLETED` cho customer **chính là biện pháp kiểm soát nội bộ** cho rủi ro đó. Đây không phải sửa cho có — đây là fix đúng vấn đề nhóm đã tự nhận diện.

### 2.2. Lỗi #11 vs BR-014

* **#11**: "CHƯA LÀM FLOW PAYMENT" — và ảnh feedback ghi rõ **VNPAY**
* **BR-014** hiện tại: *"100% manual bank transfer"* + FR-005 xây quanh **VietQR thủ công**

VietQR thủ công **không phải** cổng thanh toán. Nếu giữ nguyên, làm xong vẫn bị đánh là "chưa có flow payment" vì không có bước callback/IPN xác thực tự động.

**Cách gỡ (D-02)**: chuyển sang VNPAY thật, thu cọc. Booking chỉ `CONFIRMED` khi nhận được **IPN hợp lệ** từ VNPAY — đây mới là "flow payment" đúng nghĩa.

### 2.3. Lỗi #8 vs mô hình slot

* **#8**: "FIX LỖI BOOKING TRƯỚC 30PH TÍNH TỪ GIỜ HIỆN TẠI"

Hệ thống thật của VinaWash dùng `min_advance_value = 90 phút` cho dịch vụ slot và `60 phút` cho dịch vụ linh hoạt — **không phải 30 phút**. Con số 30 phút trong code hiện tại là do nhầm lẫn `slot_duration` (độ dài 1 slot) với `min_advance` (thời gian đặt trước tối thiểu). Đây là **hai khái niệm khác nhau bị gộp làm một**.

**Cách gỡ**: tách rõ 2 tham số trong bảng `branches`. Chi tiết tại [06-BUSINESS-RULES-V2.md](06-BUSINESS-RULES-V2.md#br-016).

---

## 3. Nguồn dữ liệu đã dùng (không bịa)

| Dữ liệu | Nguồn | Ghi chú |
| :-- | :-- | :-- |
| 38 dịch vụ, 5 danh mục, giá Small/Medium/Large, `booking_mode`, `duration_min` | API thật `https://vinawash.vn/wp-json/vinawash-booking/v1/config` | Trích xuất trực tiếp 2026-07-20 |
| Giờ mở cửa 07:00–18:00, `slot_duration = 30` | Cùng API trên, object `settings` | |
| `min_advance` 90 phút (slot) / 60 phút (flexible) | Cùng API trên, object `branches` | |
| Mô tả chi tiết gói VW Ultimate Wash | Cùng API trên, trường `description` | |
| Luồng 6 bước, nhóm size Small/Medium/Large | https://vinawash.vn/dat-lich-rua-xe/ và trang booking thật | |
| Nhóm dịch vụ icon, size SS→XL, luật trễ 10 phút, đổi lịch qua email, giá tạm tính | Ảnh chụp timy.jp do Đức Anh cung cấp | timy.jp render bằng JS, chỉ đọc được qua ảnh |
| Giá thay dầu ô tô VN | Search thị trường — xem [02-CATALOG-DICH-VU.md](02-CATALOG-DICH-VU.md) | Có trích dẫn nguồn |
| Giá lốp ô tô VN | Search thị trường — xem [02-CATALOG-DICH-VU.md](02-CATALOG-DICH-VU.md) | Có trích dẫn nguồn |

> ⚠️ **Các con số được đánh dấu `[GIẢ ĐỊNH]`** trong tài liệu là do nhóm tự đặt (chủ yếu là tiền công thợ, mức cọc). Chúng được tách bạch rõ để anh Đức Anh review và sửa, **không trộn lẫn với dữ liệu có nguồn**.

---

## 4. Danh sách tài liệu refactor

| File | Nội dung |
| :-- | :-- |
| `00-QUYET-DINH-REFACTOR.md` | (file này) Nhật ký quyết định |
| [`01-LUONG-CHAY-MOI.md`](01-LUONG-CHAY-MOI.md) | Luồng chạy end-to-end mới + state machine + phân quyền |
| [`02-CATALOG-DICH-VU.md`](02-CATALOG-DICH-VU.md) | Catalog 7 nhóm dịch vụ, combo, add-on, bảng giá |
| [`03-NGHIEP-VU-CONTACT.md`](03-NGHIEP-VU-CONTACT.md) | Nghiệp vụ ngoài luồng: trễ hẹn, đổi lịch, sửa size |
| [`04-UI-UX-SPEC.md`](04-UI-UX-SPEC.md) | Wireframe, trạng thái rỗng/lỗi, design system, responsive |
| [`05-KE-HOACH-FIX-17-LOI.md`](05-KE-HOACH-FIX-17-LOI.md) | 17 lỗi sắp theo luồng demo + phân công 6 người |
| [`06-BUSINESS-RULES-V2.md`](06-BUSINESS-RULES-V2.md) | Business rules cập nhật (thay thế `results/business_rules.md`) |
| [`07-ADMIN-SPEC.md`](07-ADMIN-SPEC.md) | Phân hệ quản trị: CRUD dịch vụ/combo/staff/guest, admin đổi lịch, thông báo |
| [`PLAN-V2-LAM-LAI-FE.md`](PLAN-V2-LAM-LAI-FE.md) | Kế hoạch thực thi: kiến trúc token, 4 sprint, phân công, sổ rủi ro |
