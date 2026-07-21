# 07 — ĐẶC TẢ PHÂN HỆ QUẢN TRỊ

> Quyết định nguồn: D-21, D-22, D-23. Luật liên quan: BR-032, BR-033, BR-034, BR-025.
> Mật độ giao diện: `data-density="compact"` (xem [04 §2](04-UI-UX-SPEC.md)).

---

## 1. Bản đồ quyền

| Chức năng | ADMIN | STAFF | Ghi chú |
| :-- | :-: | :-: | :-- |
| CRUD dịch vụ & combo | ✅ | ❌ | |
| CRUD hạng thành viên (`tiers`) | ✅ | ❌ | Lỗi #15 |
| CRUD voucher | ✅ | ❌ | |
| CRUD chi nhánh & khoang | ✅ | ❌ | D-17 |
| CRUD tài khoản STAFF | ✅ | ❌ | Lỗi #3 |
| Xem / sửa tài khoản GUEST | ✅ | 👁 chỉ xem | D-21 |
| Xem / sửa tài khoản CUSTOMER | ✅ | 👁 chỉ xem | FR-010 |
| **Đổi lịch booking bất kỳ** | ✅ | ❌ | D-23 |
| Đổi trạng thái booking | ✅ | ⚠️ giới hạn | BR-024 |
| Ghi đè `COMPLETED` | ⚠️ bắt buộc lý do | ❌ **cấm** | BR-024 |
| Sửa size xe tại quầy | ✅ | ✅ chỉ tăng | BR-020 |
| Xem báo cáo doanh thu | ✅ | 👁 ca của mình | |
| Xem `audit_logs` | ✅ | ❌ | |

> **Chỉ tồn tại đúng 1 tài khoản ADMIN** trong hệ thống, ràng buộc ở tầng DB:
> `CREATE UNIQUE INDEX UX_single_admin ON users(role) WHERE role = 'ADMIN';`

---

## 2. Quản lý dịch vụ & combo (D-22, lỗi #6)

### 2.1. Màn danh sách

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dịch vụ & Combo                                    [ + Thêm dịch vụ ]    │
│  [ Tìm tên dịch vụ...        ]  Nhóm: [Tất cả ▾]  Loại: [Tất cả ▾]       │
├────┬──────────────────────────┬──────────┬─────────┬────────┬──────┬──────┤
│    │ Tên                      │ Nhóm     │ Giá gốc │ Thời   │ Khoang│      │
├────┼──────────────────────────┼──────────┼─────────┼────────┼──────┼──────┤
│ ⠿  │ VW Ultimate Wash  COMBO  │ Rửa xe   │ 640.000 │40′+5′  │QUICK │ ⋯   │
│ ⠿  │ VW Detail Wash    COMBO  │ Rửa xe   │ 280.000 │20′+10′ │QUICK │ ⋯   │
│ ⠿  │ Rửa gầm                  │ Rửa xe   │  50.000 │20′+10′ │QUICK │ ⋯   │
│ ⠿  │ Vệ sinh dàn lạnh    ⊘size│ Vệ sinh  │1.200.000│90′+15′ │DETAIL│ ⋯   │
│ ⠿  │ Lốp 205/60R16      /lốp  │ Thay lốp │1.800.000│20′+5′  │DETAIL│ ⋯   │
└────┴──────────────────────────┴──────────┴─────────┴────────┴──────┴──────┘
   ↑ kéo thả đổi thứ tự hiển thị     ⊘size = không nhân hệ số size
```

### 2.2. Form thêm/sửa dịch vụ

```
┌──────────────────────────────────────────────────────────┐
│  Sửa dịch vụ                                      [✕]   │
├──────────────────────────────────────────────────────────┤
│  Tên *          [ VW Ultimate Wash                     ] │
│  Mã (key) *     [ vw-ultimate-wash        ] khóa sau khi│
│                                             có booking   │
│  Nhóm *         [ Rửa xe & Combo                     ▾ ] │
│  Mô tả          [ Ultimate Wash là gói rửa và chăm... ]  │
│                                               412/2000   │
│  ──────────────────────────────────────────────────────  │
│  Giá gốc (Sedan) *        [    640.000 ] đ              │
│  ☑ Nhân hệ số theo size xe                              │
│     → Hatchback 576.000 · SUV 768.000 · Pickup 896.000  │  ← xem trước
│  Đơn vị tính *            [ Mỗi xe                   ▾ ] │
│  ──────────────────────────────────────────────────────  │
│  Kiểu đặt lịch *          ( ) Slot cứng  (•) Linh hoạt  │
│  Thời gian làm *          [ 40 ] phút                   │
│  Thời gian dọn khoang *   [  5 ] phút                   │
│     → Chiếm 45 phút = 3 slot                            │  ← tự tính
│  Loại khoang *            [ QUICK — rửa nhanh        ▾ ] │
│  ──────────────────────────────────────────────────────  │
│  ☑ Đây là gói combo                                     │
│  Bao gồm các dịch vụ đơn:                               │
│     ☑ Rửa xe ngoài   ☑ Rửa gầm                          │
│     ☑ Khử mùi C-Air Fog   ☑ Wax bóng sáp sơn xe         │
│     ↳ dùng để cảnh báo khách chọn trùng                 │
│  ──────────────────────────────────────────────────────  │
│  ☑ Đang bán                                             │
│                              [ Hủy ]  [ Lưu thay đổi ]  │
└──────────────────────────────────────────────────────────┘
```

**Ràng buộc bắt buộc:**

| Luật | Lý do |
| :-- | :-- |
| `service_key` **khóa** sau khi có booking đầu tiên | Đổi key làm hỏng đối chiếu lịch sử |
| Đổi giá **không** ảnh hưởng booking cũ | Giá đã snapshot ở `booking_items` (BR-026) — đây là gốc rễ lỗi #17 |
| Không xóa cứng, chỉ `is_active = 0` | Booking cũ còn tham chiếu |
| `duration_min + buffer_min` phải > 0 với `booking_mode = slot` | Không có thời lượng thì không xếp được khoang |
| Cảnh báo khi đổi `required_bay_type` | Booking tương lai đã xếp khoang cũ — phải xếp lại |

Mọi thay đổi giá ghi `audit_logs` với `old_value` / `new_value`.

---

## 3. Quản lý chi nhánh & khoang (D-17)

```
┌──────────────────────────────────────────────────────────┐
│  CN Tân Phú                                       [Sửa] │
├──────────────────────────────────────────────────────────┤
│  Giờ mở cửa    [ 07:00 ] – [ 18:00 ]                    │
│  Độ chia slot  [ 15 ] phút        → 44 slot/ngày/khoang │
│  Đặt trước tối thiểu                                     │
│     · Dịch vụ slot      [ 90 ] phút                      │
│     · Dịch vụ linh hoạt [ 60 ] phút                      │
│  ☑ Đang mở nhận booking                                  │
│  ──────────────────────────────────────────────────────  │
│  KHOANG RỬA                          [ + Thêm khoang ]  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Bay 1  [ QUICK — rửa nhanh      ▾ ]  ☑ hoạt động ⋯│ │
│  │ Bay 2  [ QUICK — rửa nhanh      ▾ ]  ☑ hoạt động ⋯│ │
│  │ Bay 3  [ DETAIL — chuyên sâu    ▾ ]  ☑ hoạt động ⋯│ │
│  │ Bay 4  [ UNIVERSAL — linh hoạt  ▾ ]  ☑ hoạt động ⋯│ │
│  └────────────────────────────────────────────────────┘ │
│  Sức chứa hiện tại: 2 nhanh · 1 chuyên sâu · 1 linh hoạt│
└──────────────────────────────────────────────────────────┘
```

> ⚠️ **Tắt một khoang không được làm hỏng booking đã đặt.** Khi Admin bỏ tick "hoạt động", hệ thống liệt kê các booking tương lai đang nằm ở khoang đó và bắt chọn: *xếp sang khoang khác* hoặc *giữ nguyên, chỉ chặn đặt mới*. Không được im lặng xóa `slot_reservations`.

---

## 4. Quản lý tài khoản

### 4.1. Tài khoản STAFF (lỗi #3)

```
┌────────────────────────────────────────────────────────────────┐
│  Nhân sự                                    [ + Thêm nhân viên]│
│  [ Tìm tên hoặc SĐT...   ]   Chi nhánh: [Tất cả ▾]            │
├──────────────────┬────────────┬──────────┬─────────┬──────────┤
│ Họ tên           │ SĐT        │ Chi nhánh│ Trạng   │          │
├──────────────────┼────────────┼──────────┼─────────┼──────────┤
│ Nguyễn Văn Bình  │ 0901234567 │ Tân Phú  │ Đang làm│ Sửa  Khóa│
│ Trần Thị Danh    │ 0912345678 │ Quận 9   │ Đang làm│ Sửa  Khóa│
└──────────────────┴────────────┴──────────┴─────────┴──────────┘
```

**Form thêm nhân viên**: họ tên · số điện thoại · chi nhánh · mật khẩu tạm.

**Luật:**

* Chỉ ADMIN tạo được — **bỏ hoàn toàn** lựa chọn vai trò khỏi form đăng ký công khai.
* Mật khẩu tạm gửi qua SMS, **bắt đổi ở lần đăng nhập đầu**.
* **Không xóa cứng** — chỉ `is_active = 0`. Lịch sử thao tác trong `audit_logs` phải truy được về người thật.
* Nhân viên bị khóa mà đang có booking `IN_PROGRESS` → cảnh báo, bắt bàn giao trước.
* Không tạo được tài khoản role `ADMIN` thứ hai (unique index chặn).

### 4.2. Tài khoản GUEST (D-21)

Guest nằm ở bảng riêng, không trộn vào `users` (BR-032).

```
┌────────────────────────────────────────────────────────────────────┐
│  Khách vãng lai                                                    │
│  [ Tìm SĐT hoặc biển số... ]  [ ☐ Chỉ hiện chưa gộp ]             │
├──────────────┬────────────┬───────────┬────────┬─────────┬────────┤
│ Họ tên       │ SĐT        │ Biển số   │ Số lần │ Trạng   │        │
├──────────────┼────────────┼───────────┼────────┼─────────┼────────┤
│ Lê Văn Cường │ 0987654321 │ 51G-123.45│   3    │ Chưa gộp│ Sửa ⋯ │
│ Phạm Thị Dung│ 0976543210 │ 51A-999.99│   1    │ Đã gộp →│ Xem   │
└──────────────┴────────────┴───────────┴────────┴─────────┴────────┘
```

**Admin sửa được**: họ tên · email · biển số · size xe.
**Admin KHÔNG sửa được**: số điện thoại — đây là khóa định danh và đã xác thực OTP. Muốn đổi thì khách phải đặt lại bằng số mới.

**Nút "Mời tạo tài khoản"**: gửi SMS kèm link đăng ký điền sẵn số điện thoại. Đo được tỉ lệ chuyển đổi.

**Guest đã gộp** hiện trạng thái `Đã gộp →` kèm link sang tài khoản `users`, **chỉ xem, không sửa** — mọi thay đổi phải làm ở tài khoản chính để tránh hai nguồn sự thật.

### 4.3. Tài khoản CUSTOMER (FR-010)

Danh sách có tìm kiếm, lọc theo hạng, modal chi tiết gồm: hồ sơ · danh sách xe · lịch sử booking · sổ điểm · voucher · số lần no-show.

**Admin điều chỉnh điểm thủ công được** nhưng **bắt buộc nhập lý do**, ghi `audit_logs` với `action = 'POINT_MANUAL_ADJUST'`. Đây là quyền nhạy cảm — dashboard có báo cáo riêng cho nó.

---

## 5. Admin đổi lịch booking (D-23, BR-033)

Đây là tính năng **dễ bị lạm dụng nhất** trong hệ thống. Anh nêu đúng bối cảnh: *"lỡ là người quen của chủ"*. Vì vậy thiết kế theo hướng **cho phép nhưng để lại dấu vết đầy đủ**.

### 5.1. Màn đổi lịch

```
┌────────────────────────────────────────────────────────────────┐
│  Đổi lịch — AWP-381927                                  [✕]   │
├────────────────────────────────────────────────────────────────┤
│  Khách: Lê Văn Cường · 0987654321 · Mazda CX-5 (SUV)          │
│  Trạng thái hiện tại: Đã xác nhận                             │
│  ──────────────────────────────────────────────────────────── │
│                    HIỆN TẠI          →       ĐỔI THÀNH        │
│  Chi nhánh    CN Tân Phú                [ CN Tân Phú     ▾ ]  │
│  Ngày         21/07/2026                [ 22/07/2026     ▾ ]  │
│  Giờ          10:00 – 10:45             [ 14:00 – 14:45  ▾ ]  │
│  Khoang       Bay 1 (QUICK)             [ tự xếp lại     ▾ ]  │
│  Dịch vụ      Ultimate + Rửa gầm        [ Sửa dịch vụ...   ]  │
│  ──────────────────────────────────────────────────────────── │
│  Tổng đơn     778.000đ                  778.000đ  (không đổi) │
│  Đã cọc       200.000đ                  200.000đ              │
│  Còn phải trả 578.000đ                  578.000đ              │
│  ──────────────────────────────────────────────────────────── │
│  Lý do đổi lịch *                                             │
│  [ Khách gọi điện nhờ dời do bận đột xuất                  ]  │
│  ↳ Bắt buộc. Sẽ lưu vào nhật ký và hiện trong thông báo       │
│    gửi cho khách.                                             │
│  ──────────────────────────────────────────────────────────── │
│  ☑ Gửi thông báo cho khách (bắt buộc, không tắt được)         │
│     Kênh: SMS · Email · Push                                  │
│                                                                │
│                          [ Hủy ]  [ Xác nhận đổi lịch ]       │
└────────────────────────────────────────────────────────────────┘
```

### 5.2. Bốn ràng buộc bắt buộc

| # | Ràng buộc | Nếu thiếu thì sao |
| :-- | :-- | :-- |
| 1 | **Bắt buộc nhập lý do**, nút Lưu khóa khi trống | Không truy được vì sao lịch bị đổi |
| 2 | **Ghi `audit_logs`** đủ `old_value` / `new_value` | Không đối chiếu được khi có khiếu nại |
| 3 | **Thông báo tự động, không tắt được** | Khách tới đúng giờ cũ, mất khách thật |
| 4 | **Chuyển giữ chỗ nguyên tử** | Hai booking cùng chiếm một khoang |

**Ràng buộc 4 chi tiết** — trong một transaction:

```
BEGIN TRANSACTION
  1. INSERT slot_reservations mới  (bay_id mới, slot_time mới)
       ├─ DuplicateKeyException → ROLLBACK
       │  → "Khung giờ 14:00 đã có người đặt. Chọn giờ khác."
       │  → Lịch cũ GIỮ NGUYÊN, không mất gì
       └─ OK ↓
  2. DELETE slot_reservations cũ
  3. UPDATE bookings (ngày, giờ, bay_id, row_version)
  4. INSERT audit_logs
  5. Đẩy job gửi thông báo
COMMIT
```

> 🔑 **Thứ tự chiếm-trước-nhả-sau** là cố ý. Nếu nhả slot cũ trước rồi mới chiếm slot mới, mà slot mới bị người khác giành mất trong tích tắc đó, khách sẽ **mất cả hai** — không còn lịch nào.

### 5.3. Nội dung thông báo gửi khách

Phải nêu rõ **cái gì đổi từ đâu sang đâu**, không được chỉ nói "lịch của bạn đã thay đổi".

```
AutoWash Pro — Lịch hẹn AWP-381927 đã được thay đổi

Thời gian:  Thứ 2, 21/07 lúc 10:00
        →   Thứ 3, 22/07 lúc 14:00
Chi nhánh:  CN Tân Phú (không đổi)
Dịch vụ:    VW Ultimate Wash + Rửa gầm (không đổi)
Số tiền:    778.000đ (không đổi) · còn phải trả 578.000đ

Lý do: Khách gọi điện nhờ dời do bận đột xuất
Thực hiện bởi: Quản trị viên · 20/07/2026 15:32

Không đúng ý bạn? Trả lời tin này hoặc gọi 0901234567.
```

### 5.4. Giám sát lạm dụng

Dashboard Admin có thẻ riêng:

* Số lần đổi lịch trong tháng, **tách theo người thực hiện**
* Danh sách booking bị đổi **từ 2 lần trở lên**
* Cảnh báo khi một khách được đổi lịch bất thường nhiều

> Không chặn cứng — chủ có quyền ưu ái người quen, đó là việc kinh doanh của họ. Nhưng số liệu phải nhìn thấy được. Đây là điểm cộng khi thuyết trình: nhóm hiểu sự khác nhau giữa **kiểm soát** và **minh bạch**.

---

## 6. Dashboard (lỗi #17)

### 6.1. Thẻ số liệu

| Thẻ | Công thức | Bẫy |
| :-- | :-- | :-- |
| Doanh thu thực thu | `SUM(paid_amount)` với `status = COMPLETED` | ❌ Không cộng `CONFIRMED` — tiền chưa thu |
| Doanh thu dự kiến | `CONFIRMED` + `CHECKED_IN` + `IN_PROGRESS` | Tách riêng, không trộn vào ô trên |
| Tiền cọc đang giữ | `SUM(deposit_amount)` của booking chưa hoàn thành | |
| Số lượt hoàn thành | `COUNT` `COMPLETED` | |
| Tỉ lệ no-show | `NO_SHOW / (COMPLETED + NO_SHOW)` | |
| **Tỉ lệ auto-confirm** | `auto_confirmed = 1 / COMPLETED` | Cao bất thường → kiểm tra nhân viên (BR-031) |
| Lấp đầy khoang | slot đã dùng / (44 × số khoang) | Chỉ số vận hành quan trọng nhất |

### 6.2. Ba lỗi phải sửa cùng lúc

```sql
-- 1. Chỉ đếm tiền đã thực thu
WHERE status = 'COMPLETED'

-- 2. Đọc giá đã snapshot, KHÔNG join services
SUM(bi.line_total) FROM booking_items bi   -- ✅
-- SUM(s.base_price) FROM services s       -- ❌ đổi giá là sai hết lịch sử

-- 3. Đổi sang GMT+7 trước khi group
GROUP BY CAST(DATEADD(HOUR, 7, completed_at) AS DATE)
```

Thiếu bất kỳ mục nào trong ba mục trên, con số vẫn sai. Chi tiết: [05 §5](05-KE-HOACH-FIX-17-LOI.md).

---

## 7. Nhật ký kiểm toán

Mọi thao tác dưới đây **bắt buộc** ghi `audit_logs`:

| Hành động | `action` | Bắt buộc lý do |
| :-- | :-- | :-: |
| Đổi lịch booking | `BOOKING_RESCHEDULED` | ✅ |
| Ghi đè trạng thái booking | `BOOKING_STATUS_OVERRIDE` | ✅ |
| Sửa size xe tại quầy | `VEHICLE_SIZE_CORRECTED` | ✅ |
| Điều chỉnh điểm thủ công | `POINT_MANUAL_ADJUST` | ✅ |
| Sửa giá dịch vụ | `SERVICE_PRICE_CHANGED` | ❌ |
| Tạo / khóa tài khoản staff | `STAFF_CREATED` / `STAFF_DISABLED` | ❌ |
| Sửa thông tin guest | `GUEST_UPDATED` | ❌ |
| Gộp guest vào tài khoản | `GUEST_MERGED` | ❌ |
| Tắt / bật khoang | `BAY_TOGGLED` | ✅ |
| Hệ thống tự xác nhận | `AUTO_CONFIRMED` (`actor_role = SYSTEM`) | ❌ |

**Màn xem nhật ký**: lọc theo loại đối tượng · người thực hiện · khoảng thời gian. Hiển thị `old → new` dạng so sánh cạnh nhau, không phải JSON thô.

`audit_logs` **chỉ ghi thêm, không sửa, không xóa** — kể cả ADMIN. Đây là điều kiện để nó có giá trị làm bằng chứng.

---

## 8. API phân hệ quản trị

```
GET    /api/v1/admin/services                    Danh sách + lọc
POST   /api/v1/admin/services                    Thêm
PUT    /api/v1/admin/services/{id}               Sửa
PATCH  /api/v1/admin/services/{id}/active        Bật/tắt bán
PUT    /api/v1/admin/services/{id}/includes      Cập nhật combo_includes
PATCH  /api/v1/admin/services/reorder            Kéo thả đổi thứ tự

GET    /api/v1/admin/branches/{id}/bays          Danh sách khoang
POST   /api/v1/admin/branches/{id}/bays          Thêm khoang
PATCH  /api/v1/admin/bays/{id}                   Sửa loại / bật tắt

GET    /api/v1/admin/staff                       Danh sách nhân viên
POST   /api/v1/admin/staff                       Tạo (chỉ ADMIN)
PATCH  /api/v1/admin/staff/{id}                  Sửa
PATCH  /api/v1/admin/staff/{id}/active           Khóa / mở

GET    /api/v1/admin/guests                      Danh sách guest
PATCH  /api/v1/admin/guests/{id}                 Sửa (không sửa SĐT)
POST   /api/v1/admin/guests/{id}/invite          Gửi SMS mời đăng ký

PATCH  /api/v1/admin/bookings/{id}/reschedule    Đổi lịch (D-23)
PATCH  /api/v1/admin/bookings/{id}/override      Ghi đè trạng thái
POST   /api/v1/admin/customers/{id}/adjust-points Điều chỉnh điểm

GET    /api/v1/admin/reports/revenue?from=&to=&groupBy=day|month|year
GET    /api/v1/admin/reports/bay-utilization
GET    /api/v1/admin/reports/reschedule-audit
GET    /api/v1/admin/audit-logs?entityType=&actorId=&from=&to=
```

**Mọi endpoint dưới `/admin/`** đi qua bộ lọc kiểm tra role. Sai quyền trả `403` với thông điệp tiếng Việt, không lộ chi tiết hệ thống.
