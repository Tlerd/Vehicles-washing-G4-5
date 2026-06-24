# HƯỚNG DẪN VÀ LOG DỰ ÁN CHO AGENT (AGENTS.md)

Tài liệu này chứa các quy định chung của dự án và nhật ký cập nhật (log) cho cả hai phần Back-end (BE) và Front-end (FE) để các Agent tiếp theo dễ dàng nắm bắt trạng thái dự án.

---

## 1. QUY ĐỊNH CHUNG
*   Mọi thay đổi liên quan đến cấu trúc, logic nghiệp vụ quan trọng đều phải được ghi nhận lại trong thư mục [learnings/](file:///d:/demoSWP/demo1/.agents/learnings/).
*   Tuân thủ nghiêm ngặt bộ quy tắc riêng của từng phần (BE/FE) nằm trong thư mục `.agents` tương ứng.
*   **Bắt buộc thực hiện demo giao diện bằng Stitch để khách hàng và cố vấn thống nhất trước khi tiến hành code Front-end.**
*   **Hiểu rõ ngữ cảnh phát triển và tách biệt các lớp (decoupling). Khi chưa có dữ liệu/API thật từ Back-end, phải chạy Mock Data trước để kiểm thử độc lập.**

---

## 2. NHẬT KÝ CẬP NHẬT DỰ ÁN (PROJECT UPDATE LOG)

### Back-end (BE)
*   **2026-06-24**: Thiết lập bộ quy tắc phát triển BE bằng Java Spring Boot dành cho sinh viên.
    *   *Chi tiết quy tắc*: Xem tại [Back-end/.agents/rules/rules.md](file:///d:/demoSWP/demo1/Back-end/.agents/rules/rules.md).
    *   *Chi tiết thiết kế & quyết định*: Xem tại [2026-06-24-backend-rules-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-backend-rules-design.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-brainstorm-backend-rules.md](file:///d:/demoSWP/demo1/.agents/learnings/2026-06-24-brainstorm-backend-rules.md).

### Front-end (FE)
*   **2026-06-24**: Thiết lập bộ quy tắc phát triển FE bằng React, TypeScript và Tailwind CSS dành cho sinh viên.
    *   *Chi tiết quy tắc*: Xem tại [Front-end/.agents/rules/rules.md](file:///d:/demoSWP/demo1/Front-end/.agents/rules/rules.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-brainstorm-frontend-rules.md](file:///d:/demoSWP/demo1/.agents/learnings/2026-06-24-brainstorm-frontend-rules.md).
*   **2026-06-24**: Hoàn thành thảo luận & thống nhất luồng đặt lịch (Booking Wizard Flow) và Đăng nhập cho AutoWash Pro.
    *   *Chi tiết thiết kế*: Xem tại [2026-06-24-autowash-pro-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-autowash-pro-design.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-autowash-pro-brainstorming.md](file:///d:/demoSWP/demo1/.agents/learnings/2026-06-24-autowash-pro-brainstorming.md).
*   **2026-06-24**: Hoàn thành nâng cấp Front-end với 6 bước Booking Wizard, Customer Dashboard, Washing Counter và Admin Portal chạy offline bằng Mock Data.
    *   *Chi tiết kế hoạch*: Xem tại [2026-06-24-autowash-pro-loyalty-admin-plan.md](file:///d:/demoSWP/demo1/docs/superpowers/plans/2026-06-24-autowash-pro-loyalty-admin-plan.md).
    *   *Nhật ký chi tiết*: Xem tại [2026-06-24-autowash-pro-frontend-implementation.md](file:///d:/demoSWP/demo1/.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md).

---

## 3. QUY ĐỊNH PHIÊN LÀM VIỆC & PHỐI HỢP NHÓM (DEVELOPMENT SESSION & TEAM WORKFLOW)
*   **Quy mô nhóm phát triển**: Dự án được phát triển bởi nhóm **6 người**.
*   **Xác nhận danh tính phiên làm việc**:
    *   **Hỏi tên 1 lần duy nhất**: Agent chỉ thực hiện **hỏi tên của lập trình viên 1 lần duy nhất** khi dự án vừa được tải (clone) từ GitHub về máy tính lần đầu để làm việc. Khi đã xác định được tên, các phiên sau không cần hỏi lại.
    *   **Nếu tên là Anh**: Tiếp tục sử dụng file nhật ký/cập nhật chung như cũ (tập tin `.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md` hoặc tệp cập nhật chung hiện tại).
    *   **Nếu tên khác**: Agent phải tạo một file nhật ký mới nằm trong thư mục `.agents/learnings/` có tên dạng `journal-[tên].md` (ví dụ: `journal-binh.md`) để bắt đầu lưu trữ thông tin và ghi chép hoạt động của phiên làm việc đó.
*   **Quy tắc đọc hiểu và ghi nhận log**:
    *   Khi lấy code hoặc tham chiếu logic từ phần việc của thành viên khác, Agent phải đọc tệp nguồn và file log của thành viên đó để hiểu đầy đủ ngữ cảnh.
    *   Tuyệt đối **KHÔNG ghi đè hoặc chỉnh sửa** vào tệp log của người khác. Lập trình viên nào thì chỉ ghi nhật ký vào tệp log mang tên người đó.
*   **Quy định xóa sạch Front-end (FE) để tái thiết kế/rebuild**:
    *   **CHÚ Ý QUAN TRỌNG**: Ở phiên tiếp theo bắt đầu viết code Front-end, Agent bắt buộc phải **xóa sạch toàn bộ thư mục/tệp tin Front-end hiện có** (trừ các file cấu hình quan trọng nếu cần) để xây dựng và biên dịch lại giao diện FE hoàn toàn mới từ đầu nhằm tránh xung đột code cũ.



