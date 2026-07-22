# 04 — ĐẶC TẢ UI/UX (v2 — làm lại từ đầu)

> ⚠️ **Bản này thay thế hoàn toàn v1.** Design system cũ (Sky Blue `#0ea5e9`, CSS Modules) đã bỏ theo D-24, D-25.
> Quyết định nguồn: D-14 → D-16, D-24, D-25. Kế hoạch thực thi: [PLAN-V2-LAM-LAI-FE.md](PLAN-V2-LAM-LAI-FE.md)

---

## 1. Kiến trúc token 3 lớp

Bảng màu sẽ lấy từ thiết kế landing page. Để việc đó **không chặn ai**, màu được tách khỏi ngữ nghĩa.

```
LỚP 1 · PALETTE    --p-*    file duy nhất đổi khi có landing page
       ↓
LỚP 2 · SEMANTIC   --c-*    không bao giờ đổi
       ↓
LỚP 3 · COMPONENT           chỉ được dùng --c-*
```

### 1.1. Lớp 1 — `src/styles/palette.css`

Bản tạm dùng ngay (hướng *B Fresh*). Khi landing page về, thay 10 dòng `--p-brand-*`, xong.

```css
:root {
  --p-brand-50:#E1F5EE; --p-brand-100:#9FE1CB; --p-brand-200:#5DCAA5;
  --p-brand-500:#1D9E75; --p-brand-600:#0F6E56; --p-brand-900:#04342C;

  --p-neutral-0:#FFFFFF;   --p-neutral-50:#F8FAFC;  --p-neutral-100:#F1F5F9;
  --p-neutral-200:#E2E8F0; --p-neutral-400:#94A3B8;
  --p-neutral-600:#475569; --p-neutral-900:#0F172A;

  --p-green-50:#F0FDF4; --p-green-500:#16A34A; --p-green-700:#15803D;
  --p-amber-50:#FFFBEB; --p-amber-500:#F59E0B; --p-amber-700:#B45309;
  --p-red-50:#FEF2F2;   --p-red-500:#DC2626;   --p-red-700:#B91C1C;
  --p-violet-50:#F5F3FF; --p-violet-500:#8B5CF6; --p-violet-700:#6D28D9;
}
```

### 1.2. Lớp 2 — `src/styles/semantic.css`

```css
:root {
  --c-primary:        var(--p-brand-500);
  --c-primary-hover:  var(--p-brand-600);
  --c-primary-soft:   var(--p-brand-50);
  --c-on-primary:     var(--p-neutral-0);

  --c-surface-page:   var(--p-neutral-50);
  --c-surface-card:   var(--p-neutral-0);
  --c-surface-sunken: var(--p-neutral-100);

  --c-text-heading:   var(--p-neutral-900);
  --c-text-body:      var(--p-neutral-600);
  --c-text-muted:     var(--p-neutral-400);

  --c-border:         var(--p-neutral-200);
  --c-border-strong:  var(--p-neutral-400);

  --c-success: var(--p-green-500);  --c-success-soft: var(--p-green-50);
  --c-warning: var(--p-amber-500);  --c-warning-soft: var(--p-amber-50);
  --c-danger:  var(--p-red-500);    --c-danger-soft:  var(--p-red-50);

  /* Trạng thái ô slot — dùng ở lưới tuần */
  --c-slot-free:   var(--p-brand-50);
  --c-slot-picked: var(--p-brand-500);
  --c-slot-held:   var(--p-amber-50);
  --c-slot-full:   var(--p-neutral-100);
  --c-slot-closed: transparent;
}
```

### 1.3. Luật bắt buộc

* Component **cấm** viết mã hex. Cấm dùng `--p-*`. Chỉ được dùng `--c-*`.
* Thêm ESLint rule chặn `#[0-9a-fA-F]{3,8}` trong `className` và `style`.
* Đưa vào checklist PR (§7).

---

## 2. Hai mật độ, một bộ component (D-24)

Luồng khách cần thoáng. Lưới tuần 44 hàng và trang admin cần gọn. Nhưng **không viết 2 bộ component** — chỉ đổi biến qua một thuộc tính trên phần tử bọc.

```html
<div data-density="comfortable">   <!-- luồng khách -->
<div data-density="compact">       <!-- admin, quầy, lưới tuần -->
```

```css
[data-density="comfortable"] {
  --d-radius-card:16px; --d-radius-ctl:12px;
  --d-row-h:48px; --d-font:16px; --d-pad-card:20px; --d-gap:16px;
}
[data-density="compact"] {
  --d-radius-card:6px;  --d-radius-ctl:6px;
  --d-row-h:36px; --d-font:14px; --d-pad-card:12px; --d-gap:8px;
}
```

| | Khách (`comfortable`) | Admin/Quầy (`compact`) |
| :-- | :-- | :-- |
| Bo góc thẻ | 16px | 6px |
| Chiều cao hàng | 48px | 36px |
| Cỡ chữ nền | 16px | 14px |
| Padding thẻ | 20px | 12px |
| Đổ bóng | `shadow-sm` | không |

---

## 3. Typography (sửa lỗi #1)

| Vai trò | Class | px | Weight |
| :-- | :-- | --: | :-- |
| Display (hero landing) | `text-5xl md:text-6xl` | 48 / 60 | 700 |
| H1 — tiêu đề trang | `text-3xl md:text-4xl` | 30 / 36 | 600 |
| H2 — tiêu đề bước | `text-2xl` | 24 | 600 |
| H3 — tiêu đề thẻ | `text-lg` | 18 | 600 |
| Body | `text-base` | 16 | 400 |
| Body nhỏ / mô tả | `text-sm` | 14 | 400 |
| Caption / nhãn | `text-xs` | 12 | 500 |
| **Giá tiền** | `text-xl font-semibold tabular-nums` | 20 | 600 |
| **Ô slot trong lưới** | `text-xs tabular-nums` | 12 | 500 |

**Font**: `Be Vietnam Pro` (Google Fonts, dấu tiếng Việt tốt), fallback `system-ui, sans-serif`.

> ⚠️ Cấm cỡ chữ ngoài thang này. `tabular-nums` cho **mọi** con số tiền và giờ để các cột thẳng hàng — đặc biệt quan trọng ở lưới tuần.

---

## 4. Bộ component

```
components/ui/          Button Card Modal Sheet Chip Badge Input Select Textarea
                        EmptyState Skeleton Stepper PriceTag Countdown Toast Tooltip
components/domain/      ServiceIconGrid ServicePickerSheet InlineNudge CartBar
                        WeekGrid SlotCell BookingCard VehicleCard TierProgress BayBadge
```

### 4.1. Badge trạng thái booking

| Trạng thái | Nền | Chữ | Nhãn |
| :-- | :-- | :-- | :-- |
| `PENDING_DEPOSIT` | `--c-warning-soft` | `--p-amber-700` | Chờ thanh toán cọc |
| `CONFIRMED` | `--c-primary-soft` | `--p-brand-600` | Đã xác nhận |
| `CHECKED_IN` | `--p-violet-50` | `--p-violet-700` | Đã đến quầy |
| `IN_PROGRESS` | `--c-primary-soft` | `--p-brand-600` | Đang thực hiện |
| `AWAITING_CONFIRM` | `--c-warning-soft` | `--p-amber-700` | Chờ bạn xác nhận |
| `COMPLETED` | `--c-success-soft` | `--p-green-700` | Hoàn thành |
| `NO_SHOW` | `--c-surface-sunken` | `--c-text-body` | Không đến |
| `CANCELLED` | `--c-danger-soft` | `--p-red-700` | Đã hủy |

Badge **luôn có cả màu và chữ**. Không bao giờ chỉ dùng màu — khoảng 8% nam giới mù màu.

---

## 5. Wireframe

### 5.1. Bước 2 — Lưới icon chọn dịch vụ

Tách riêng khối **combo** và khối **dịch vụ đơn** (D-05).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ①Chi nhánh ── ②Dịch vụ ── ③Ngày giờ ── ④Xe ── ⑤Xem lại ── ⑥Xác nhận │
├──────────────────────────────────────────────────────────────────────────┤
│  BƯỚC 2 / 6 · Chọn dịch vụ                                               │
│  Giá theo xe Sedan. Chọn xe ở bước 4 xong, giá sẽ tính lại chính xác. ⓘ │
│                                                                          │
│  GÓI COMBO ─────────────────────────────────── tiết kiệm hơn chọn lẻ    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│  │  [icon]   │ │  [icon]   │ │  [icon]   │ │  [icon]   │                │
│  │   BASIC   │ │  DETAIL   │ │ ULTIMATE  │ │ BẢO DƯỠNG │                │
│  │từ 180.000đ│ │từ 280.000đ│ │từ 640.000đ│ │từ 880.000đ│                │
│  │  30 phút  │ │  30 phút  │ │  45 phút  │ │  75 phút  │                │
│  │           │ │           │ │ Phổ biến  │ │   Mới     │                │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘                │
│                                                                          │
│  DỊCH VỤ ĐƠN ───────────────────────────── chọn đúng thứ bạn cần        │
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐              │
│  │Rửa xe││Vệ sinh││Vệ sinh││Xử lý ││Bảo vệ││ Thay ││ Thay │              │
│  │      ││ trong ││ ngoài ││bề mặt││      ││ dầu  ││ lốp  │              │
│  │2 mục ││ 8 mục ││ 8 mục ││6 mục ││9 mục ││3 mục ││6 mục │              │
│  └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘              │
├──────────────────────────────────────────────────────────────────────────┤
│  2 dịch vụ · từ 230.000đ   [Xem chi tiết ⌃]      [ Tiếp theo → ]        │ sticky
└──────────────────────────────────────────────────────────────────────────┘
```

**Lưu ý**: thời lượng hiển thị là **thời gian chiếm khoang** (`duration + buffer`), không phải thời gian làm thuần — đúng cái khách quan tâm khi xếp lịch. VW Basic ghi 30 phút chứ không phải 20 phút.

### 5.2. Modal chọn dịch vụ

```
        ┌────────────────────────────────────────────────────────┐
        │  Rửa xe & Combo                                  [✕]  │
        ├────────────────────────────────────────────────────────┤
        │ ┌────────────────────────────────────────────────────┐ │
        │ │ ☑  VW Ultimate Wash                    640.000đ   │ │
        │ │    45 phút (làm 40′ + dọn khoang 5′)              │ │
        │ │    ┌──────────────────────────────────────────┐   │ │
        │ │    │ CHI TIẾT DỊCH VỤ                         │   │ │
        │ │    │ · Rửa xe ngoài  · Rửa gầm                │   │ │
        │ │    │ · Hút bụi + lau nội thất                 │   │ │
        │ │    │ · Vệ sinh mặt sau lazang, khe kẽ         │   │ │
        │ │    │ · Dưỡng nhựa nhám & ron cửa (Boronax)    │   │ │
        │ │    │ · Khử mùi C-AirFog                       │   │ │
        │ │    │ · Wax sáp bóng Carnauba                  │   │ │
        │ │    │ Phù hợp: xe có mùi nhẹ, đi mưa, đi xa.   │   │ │
        │ │    └──────────────────────────────────────────┘   │ │
        │ └────────────────────────────────────────────────────┘ │
        │ ┌────────────────────────────────────────────────────┐ │
        │ │ ☐  Rửa xe ngoài                         90.000đ   │ │
        │ │    ⚠ Đã có trong gói VW Ultimate Wash             │ │
        │ └────────────────────────────────────────────────────┘ │
        ├────────────────────────────────────────────────────────┤
        │  Đã chọn: 1 dịch vụ · 640.000đ            [ Xong ]     │
        └────────────────────────────────────────────────────────┘
```

* Mô tả mặc định **thu gọn**; chỉ mục đang chọn mới bung.
* Dịch vụ đã nằm trong combo → dòng cảnh báo `⚠`, checkbox **vẫn bấm được** (D-06).
* Đóng bằng ✕ · `Esc` · click ra ngoài. Lựa chọn được giữ.
* **Nhóm Thay lốp** có thêm bộ chọn số lượng và ô nhập thông số lốp:

```
        │ ☑  Lốp 205/60R16                     1.800.000đ/lốp │
        │    Số lượng:  ( 1 )  ( 2 )  [ 4 ]                    │
        │    Thông số:  [ 205/60R16 ]  ⓘ xem ở hông lốp       │
        │    ☐ Tôi không rõ — nhờ nhân viên kiểm tra          │
        │    ─────────────────────────────────────────────    │
        │    4 lốp × 1.800.000đ                = 7.200.000đ   │
        │    Công thay 4 bánh          miễn phí (thay đủ bộ)  │
```

### 5.3. Nhắc inline sau khi chọn (D-16) — **không dùng dialog**

Đóng modal → quay về trang lưới icon → một dải nhắc **trượt vào** ngay trên thanh giỏ hàng. Không chặn thao tác, không cướp focus, không phải dialog.

```
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ✓ Đã thêm VW Ultimate Wash · 640.000đ                       [✕]  │ │
│  │   Bạn muốn chọn thêm dịch vụ nào nữa không?                       │ │
│  │   [ Chọn thêm ]                              [ Tiếp tục → ]       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  1 dịch vụ · từ 640.000đ  [Xem chi tiết ⌃]         [ Tiếp theo → ]      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Hành vi:**

| Điều kiện | Xử lý |
| :-- | :-- |
| Hiện ra | Trượt lên 200ms, nền `--c-success-soft`, viền trái `--c-success` 3px |
| Tự ẩn | Sau **8 giây**, mờ dần — thanh giỏ hàng vẫn còn nên không mất thông tin |
| Bấm `Chọn thêm` | Cuộn mượt lên khối lưới icon, làm sáng nhẹ các nhóm chưa chọn |
| Bấm `Tiếp tục` | Sang bước 3 |
| Bấm `✕` | Ẩn ngay, **ghi nhớ trong session** — lần sau chỉ hiện toast gọn 3 giây |
| Chọn thêm dịch vụ thứ 2 | Không hiện lại toàn bộ, chỉ cập nhật số trong thanh giỏ |

> Lý do bỏ dialog: dialog chặn màn hình, bắt khách phải trả lời mới làm được việc khác. Khách đang muốn chọn tiếp thì bị chặn đúng lúc — hỏng nhịp. Dải inline nói cùng nội dung mà không giành quyền điều khiển.

**Cấm dùng `position: fixed` cho dải này** — nó phải nằm trong luồng, đẩy nội dung xuống, để không che thanh giỏ hàng.

### 5.4. Bước 3 — Lưới tuần 15 phút (D-14, D-15)

Bố cục theo đúng ảnh mẫu: 8 cột ngày, các hàng là mốc 15 phút.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  (‹) Tuần trước        [ Tháng 7, 2026  ⌄ ]         Tuần tiếp theo (›)      │
├──────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────────┤
│          │   20   │   21   │   22   │   23   │   24   │   25   │   26       │
│ Ngày&giờ │ (T2)   │ (T3)   │ (T4)   │ (T5)   │ (T6)   │ (T7)   │ (CN)       │  ← dính
│          │ hôm nay│        │        │        │        │        │            │
├──────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────────┤
│  08:30   │   –    │   ○    │   ○    │   ○    │   ○    │   ○    │    ○       │
│  08:45   │   –    │   ○    │   ○    │   ○    │   ○    │   ○    │    ○       │
│  09:00   │   –    │   ○    │   ○    │   ○    │   ○    │   ○    │    ○       │
│  09:15   │   –    │   ○    │   ○    │   ○    │   ○    │   ◐    │    ○       │
│  09:30   │   –    │   ○    │   ○    │   ○    │   ○    │   ●    │    ○       │
│  09:45   │   –    │   ✕    │   ○    │   ○    │   ○    │   ●    │    ○       │
│  10:00   │   –    │   ✕    │   ○    │   ○    │   ○    │   ●    │    ○       │
│    ⋮     │        │        │        │        │        │        │            │  ← cuộn dọc
├──────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────────┤
│  ○ còn chỗ   ◐ còn 1 chỗ   ● bạn đang chọn   ✕ hết chỗ   – ngoài giờ/quá hạn │
│  Dịch vụ của bạn cần 45 phút → chiếm 3 ô liên tiếp                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Quy tắc hiển thị:**

| Ký hiệu | Ý nghĩa | Nền | Bấm được |
| :-- | :-- | :-- | :-- |
| `○` | Còn ≥ 2 khoang trống | `--c-slot-free` | ✅ |
| `◐` | Chỉ còn 1 khoang | `--c-slot-held` | ✅ có nhãn *"Còn 1 chỗ"* |
| `●` | Đang chọn (cả block liên tiếp) | `--c-slot-picked` | ✅ bấm lại để bỏ |
| `✕` | Hết khoang, hoặc không đủ ô liên tiếp | `--c-slot-full` | ❌ |
| `–` | Ngoài giờ mở cửa, quá khứ, hoặc chưa đủ 90 phút đặt trước | `--c-slot-closed` | ❌ |

**Chi tiết kỹ thuật:**

* Cột giờ **dính trái**, hàng ngày **dính trên** — cuộn 44 hàng vẫn biết mình đang ở đâu.
* Hover một ô → **làm sáng cả block** sẽ chiếm (3 ô nếu dịch vụ 45 phút), kèm tooltip `10:00 – 10:45`.
* Chọn một ô → tô cả block, hiện `● ● ●`.
* Cột **Thứ 7** nền `--p-brand-50` nhạt, **Chủ nhật** nền `--p-red-50` nhạt — theo quy ước lịch trong ảnh mẫu.
* Cột **hôm nay** có viền trái `--c-primary` 2px.
* Dropdown tháng để nhảy nhanh; hai nút mũi tên đi từng tuần.
* Ô ngoài cửa sổ đặt trước theo hạng (BR-004) hiện `–` kèm tooltip *"Hạng Silver đặt trước tối đa 10 ngày"*.
* **Polling 10 giây** khi khách đang ở màn này — ô vừa bị người khác giữ chuyển `✕` ngay, kèm hiệu ứng nhấp nháy nhẹ 1 lần (BR-030).

**Với dịch vụ `flexible`** — không hiện lưới, thay bằng:

```
│  Dịch vụ bạn chọn cần khảo sát tình trạng xe thực tế.                   │
│  Chọn giờ mong muốn, nhân viên sẽ gọi xác nhận trong 30 phút.           │
│                                                                         │
│  Ngày:  [ 23/07/2026 ▾ ]      Giờ mong muốn:  [ 10 ] : [ 00 ]          │
```

### 5.5. Bước 5 — Xem lại (nơi chốt giá)

```
┌──────────────────────────────────────────────────────────────────┐
│  BƯỚC 5 / 6 — Xem lại thông tin                                 │
│                                                                  │
│  Chi nhánh                                          [ Sửa ]     │
│    CN Tân Phú · 87 Tân Thắng, P. Tân Sơn Nhì                    │
│  ──────────────────────────────────────────────────────────────  │
│  Thời gian                                          [ Sửa ]     │
│    Thứ 2, 21/07/2026 · 10:00 – 10:45 · Khoang rửa nhanh         │
│  ──────────────────────────────────────────────────────────────  │
│  Xe                                                 [ Sửa ]     │
│    Mazda CX-5 · 51G-123.45 · SUV/CUV                            │
│  ──────────────────────────────────────────────────────────────  │
│  Dịch vụ                                            [ Sửa ]     │
│    VW Ultimate Wash                              640.000đ       │
│    Rửa gầm                                        50.000đ       │
│                                              ───────────────    │
│    Tạm tính (giá Sedan)                          690.000đ       │
│    Điều chỉnh size SUV/CUV  (×1,2)              +138.000đ       │
│    Voucher AWP-50K                               −50.000đ       │
│                                              ═══════════════    │
│    TỔNG ĐƠN                                      778.000đ       │
│  ──────────────────────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cọc giữ chỗ (trả ngay qua VNPAY)             200.000đ    │ │
│  │  Còn lại thanh toán tại quầy                  578.000đ    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ──────────────────────────────────────────────────────────────  │
│  Ghi chú thêm cho nhân viên                                     │
│    [ Xe mới đi mưa, nội thất hơi ẩm...           ]  23/300     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tạo tài khoản miễn phí để nhận 778 điểm cho đơn này       │ │ ← chỉ guest
│  │  và voucher 50.000đ cho lần sau.       [ Tạo ngay → ]      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│         [ ← Quay lại ]      [ Thanh toán cọc 200.000đ → ]      │
└──────────────────────────────────────────────────────────────────┘
```

Dòng **"Điều chỉnh size SUV/CUV (×1,2)"** là mấu chốt — biến việc giá tăng so với bước 2 thành minh bạch có giải thích, thay vì cảm giác bị đội giá.

### 5.6. Màn check-in của khách (lỗi #12)

```
┌──────────────────────────────────────────┐
│  Lịch hẹn hôm nay                        │
│  ┌────────────────────────────────────┐  │
│  │ AWP-381927        [Đã xác nhận]   │  │
│  │ 10:00 – 10:45 · CN Tân Phú        │  │
│  │ VW Ultimate Wash + Rửa gầm        │  │
│  │ Mazda CX-5 · 51G-123.45           │  │
│  │ Còn phải trả: 578.000đ            │  │
│  │                                    │  │
│  │   Còn 12 phút nữa tới giờ hẹn     │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │    TÔI ĐÃ ĐẾN QUẦY          │ │  │ ← chỉ bật trong T−30′ → T+10′
│  │  └──────────────────────────────┘ │  │
│  │  [ Tôi đang trên đường ]          │  │ ← gia hạn 15 phút
│  │  [ Yêu cầu đổi lịch ]             │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

Khi thợ báo xong (`AWAITING_CONFIRM`):

```
│  │  Xe của bạn đã hoàn thành!         │  │
│  │  Vui lòng kiểm tra trước khi xác   │  │
│  │  nhận. Sau 15 phút hệ thống sẽ tự  │  │  ← nói rõ luật auto-confirm
│  │  xác nhận giúp bạn.   ⏱ 14:32     │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   XÁC NHẬN ĐÃ NHẬN XE       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  [ Có vấn đề, cần hỗ trợ ]         │  │
```

> Đồng hồ đếm ngược phải **nói rõ** hệ thống sẽ tự xác nhận (BR-031). Tự động làm thay người dùng mà không báo trước là mất lòng tin.

---

## 6. Trạng thái rỗng / lỗi / loading

### 6.1. Empty states

| Màn hình | Tiêu đề | Mô tả | Hành động |
| :-- | :-- | :-- | :-- |
| Garage chưa có xe | Chưa có xe nào | Thêm xe để đặt lịch nhanh hơn lần sau | `+ Thêm xe đầu tiên` |
| Chưa có booking | Bạn chưa có lịch hẹn nào | Đặt trước để không phải chờ tại cửa hàng | `Đặt lịch ngay` |
| Tuần kín lịch | Tuần này đã kín | Thử tuần sau hoặc đổi chi nhánh gần đó | `Tuần sau` · `Đổi chi nhánh` |
| Ví voucher rỗng | Chưa có voucher nào | Bạn còn 320 điểm, cần thêm 180 điểm để đổi voucher 50.000đ | `Cửa hàng đổi thưởng` |
| Lịch sử điểm rỗng | Chưa có biến động điểm | Hoàn thành lần rửa đầu tiên để bắt đầu tích điểm | `Đặt lịch ngay` |
| Admin: chưa có booking | Hôm nay chưa có lịch hẹn | Dữ liệu tự cập nhật khi có khách đặt | `Xem ngày khác` |
| Tìm kiếm không ra | Không tìm thấy "51G-999" | Thử tìm bằng số điện thoại hoặc tên khách | `Xóa bộ lọc` |

**Công thức**: một câu nói *đang trống*, một câu nói *làm gì tiếp*, một nút. Không bao giờ chỉ để chữ "Không có dữ liệu".

### 6.2. Error states

| Tình huống | Thông điệp | Phục hồi |
| :-- | :-- | :-- |
| Mất mạng | Mất kết nối mạng. Đang thử lại… | Tự retry 3 lần, backoff 2s/4s/8s |
| API 500 | Hệ thống đang bận. Vui lòng thử lại sau ít phút. | Nút `Thử lại` |
| OTP sai (#4) | Mã OTP không đúng. Bạn còn **2** lần thử. | **Giữ nguyên form**, không reset |
| OTP hết hạn | Mã đã hết hạn sau 5 phút. | `Gửi lại mã` (đếm ngược 60s) |
| OTP sai quá 3 lần | Sai quá 3 lần. Thử lại sau 15 phút. | Đếm ngược, cho đổi số điện thoại |
| Google chưa có SĐT | Cần số điện thoại để nhân viên liên hệ khi bạn tới. | Ô nhập + OTP xác thực (BR-034) |
| **Slot vừa bị giữ** (BR-030) | Khung giờ 10:00 vừa có người giữ chỗ. | **3 slot gần nhất, bấm là chọn luôn** |
| Hết khoang | Giờ này đã kín cả 4 khoang. | 3 khung giờ trống gần nhất |
| VNPAY thất bại | Thanh toán chưa thành công. Lịch hẹn vẫn được giữ **12:34** nữa. | `Thử lại` · `Đổi phương thức` |
| Voucher sai hạng | Voucher này chỉ áp dụng cho hạng Gold trở lên. | Tự bỏ voucher, tính lại giá |
| Đã có booking đang chạy | Bạn đang có lịch hẹn **AWP-381927** chưa hoàn tất. | `Xem lịch đó` · `Yêu cầu đổi lịch` |

> Cấm hiện thông điệp kỹ thuật: không `NullPointerException`, không `500 Internal Server Error`, không stack trace. `GlobalExceptionHandler` map sang tiếng Việt thân thiện.

### 6.3. Loading states

| Chỗ | Kiểu |
| :-- | :-- |
| Lưới icon dịch vụ | Skeleton — 7 ô xám shimmer |
| **Lưới tuần** | Skeleton — 8 cột × 10 hàng xám, **giữ nguyên kích thước** để không nhảy layout |
| Danh sách booking (admin) | Skeleton 5 hàng |
| Bấm nút Tiếp theo | Chữ đổi `Đang xử lý…` + spinner trong nút, nút `disabled` |
| Thanh toán VNPAY | Overlay toàn màn + *"Vui lòng không tắt trình duyệt"* |
| Infinite scroll (#11) | Skeleton 3 hàng cuối + `IntersectionObserver` cách đáy 200px |

**Nguyên tắc**: dưới 300ms không hiện gì (tránh nhấp nháy). Trên 300ms hiện skeleton. Trên 10 giây thêm dòng *"Đang mất nhiều thời gian hơn thường lệ…"* kèm nút Hủy.

### 6.4. Chống double-submit

Mọi nút gây tác dụng phụ (tạo booking, thanh toán, check-in, xác nhận hoàn thành) **bắt buộc**:

1. `disabled` ngay khi bấm, mở lại khi có phản hồi
2. Gửi header `Idempotency-Key` (UUID sinh phía client, **giữ nguyên khi retry**)
3. Backend lưu key 24h → request trùng key trả về kết quả cũ, không tạo bản ghi mới

Đây là thứ trực tiếp ngăn **lỗi #9** tái diễn (BR-028).

---

## 7. Responsive & Mobile

### 7.1. Breakpoints

| Tên | Bề rộng | Thiết bị |
| :-- | :-- | :-- |
| `base` | < 640px | Điện thoại — **thiết kế chính** |
| `sm` | ≥ 640px | Điện thoại ngang |
| `md` | ≥ 768px | Tablet |
| `lg` | ≥ 1024px | Laptop |
| `xl` | ≥ 1280px | Admin |

### 7.2. Bảng biến đổi

| Thành phần | Mobile (< 640px) | Tablet | Desktop |
| :-- | :-- | :-- | :-- |
| Stepper | `Bước 2/6` + thanh tiến trình | Icon + số | Icon + số + nhãn |
| Lưới combo | 2 cột | 3 cột | 4 cột |
| Lưới dịch vụ đơn | 3 cột | 4 cột | 7 cột 1 hàng |
| Modal dịch vụ | **Bottom sheet** 90vh, kéo xuống đóng | Modal `max-w-lg` | Modal `max-w-2xl` |
| **Lưới tuần** | **Giữ nguyên 8 cột**, cuộn 2 chiều — xem §7.3 | 8 cột vừa màn | 8 cột vừa màn |
| Nhắc inline | Chiếm hết bề ngang, trên thanh giỏ | như desktop | như desktop |
| Giỏ hàng | Sticky đáy, bấm bung lên | Sticky đáy | Sidebar phải |
| Màn Xem lại | 1 cột dọc | 1 cột | 2 cột |
| Bảng Admin | Thẻ card thay bảng | Bảng cuộn ngang | Bảng đầy đủ |
| Màn Quầy | Tab chuyển cột | 2 cột | 4 cột theo khoang |

### 7.3. Lưới tuần trên mobile (D-15)

Anh chọn **giữ nguyên lưới tuần** trên điện thoại. Vấn đề: 8 cột × 44px = 352px cộng cột giờ 56px = **408px**, rộng hơn màn iPhone SE (375px). Cách xử lý:

```
┌─────────────────────────────────┐  màn 375px
│ (‹)  Tháng 7, 2026 ⌄       (›) │
├──────┬────┬────┬────┬────┬─────┤
│      │ 20 │ 21 │ 22 │ 23 │ 24 →│  ← cuộn ngang, cột giờ DÍNH TRÁI
│ Giờ  │ T2 │ T3 │ T4 │ T5 │ T6  │
├──────┼────┼────┼────┼────┼─────┤
│ 08:30│ –  │ ○  │ ○  │ ○  │ ○   │
│ 08:45│ –  │ ○  │ ○  │ ○  │ ○   │  ← cuộn dọc
│  ⋮   │    │    │    │    │     │
└──────┴────┴────┴────┴────┴─────┘
   56px  ←──── 5 cột hiện, vuốt ngang xem tiếp ────→
```

* Cột giờ `position: sticky; left: 0` — vuốt ngang vẫn biết đang xem giờ nào.
* Hàng ngày `position: sticky; top: 0`.
* Ô slot: rộng **44px**, cao **44px** — đúng chuẩn WCAG, không thu nhỏ.
* Hiện ~5 cột, vuốt ngang xem 3 cột còn lại. Có bóng mờ mép phải báo hiệu còn nội dung.
* **Không** dùng `-webkit-overflow-scrolling` cả hai chiều trên cùng một phần tử — tách vùng cuộn ngang và dọc để iOS không giật.

### 7.4. Quy tắc chạm

* Vùng chạm tối thiểu **44 × 44px**.
* Hai nút hành động ngược nhau cách nhau tối thiểu **8px**.
* CTA chính ở **đáy màn**, trong tầm ngón cái.
* Ô số điện thoại / biển số: `inputMode="numeric"`.
* Ô OTP: 6 ô riêng, `autoComplete="one-time-code"` để iOS tự điền từ SMS.

### 7.5. Accessibility

* Icon chỉ có hình → thêm `aria-label`.
* Modal: khóa focus, `Esc` đóng, trả focus về nút đã mở.
* Trạng thái luôn có chữ kèm màu (§4.1).
* Tương phản chữ/nền ≥ **4.5:1**.
* **Lưới tuần điều hướng được bằng phím mũi tên**; ô slot là `<button>` thật, không phải `<div onClick>`.
* `prefers-reduced-motion` → tắt hiệu ứng trượt bước và nhấp nháy ô slot.

---

## 8. Checklist bàn giao FE (dán vào PR template)

```
[ ] Đủ 4 trạng thái: loading (skeleton) / empty / error / success
[ ] KHÔNG có mã hex trong component — chỉ dùng --c-*
[ ] KHÔNG dùng --p-* trực tiếp trong component
[ ] Chỉ dùng cỡ chữ trong thang §3
[ ] Đã bọc đúng data-density (comfortable cho khách, compact cho admin)
[ ] Test ở 375px và 1440px
[ ] Vùng chạm ≥ 44px trên mobile
[ ] Nút gây tác dụng phụ có disabled + Idempotency-Key
[ ] Không còn kiểu `any`
[ ] Component < 300 dòng
[ ] Số tiền dùng tabular-nums, format vi-VN (778.000đ)
[ ] Ngày giờ hiển thị GMT+7, truyền API bằng ISO 8601 UTC
[ ] Không dùng position:fixed cho dải nhắc inline
```
