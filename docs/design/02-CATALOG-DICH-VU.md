# 02 — CATALOG DỊCH VỤ, COMBO & BẢNG GIÁ

> Nguồn dữ liệu chính: API thật của VinaWash `https://vinawash.vn/wp-json/vinawash-booking/v1/config`, trích xuất 2026-07-20.
> Quyết định nguồn: D-03, D-04, D-05, D-06 tại [00-QUYET-DINH-REFACTOR.md](00-QUYET-DINH-REFACTOR.md).

---

## 1. Mô hình giá (cập nhật BR-001)

Giữ nguyên hệ số nhân theo size xe, **bổ sung 1 cờ boolean**:

| Size xe | Hệ số `K_size` |
| :-- | :-- |
| Hatchback | `0.9` |
| **Sedan (chuẩn)** | **`1.0`** |
| SUV / CUV | `1.2` |
| Pickup / Luxury | `1.4` |

```
Thành tiền = ROUND( base_price × (is_size_dependent ? K_size : 1.0) , 1000 )
```

### Vì sao phải có `is_size_dependent`

Dữ liệu thật cho thấy **5 dịch vụ đồng giá cho mọi size** — vì công việc không phụ thuộc kích thước thân xe:

| Dịch vụ | Small | Medium | Large | Lý do đồng giá |
| :-- | --: | --: | --: | :-- |
| Vệ sinh nội soi / dàn lạnh | 1.200.000 | 1.200.000 | 1.200.000 | Làm trên dàn lạnh, không liên quan thân xe |
| Vệ sinh nội soi 2 dàn lạnh | 1.700.000 | 1.700.000 | 1.700.000 | như trên |
| Xử lý vị trí ngồi (1 vị trí) | 350.000 | 350.000 | 350.000 | Tính theo **số ghế**, không theo size |
| Khử mùi C-Air Fog | 300.000 | 300.000 | 300.000 | Tính theo lượng dung dịch cố định |
| Khử mùi máy Ozone | 200.000 | 200.000 | 200.000 | Tính theo thời gian chạy máy |

Nếu nhân hệ số 1.4 cho pickup ở các dịch vụ này thì tính sai **140.000đ** trên một lần vệ sinh dàn lạnh. Cờ `is_size_dependent = false` xử lý đúng mà không phá cấu trúc BR-001.

**Ngoài ra, 3 dịch vụ mới tính theo đơn vị khác**, dùng `pricing_unit`:

| `pricing_unit` | Ý nghĩa | Ví dụ |
| :-- | :-- | :-- |
| `per_car` | Mặc định, 1 lần / 1 xe | Rửa xe, ceramic |
| `per_seat` | Nhân theo số ghế khách chọn | Xử lý vị trí ngồi |
| `per_panel` | Nhân theo số tấm/cặp | Đánh bóng kính, đèn pha |
| `per_tire` | Nhân theo số lốp (1–4) | Thay lốp |

> ⚠️ **Base price = cột `Medium` của VinaWash** (tương ứng Sedan, hệ số 1.0). Cách quy đổi này giữ khớp với tài liệu cũ của nhóm — `FR-004 AC-1` đã dùng VW Basic Wash = 180.000đ làm giá gốc.

---

## 1b. Thời lượng và số slot (D-14)

Slot đổi từ 30 phút xuống **15 phút**. Nhưng thời lượng thật là 20′, 40′, 45′ — 20 và 40 **không chia hết cho 15**.

Giải bằng cách tách **thời gian làm** khỏi **thời gian dọn khoang**:

```
số_slot_chiếm = CEIL( (duration_min + buffer_min) / 15 )
```

| Dịch vụ | `duration` | `buffer` | Chiếm | Slot | Loại khoang |
| :-- | --: | --: | --: | --: | :-- |
| Rửa xe ngoài | 20′ | 10′ | 30′ | 2 | `QUICK` |
| Rửa gầm | 20′ | 10′ | 30′ | 2 | `QUICK` |
| VW Basic Wash | 20′ | 10′ | 30′ | 2 | `QUICK` |
| VW Detail Wash | 20′ | 10′ | 30′ | 2 | `QUICK` |
| VW Ultimate Wash | 40′ | 5′ | 45′ | 3 | `QUICK` |
| Combo Bảo dưỡng nhanh | 65′ | 10′ | 75′ | 5 | `QUICK` |
| Vệ sinh khoang máy | 60′ | 15′ | 75′ | 5 | `DETAIL` |
| Vệ sinh nội thất Super Clean | 120′ | 15′ | 135′ | 9 | `DETAIL` |
| Thay dầu (trọn gói) | 45′ | 10′ | 55′ | 4 | `DETAIL` |
| Thay lốp | 20′/lốp | 5′ | tùy SL | — | `DETAIL` |

**`buffer_min` không phải con số bịa để lấp chỗ.** Đó là thời gian có thật ngoài đời: đưa xe ra, xịt dọn khoang, đưa xe kế tiếp vào. Không thể xe này ra là xe kia vào ngay.

Giờ mở cửa 07:00–18:00 → **44 slot/ngày/khoang**.

> 💡 **Hiển thị cho khách**: ghi **thời gian chiếm khoang**, không ghi thời gian làm thuần. VW Basic hiện *"30 phút"* chứ không phải *"20 phút"* — đó mới là con số khách cần để xếp lịch của mình.

---

## 2. Cấu trúc lưới icon (D-05)

Khách vào **Bước 2** thấy 2 khối tách bạch — đúng yêu cầu *"chia dữ liệu ra đơn và combo thành icon riêng biệt"*:

```
╔══════════════════════════════════════════════════════════════════╗
║  🎁  GÓI COMBO  —  tiết kiệm hơn chọn lẻ                         ║
╠═══════════════╦═══════════════╦═══════════════╦═════════════════╣
║   🚿 BASIC    ║   ✨ DETAIL   ║  👑 ULTIMATE  ║  🔧 BẢO DƯỠNG   ║
║   từ 180.000đ ║   từ 280.000đ ║   từ 640.000đ ║   từ 930.000đ   ║
║   20 phút     ║   20 phút     ║   40 phút     ║   65 phút       ║
╚═══════════════╩═══════════════╩═══════════════╩═════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  🧩  DỊCH VỤ ĐƠN  —  chọn đúng thứ bạn cần                       ║
╠═══════════╦═══════════╦═══════════╦═══════════╦═════════╦════════╣
║  🚿 Rửa   ║ 🪑 Vệ sinh║ ✨ Vệ sinh║ 💎 Xử lý  ║ 🛡 Bảo  ║ 🛢 Thay║
║     xe    ║   trong   ║   ngoài   ║  bề mặt   ║   vệ    ║  dầu   ║
║  2 dịch vụ║  8 dịch vụ║  8 dịch vụ║  6 dịch vụ║ 9 dịch  ║ 3 dịch ║
╠═══════════╬═══════════╩═══════════╩═══════════╩═════════╩════════╣
║  🛞 Thay  ║                                                       ║
║     lốp   ║                                                       ║
║  6 dịch vụ║                                                       ║
╚═══════════╩═══════════════════════════════════════════════════════╝
```

Bấm bất kỳ icon nào → mở **modal** chứa danh sách dịch vụ của nhóm đó. Chi tiết layout modal: [04-UI-UX-SPEC.md §2.2](04-UI-UX-SPEC.md).

---

## 3. GÓI COMBO

### 3.1. VW Basic Wash — `180.000đ` · 20 phút · `slot`

Rửa xe ngoài · Rửa gầm · Hút bụi nội thất · Lau nội thất cơ bản.

*Phù hợp khi*: xe bẩn nhẹ, rửa định kỳ hằng tuần.

### 3.2. VW Detail Wash — `280.000đ` · 20 phút · `slot`

Toàn bộ Basic Wash, cộng thêm: vệ sinh chuyên sâu mặt sau lazang · vệ sinh khe kẽ nội thất phức tạp · dưỡng bảo vệ nhựa nhám đen ngoại thất bằng Boronax VRP · dưỡng ron cửa nội thất.

*Phù hợp khi*: xe đi mưa, lâu chưa chăm sóc kỹ.

### 3.3. VW Ultimate Wash — `640.000đ` · 40 phút · `slot`

Toàn bộ Detail Wash, cộng thêm: **khử mùi C-AirFog** · **Wax sáp bóng Carnauba cao cấp**.

*Phù hợp khi*: xe có mùi nhẹ, đi xa, hoặc muốn trải nghiệm gói cao cấp nhất.

### 3.4. 🆕 Combo Bảo Dưỡng Nhanh — `930.000đ` · 65 phút · `slot`

> **`[ĐỀ XUẤT MỚI]`** — Do nhóm thiết kế, tận dụng 2 nhóm dịch vụ mới. Anh Đức Anh duyệt trước khi triển khai.

VW Basic Wash + Thay dầu bán tổng hợp trọn gói.
Giá lẻ: `180.000 + 750.000 = 930.000đ`. **Đề xuất bán 880.000đ** (giảm 50.000đ) để combo có lý do tồn tại.

*Lập luận nghiệp vụ*: đây là combo duy nhất khiến khách quay lại theo **chu kỳ cố định 5.000km** thay vì ngẫu hứng — giá trị vòng đời khách hàng cao nhất trong toàn catalog.

---

## 4. Bảng combo bao gồm dịch vụ nào (`combo_includes`) — chống trùng (D-06)

Bảng này **chỉ dùng để cảnh báo UI**, không ảnh hưởng tính tiền.

| Combo | Bao gồm sẵn các dịch vụ đơn |
| :-- | :-- |
| VW Basic Wash | Rửa xe ngoài · Rửa gầm |
| VW Detail Wash | Rửa xe ngoài · Rửa gầm |
| VW Ultimate Wash | Rửa xe ngoài · Rửa gầm · **Khử mùi C-Air Fog** · **Wax bóng sáp sơn xe** |
| Combo Bảo Dưỡng Nhanh | Rửa xe ngoài · Rửa gầm · Thay dầu bán tổng hợp · Thay lọc dầu |

**Hành vi UI**: khách đã chọn `VW Ultimate Wash`, sau đó tick `Khử mùi C-Air Fog` →

> ⚠️ *Gói VW Ultimate Wash đã bao gồm Khử mùi C-AirFog. Vẫn thêm sẽ tính tiền 2 lần.*
> `[ Bỏ tick ]`   `[ Vẫn thêm ]`

Không chặn cứng — có khách thật sự muốn khử mùi 2 lượt cho xe hôi nặng.

---

## 5. DỊCH VỤ ĐƠN — Bảng giá đầy đủ

> Cột **Giá gốc** = giá Sedan (`K_size = 1.0`). Cột `Size?` = `is_size_dependent`.

### 5.1. 🚿 Rửa xe (2) — `slot`

| Dịch vụ | Giá gốc | Thời lượng | Size? | Đơn vị |
| :-- | --: | :-- | :-: | :-- |
| Rửa xe ngoài | 90.000 | 20 phút | ✅ | `per_car` |
| Rửa gầm | 50.000 | 20 phút | ✅ | `per_car` |

### 5.2. 🪑 Vệ sinh trong (8) — `flexible`

| Dịch vụ | Giá gốc | Thời lượng | Size? | Đơn vị |
| :-- | --: | :-- | :-: | :-- |
| Vệ sinh nội thất Super Clean | 1.400.000 | 120 phút | ✅ | `per_car` |
| Vệ sinh nội thất Ultimate Clean | 1.900.000 | 180 phút | ✅ | `per_car` |
| Vệ sinh nội thất Ultimate Clean Plus | 2.300.000 | 180 phút | ✅ | `per_car` |
| Xử lý vị trí ngồi trên nội thất | 350.000 | 60 phút | ❌ | `per_seat` |
| Vệ sinh nội soi / dàn lạnh | 1.200.000 | 90 phút | ❌ | `per_car` |
| Vệ sinh nội soi 2 dàn lạnh | 1.700.000 | 120 phút | ❌ | `per_car` |
| Khử mùi công nghệ C-Air Fog | 300.000 | 30 phút | ❌ | `per_car` |
| Khử mùi bằng máy Ozone | 200.000 | 30 phút | ❌ | `per_car` |

**Phân biệt 3 gói nội thất** (viết vào modal để khách không hỏi staff):

* **Super Clean** — giặt ghế, trần, taplo, tapi 4 cửa, cửa gió, khử mùi Ozone, dưỡng da & nhựa. **Không tháo ghế.**
* **Ultimate Clean** — **tháo toàn bộ ghế** để làm sạch sàn và khe khuất dưới chân ghế.
* **Ultimate Clean Plus** — tháo ghế **và tháo sàn**, giặt thảm sàn riêng. Dành cho xe mùi nặng, ẩm mốc sâu, đổ chất lỏng, ngập nước nhẹ.

### 5.3. ✨ Vệ sinh ngoài (8) — `flexible`

| Dịch vụ | Giá gốc | Thời lượng | Size? |
| :-- | --: | :-- | :-: |
| Vệ sinh khoang máy | 800.000 | 60 phút | ✅ |
| Tẩy nhựa đường | 400.000 | 30 phút | ✅ |
| Tẩy bụi sơn, bụi sắt | 700.000 | 45 phút | ✅ |
| Tẩy ố kính | 700.000 | 45 phút | ✅ |
| Tẩy gầm ô tô | 900.000 | 60 phút | ✅ |
| Tẩy ố Chrome | 250.000 | 20 phút | ✅ |
| Tẩy nhựa cây | 250.000 | 20 phút | ✅ |
| Vệ sinh mâm bánh lazang trong ngoài (4 bánh) | 500.000 | 45 phút | ✅ |

### 5.4. 💎 Xử lý bề mặt (6) — `flexible`

| Dịch vụ | Giá gốc | Size? | Đơn vị |
| :-- | --: | :-: | :-- |
| Đánh bóng sơn xe Basic | 1.500.000 | ✅ | `per_car` |
| Đánh bóng sơn xe hiệu chỉnh | 2.200.000 | ✅ | `per_car` |
| Đánh bóng kính lái / lưng | 1.800.000 | ✅ | `per_panel` |
| Đánh bóng kính sườn ô tô | 1.200.000 | ✅ | `per_panel` |
| Đánh bóng đèn pha ô tô | 900.000 | ✅ | `per_panel` (1 cặp) |
| Wax bóng sáp sơn xe | 600.000 | ✅ | `per_car` |

* **Basic** — đánh bóng 1 bước, xóa xước dăm quầng xoáy nhẹ **60–70%**.
* **Hiệu chỉnh** — 3 bước chuẩn 3M, xóa xước sâu **90–98%**. Bắt buộc làm trước khi phủ ceramic.

### 5.5. 🛡 Bảo vệ (9) — `flexible`

| Dịch vụ | Giá gốc | Size? |
| :-- | --: | :-: |
| Phủ Nano kính | 1.300.000 | ✅ |
| Phủ gầm ô tô | 3.500.000 | ✅ |
| Pro Coating (Ceramic 2 lớp) | 8.500.000 | ✅ |
| Ultimate Coating (Ceramic 3 lớp) | 9.500.000 | ✅ |
| Phim cách nhiệt 3M Crystalline | 15.600.000 | ✅ |
| PPF Dopon Save Protection (7.5 mil) | 21.000.000 | ✅ |
| PPF Dopon Shining (7.5 mil) | 30.000.000 | ✅ |
| PPF Tecwrap (6.5 mil) | 30.000.000 | ✅ |
| PPF Tecwrap M75 (7.5 mil) | 42.000.000 | ✅ |

> 💡 **Lưu ý thiết kế**: nhóm này có đơn tới **42 triệu** — mức cọc theo bậc (BR-017) rất quan trọng ở đây. Đồng thời các dịch vụ này mất 1–3 ngày, **không thể** dùng slot 30 phút → bắt buộc `booking_mode = flexible`.

---

## 6. 🆕 NHÓM MỚI: Thay dầu (3)

> **Nguồn giá**: khảo sát thị trường VN 2026 (xem §8). Giá gốc = Sedan, đã bao gồm **dầu + lọc dầu + công thợ**.

| Dịch vụ | Giá gốc | Thời lượng | Size? | Cơ sở tính |
| :-- | --: | :-- | :-: | :-- |
| Thay dầu bán tổng hợp (trọn gói) | 750.000 | 45 phút | ✅ | 4L × ~105.000đ/L + lọc ~200.000đ + công ~150.000đ |
| Thay dầu tổng hợp toàn phần (trọn gói) | 1.650.000 | 45 phút | ✅ | 4L × ~315.000đ/L + lọc ~250.000đ + công ~150.000đ |
| Thay lọc dầu (lẻ) | 250.000 | 20 phút | ❌ | Giá lọc thị trường 150.000–300.000đ |

**Kiểm chứng dải giá sau khi nhân hệ số:**

| | Hatchback ×0.9 | Sedan ×1.0 | SUV ×1.2 | Pickup ×1.4 |
| :-- | --: | --: | --: | --: |
| Bán tổng hợp | 675.000 | 750.000 | 900.000 | 1.050.000 |
| Tổng hợp toàn phần | 1.485.000 | 1.650.000 | 1.980.000 | 2.310.000 |

Dải bán tổng hợp `675k–1.050k` nằm gọn trong khoảng thị trường **500.000–1.500.000đ/lần**. ✅
Dải tổng hợp toàn phần cao hơn là **đúng** — dòng này dành cho Mercedes/BMW/Lexus dùng dầu 300–330k/lít và cần 6–8 lít. ✅

> ⚠️ Hệ số size ở đây đại diện cho **dung tích dầu** (xe nhỏ 3–4L, SUV/xe sang 6–8L), không phải kích thước thân xe. Ghi rõ trong tooltip để khách hiểu vì sao SUV đắt hơn.

---

## 7. 🆕 NHÓM MỚI: Thay lốp (6)

> ⚠️ **Toàn bộ nhóm này `is_size_dependent = false`** — giá lốp phụ thuộc **thông số lốp** (185/60R15, 205/60R16…), **không** phụ thuộc size thân xe. Đây là ví dụ rõ nhất cho thấy vì sao cờ này cần thiết.

| Dịch vụ | Giá | Đơn vị | Thời lượng | Nguồn |
| :-- | --: | :-- | :-- | :-- |
| Lốp 185/60R15 (Bridgestone / Michelin) | 1.400.000 | `per_tire` | 20 phút/lốp | Khảo sát |
| Lốp 205/60R16 (Bridgestone / Michelin) | 1.800.000 | `per_tire` | 20 phút/lốp | Khảo sát |
| Lốp 225/45R17 (Michelin) | 2.900.000 | `per_tire` | 20 phút/lốp | Khảo sát |
| Công thay + cân bằng động | 100.000 | `per_tire` | (gộp) | Nhóm chốt — D-26 |
| Đảo lốp 4 bánh | 150.000 | `per_car` | 30 phút | Nhóm chốt — D-26 |
| Vá lốp | 80.000 | `per_car` | 20 phút | Nhóm chốt — D-26 |

> **Tiền công 100.000đ/lốp đã chốt** (D-26), **miễn phí khi thay đủ 4 lốp**. Đây là cách làm phổ biến của garage Việt Nam, đồng thời tạo lý do để khách thay cả bộ thay vì thay lẻ. Giá lốp có nguồn thị trường (§8); riêng tiền công không đơn vị nào công bố nên nhóm tự đặt — vẫn ghi rõ để không trộn với dữ liệu có nguồn.

**UI đặc thù nhóm này** — modal phải có thêm:

1. **Bộ chọn số lượng lốp** (1 / 2 / 4) — mặc định 4, vì thay lẻ 1 lốp là ngoại lệ.
2. **Ô nhập thông số lốp** kèm gợi ý *"Xem thông số ở hông lốp xe, dạng 205/60R16"*.
3. Nếu khách không biết → nút *"Tôi không rõ, nhờ nhân viên kiểm tra"* → chuyển thành `booking_mode = flexible`, staff gọi xác nhận.

---

## 8. Nguồn tham chiếu giá thị trường

Giá thay dầu và thay lốp không có trong catalog VinaWash nên nhóm khảo sát thị trường VN:

* Chi phí thay nhớt ô tô trung bình `500.000 – 1.500.000đ/lần`; dầu bán tổng hợp `95.000–115.000đ/lít` (xe phổ thông Toyota/Honda/Mitsubishi), dầu tổng hợp `300.000–330.000đ/lít` (xe sang); công thợ + phụ kiện `100.000–200.000đ`; lọc dầu mới `150.000–300.000đ`; xe nhỏ cần 3–4L, SUV/xe sang cần 6–8L.
* Lốp Bridgestone từ `980.000đ/lốp`; Michelin từ `1.340.000đ/lốp`; `185/60R15 ≈ 1.400.000đ`; `205/60R16 ≈ 1.800.000đ`; cỡ 17 inch `2.500.000–3.000.000đ`; Bridgestone Alenza 17" ≈ `2.915.000đ`.

**Sources:**

- [Chi phí thay dầu ô tô — atomauto.vn](https://atomauto.vn/kien-thuc/thay-dau-o-to-bao-nhieu-tien.html)
- [Bảng giá thay dầu nhớt xe ô tô — 911workshop.vn](https://911workshop.vn/chi-phi-thay-dau-o-to-bao-nhieu-tien/)
- [Thay nhớt ô tô hết bao nhiêu tiền — 1cargara.vn](https://1cargara.vn/thay-nhot-o-to-het-bao-nhieu-tien.html)
- [Bảng giá bán lẻ lốp xe du lịch — bridgestone.com.vn](https://www.bridgestone.com.vn/vi/khuyen-mai/bang-gia-ban-le-lop-xe-du-lich-bridgestone)
- [Bảng giá lốp Michelin 2026 — natcenter.vn](https://natcenter.vn/lop-o-to/lop-michelin/)
- [Bảng giá lốp ô tô — thanhanautocare.com](https://thanhanautocare.com/lop-o-to)
- [Catalog dịch vụ & giá gốc — VinaWash](https://vinawash.vn/dat-lich-rua-xe/)

---

## 9. Schema đề xuất

```sql
CREATE TABLE service_categories (
    id            INT PRIMARY KEY IDENTITY,
    code          VARCHAR(40)  NOT NULL UNIQUE,   -- 'wash', 'interior', 'oil', 'tire'
    name          NVARCHAR(100) NOT NULL,
    icon          VARCHAR(40)  NOT NULL,          -- tên icon lucide-react
    display_group VARCHAR(10)  NOT NULL,          -- 'COMBO' | 'SINGLE'
    sort_order    INT          NOT NULL DEFAULT 0
);

CREATE TABLE services (
    id                 INT PRIMARY KEY IDENTITY,
    category_id        INT NOT NULL FOREIGN KEY REFERENCES service_categories(id),
    service_key        VARCHAR(60)  NOT NULL UNIQUE,
    name               NVARCHAR(150) NOT NULL,
    description        NVARCHAR(MAX) NULL,
    base_price         DECIMAL(12,0) NOT NULL,    -- giá Sedan (K_size = 1.0)
    is_size_dependent  BIT NOT NULL DEFAULT 1,    -- ⬅ cờ mới (D-03)
    pricing_unit       VARCHAR(20) NOT NULL DEFAULT 'per_car',
    booking_mode       VARCHAR(10) NOT NULL DEFAULT 'slot',   -- 'slot' | 'flexible'
    duration_min       INT NULL,                  -- thời gian làm thật
    buffer_min         INT NOT NULL DEFAULT 10,   -- ⬅ mới (D-14) dọn khoang, đưa xe ra vào
    required_bay_type  VARCHAR(20) NOT NULL DEFAULT 'QUICK',  -- ⬅ mới (D-17) QUICK|DETAIL|UNIVERSAL
    is_combo           BIT NOT NULL DEFAULT 0,
    is_active          BIT NOT NULL DEFAULT 1,
    sort_order         INT NOT NULL DEFAULT 0
);

-- Cảnh báo trùng (D-06) — chỉ dùng cho UI, không tính tiền
CREATE TABLE combo_includes (
    combo_id    INT NOT NULL FOREIGN KEY REFERENCES services(id),
    included_id INT NOT NULL FOREIGN KEY REFERENCES services(id),
    PRIMARY KEY (combo_id, included_id)
);

-- Chi tiết dịch vụ trong 1 booking (thay cho cột totalPrice đơn lẻ ở FR-005)
CREATE TABLE booking_items (
    id            INT PRIMARY KEY IDENTITY,
    booking_id    VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES bookings(id),
    service_id    INT NOT NULL FOREIGN KEY REFERENCES services(id),
    quantity      INT NOT NULL DEFAULT 1,
    unit_price    DECIMAL(12,0) NOT NULL,   -- CHỐT giá tại thời điểm đặt
    size_multiplier DECIMAL(3,2) NOT NULL,  -- CHỐT hệ số tại thời điểm đặt
    line_total    DECIMAL(12,0) NOT NULL
);
```

> 🔑 **`unit_price` và `size_multiplier` phải snapshot vào `booking_items`**, không join sang `services` khi hiển thị lịch sử. Nếu không, admin sửa giá hôm nay sẽ làm **sai toàn bộ báo cáo doanh thu quá khứ** — đây chính là nguyên nhân gốc của **lỗi #17 (dashboard revenue không chính xác)**.
