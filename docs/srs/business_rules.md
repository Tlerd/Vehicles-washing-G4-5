# 06 — BUSINESS RULES v2

> Thay thế `results/business_rules.md`. Các luật **giữ nguyên** ghi rõ "giữ nguyên"; các luật **sửa** có gạch ngang bản cũ.

---

## 1. Giá & Size xe

### BR-001 — Hệ số nhân theo size xe *(giữ nguyên, bổ sung)*

| Size | Hệ số `K_size` |
| :-- | --: |
| Hatchback | 0.90 |
| **Sedan (chuẩn)** | **1.00** |
| SUV / CUV | 1.20 |
| Pickup / Luxury | 1.40 |

**Bổ sung**: chỉ áp dụng khi `services.is_size_dependent = true`.

```
line_total = ROUND( base_price × (is_size_dependent ? K_size : 1.0) × quantity , 1000 )
```

### BR-001b — Dịch vụ không phụ thuộc size *(MỚI)*

`is_size_dependent = false` cho: vệ sinh dàn lạnh, khử mùi (C-Air Fog, Ozone), xử lý vị trí ngồi, toàn bộ nhóm **Thay lốp**. Danh sách đầy đủ: [02-CATALOG-DICH-VU](../refactor/02-CATALOG-DICH-VU.md).

### BR-001c — Đơn vị tính giá *(MỚI)*

| `pricing_unit` | Nhân theo |
| :-- | :-- |
| `per_car` | 1 (mặc định) |
| `per_seat` | Số ghế khách chọn |
| `per_panel` | Số tấm kính / cặp đèn |
| `per_tire` | Số lốp (1–4) |

### BR-020 — Staff sửa size tại quầy *(MỚI — D-12)*

Staff được sửa `vehicle_size` khi booking ở `CHECKED_IN` hoặc `IN_PROGRESS`. Hệ thống tính lại toàn bộ `booking_items`, hiển thị số dư mới. **Bắt buộc nhập lý do** → ghi `audit_logs`. Chỉ được sửa **tăng** size; giảm size cần Admin duyệt. Đồng thời cập nhật `vehicles.size` cho lần sau. Chi tiết: [03-NGHIEP-VU-CONTACT §4](../refactor/03-NGHIEP-VU-CONTACT.md).

---

## 2. Điểm thưởng & Hạng thành viên

### BR-002 / BR-003 — Công thức tính điểm *(giữ nguyên)*

```
P = ⌊ V / 1.000 × K_h × K_km ⌋
```

* `V` — số tiền **thực thu** (đã trừ voucher), gồm cả cọc và phần trả tại quầy
* `K_h` — hệ số hạng, đọc từ bảng `tiers` (**không hardcode nữa** — lỗi #15)
* `K_km` — hệ số chiến dịch khuyến mãi đang chạy, mặc định `1.0`

**Bổ sung**: điểm chỉ cộng khi booking chuyển `COMPLETED`, và `point_transactions` **bắt buộc** có `booking_id` (sửa lỗi #14).

### BR-004 — Hệ số hạng *(giữ nguyên, chuyển sang cấu hình DB)*

| Hạng | `K_h` | Cửa sổ đặt trước | Đặc quyền |
| :-- | --: | --: | :-- |
| Member | 1.0 | 7 ngày | Cơ bản |
| Silver | 1.1 | 10 ngày | Ưu tiên hàng chờ |
| Gold | 1.2 | 12 ngày | Nâng cấp gói miễn phí hằng tháng · **miễn cọc** |
| Platinum | 1.3 | 14 ngày | 1 lượt rửa tiêu chuẩn miễn phí/tháng · **miễn cọc** |

> Toàn bộ giá trị trên nằm trong bảng `tiers`, Admin CRUD được (lỗi #15).

### BR-005 / BR-006 / BR-007 / BR-008 — Ngưỡng hạng, thăng/hạ hạng, hết hạn điểm *(giữ nguyên)*

* Ngưỡng rolling 12 tháng: Silver ≥ 5 lượt **hoặc** ≥ 2.000.000đ · Gold ≥ 15 lượt **hoặc** ≥ 6.000.000đ · Platinum ≥ 30 lượt **hoặc** ≥ 15.000.000đ
* Thăng hạng **tức thời** ngay khi checkout vượt ngưỡng
* Rà hạ hạng chạy **02:00–04:00 ngày 1 hằng tháng**
* Điểm hết hạn sau **12 tháng**, khấu trừ theo nguyên tắc **FIFO** (điểm sắp hết hạn dùng trước)

---

## 3. Voucher

### BR-009 — Tỉ giá đổi thưởng *(giữ nguyên)*

Voucher giảm 50.000đ = `500` điểm · Rửa Basic miễn phí = `1.800` điểm · Rửa Detail miễn phí = `2.800` điểm

### BR-010 — Chính sách khách mới *(giữ nguyên)*

Đơn đầu tiên > 300.000đ → tặng voucher 50.000đ. > 500.000đ → tặng voucher 100.000đ.
**Bổ sung**: chỉ áp dụng cho tài khoản đã đăng ký. Guest xem [01-LUONG-CHAY-MOI §4](../refactor/01-LUONG-CHAY-MOI.md) — điểm và voucher treo 7 ngày ở `pending_points`.

### BR-011 — Vòng đời voucher *(giữ nguyên, cập nhật trạng thái)*

`ACTIVE` → `LOCKED` (khi áp vào booking) → `USED` (khi `COMPLETED`).
Trả về `ACTIVE` khi booking chuyển `CANCELLED`, `EXPIRED`, hoặc `NO_SHOW`.

### BR-016 — Voucher theo hạng *(MỚI — sửa lỗi #16)*

```sql
ALTER TABLE vouchers ADD min_tier_id INT NULL FOREIGN KEY REFERENCES tiers(id);
```

* `min_tier_id = NULL` → mọi hạng dùng được
* Khách hạng thấp hơn → voucher hiện **xám** kèm chú thích *"Cần hạng Gold trở lên"* (không ẩn đi — cho khách thấy mục tiêu để phấn đấu)
* Backend **bắt buộc** kiểm tra lại khi tạo booking; sai hạng → `400 Bad Request`

---

## 4. Đặt lịch

### BR-012 — Một booking đang hoạt động *(SỬA — lỗi #9)*

~~Trạng thái `PENDING` hoặc `CONFIRMED` tính là đang hoạt động.~~

**Định nghĩa mới**: "đang hoạt động" = trạng thái ∈ `{CONFIRMED, CHECKED_IN, IN_PROGRESS, AWAITING_CONFIRM}`.
`PENDING_DEPOSIT` **KHÔNG** tính. Bản ghi DB chỉ được tạo ở **Bước 6**, không tạo khi khách mới mở wizard.

### BR-013 — Chính sách hủy *(SỬA — D-10)*

~~Khách hàng không thể hủy booking sau khi đã gửi.~~

Khách **không có nút Hủy**, nhưng có nút **"Yêu cầu đổi lịch"** tạo bản ghi `change_requests` cho staff xử lý. Chi tiết + luật xử lý cọc: [03-NGHIEP-VU-CONTACT §3](../refactor/03-NGHIEP-VU-CONTACT.md).

### BR-014 — Chính sách thanh toán *(SỬA — D-02)*

~~Thanh toán 100% chuyển khoản thủ công qua VietQR trước khi xác nhận.~~

**Đặt cọc giữ chỗ qua VNPAY**, phần còn lại thanh toán tại quầy khi nhận xe.
Booking chỉ chuyển `CONFIRMED` khi backend nhận **IPN hợp lệ** từ VNPAY (verify `vnp_SecureHash` + verify số tiền). **Tuyệt đối không** cập nhật trạng thái từ `return` URL.

### BR-017 — Mức cọc theo bậc giá trị đơn *(CHỐT CỨNG — D-02, D-26)*

| Tổng đơn | Cọc phải trả |
| :-- | --: |
| < 500.000đ | **50.000đ** |
| 500.000đ – 2.000.000đ | **200.000đ** |
| > 2.000.000đ | **500.000đ** |

**Ba luật đi kèm — thiếu là sinh lỗi thật:**

1. `deposit = MIN(bậc, tổng_đơn)`. Không có luật này, đơn "Rửa gầm 50.000đ" bị đòi cọc đúng 50.000đ → số dư tại quầy bằng 0, trông như bug.
2. Hạng **Gold** và **Platinum**: **miễn cọc** hoàn toàn (`tiers.deposit_waived = 1`) — đặc quyền hạng, gắn thẳng vào loyalty engine.
3. Khách có cờ `requires_full_prepay` (no-show ≥ 3 lần): **bắt trả 100%** trước, không áp bậc.

Cọc được **trừ vào tổng đơn**, không phải phụ phí.

**Vì sao dừng ở 500.000đ**: đơn PPF/Ceramic 8,5tr–42tr đều là `booking_mode = flexible`, nhân viên gọi điện xác nhận trước khi xếp lịch. Rủi ro no-show nhóm này đã chặn bằng cuộc gọi, không cần chặn bằng tiền. Căn cứ đầy đủ: [PLAN-V2 §12](../refactor/PLAN-V2-LAM-LAI-FE.md).

### BR-016b — Thời gian đặt trước tối thiểu *(MỚI — sửa lỗi #8)*

| Loại dịch vụ | `min_advance` |
| :-- | --: |
| `booking_mode = slot` | **90 phút** |
| `booking_mode = flexible` | **60 phút** |

Cấu hình theo từng chi nhánh trong bảng `branches`. **Không được nhầm với `slot_duration = 30 phút`** — hai khái niệm khác nhau. Phân tích: [05-KE-HOACH-FIX §4](../refactor/05-KE-HOACH-FIX-17-LOI.md).

### BR-021 — Hết hạn giữ chỗ *(MỚI)*

`PENDING_DEPOSIT` quá **15 phút** chưa có IPN thành công → `EXPIRED`, slot được nhả. UI hiện đồng hồ đếm ngược.

### BR-022 — Độ chia slot 15 phút và thời gian đệm *(SỬA — D-14)*

~~Slot 30 phút. Số slot = CEIL(Σ duration_min / slot_duration).~~

**Slot = 15 phút.** Thời gian chiếm dụng gồm cả thời gian dọn khoang:

```
số_slot_cần = CEIL( Σ (duration_min + buffer_min) / 15 )
```

| Dịch vụ | `duration` | `buffer` | Chiếm | Slot |
| :-- | --: | --: | --: | --: |
| Rửa xe ngoài / VW Basic / VW Detail | 20′ | 10′ | 30′ | 2 |
| VW Ultimate Wash | 40′ | 5′ | 45′ | 3 |
| Combo Bảo dưỡng nhanh | 65′ | 10′ | 75′ | 5 |
| Vệ sinh khoang máy | 60′ | 15′ | 75′ | 5 |

**Vì sao cần `buffer_min`**: thời lượng thật là 20′, 40′, 45′ — 20 và 40 không chia hết cho 15. Buffer là thời gian **có thật ngoài đời** (đưa xe ra, dọn khoang, đưa xe vào), nên vừa giải bài toán chia hết vừa đúng nghiệp vụ. Không phải con số bịa để lấp chỗ.

Giờ mở cửa 07:00–18:00 → **44 slot/ngày/khoang**.

Booking chỉ chọn được giờ bắt đầu nếu **tất cả** slot cần thiết đều trống **trong cùng một khoang** (BR-029).

Dịch vụ `flexible` **không** chiếm slot cứng, chỉ ghi nhận giờ mong muốn để nhân viên gọi xác nhận.

---

### BR-029 — Khoang rửa và sức chứa *(MỚI — D-17)*

Slot không phải "có/không" mà là **sức chứa**. Mỗi chi nhánh có 4 khoang:

| Khoang | Loại | Nhận dịch vụ |
| :-- | :-- | :-- |
| Bay 1, Bay 2 | `QUICK` | `booking_mode = slot` — rửa xe, combo |
| Bay 3 | `DETAIL` | `booking_mode = flexible` — ceramic, PPF, nội thất, dầu, lốp |
| Bay 4 | `UNIVERSAL` | Mọi loại — van xả khi một nhóm quá tải |

```
Slot t còn nhận được  ⟺  tồn tại 1 khoang hợp loại trống suốt [t, t + tổng_chiếm_dụng)
```

**Thuật toán xếp khoang**: thử khoang chuyên dụng trước, hết mới dùng `UNIVERSAL` — giữ nó làm dự phòng. Chi tiết + ví dụ combo-đè-gói-lẻ: [PLAN-V2 §5.2](../refactor/PLAN-V2-LAM-LAI-FE.md).

Khi hết khoang, hệ thống **không** chỉ báo lỗi mà phải trả về **3 khung giờ trống gần nhất**, bấm là chọn được luôn.

### BR-030 — Giữ chỗ tạm và chống đặt trùng *(MỚI — D-18)*

Khách bấm "Thanh toán cọc" → ghi `slot_reservations` với `status = HOLD`, `expires_at = now + 15 phút`.

**Tính đúng đắn do tầng dữ liệu bảo đảm, không do code:**

```sql
CONSTRAINT UX_bay_slot UNIQUE (bay_id, slot_time)
```

* Người thứ hai chèn cùng `(bay_id, slot_time)` → `DuplicateKeyException` → rollback → `409` kèm 3 slot thay thế
* VNPAY IPN thành công → `status = BOOKED`, `expires_at = NULL`
* Job mỗi phút xóa `HOLD` quá hạn → nhả slot
* FE polling 10 giây khi khách đang ở bước chọn giờ → ô slot tự khóa, hiện *"Còn 1 chỗ"*

**Không dùng Redis** — unique index của SQL Server đã cho tính đúng đắn tuyệt đối ở mức đồng thời của đồ án. Thêm Redis là thêm hạ tầng phải vận hành và đồng bộ, rủi ro lớn hơn lợi ích.

**Test bắt buộc**: 2 trình duyệt cùng chọn slot 10:00, bấm cách nhau < 1 giây → đúng 1 người vào VNPAY, người kia nhận 409. Không được có trường hợp cả hai thành công.

### BR-023 — Khách vãng lai (Guest) *(MỚI — D-09)*

Guest đặt lịch và thanh toán cọc được, nhưng **không** tích điểm, **không** dùng/nhận voucher, **không** đánh giá, **không** lưu xe. Cửa sổ đặt trước cố định **7 ngày**. Guest tự check-in bằng `bookingRef` + số điện thoại. Chiến lược khuyến khích tạo tài khoản: [01-LUONG-CHAY-MOI §4](../refactor/01-LUONG-CHAY-MOI.md).

### BR-032 — Bảng guest riêng và quy trình gộp *(MỚI — D-21)*

Guest lưu ở bảng `guests`, **không** trộn vào `users`.

```sql
CREATE TABLE guests (
    id           VARCHAR(36) PRIMARY KEY,
    full_name    NVARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        NVARCHAR(150) NULL,
    license_plate VARCHAR(20) NULL,
    vehicle_size VARCHAR(20)  NULL,
    merged_user_id VARCHAR(36) NULL,       -- ⬅ trỏ sang users sau khi gộp
    merged_at    DATETIME2 NULL,
    created_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UX_guest_phone UNIQUE (phone)
);
```

**`UX_guest_phone` là bắt buộc** — nếu không, cùng một số điện thoại đặt 3 lần sẽ tạo 3 bản ghi guest, lúc gộp không biết chọn cái nào.

**Quy trình gộp** khi guest đăng ký tài khoản bằng đúng số điện thoại đó, chạy trong **một transaction**:

```
1. Tìm guests WHERE phone = <sdt đã xác thực OTP> AND merged_user_id IS NULL
2. Nếu có:
   a. UPDATE bookings SET customer_id = <user mới>, guest_id = NULL
   b. Cộng điểm treo (pending_points) nếu còn trong hạn 7 ngày
   c. Chép license_plate / vehicle_size sang bảng vehicles
   d. UPDATE guests SET merged_user_id = <user mới>, merged_at = NOW()
3. Ghi audit_logs: action = 'GUEST_MERGED'
```

Guest đã gộp **không xóa** — giữ lại để đối chiếu lịch sử. Cờ `merged_user_id` khiến bản ghi đó không bao giờ được gộp lần hai.

### BR-033 — Admin đổi lịch và thông báo bắt buộc *(MỚI — D-23)*

Admin đổi được **mọi thông tin** của booking đang hoạt động: ngày, giờ, chi nhánh, dịch vụ, khoang.

**Bốn điều kiện, không được bỏ điều nào:**

1. **Bắt buộc nhập lý do** — không có lý do thì nút Lưu bị khóa.
2. **Ghi `audit_logs`** đầy đủ giá trị cũ và mới.
3. **Tự động thông báo cho khách** qua mọi kênh khách có (push · SMS · email), nội dung nêu rõ *cái gì đổi từ đâu sang đâu*, không được chỉ nói "lịch của bạn đã thay đổi".
4. **Chuyển giữ chỗ nguyên tử** — nhả `slot_reservations` cũ và chiếm slot mới trong cùng một transaction. Nếu slot mới đã có người, toàn bộ rollback, giữ nguyên lịch cũ.

**Chênh lệch giá khi admin đổi dịch vụ**: tính lại tổng đơn, phần chênh thu/trả tại quầy. Không hoàn tiền cọc tự động.

Dashboard Admin có báo cáo **số lần đổi lịch theo người thực hiện** — đây là quyền dễ bị lạm dụng nhất trong hệ thống.

### BR-034 — Đăng ký bằng OTP hoặc Google *(MỚI — D-20)*

Khách chọn **một trong hai**, bắt buộc phải có một:

| Cách | Firebase provider | Xác thực được | Thiếu gì |
| :-- | :-- | :-- | :-- |
| SMS OTP | Phone Auth | Số điện thoại | Email (tùy chọn nhập sau) |
| Google | Google Sign-In | Email | Số điện thoại — **bắt buộc bổ sung trước khi đặt lịch đầu tiên** |

**Vì sao Google vẫn phải bổ sung số điện thoại**: nhân viên quầy cần gọi khi khách trễ hoặc dịch vụ `flexible` cần xác nhận. Không có số điện thoại thì luồng vận hành đứt.

**Account linking** — cùng một người dùng cả hai cách phải ra **một tài khoản**:

```
Đăng nhập Google, email trùng users.email đã có
   → gọi linkWithCredential, KHÔNG tạo user mới
Đăng ký OTP, số điện thoại trùng users.phone đã có
   → báo "Số này đã có tài khoản, đăng nhập?" thay vì tạo trùng
```

Ràng buộc DB: `UNIQUE(phone) WHERE phone IS NOT NULL` và `UNIQUE(email) WHERE email IS NOT NULL`.

---

## 5. Vận hành

### BR-018 — Luật trễ hẹn 10 phút *(MỚI — D-11)*

Quá giờ hẹn **10 phút** chưa `CHECKED_IN` → `NO_SHOW`, nhả slot, mất cọc, `no_show_count += 1`.

**Ba lớp bảo vệ khách:**

1. Nhắc lịch `T−1 ngày` và `T−60 phút`
2. Nút *"Tôi đang trên đường"* → gia hạn thêm **15 phút** (1 lần/booking)
3. `no_show_count = 0` → lần đầu **hoàn cọc bằng voucher** hạn 30 ngày

`no_show_count ≥ 3` → gắn cờ `requires_full_prepay`.

### BR-024 — Ai được chuyển trạng thái *(MỚI — D-01, sửa lỗi #10 & #12)*

| Chuyển | Chủ thể |
| :-- | :-- |
| `PENDING_DEPOSIT → CONFIRMED` | 🤖 Hệ thống (VNPAY IPN) |
| `CONFIRMED → CHECKED_IN` | 👤 **CUSTOMER** |
| `CHECKED_IN → IN_PROGRESS` | 🔧 STAFF |
| `IN_PROGRESS → AWAITING_CONFIRM` | 🔧 STAFF |
| `AWAITING_CONFIRM → COMPLETED` | 👤 **CUSTOMER** (staff bị chặn `403`) |

**STAFF không bao giờ được tự chuyển sang `COMPLETED`.** Đây là chốt kiểm soát chống gian lận nội bộ mà chính `source/Phân Tích Dự Án AutoWash.md` đã cảnh báo. Admin ghi đè được nhưng **bắt buộc** ghi `override_reason` + `override_by` vào `audit_logs`.

### BR-031 — Tự động xác nhận hoàn thành *(MỚI — D-19)*

Khách hay quên bấm xác nhận rồi lái xe đi. Nếu để treo mãi thì không cộng điểm được, doanh thu không ghi nhận.

```
AWAITING_CONFIRM  +15 phút  →  COMPLETED  (auto_confirmed = 1)
```

**Nhưng chỉ khi `paid_amount >= total_amount`.**

| Tình huống | Kết quả sau 15 phút |
| :-- | :-- |
| Đã thu đủ tiền | ✅ Tự `COMPLETED`, cộng điểm, `auto_confirmed = 1` |
| Chưa thu đủ | ❌ Treo ở `AWAITING_CONFIRM`, gắn cờ cảnh báo trên màn quầy |

**Vì sao ràng buộc này quan trọng**: không có nó, staff chỉ cần bấm "Xong việc" rồi đợi 15 phút là đơn tự hoàn thành — bỏ túi tiền mặt mà hệ thống vẫn ghi nhận xong. Điều kiện "đã thu đủ" chặn đúng động cơ gian lận, giữ nguyên tinh thần BR-024.

**Ba lớp bù thêm:**

1. Khách vẫn có **24 giờ** để bấm *"Có vấn đề"* → mở khiếu nại dù đơn đã auto-confirm.
2. Dashboard Admin có báo cáo **tỉ lệ auto-confirm theo nhân viên** — cao bất thường là dấu hiệu cần kiểm tra.
3. Mọi lần auto-confirm ghi `audit_logs` với `actor_role = 'SYSTEM'`.

### BR-025 — Nhật ký kiểm toán *(MỚI)*

Ghi `audit_logs` bắt buộc cho: mọi chuyển trạng thái booking · sửa size xe · sửa giá dịch vụ · điều chỉnh điểm thủ công · tạo/xóa tài khoản staff · Admin ghi đè trạng thái.

```sql
CREATE TABLE audit_logs (
    id          BIGINT PRIMARY KEY IDENTITY,
    entity_type VARCHAR(40) NOT NULL,      -- 'BOOKING' | 'SERVICE' | 'USER' | 'POINT'
    entity_id   VARCHAR(36) NOT NULL,
    action      VARCHAR(40) NOT NULL,
    old_value   NVARCHAR(MAX) NULL,
    new_value   NVARCHAR(MAX) NULL,
    reason      NVARCHAR(500) NULL,
    actor_id    VARCHAR(36) NOT NULL,
    actor_role  VARCHAR(20) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE INDEX IX_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
```

---

## 6. Kỹ thuật

### BR-015 — Chuẩn hóa số điện thoại E.164 *(giữ nguyên, nhấn mạnh)*

Chuẩn hóa về `+84…`: bỏ ký tự không phải số, `0` đầu → `+84`.

> ⚠️ Phải gọi ở **cả 3 chỗ**: gửi OTP · verify OTP · lưu user. Chỉ chuẩn hóa một chỗ là nguyên nhân nhiều khả năng nhất của **lỗi #4**. Bắt buộc có unit test.

### BR-026 — Chốt giá tại thời điểm đặt *(MỚI — sửa lỗi #17)*

`booking_items` **phải** lưu snapshot `unit_price` và `size_multiplier`. Mọi báo cáo doanh thu đọc từ đây, **không** join sang `services`. Nếu không, Admin sửa giá hôm nay sẽ làm sai toàn bộ báo cáo quá khứ.

### BR-027 — Múi giờ *(MỚI — sửa lỗi #17)*

API truyền nhận **ISO 8601 UTC**. Mọi truy vấn báo cáo và bộ lọc "hôm nay" phải đổi sang **GMT+7 trước khi `GROUP BY`**:

```sql
GROUP BY CAST(DATEADD(HOUR, 7, completed_at) AS DATE)
```

Không làm bước này thì booking từ 00:00–07:00 giờ VN bị tính sang ngày hôm trước.

### BR-028 — Idempotency *(MỚI)*

Mọi endpoint `POST` gây tác dụng phụ (tạo booking, thanh toán, check-in, xác nhận hoàn thành) nhận header `Idempotency-Key`. Backend lưu key **24 giờ**; request trùng key trả về **đúng kết quả cũ**, không tạo bản ghi mới. Đây là chốt chặn kỹ thuật cho **lỗi #9**.

---

## 7. Bảng tra cứu nhanh: luật nào sửa lỗi nào

| Lỗi | Luật liên quan |
| :-- | :-- |
| #4 OTP fail | BR-015 |
| #8 Đặt trước 30 phút | BR-016b |
| #9 Booking pending sai | BR-012, BR-021, BR-028 |
| #10 Bỏ approve/reject | BR-024 |
| #11 Chưa có payment | BR-014, BR-017 |
| #12 Customer check-in/complete | BR-024 |
| #14 Link booking–point | BR-003 |
| #15 CRUD tiers | BR-004 (chuyển sang bảng `tiers`) |
| #16 Voucher theo hạng | BR-016 |
| #17 Dashboard sai | BR-026, BR-027 |

## 8. Luật mới vòng 2 — tra cứu nhanh

| Luật | Nội dung | Quyết định |
| :-- | :-- | :-- |
| BR-022 | Slot 15 phút + `buffer_min` | D-14 |
| BR-029 | Khoang rửa và sức chứa (4 khoang/chi nhánh) | D-17 |
| BR-030 | Giữ chỗ tạm + unique index chống đặt trùng | D-18 |
| BR-031 | Auto-confirm +15′ **chỉ khi đã thu đủ** | D-19 |
| BR-032 | Bảng `guests` riêng + quy trình gộp | D-21 |
| BR-033 | Admin đổi lịch + thông báo bắt buộc | D-23 |
| BR-034 | Đăng ký bằng OTP **hoặc** Google + account linking | D-20 |
