# 05 — KẾ HOẠCH FIX 17 LỖI (sắp theo luồng demo end-to-end)

> ⚠️ **Cập nhật 2026-07-20**: sau khi chốt làm lại FE từ đầu (D-24), lộ trình 9 chặng dưới đây được **gộp lại thành 4 sprint** trong [PLAN-V2-LAM-LAI-FE.md §6](PLAN-V2-LAM-LAI-FE.md). File này giữ nguyên vì phần **phân tích nguyên nhân gốc** của các lỗi #4, #8, #17 (§3, §4, §5) vẫn còn giá trị và không đổi. Đọc PLAN-V2 để biết lịch và phân công thực tế.
>
> **Ánh xạ chặng → sprint**: Chặng 0 → S4 · Chặng 1, 2 → S1 · Chặng 3, 4 → S2 · Chặng 5, 6 → S3 · Chặng 7, 8 → S4

> Quyết định nguồn: D-13. Mục tiêu: buổi chấm Tuần 10 **không đứt đoạn ở bất kỳ bước nào**.
> Nguyên tắc sắp xếp: đúng thứ tự giảng viên sẽ bấm chuột, không phải theo module hay độ khó.

---

## 1. Vì sao sắp theo luồng demo, không theo mức độ nghiêm trọng

Nếu sắp theo mức nghiêm trọng, nhóm có thể fix xong 8 lỗi P0 rải rác nhưng **demo vẫn chết ở bước 3** vì một lỗi P2 chưa làm. Người chấm không chấm theo danh sách — họ chấm theo **trải nghiệm liền mạch**.

Sắp theo luồng demo cho phép: sau mỗi chặng, nhóm **chạy thử được tới đúng chỗ đó**. Hết thời gian ở chặng nào thì phần đã làm vẫn demo trọn vẹn tới chặng đó.

---

## 2. Lộ trình 9 chặng

### 🎬 CHẶNG 0 — Ấn tượng đầu (0.5 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#1** | Fix lại font size trang landing page | Áp thang typography [04-UI-UX-SPEC §1.2](04-UI-UX-SPEC.md). Quét toàn bộ landing, thay mọi cỡ chữ tự chế bằng class chuẩn |

> Xếp đầu vì đây là **màn hình đầu tiên** giảng viên nhìn thấy. Rẻ nhất, ảnh hưởng ấn tượng lớn nhất.

**Nghiệm thu**: mở landing ở 375px và 1440px, không có chữ nào ngoài thang §1.2.

---

### 🔐 CHẶNG 1 — Đăng ký & Xác thực (2 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#2** | Tạo lại form đăng ký/đăng nhập cho customer | Theo `source/update.md`: Họ tên · password · re-password · SĐT (OTP) · Gmail (tùy chọn). Biển số + loại xe **cho phép bổ sung sau** |
| **#4** | Verify OTP fail → không đăng ký được | Xem §3 bên dưới — đây là lỗi có nguyên nhân sâu |
| **#3** | Chỉ Admin tạo account staff / chỉ 1 account admin | Bỏ role chọn được ở form đăng ký công khai. Thêm màn `Admin → Quản lý nhân sự`. Seed **đúng 1** admin trong `data.sql`, thêm ràng buộc DB |

**Ràng buộc chỉ-1-admin ở tầng DB (không chỉ ở code):**

```sql
CREATE UNIQUE INDEX UX_single_admin
    ON users(role) WHERE role = 'ADMIN';
```

**Nghiệm thu**: đăng ký số mới → nhận OTP → nhập sai 1 lần thấy thông báo rõ, form không mất dữ liệu → nhập đúng → vào được app. Thử tạo admin thứ 2 → DB chặn.

---

### 👤 CHẶNG 2 — Hồ sơ & Garage (1.5 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#5** | CRUD Profile | Màn `Tài khoản`: sửa họ tên, email, đổi mật khẩu, đổi SĐT (bắt OTP lại), ảnh đại diện |
| — | CRUD Vehicle (FR-003) | BE chưa có Service/Controller. Bắt buộc làm vì Bước 4 wizard phụ thuộc |

> Chặng này không có lỗi nào ghi trong feedback ngoài #5, nhưng **FR-003 phía BE đang là "Chưa bắt đầu"** theo `learnings/progress_tracker.md`. Không có Garage thì Bước 4 của wizard không chạy được → demo đứt.

**Nghiệm thu**: thêm 2 xe, sửa 1 xe, xóa 1 xe, đặt xe mặc định. Reload trang vẫn còn.

---

### 🧩 CHẶNG 3 — Catalog dịch vụ (2 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#6** | Bổ sung CRUD Services | Admin CRUD `services` + `service_categories` + `combo_includes`. Schema tại [02-CATALOG-DICH-VU §9](02-CATALOG-DICH-VU.md) |
| — | Nạp dữ liệu thật | Seed 36 dịch vụ VinaWash + 9 dịch vụ dầu/lốp + 4 combo |
| — | Lưới icon + modal (D-05) | UI theo [04-UI-UX-SPEC §2.1–2.2](04-UI-UX-SPEC.md) |

**Nghiệm thu**: Admin sửa giá VW Basic từ 180k → 200k, khách vào wizard thấy giá mới ngay. Chọn Ultimate rồi tick Khử mùi C-AirFog → hiện cảnh báo trùng.

---

### 📅 CHẶNG 4 — Đặt lịch (3 ngày) — **chặng nặng nhất**

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#7** | Khi booking phải chọn lịch theo calendar | Dải ngày ngang + modal lịch tháng (D-07) |
| **#8** | Fix lỗi booking trước 30 phút tính từ giờ hiện tại | **Tách 2 khái niệm bị gộp nhầm** — xem §4 |
| **#9** | New booking bị lỗi PENDING dù chưa tạo booking | **Định nghĩa lại "booking đang hoạt động"** — xem [01-LUONG-CHAY-MOI §3](01-LUONG-CHAY-MOI.md) |
| — | Đổi thứ tự wizard (D-08) | Chi nhánh → Dịch vụ → Ngày giờ → Xe → Xem lại → Xác nhận |

**Nghiệm thu**:
- Mở lịch tháng, ngày kín hiện ✕, ngày ngoài cửa sổ hạng hiện xám.
- Bây giờ 14:00, thử đặt 15:00 → bị chặn với thông báo *"Đặt trước tối thiểu 90 phút"*. Đặt 16:00 → được.
- Vào wizard tới bước 5 rồi thoát, quay lại đặt mới → **không** báo "đã có booking đang chờ".
- Chọn dịch vụ 40 phút, slot 10:30 đã kín → slot 10:00 tự disable (không đủ 2 slot liên tiếp).

---

### 💳 CHẶNG 5 — Thanh toán (2.5 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#11** | Chưa làm flow payment | Tích hợp **VNPAY sandbox** thu **cọc theo bậc** (D-02, BR-017) |

**Bắt buộc có đủ 3 mảnh mới gọi là "có flow payment":**

1. `POST /payments/vnpay/create` — sinh URL có chữ ký `vnp_SecureHash` (HMAC-SHA512)
2. `GET /payments/vnpay/return` — trang khách quay lại, **chỉ để hiển thị**, không tin để cập nhật DB
3. `POST /payments/vnpay/ipn` — **nguồn sự thật duy nhất**. Verify chữ ký → verify số tiền khớp → mới chuyển `CONFIRMED`

> ⚠️ Lỗi kinh điển: cập nhật trạng thái ở `return` URL. Người dùng sửa query string là booking thành công mà **chưa trả đồng nào**. Phải dùng IPN.

**Nghiệm thu**: đặt lịch → chuyển sang VNPAY sandbox → thanh toán thành công → booking tự `CONFIRMED` **không cần staff bấm gì**. Test thêm: đóng tab giữa chừng → sau 15 phút booking `EXPIRED`, slot mở lại.

---

### 🏁 CHẶNG 6 — Check-in & Hoàn thành (2 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#10** | Bỏ reject/approve booking (staff) | Xóa nút Approve/Reject khỏi Washing Counter. Xóa endpoint. Sửa FR-009 |
| **#12** | Customer phải là người check-in / complete service | Thêm 2 endpoint `[CUSTOMER]`, chặn STAFF gọi `/confirm` bằng `403` |

State machine đầy đủ: [01-LUONG-CHAY-MOI §1](01-LUONG-CHAY-MOI.md).

**Nghiệm thu**: đăng nhập customer bấm *"Tôi đã đến quầy"* → thẻ nhảy sang cột Đã đến ở màn staff. Staff bấm *Bắt đầu* → *Xong việc*. Customer bấm *Xác nhận đã nhận xe* → `COMPLETED`. Dùng Postman gọi `/confirm` bằng token staff → trả `403`.

---

### ⭐ CHẶNG 7 — Loyalty (3 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#14** | Chưa link được booking và point | Trigger cộng điểm khi `COMPLETED`, ghi `point_transactions` **kèm `booking_id`** |
| **#15** | Bổ sung CRUD Tiers và setup point từng tier | Đưa 4 hạng ra bảng `tiers`, Admin sửa được ngưỡng + hệ số. Bỏ hardcode |
| **#16** | Fix lại voucher phải apply theo tiers | Thêm `vouchers.min_tier_id`. Wizard lọc voucher theo hạng khách |
| **#13** | Chưa có tính năng feedback/rating | Form 5 sao + bình luận, bật ngay sau khi customer bấm xác nhận |

**Bảng `tiers` (bỏ hardcode BR-004/BR-005):**

```sql
CREATE TABLE tiers (
    id                INT PRIMARY KEY IDENTITY,
    code              VARCHAR(20) UNIQUE NOT NULL,  -- MEMBER/SILVER/GOLD/PLATINUM
    name              NVARCHAR(50) NOT NULL,
    point_multiplier  DECIMAL(3,2) NOT NULL,        -- 1.00 / 1.10 / 1.20 / 1.30
    min_washes_12m    INT NOT NULL,                 -- 0 / 5 / 15 / 30
    min_spend_12m     DECIMAL(12,0) NOT NULL,       -- 0 / 2tr / 6tr / 15tr
    booking_window_days INT NOT NULL,               -- 7 / 10 / 12 / 14
    deposit_waived    BIT NOT NULL DEFAULT 0,
    sort_order        INT NOT NULL
);
```

**Nghiệm thu (kịch bản demo Member → Silver, đúng như yêu cầu trong ảnh feedback):**

1. Tài khoản mới, hạng Member, 0 điểm.
2. Đặt và hoàn thành đơn 2.000.000đ.
3. Điểm cộng = `⌊2.000.000 / 1.000 × 1.0 × 1.0⌋` = **2.000 điểm**. Lịch sử điểm hiện đúng mã booking `AWP-XXXXXX`.
4. Hệ thống tự thăng **Silver** (đạt ngưỡng 2.000.000đ chi tiêu) → hiện thông báo chúc mừng.
5. Vào ví voucher: voucher `min_tier = GOLD` hiện xám + ghi *"Cần hạng Gold"*.
6. Đặt đơn tiếp: cửa sổ đặt trước tăng từ 7 → **10 ngày**; điểm nhân **×1.1**.

---

### 📊 CHẶNG 8 — Admin Dashboard (2 ngày)

| Lỗi | Nội dung | Cách xử lý |
| :-- | :-- | :-- |
| **#17** | Dashboard hiển thị revenue và list booking chưa chính xác | Xem §5 — có 3 nguyên nhân gốc |
| — | Infinite scroll (FR-011) | BE cần API phân trang cursor-based |
| — | Sort các danh mục | Theo `source/update.md` |

**Nghiệm thu**: tạo 3 booking `COMPLETED` hôm nay tổng 1.500.000đ → dashboard hiện đúng 1.500.000đ. Đổi giá dịch vụ trong Admin → doanh thu hôm qua **không đổi**.

---

## 3. Phân tích sâu — Lỗi #4 (OTP fail)

**Triệu chứng**: verify OTP thất bại → không đăng ký được.

**Ba nguyên nhân có thể, phải loại trừ theo thứ tự:**

1. **Chuẩn hóa số điện thoại (khả năng cao nhất).** BR-015 yêu cầu chuẩn E.164, nhưng nếu chỉ chuẩn hóa lúc **gửi** OTP mà không chuẩn hóa lúc **verify**, thì `0901234567` và `+84901234567` thành 2 khóa khác nhau trong cache → luôn sai.
   → **Fix**: gọi `PhoneUtil.normalize()` ở **cả 3 chỗ**: gửi OTP, verify OTP, lưu user. Viết unit test cho `0901…` / `84901…` / `+84 901…` / `+84-901-234-567` đều ra cùng một chuỗi.

2. **Race condition giữa OTP và tạo user.** Nếu FE gọi verify rồi mới gọi register ở request khác, mà OTP bị xóa ngay sau verify → request register không xác thực lại được.
   → **Fix**: gộp thành **1 giao dịch** `POST /auth/register` nhận cả `otpToken`. Verify và tạo user trong cùng `@Transactional`.

3. **Firebase ID Token hết hạn.** Firebase ID token sống 1 giờ; nếu khách điền form chậm thì token chết.
   → **Fix**: BE trả lỗi rõ `OTP_TOKEN_EXPIRED`, FE hiện nút `Gửi lại mã` thay vì báo lỗi chung chung.

**UX bắt buộc kèm theo** (không có thì vẫn bị đánh là lỗi): giữ nguyên dữ liệu form khi OTP sai, hiện số lần thử còn lại, nút gửi lại có đếm ngược 60s. Chi tiết tại [04-UI-UX-SPEC §3.2](04-UI-UX-SPEC.md).

---

## 4. Phân tích sâu — Lỗi #8 (booking trước 30 phút)

**Nguyên nhân gốc: hai khái niệm khác nhau bị gộp làm một biến.**

| Khái niệm | Ý nghĩa | Giá trị thật (VinaWash) |
| :-- | :-- | :-- |
| `slot_duration` | Độ dài **một** ô thời gian trên lịch | **30 phút** |
| `min_advance` | Phải đặt trước **bao lâu** so với hiện tại | **90 phút** (slot) / **60 phút** (flexible) |

Code hiện tại dùng `30` cho cả hai → khách đặt được lịch cách hiện tại 30 phút, quầy không kịp chuẩn bị.

**Fix — tách thành 4 cột trong bảng `branches`:**

```sql
ALTER TABLE branches ADD
    slot_duration_min         INT NOT NULL DEFAULT 30,
    slot_min_advance_min      INT NOT NULL DEFAULT 90,
    flexible_min_advance_min  INT NOT NULL DEFAULT 60,
    open_time  TIME NOT NULL DEFAULT '07:00',
    close_time TIME NOT NULL DEFAULT '18:00';
```

Logic kiểm tra:

```java
int minAdvance = booking.hasSlotService()
        ? branch.getSlotMinAdvanceMin()
        : branch.getFlexibleMinAdvanceMin();

LocalDateTime earliest = LocalDateTime.now().plusMinutes(minAdvance);
if (requestedDateTime.isBefore(earliest)) {
    throw new BadRequestException(
        "Vui lòng đặt trước ít nhất " + minAdvance + " phút.");
}
```

> ✅ Đây là điểm cộng khi thuyết trình: nhóm không đoán con số mà **lấy từ hệ thống thật đang vận hành**, và giải thích được vì sao 90 phút chứ không phải 30.

---

## 5. Phân tích sâu — Lỗi #17 (dashboard revenue sai)

**Ba nguyên nhân gốc, phải sửa cả ba:**

### 5.1. Đếm nhầm trạng thái

Doanh thu đang cộng cả booking `PENDING`/`CONFIRMED` — tức là tiền **chưa thu**.

```sql
-- ĐÚNG: chỉ đếm tiền đã thực thu
SELECT SUM(actual_paid) FROM bookings
WHERE status = 'COMPLETED'
  AND CAST(completed_at AS DATE) = @date;
```

Bổ sung 2 chỉ số riêng để Admin nhìn được bức tranh đầy đủ:
* **Doanh thu thực thu** — `COMPLETED`
* **Doanh thu dự kiến** — `CONFIRMED` + `CHECKED_IN` + `IN_PROGRESS`
* **Tiền cọc đang giữ** — tổng cọc của booking chưa hoàn thành

### 5.2. Không snapshot giá

Nếu báo cáo `JOIN services` để lấy giá, Admin sửa giá hôm nay sẽ làm **sai toàn bộ lịch sử**. Bắt buộc đọc từ `booking_items.unit_price` đã chốt lúc đặt ([02-CATALOG-DICH-VU §9](02-CATALOG-DICH-VU.md)).

### 5.3. Lệch múi giờ

`AGENTS.md §4.4` quy định truyền ISO 8601 **UTC**. Nếu group by `DATE(created_at)` trên cột UTC, mọi booking từ 00:00–07:00 giờ VN bị tính sang **ngày hôm trước**.

```sql
-- ĐÚNG: đổi sang GMT+7 trước khi group
GROUP BY CAST(DATEADD(HOUR, 7, completed_at) AS DATE)
```

> Đây cũng là lý do "list booking chưa chính xác": bộ lọc mặc định *"hôm nay"* đang lọc theo ngày UTC.

---

## 6. Tổng hợp & phân công

| Chặng | Ngày | FE | BE |
| :-- | :-- | :-- | :-- |
| 0 · Landing | 0.5 | Phong | — |
| 1 · Auth & OTP | 2 | Nguyên | Bình |
| 2 · Profile & Garage | 1.5 | An | Phát |
| 3 · Catalog + lưới icon | 2 | Phong, Nguyên | Bình |
| 4 · Booking + calendar | 3 | Nguyên, Phong | Bình, Phát |
| 5 · VNPAY | 2.5 | An | **Phát** (chủ trì) |
| 6 · Check-in / Complete | 2 | Nguyên | Phát |
| 7 · Loyalty + Feedback | 3 | An, Phong | Bình |
| 8 · Admin Dashboard | 2 | Phong | Phát |
| **Tổng** | **18.5 ngày công** | | |

**Anh**: reviewer, duyệt mọi PR, không nhận task code để tránh thành nút cổ chai.
**Danh**: QA — chạy kịch bản nghiệm thu cuối mỗi chặng, ghi journal, quản lý dữ liệu seed.

### Quy tắc để không đứt demo

1. **Cuối mỗi chặng phải demo được tới đúng chặng đó.** Không sang chặng mới khi chặng cũ chưa chạy.
2. Nhánh `feat/chang-N-<ten>`, PR vào `develop`, Anh review.
3. Chặng 4 và 5 là đường găng (critical path) — nếu trễ, **cắt Chặng 7 phần feedback (#13)** trước, giữ nguyên phần điểm/hạng.
4. Danh giữ một file `data.sql` seed sạch để mọi người reset DB về cùng trạng thái trước khi test.

---

## 7. Kịch bản demo cuối cùng (12 phút)

```
 1. Landing page                                    30s   → #1
 2. Đăng ký: SĐT → OTP sai 1 lần → OTP đúng         90s   → #2 #4
 3. Thêm xe vào Garage                              45s   → #5
 4. Đặt lịch:
    Chi nhánh → lưới icon → modal chọn combo        90s   → #6 #10(UI)
    Cảnh báo trùng dịch vụ                          20s   → D-06
    Lịch tháng → chọn ngày → grid slot              60s   → #7
    Thử đặt sát giờ → bị chặn 90 phút               30s   → #8
    Chọn xe → Xem lại → giá tính lại theo size      45s   → D-03 D-08
 5. Thanh toán VNPAY sandbox → tự CONFIRMED         90s   → #11
 6. Đặt tiếp lịch 2 → chặn 409                      20s   → #9
 7. Customer bấm "Tôi đã đến quầy"                  20s   → #12
 8. Màn staff: Bắt đầu → Xong việc                  40s   → #10
 9. Customer xác nhận → cộng 2.000 điểm             30s   → #14
10. Tự thăng hạng Member → Silver                   20s   → #15
11. Ví voucher: voucher Gold bị khóa                20s   → #16
12. Đánh giá 5 sao                                  20s   → #13
13. Admin: doanh thu hôm nay khớp số                45s   → #17
14. Admin: infinite scroll + sort                   30s   → FR-011
                                                  ─────
                                                   ~12 phút
```

Kịch bản này chạm **đủ 17/17 lỗi** theo đúng thứ tự tự nhiên, không phải nhảy qua lại giữa các màn hình.
