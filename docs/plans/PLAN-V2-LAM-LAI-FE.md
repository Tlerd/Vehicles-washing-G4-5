# KẾ HOẠCH THỰC THI V2 — LÀM LẠI FRONT-END TỪ ĐẦU

> **Ngày lập**: 2026-07-20 · **Phê duyệt**: Đức Anh
> **Trạng thái**: đã xác nhận làm lại FE từ đầu. Bảng màu chờ thiết kế landing page.
> **Đọc trước**: [00-QUYET-DINH-REFACTOR.md](00-QUYET-DINH-REFACTOR.md)

---

## 1. Phạm vi & nguyên tắc

### 1.1. Cái gì bỏ, cái gì giữ

| Hạng mục | Quyết định | Lý do |
| :-- | :-- | :-- |
| Toàn bộ `Front-end/src` | ❌ **Bỏ, dựng lại** | Đổi design system, đổi thứ tự wizard, đổi mô hình slot — sửa tốn hơn viết lại |
| `BookingContext.tsx` (mock DB) | ❌ Bỏ | Thay bằng API thật + TanStack Query |
| Back-end `config`, `entity`, `repository` | ✅ **Giữ** | Đúng chuẩn, chỉ cần bổ sung bảng mới |
| Auth + JWT + Firebase (BE) | ✅ Giữ, mở rộng | Thêm nhánh Google Sign-In |
| 7 tài liệu refactor đã viết | ✅ Giữ, cập nhật | Nghiệp vụ không đổi, chỉ thêm |
| Schema DB hiện có | ⚠️ Migrate | Thêm 7 bảng, sửa 3 bảng — không drop |

### 1.2. Bốn nguyên tắc xuyên suốt

1. **Không có "sẽ dọn sau".** Code viết lại từ đầu là cơ hội duy nhất để làm sạch. Component quá 300 dòng là tách ngay, không để nợ.
2. **BE chạy trước FE nửa bước.** FE không mock nữa. BE xong endpoint nào, FE nối endpoint đó. Contract chốt bằng Swagger trước khi cả hai bắt tay.
3. **Mỗi chặng phải demo được.** Hết chặng mà không bấm chạy được từ đầu tới đó thì không sang chặng mới.
4. **Màu là biến, không phải hằng.** Xem §2.

---

## 2. Gỡ phụ thuộc bảng màu — kiến trúc token 3 lớp

Anh sẽ gửi thiết kế landing page sau. Nếu code màu trực tiếp vào component thì lúc đó phải sửa hàng trăm chỗ. Giải pháp: **tách palette ra khỏi ngữ nghĩa**.

```
┌─ LỚP 1 · PALETTE ──────────── file duy nhất phải sửa khi có landing page
│  --p-brand-50 … --p-brand-900      (thang 10 bậc màu thương hiệu)
│  --p-neutral-0 … --p-neutral-900
│  --p-green / --p-amber / --p-red   (trạng thái, ít khi đổi)
└────────────────────────────────────────────────────────────────────
           ↓ ánh xạ 1 lần
┌─ LỚP 2 · SEMANTIC ─────────── KHÔNG BAO GIỜ ĐỔI
│  --c-primary        : var(--p-brand-500)
│  --c-primary-hover  : var(--p-brand-600)
│  --c-surface-page   : var(--p-neutral-50)
│  --c-surface-card   : var(--p-neutral-0)
│  --c-text-heading   : var(--p-neutral-900)
│  --c-text-body      : var(--p-neutral-600)
│  --c-border         : var(--p-neutral-200)
│  --c-slot-free / --c-slot-held / --c-slot-full / --c-slot-picked
└────────────────────────────────────────────────────────────────────
           ↓ dùng trong component
┌─ LỚP 3 · COMPONENT ────────── chỉ tham chiếu lớp 2, không bao giờ tham chiếu lớp 1
│  <Button variant="primary">  →  bg: var(--c-primary)
└────────────────────────────────────────────────────────────────────
```

**File duy nhất phải sửa khi landing page về**: `src/styles/palette.css` (~40 dòng).

```css
/* src/styles/palette.css — LỚP 1, tạm dùng hướng B Fresh cho tới khi có landing page */
:root {
  --p-brand-50:#E1F5EE; --p-brand-100:#9FE1CB; --p-brand-200:#5DCAA5;
  --p-brand-500:#1D9E75; --p-brand-600:#0F6E56; --p-brand-900:#04342C;

  --p-neutral-0:#FFFFFF;  --p-neutral-50:#F8FAFC; --p-neutral-100:#F1F5F9;
  --p-neutral-200:#E2E8F0; --p-neutral-400:#94A3B8;
  --p-neutral-600:#475569; --p-neutral-900:#0F172A;

  --p-green-500:#16A34A; --p-amber-500:#F59E0B; --p-red-500:#DC2626;
}
```

> ✅ **Việc bắt đầu được ngay hôm nay**: dùng bảng tạm ở trên (hướng B Fresh). Khi landing page về, thay 10 dòng `--p-brand-*` là toàn bộ ứng dụng đổi màu. Zero thay đổi trong component.

**Luật bắt buộc, đưa vào review**: component **cấm** viết `#hex`, cấm dùng `--p-*`. Chỉ được dùng `--c-*`. Thêm ESLint rule chặn hex trong `className`/`style`.

### 2.1. Hai bộ token cho hai ngữ cảnh (D-24)

| | Khách hàng (B Fresh) | Admin & Quầy (C Utility) |
| :-- | :-- | :-- |
| Bo góc thẻ | `16px` | `6px` |
| Bo góc nút | `12px` | `6px` |
| Mật độ hàng | `48px` | `36px` |
| Cỡ chữ nền | `16px` | `14px` |
| Padding thẻ | `20px` | `12px` |
| Đổ bóng | `shadow-sm` | không |

Cài bằng một lớp bọc, không phải hai design system:

```html
<div data-density="comfortable">  <!-- luồng khách -->
<div data-density="compact">      <!-- admin, quầy, lưới tuần -->
```

```css
[data-density="comfortable"] { --d-radius-card:16px; --d-row-h:48px; --d-font:16px; }
[data-density="compact"]     { --d-radius-card:6px;  --d-row-h:36px; --d-font:14px; }
```

Cùng một `<Button>`, `<Card>` dùng được cả hai nơi. **Không viết 2 bộ component.**

---

## 3. Kiến trúc Front-end mới

### 3.1. Công nghệ

| Hạng mục | Chọn | Lý do |
| :-- | :-- | :-- |
| Build | Vite + React 18 + TypeScript | Giữ như cũ, nhóm đã quen |
| Style | **Tailwind CSS** (bỏ CSS Modules) | Chốt xung đột ở `04 §0`. Token map vào `tailwind.config.js` |
| Server state | **TanStack Query** | Cache, retry, invalidate, polling slot — tự làm tay sẽ sinh bug |
| Client state | **Zustand** cho wizard | Nhẹ hơn Context, không re-render toàn cây khi đổi 1 bước |
| Form | React Hook Form + Zod | Validate dùng chung schema với type |
| Ngày giờ | `date-fns` + `date-fns-tz` | Xử lý GMT+7 (BR-027) |
| Icon | `lucide-react` | Đã có trong quy định |
| Router | React Router v6 | |

> ⚠️ **Không** dùng thư viện calendar dựng sẵn cho lưới tuần. Lưới 15 phút × 8 cột × trạng thái hold/full/selected quá đặc thù — bọc thư viện sẽ tốn hơn tự viết một `<WeekGrid>` khoảng 200 dòng.

### 3.2. Cấu trúc thư mục

```text
src/
├── app/
│   ├── router.tsx                 Định tuyến + route guard theo role
│   ├── providers.tsx              QueryClient, Auth, Density
│   └── layouts/                   PublicLayout · CustomerLayout · AdminLayout · CounterLayout
├── styles/
│   ├── palette.css                ⬅ LỚP 1 — file duy nhất đổi khi có landing page
│   ├── semantic.css               ⬅ LỚP 2
│   └── density.css                ⬅ comfortable / compact
├── components/ui/                 Button Card Modal Sheet Chip Badge Input Select
│                                  EmptyState Skeleton Stepper PriceTag Countdown Toast
├── components/domain/             ServiceIconGrid ServicePickerSheet WeekGrid SlotCell
│                                  CartBar BookingCard VehicleCard TierProgress BayBadge
├── features/
│   ├── auth/                      register · login · otp · google · account-link
│   ├── booking/                   6 bước wizard + store + hooks
│   ├── customer/                  dashboard garage points vouchers history feedback
│   ├── counter/                   hàng chờ · bắt đầu · xong việc
│   └── admin/                     services combos bookings customers staff guests reports
├── lib/
│   ├── api/                       axios instance + interceptor + endpoint theo domain
│   ├── firebase.ts                Phone Auth + Google Provider
│   ├── money.ts                   format vi-VN, tính giá theo size
│   ├── slot.ts                    tính số slot, kiểm tra liên tiếp
│   └── datetime.ts                UTC ⇄ GMT+7
└── types/                         khớp 1-1 với DTO của BE
```

### 3.3. Thứ tự dựng component (quan trọng — tránh chờ nhau)

**Đợt 1 — nền, không phụ thuộc API** (làm được ngay, song song với BE)
`palette.css` → `semantic.css` → `density.css` → `Button` `Card` `Input` `Badge` `Chip` `Skeleton` `EmptyState` `Modal/Sheet` `Toast` `Stepper` `PriceTag` `Countdown`

**Đợt 2 — component nghiệp vụ, dữ liệu giả cục bộ**
`ServiceIconGrid` → `ServicePickerSheet` → `CartBar` → `WeekGrid` + `SlotCell` → `BookingCard` → `TierProgress`

**Đợt 3 — nối API thật**
Theo đúng thứ tự BE bàn giao endpoint.

> Đợt 1 và 2 **không cần chờ BE**. Đây là lý do FE làm lại từ đầu không nhất thiết chậm hơn — 2 đợt đầu chạy song song với BE làm schema.

---

## 4. Back-end — thay đổi schema

### 4.1. Bảng mới (7)

| Bảng | Mục đích | Quyết định |
| :-- | :-- | :-- |
| `service_categories` | 7 nhóm dịch vụ, icon, nhóm COMBO/SINGLE | D-04, D-05 |
| `combo_includes` | Cảnh báo trùng | D-06 |
| `booking_items` | Chi tiết dịch vụ + snapshot giá | BR-026 |
| `bays` | Khoang rửa và loại khoang | D-17 |
| `slot_reservations` | Giữ chỗ + khóa chống trùng | D-18 |
| `guests` | Khách vãng lai, gộp khi đăng ký | D-21 |
| `change_requests` | Yêu cầu đổi lịch | D-10 |
| `audit_logs` | Nhật ký kiểm toán | BR-025 |
| `tiers` | Hạng thành viên cấu hình được | Lỗi #15 |

### 4.2. Sửa bảng cũ

```sql
ALTER TABLE branches ADD
    slot_duration_min        INT NOT NULL DEFAULT 15,   -- ⬅ 30 → 15 (D-14)
    slot_min_advance_min     INT NOT NULL DEFAULT 90,   -- ⬅ tách khỏi slot_duration (lỗi #8)
    flexible_min_advance_min INT NOT NULL DEFAULT 60,
    open_time  TIME NOT NULL DEFAULT '07:00',
    close_time TIME NOT NULL DEFAULT '18:00';

ALTER TABLE services ADD
    is_size_dependent BIT NOT NULL DEFAULT 1,           -- D-03
    pricing_unit      VARCHAR(20) NOT NULL DEFAULT 'per_car',
    booking_mode      VARCHAR(10) NOT NULL DEFAULT 'slot',
    duration_min      INT NULL,
    buffer_min        INT NOT NULL DEFAULT 10,          -- ⬅ mới (D-14)
    required_bay_type VARCHAR(20) NOT NULL DEFAULT 'QUICK';

ALTER TABLE bookings ADD
    bay_id           INT NULL,
    deposit_amount   DECIMAL(12,0) NOT NULL DEFAULT 0,
    paid_amount      DECIMAL(12,0) NOT NULL DEFAULT 0,
    auto_confirmed   BIT NOT NULL DEFAULT 0,            -- D-19
    no_show_count_at INT NULL,
    row_version      ROWVERSION;                        -- optimistic lock

ALTER TABLE vouchers ADD min_tier_id INT NULL;          -- lỗi #16
```

---

## 5. Ba bài toán kỹ thuật — thiết kế chi tiết

### 5.1. Slot 15 phút + buffer (D-14)

**Vấn đề**: thời lượng thật là 20, 40, 45, 60, 90… phút — 20 và 40 không chia hết cho 15.

**Giải**: chiếm dụng = thời gian làm + thời gian dọn khoang.

```java
int occupiedMinutes = service.getDurationMin() + service.getBufferMin();
int slotCount = (int) Math.ceil(occupiedMinutes / 15.0);
```

| Dịch vụ | `duration` | `buffer` | Chiếm | Số slot |
| :-- | --: | --: | --: | --: |
| Rửa xe ngoài | 20′ | 10′ | 30′ | 2 |
| VW Basic Wash | 20′ | 10′ | 30′ | 2 |
| VW Detail Wash | 20′ | 10′ | 30′ | 2 |
| VW Ultimate Wash | 40′ | 5′ | 45′ | 3 |
| Combo Bảo dưỡng nhanh | 65′ | 10′ | 75′ | 5 |
| Vệ sinh khoang máy | 60′ | 15′ | 75′ | 5 |

**Giờ mở cửa 07:00–18:00** → `(18−7) × 4 = 44` slot/ngày/khoang.

### 5.2. Khoang & sức chứa (D-17)

**Cấu hình mặc định mỗi chi nhánh: 4 khoang**

| Khoang | Loại | Nhận dịch vụ |
| :-- | :-- | :-- |
| Bay 1 | `QUICK` | `booking_mode = slot` (rửa xe, combo) |
| Bay 2 | `QUICK` | như trên |
| Bay 3 | `DETAIL` | `booking_mode = flexible` (ceramic, PPF, nội thất, dầu, lốp) |
| Bay 4 | `UNIVERSAL` | mọi loại — van xả khi quá tải |

**Thuật toán xếp khoang** — ưu tiên khoang chuyên dụng, để dành khoang linh hoạt:

```java
Optional<Bay> allocate(Branch b, ServiceType type, Instant start, int slots) {
    // 1. Thử khoang chuyên dụng trước
    for (Bay bay : b.baysOfType(type)) {
        if (isFreeForAllSlots(bay, start, slots)) return Optional.of(bay);
    }
    // 2. Hết mới dùng UNIVERSAL — giữ nó làm dự phòng
    for (Bay bay : b.baysOfType(UNIVERSAL)) {
        if (isFreeForAllSlots(bay, start, slots)) return Optional.of(bay);
    }
    return Optional.empty();
}
```

**Kiểm chứng tình huống anh nêu** — combo 1 giờ 13:00–14:00 + gói lẻ trùng giờ:

```
          13:00   13:15   13:30   13:45   14:00
Bay 1 Q  │███████████████████████████████│         Combo 1h — khách A
Bay 2 Q  │        ███████████████│                 Gói lẻ 30′ — khách B  ✅
Bay 3 D  │  (chỉ nhận flexible, combo không vào được)
Bay 4 U  │        ███████████████████████│         Gói lẻ 45′ — khách C  ✅
                  ↑ khách D lúc 13:15 → ❌ hết khoang QUICK và UNIVERSAL
```

Khách D nhận thông báo: *"Khung giờ 13:15 đã kín. Còn chỗ lúc 13:45, 14:00, 14:15."* — 3 nút bấm là chọn luôn.

### 5.3. Chống 2 người đặt cùng slot (D-18)

**Cơ chế cốt lõi: unique index làm việc khóa, không phải code.**

```sql
CREATE TABLE slot_reservations (
    id          BIGINT PRIMARY KEY IDENTITY,
    branch_id   INT NOT NULL,
    bay_id      INT NOT NULL,
    slot_time   DATETIME2 NOT NULL,
    booking_id  VARCHAR(36) NOT NULL,
    status      VARCHAR(10) NOT NULL,        -- 'HOLD' | 'BOOKED'
    expires_at  DATETIME2 NULL,              -- chỉ có với HOLD
    CONSTRAINT UX_bay_slot UNIQUE (bay_id, slot_time)
);
CREATE INDEX IX_slot_lookup ON slot_reservations(branch_id, slot_time, status);
```

**Luồng 5 lớp:**

```
Khách bấm "Thanh toán cọc"
   │
   ├─ 1. BEGIN TRANSACTION
   │     allocate() chọn bay
   │     INSERT slot_reservations (status='HOLD', expires_at=now+15′) × N slot
   │     ├─ thành công → COMMIT → tạo booking PENDING_DEPOSIT → URL VNPAY
   │     └─ DuplicateKeyException → ROLLBACK → 409 + gợi ý 3 slot gần nhất
   │
   ├─ 2. Idempotency-Key: chính khách đó bấm 2 lần → trả kết quả cũ, không tạo mới
   │
   ├─ 3. VNPAY IPN thành công → UPDATE status='BOOKED', expires_at=NULL
   │
   ├─ 4. Job mỗi phút: DELETE HOLD quá hạn → nhả slot
   │
   └─ 5. FE polling 10 giây khi đang ở bước chọn giờ → ô slot tự khóa
         hiển thị "Còn 1 chỗ" khi sức chứa còn 1
```

**Vì sao không dùng Redis**: unique index của SQL Server đã cho tính đúng đắn tuyệt đối ở mức đồng thời của đồ án (< 100 người). Thêm Redis là thêm một hạ tầng phải cài, phải vận hành, phải đồng bộ — rủi ro lớn hơn lợi ích. Ghi rõ lập luận này vào tài liệu để trả lời nếu bị hỏi.

**Kịch bản test bắt buộc** (Danh chạy): mở 2 trình duyệt, cùng chọn slot 10:00, bấm thanh toán cách nhau < 1 giây. Kết quả đúng: một người vào VNPAY, người kia nhận 409 kèm gợi ý — **không** có trường hợp cả hai cùng thành công.

---

## 6. Lịch trình — 4 sprint

> Đơn vị: **ngày công**. Nhân lực: 3 FE (Nguyên, Phong, An) · 2 BE (Phát, Bình) · 1 QA (Danh) · Anh review.

### Sprint 0 — Nền móng (2 ngày)

| Việc | Ai | Ngày |
| :-- | :-- | --: |
| `palette.css` + `semantic.css` + `density.css` + `tailwind.config` | Phong | 1 |
| Dựng dự án Vite mới, router, layout, providers | Nguyên | 1 |
| Bộ `components/ui` đợt 1 (13 component) | An + Phong | 2 |
| Migration script 7 bảng mới + sửa 3 bảng | Bình | 2 |
| Seed 45 dịch vụ + 4 combo + 4 khoang × 3 chi nhánh | Phát | 1 |
| Chốt contract Swagger toàn bộ endpoint | Phát + Bình | 1 |

> 🔓 **Không phụ thuộc landing page.** Bắt đầu được ngay.

### Sprint 1 — Auth & Hồ sơ (3 ngày)

| Việc | Ai |
| :-- | :-- |
| Firebase Phone OTP + Google Sign-In, chọn 1 trong 2 (D-20) | Nguyên (FE) · Bình (BE) |
| Account linking: cùng SĐT/email thì gộp, không tạo trùng | Bình |
| Fix lỗi #4 — chuẩn hóa E.164 ở cả 3 chỗ + unit test | Bình |
| Fix lỗi #3 — chỉ 1 admin, unique index; Admin CRUD staff | Phát |
| Fix lỗi #5 — CRUD Profile | An (FE) · Phát (BE) |
| CRUD Vehicle (FR-003, BE đang thiếu) | Phong (FE) · Phát (BE) |

**Nghiệm thu**: đăng ký bằng OTP → ra app. Đăng ký bằng Google → ra app. Cùng một người đăng ký cả hai cách → **1 tài khoản**, không phải 2.

### Sprint 2 — Catalog & Đặt lịch (5 ngày) ← **đường găng**

| Việc | Ai |
| :-- | :-- |
| Admin CRUD dịch vụ + combo + `combo_includes` (D-22, lỗi #6) | Phong (FE) · Bình (BE) |
| `ServiceIconGrid` + `ServicePickerSheet` + nhắc inline (D-16) | Nguyên |
| `WeekGrid` + `SlotCell` 15 phút, 8 cột (D-15) | Phong |
| Thuật toán khoang & sức chứa (§5.2) | **Bình** |
| Soft-hold + unique index + job nhả hold (§5.3) | **Phát** |
| API slot theo tổng thời lượng + gợi ý slot thay thế | Phát |
| Wizard 6 bước thứ tự mới, tính lại giá bước 5 | An |
| Fix lỗi #8, #9 | Bình |

**Nghiệm thu**: chạy được kịch bản combo-đè-gói-lẻ ở §5.2 **và** kịch bản 2 trình duyệt ở §5.3.

### Sprint 3 — Thanh toán & Vòng đời (4 ngày)

| Việc | Ai |
| :-- | :-- |
| VNPAY create + return + **IPN** (lỗi #11) | **Phát** |
| Cọc theo bậc BR-017, miễn cọc Gold/Platinum | Phát |
| Customer check-in / xác nhận hoàn thành (lỗi #10, #12) | Nguyên (FE) · Bình (BE) |
| Auto-confirm +15′ **có điều kiện thu đủ** (D-19) | Bình |
| Màn Quầy: hàng chờ theo khoang, bắt đầu, xong việc | An |
| Job `MarkNoShow`, `ExpirePendingDeposits`, `RemindBooking` | Bình |

**Nghiệm thu**: đặt → trả cọc → tự CONFIRMED → check-in → thợ làm → khách xác nhận → cộng điểm. Thử staff gọi `/confirm` → 403.

### Sprint 4 — Loyalty & Admin (4 ngày)

| Việc | Ai |
| :-- | :-- |
| Bảng `tiers` + Admin CRUD (lỗi #15) | Phong (FE) · Bình (BE) |
| Link booking ↔ point (lỗi #14), thăng hạng tức thời | Bình |
| Voucher theo hạng (lỗi #16) | An (FE) · Bình (BE) |
| Feedback / rating (lỗi #13) | Nguyên |
| Admin đổi lịch + thông báo bắt buộc (D-23) | Phong (FE) · Phát (BE) |
| Admin CRUD guest + gộp khi đăng ký (D-21) | Phát |
| Dashboard: sửa 3 nguyên nhân của lỗi #17 | Phát |
| Infinite scroll + sort (FR-011) | An |
| Landing page + fix font (lỗi #1) | Phong |

---

## 7. Đường găng & phân công

```
Sprint 0 ──┬─→ Sprint 1 ──┬─→ Sprint 2 ═══════╗ ← ĐƯỜNG GĂNG
  2 ngày   │    3 ngày    │     5 ngày        ║
           │              │                   ▼
           └──────────────┴─────────────→ Sprint 3 ──→ Sprint 4
                                             4 ngày      4 ngày
Tổng: 18 ngày làm việc
```

**Sprint 2 là nút cổ chai.** Ba việc nặng nhất (khoang, soft-hold, lưới tuần) nằm cùng một sprint và phụ thuộc lẫn nhau. Biện pháp:

* Bình và Phát **kết đôi** ở §5.2 và §5.3 — hai việc này dính nhau, tách ra sẽ phải viết lại giao diện giữa chúng.
* Phong làm `WeekGrid` với dữ liệu giả **song song**, không chờ API. Hợp đồng chỉ là mảng `{time, status, remaining}`.
* Nếu Sprint 2 trượt quá 1 ngày → kích hoạt danh sách cắt §9 ngay, không chờ tới cuối.

| Người | Vai trò chính |
| :-- | :-- |
| **Anh** | PO, review mọi PR, không nhận task code |
| **Nguyên** | FE — wizard, chọn dịch vụ, check-in, feedback |
| **Phong** | FE — design system, lưới tuần, admin, landing |
| **An** | FE — hồ sơ, quầy, voucher, thanh toán, danh sách |
| **Phát** | BE — thanh toán, soft-hold, admin, báo cáo |
| **Bình** | BE — auth, khoang, booking, loyalty, job nền |
| **Danh** | QA — kịch bản nghiệm thu, dữ liệu seed, test đồng thời |

---

## 8. Định nghĩa hoàn thành (DoD)

Mỗi PR phải đủ, không có ngoại lệ:

```
[ ] Chạy được từ màn đầu tới tính năng này, không lỗi console
[ ] Đủ 4 trạng thái: loading (skeleton) / empty / error / success
[ ] Component không quá 300 dòng
[ ] Không còn kiểu `any`
[ ] Không có mã hex trong component — chỉ dùng --c-*
[ ] Test ở 375px và 1440px
[ ] Vùng chạm ≥ 44px trên mobile
[ ] Nút gây tác dụng phụ có disabled + Idempotency-Key
[ ] Endpoint mới có Swagger @Operation
[ ] Thay đổi nghiệp vụ có ghi audit_logs
[ ] Danh đã chạy kịch bản nghiệm thu của chặng
```

---

## 9. Sổ rủi ro & danh sách cắt

| Rủi ro | Khả năng | Tác động | Ứng phó |
| :-- | :-- | :-- | :-- |
| Sprint 2 trượt (khoang + soft-hold khó hơn dự kiến) | **Cao** | Đứt demo | Bình + Phát kết đôi. Trượt 1 ngày → cắt ngay mục 1 dưới đây |
| Landing page về muộn | Trung bình | Thấp — kiến trúc §2 đã gỡ | Dùng bảng tạm B Fresh, đổi sau 10 dòng |
| VNPAY sandbox trục trặc | Trung bình | **Cao** — lỗi #11 là P0 | Phát đăng ký sandbox **ngay Sprint 0**, không đợi Sprint 3 |
| Dựng lại FE lâu hơn dự kiến | Trung bình | Cao | Đợt 1 + 2 component không phụ thuộc API — làm song song từ Sprint 0 |
| Gộp guest sinh trùng SĐT | Thấp | Trung bình | Unique index trên `guests.phone`; viết test gộp trước khi code |
| 6 người sửa cùng file | Trung bình | Trung bình | Chia theo `features/`, mỗi người một thư mục |

### Danh sách cắt — theo thứ tự

Khi trượt lịch, cắt theo đúng thứ tự này, **không cắt tùy hứng**:

1. **Nhóm Thay lốp** (giữ Thay dầu) — tiết kiệm ~1,5 ngày. Vẫn chứng minh được kiến trúc `pricing_unit` và `is_size_dependent` bằng nhóm Thay dầu.
2. **Khoang UNIVERSAL thứ 4** — còn 3 khoang. Tiết kiệm ~0,5 ngày. Tình huống combo-đè-gói-lẻ vẫn demo được.
3. **Feedback / rating (lỗi #13)** — tiết kiệm ~1 ngày. Mất 1 lỗi trong 17 nhưng là lỗi nhẹ nhất.
4. **Admin CRUD guest (D-21)** — chỉ giữ phần đọc, bỏ phần sửa. Tiết kiệm ~1 ngày.
5. **Infinite scroll** → phân trang thường. Tiết kiệm ~0,5 ngày.

**Tuyệt đối không cắt**: VNPAY IPN · customer check-in/complete · soft-hold · link booking–point · dashboard revenue. Đây là 5 thứ feedback chấm điểm nêu đích danh.

---

## 10. Bắt đầu được ngay hôm nay

Không có việc nào dưới đây phụ thuộc landing page hay quyết định còn treo:

| Ai | Việc đầu tiên |
| :-- | :-- |
| **Phong** | Tạo `palette.css` (chép §2), `semantic.css`, cấu hình Tailwind |
| **Nguyên** | `npm create vite` dự án mới, dựng router + 4 layout |
| **An** | Dựng `Button` `Card` `Input` `Badge` `Chip` `Skeleton` `EmptyState` |
| **Bình** | Viết migration 7 bảng mới; unit test chuẩn hóa E.164 |
| **Phát** | **Đăng ký VNPAY sandbox ngay** (khâu này hay chờ lâu); viết seed 45 dịch vụ |
| **Danh** | Soạn kịch bản nghiệm thu cho §5.2 và §5.3 |
| **Anh** | Review PR. Landing page gửi lúc nào cũng được — không chặn ai |

> ✅ **Không còn hạng mục nào chờ quyết định.** Mức cọc đã chốt (§12), bảng màu đã có bản tạm dùng được ngay (§2), landing page về lúc nào thì thay 10 dòng lúc đó.

---

## 11. Đối chiếu — không sót gì

| Nguồn | Số mục | Đã phủ ở |
| :-- | --: | :-- |
| 17 lỗi chấm lại | 17/17 | Sprint 0→4, chi tiết `05` |
| Quyết định D-01 → D-13 | 13/13 | 7 tài liệu refactor |
| Quyết định D-14 → D-25 | 12/12 | Kế hoạch này |

**17 lỗi → sprint nào**: #1→S4 · #2,#3,#4→S1 · #5→S1 · #6→S2 · #7,#8,#9→S2 · #10,#12→S3 · #11→S3 · #13,#14,#15,#16→S4 · #17→S4

**D-14→D-25 → mục nào**: D-14→§5.1 · D-15→S2 · D-16→S2 · D-17→§5.2 · D-18→§5.3 · D-19→S3 · D-20→S1 · D-21→S4 · D-22→S1 (staff) + S2 (dịch vụ, combo) + S4 (guest) · D-23→S4 · D-24→§2.1 · D-25→§2

---

## 12. Mức cọc — đã chốt (D-26)

Trước đây để `[GIẢ ĐỊNH]` chờ duyệt. Nay chốt cứng, kèm căn cứ để trả lời nếu bị hỏi khi thuyết trình.

| Tổng đơn | Cọc | Tỉ lệ trên đơn điển hình |
| :-- | --: | :-- |
| < 500.000đ | **50.000đ** | Rửa xe ngoài 90k → 56% · VW Basic 180k → 28% · VW Detail 280k → 18% |
| 500.000đ – 2.000.000đ | **200.000đ** | VW Ultimate 640k → 31% · Super Clean 1,4tr → 14% |
| > 2.000.000đ | **500.000đ** | Ultimate Clean Plus 2,3tr → 22% · Ceramic 8,5tr → 6% |

### Ba luật đi kèm — bắt buộc, nếu thiếu sẽ sinh lỗi thật

1. **Cọc không bao giờ lớn hơn tổng đơn**: `deposit = MIN(bậc, total)`.
   Không có luật này, khách đặt mỗi "Rửa gầm 50.000đ" sẽ bị đòi cọc 50.000đ — bằng đúng tổng đơn, số dư tại quầy bằng 0, trông như lỗi.
2. **Gold và Platinum miễn cọc hoàn toàn** (`tiers.deposit_waived = 1`). Đặc quyền hạng, gắn thẳng vào loyalty engine.
3. **Khách có cờ `requires_full_prepay`** (no-show từ 3 lần) phải trả **100%** trước, không áp bậc.

### Vì sao dừng ở 500.000đ mà không thêm bậc cho đơn chục triệu

Đơn PPF/Ceramic 8,5tr–42tr đều là `booking_mode = flexible` — nhân viên **gọi điện xác nhận** trước khi xếp lịch. Rủi ro no-show ở nhóm này đã được chặn bằng cuộc gọi, không cần chặn bằng tiền. Đòi cọc 2 triệu online cho một dịch vụ chưa khảo sát xe sẽ giết tỉ lệ chuyển đổi mà chẳng thêm an toàn.

### Tiền công thay lốp — chốt 100.000đ/lốp

Giá lốp có nguồn thị trường ([02 §8](02-CATALOG-DICH-VU.md)), riêng tiền công thì không đơn vị nào công bố. Nhóm chốt **100.000đ/lốp** (đã gồm tháo lắp + cân bằng động), và **miễn công khi thay đủ 4 lốp** — đây là cách làm phổ biến của các garage Việt Nam, đồng thời tạo lý do để khách thay cả bộ thay vì thay lẻ.

Trong tài liệu vẫn ghi rõ đây là con số nhóm tự đặt, không trộn với dữ liệu có nguồn.
