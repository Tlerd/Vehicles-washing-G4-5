# 03 — NGHIỆP VỤ NGOÀI LUỒNG (Out-of-band Contact Handling)

> Nguồn: ảnh chụp màn hình timy.jp do Đức Anh cung cấp + thông số `min_advance` từ API VinaWash.
> Quyết định nguồn: D-10, D-11, D-12.

Đây là các tình huống **không nằm trong luồng đặt lịch thành công**. Đồ án sinh viên hay bị trừ điểm ở đúng chỗ này vì chỉ làm happy path.

---

## 1. Những gì timy quy định (đọc từ ảnh)

| Nội dung gốc (dịch) | Áp dụng? | Ghi chú |
| :-- | :-: | :-- |
| *"Giá hiển thị là gần đúng. Tùy thuộc vào kiểu xe, cấp độ, kích thước và tình trạng của xe, số tiền thanh toán tại chỗ có thể khác nhau"* | ❌ | Anh Đức Anh **không chọn**. Hệ thống ta chốt giá cứng theo size → minh bạch hơn, nhưng phải chấp nhận rủi ro xe quá bẩn vẫn tính giá cũ |
| *"Thời gian yêu cầu có thể thay đổi tùy tình hình tại cửa hàng"* | ✅ ngầm định | Đã xử lý qua `booking_mode = flexible` |
| *"Kích thước xe bạn nhập có thể được sửa tại cửa hàng"* | ✅ | → §4 |
| *"Thay đổi hoặc hủy bỏ sau khi hoàn tất đặt chỗ được chấp nhận qua email"* | ✅ | → §3 |
| *"Nếu bạn không đến quá 10 phút sau thời gian đặt chỗ, đặt chỗ của bạn sẽ bị hủy. Phí hủy sẽ được tính nếu vắng mặt"* | ✅ | → §2 |
| *"Bạn có thể thêm các tùy chọn như khử trùng nội thất, vệ sinh nội thất, loại bỏ côn trùng, rửa bánh xe — chọn từ menu bên"* | ✅ | Đã xử lý bằng dịch vụ đơn + `combo_includes` (D-06) |

---

## 2. BR-018 — Luật trễ hẹn 10 phút (D-11)

### Quy tắc

```
T = giờ hẹn (booking_time)
T + 10 phút: chưa CHECKED_IN  →  status = NO_SHOW
                              →  slot được giải phóng ngay
                              →  tiền cọc KHÔNG hoàn (chính là "phí hủy")
                              →  ghi +1 vào customers.no_show_count
```

Job `MarkNoShow` chạy **mỗi phút**.

### Nhưng phải công bằng — 3 lớp bảo vệ khách

Đánh `NO_SHOW` phũ quá sẽ tạo trải nghiệm tệ. Thiết kế 3 lớp:

**Lớp 1 — Nhắc trước (chủ động).**
`T − 1 ngày`: push/SMS nhắc lịch (yêu cầu có sẵn trong `source/update.md`).
`T − 60 phút`: nhắc lần 2 kèm nút **"Tôi đang trên đường"**.

**Lớp 2 — Ân hạn có điều kiện.**
Khách bấm *"Tôi đang trên đường"* trong khoảng `T−60′ → T+10′` → gia hạn thêm **15 phút**, tổng ân hạn thành 25 phút. Chỉ được bấm **1 lần / booking**.

> Lập luận: kẹt xe TP.HCM là chuyện thường ngày. Cho khách một hành động chủ động vừa giữ được khách, vừa cho quầy biết xe vẫn sẽ tới để không xếp người khác vào.

**Lớp 3 — Miễn phí hủy cho lần đầu.**
`no_show_count = 0` (khách chưa từng trễ) → `NO_SHOW` lần đầu **hoàn cọc** dưới dạng **voucher** đúng bằng số tiền cọc, hạn 30 ngày.

> Lập luận: hoàn tiền mặt tốn nghiệp vụ refund (không có trong scope). Hoàn bằng voucher vừa giữ chân khách, vừa chỉ tốn 1 dòng `INSERT` — và khách phải quay lại mới dùng được.

### Bảng đối chiếu

| `no_show_count` trước đó | Kết quả | Cọc |
| :-- | :-- | :-- |
| 0 | `NO_SHOW` + voucher hoàn cọc | Hoàn dạng voucher |
| 1–2 | `NO_SHOW` | Mất cọc |
| ≥ 3 | `NO_SHOW` + gắn cờ `requires_full_prepay` | Mất cọc. **Lần sau bắt trả 100% trước** |

---

## 3. BR-019 — Yêu cầu đổi lịch (D-10, sửa BR-013)

**BR-013 cũ**: *"Customers cannot cancel their booking once it has been submitted."*

Giữ tinh thần chống hủy bừa, nhưng bỏ cách làm cứng nhắc. Khách **không có nút Hủy**, thay bằng nút **"Yêu cầu đổi lịch"**.

### Luồng

```
CONFIRMED ──[khách bấm "Yêu cầu đổi lịch"]──► CHANGE_REQUESTED
                                                    │
                          ┌─────────────────────────┼──────────────────────┐
                          ▼                         ▼                      ▼
                  Staff xếp lịch mới        Staff từ chối          Khách rút yêu cầu
                          │                (hết chỗ / quá gấp)            │
                          ▼                         ▼                      ▼
                     CONFIRMED                 CANCELLED              CONFIRMED
                   (giờ mới, giữ cọc)      (xử lý cọc theo §3.2)     (giờ cũ)
```

### 3.2. Xử lý cọc khi đổi/hủy

| Thời điểm gửi yêu cầu | Kết quả |
| :-- | :-- |
| Trước giờ hẹn **> 24 giờ** | Đổi lịch **miễn phí**, cọc chuyển sang booking mới |
| Trước giờ hẹn **2–24 giờ** | Đổi được 1 lần, cọc giữ nguyên. Lần 2 mất cọc |
| Trước giờ hẹn **< 2 giờ** | Không đổi được. Coi như hủy, mất cọc |

### 3.3. Kênh liên hệ

timy dùng email (`taito.sensha.yoyaku@gmail.com`). Ta làm **3 kênh, ưu tiên trong app**:

1. **Trong app** (chính) — nút "Yêu cầu đổi lịch" → tạo `change_requests`, staff thấy ngay trên Washing Counter. **Có audit trail**, đây là lý do phải làm kênh này.
2. **Email tự động** — mọi email xác nhận đều gắn link đổi lịch (guest không đăng nhập cũng dùng được, link chứa token 1 lần).
3. **Hotline chi nhánh** — staff nhập hộ vào hệ thống, **bắt buộc chọn lý do** để không thành cửa hậu bỏ qua quy trình.

```sql
CREATE TABLE change_requests (
    id             INT PRIMARY KEY IDENTITY,
    booking_id     VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES bookings(id),
    requested_by   VARCHAR(20) NOT NULL,        -- 'CUSTOMER' | 'STAFF_ON_BEHALF'
    channel        VARCHAR(20) NOT NULL,        -- 'APP' | 'EMAIL' | 'HOTLINE'
    reason         NVARCHAR(500) NULL,
    desired_date   DATE NULL,
    desired_time   VARCHAR(5) NULL,
    status         VARCHAR(20) NOT NULL,        -- 'OPEN' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
    handled_by     VARCHAR(36) NULL,
    handled_at     DATETIME2 NULL,
    created_at     DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
```

---

## 4. BR-020 — Staff sửa size xe tại quầy (D-12)

### Vì sao cần

Khách tự khai size xe. Chọn sai (cố ý hoặc vô ý) → cửa hàng làm nhiều việc hơn nhưng thu ít tiền hơn.

### Quy tắc

```
Staff mở booking đang CHECKED_IN / IN_PROGRESS
  → sửa vehicle_size (Sedan → SUV)
  → hệ thống TÍNH LẠI toàn bộ booking_items theo K_size mới
  → hiển thị:  Tổng đơn mới        : 276.000đ
               Đã cọc              :  50.000đ
               ⚠ Còn phải thu      : 226.000đ  (tăng 46.000đ so với báo giá ban đầu)
  → bắt buộc nhập lý do  →  ghi audit_logs
  → cập nhật luôn vehicles.size để LẦN SAU tự động đúng
```

### 🔑 Vì sao mô hình cọc giải quyết được vấn đề này

Với **thanh toán 100% trước** (BR-014 cũ), sửa size sẽ tạo chênh lệch **đã thu thừa/thiếu** → phải xây nghiệp vụ hoàn tiền hoặc thu bù, cực kỳ phiền.

Với **cọc theo bậc**, phần lớn tiền chưa thu → sửa size chỉ làm số dư cuối thay đổi. **Không phát sinh hoàn tiền.** Đây là lợi ích kỹ thuật quan trọng của D-02 mà nhóm nên nêu khi thuyết trình.

### Chống lạm dụng

* Staff chỉ được sửa **tăng hoặc giữ nguyên** size. Muốn giảm size (giảm tiền) → phải Admin duyệt.
* Mọi lần sửa ghi `audit_logs`: ai sửa, từ size nào sang size nào, lý do, chênh lệch bao nhiêu.
* Dashboard Admin có báo cáo *"Số lần sửa size theo nhân viên"* — sửa bất thường nhiều là dấu hiệu cần kiểm tra.

---

## 4b. BR-033 — Admin đổi lịch (D-23)

Anh nêu bối cảnh rất thật: *"lỡ là người quen của chủ"*. Chủ có quyền ưu ái — đó là việc kinh doanh của họ. Nhưng hệ thống phải để lại dấu vết đầy đủ.

**Bốn ràng buộc, không bỏ điều nào:**

1. **Bắt buộc nhập lý do** — nút Lưu khóa khi trống.
2. **Ghi `audit_logs`** đủ giá trị cũ và mới.
3. **Thông báo tự động cho khách, không tắt được**, nêu rõ *cái gì đổi từ đâu sang đâu* — không được chỉ nói "lịch của bạn đã thay đổi". Khách tới đúng giờ cũ là mất khách thật.
4. **Chuyển giữ chỗ nguyên tử** — chiếm slot mới **trước**, thành công rồi mới nhả slot cũ. Nếu làm ngược lại mà slot mới bị người khác giành trong tích tắc đó, khách **mất cả hai**.

Giao diện, nội dung thông báo mẫu và báo cáo giám sát lạm dụng: [07-ADMIN-SPEC §5](07-ADMIN-SPEC.md).

---

## 5. BR-021 — Hết hạn giữ chỗ chưa thanh toán

```
PENDING_DEPOSIT tạo lúc T0
  T0 + 15 phút chưa có IPN thành công  →  EXPIRED, nhả slot
```

**UI**: đồng hồ đếm ngược ngay trên màn thanh toán —
`⏱ Giữ chỗ còn 14:32 · Hết giờ, khung giờ sẽ mở lại cho khách khác`

Đếm ngược tạo áp lực chuyển đổi lành mạnh và giải thích rõ vì sao khách bị mất chỗ nếu chần chừ. Đây cũng là mảnh ghép cuối để đóng **lỗi #9**: slot không bị treo vô thời hạn bởi booking chưa trả tiền.

---

## 6. Ma trận thông báo (Notification Matrix)

| Sự kiện | Khách hàng | Staff |
| :-- | :-- | :-- |
| `CONFIRMED` | Email + SMS: mã booking, giờ, chi nhánh, khoang, số dư phải trả | Hiện lên hàng chờ hôm nay |
| **Admin đổi lịch** (D-23) | 🔔 **Bắt buộc, không tắt được** — nêu rõ đổi từ đâu sang đâu + lý do | Hàng chờ cập nhật |
| **Auto-confirm** (BR-031) | "Hệ thống đã tự xác nhận giúp bạn. Còn 24h để báo nếu có vấn đề." | Hiện ở doanh thu ca |
| Slot bị người khác giữ mất | Ngay lập tức trên UI + 3 slot thay thế bấm được | — |
| `T − 1 ngày` | Push/SMS nhắc lịch | — |
| `T − 60 phút` | Push kèm nút "Tôi đang trên đường" | — |
| Khách bấm "đang trên đường" | Xác nhận đã gia hạn 15 phút | 🔔 Toast trên màn quầy |
| `CHECKED_IN` | "Đã ghi nhận, vui lòng chờ gọi" | 🔔 Xe đã tới |
| `IN_PROGRESS` | "Xe đang được chăm sóc · dự kiến xong 10:40" | — |
| `AWAITING_CONFIRM` | 🔔 Push: "Xe đã xong, mời bạn kiểm tra" | — |
| `COMPLETED` | Điểm cộng + form đánh giá | Hiện ở doanh thu ca |
| `NO_SHOW` | Email giải thích + voucher (nếu lần đầu) | Slot tự nhả |
| `CHANGE_REQUESTED` | "Đã nhận yêu cầu, sẽ phản hồi trong 30 phút" | 🔔 Cần xử lý |
| `EXPIRED` | "Hết hạn giữ chỗ" + nút đặt lại giữ nguyên lựa chọn cũ | — |
