# BỘ QUY TẮC PHÁT TRIỂN FRONT-END (REACT + TS + TAILWIND) CHO SINH VIÊN

Tài liệu này định nghĩa các tiêu chuẩn thiết kế mã nguồn, cấu trúc thư mục, quy tắc viết CSS/Tailwind, TypeScript và cách tích hợp dữ liệu với Back-end nhằm đảm bảo dự án dễ hiểu, dễ quản lý (High Cohesion) và dễ bảo trì.

---

## 1. Cấu Trúc Thư Mục Chuẩn (Vite hoặc Next.js)

Đối với dự án sử dụng React (Vite hoặc Next.js), cấu trúc thư mục trong gói `src/` (hoặc root đối với Next.js) được khuyến nghị như sau:

```text
src
│
├── assets                 # Tài nguyên tĩnh (Hình ảnh, SVG, Fonts, Icons...)
│
├── components             # Các React Component dùng chung cho toàn bộ dự án (Button, Input, Modal...)
│
├── config                 # Cấu hình hệ thống (Axios client, các biến môi trường env...)
│
├── context                # Quản lý trạng thái toàn cục (AuthContext, ThemeContext...)
│
├── hooks                  # Các custom hooks dùng chung (useAuth, useDebounce...)
│
├── layouts                # Các khung giao diện chung (AdminLayout, ClientLayout, AuthLayout...)
│
├── pages (hoặc app)       # Tầng hiển thị trang chính (Home, Login, Dashboard...)
│
├── services               # Lớp gọi API (Gửi request HTTP lên Spring Boot Backend)
│
├── types                  # Định nghĩa TypeScript interfaces/types
│
└── utils                  # Các hàm tiện ích (Format date, format tiền tệ, helper...)
```

### Quy tắc bắt buộc:
1. **Chia nhỏ Component**: Khi một Component vượt quá 300 dòng code, bắt buộc phải chia nhỏ nó thành các Component con độc lập.
2. **Mock Data trước**: Thiết lập các Mock Data trong pages/components để kiểm tra giao diện trước khi kết nối API thật.
3. **Demo Stitch trước**: Thực hiện demo giao diện bằng công cụ Stitch để thống nhất thiết kế với người dùng trước khi tiến hành viết mã nguồn (code) Front-end.

---

## 2. Quy Tắc Viết Code HTML & CSS/Tailwind

### 2.1. Sử Dụng Semantic HTML
*   Bắt buộc dùng các thẻ ngữ nghĩa của HTML5 thay vì lạm dụng `<div>` lồng nhau:
    *   `<header>`: Phần đầu trang (Navigation, Logo).
    *   `<nav>`: Liên kết điều hướng chính.
    *   `<main>`: Phần nội dung chính (Chỉ có duy nhất 1 thẻ `<main>` trên một trang).
    *   `<section>`: Phân đoạn nội dung riêng biệt.
    *   `<article>`: Một bài viết hoặc khối nội dung độc lập.
    *   `<footer>`: Phần chân trang.
*   **Cấm dùng Style nội tuyến (Inline Styles)**: Không dùng thuộc tính `style="..."` trực tiếp trên mã HTML, ngoại trừ các trường hợp giá trị cần tính toán động bằng JS (ví dụ: `style={{ width: `${progress}%` }}`).

### 2.2. Quy Tắc Sử Dụng Tailwind CSS
Để giữ cho giao diện nhất quán và dễ thay đổi giao diện (theme) sau này:
*   **Định nghĩa Design System trong `tailwind.config.js`**:
    *   Cấu hình các màu sắc chủ đạo (`primary`, `secondary`, `accent`, `neutral`) và font chữ chính trong file config.
    *   *Ví dụ*:
        ```javascript
        module.exports = {
          theme: {
            extend: {
              colors: {
                primary: '#1E3A8A',    // Màu xanh chủ đạo
                secondary: '#10B981',  // Màu xanh lá phụ
                accent: '#F59E0B',     // Màu nhấn
                neutral: '#374151',    // Màu chữ chính
              },
            },
          },
        }
        ```
*   **Hạn chế Giá trị Tùy biến (Arbitrary Values)**:
    *   Hạn chế viết các class tự định nghĩa giá trị trực tiếp như `bg-[#1E3A8A]`, `text-[13px]`, `w-[342px]`.
    *   Sử dụng các class tiêu chuẩn dựa trên cấu hình: `bg-primary`, `text-sm`, `w-80`.
*   **Tái sử dụng style bằng React Component**:
    *   Nếu một cụm CSS Tailwind lặp lại nhiều lần (ví dụ: style cho nút bấm), hãy tạo một React Component chuyên biệt (như `<Button />`) thay vì copy-paste class Tailwind nhiều nơi.

---

## 3. Quy Tắc Viết JavaScript / TypeScript

### 3.1. Viết Code JS/TS Hiện Đại (ES6+)
*   Sử dụng `const` và `let`, tuyệt đối không sử dụng `var`.
*   Sử dụng Arrow Functions (`const handleClick = () => {}`).
*   Tận dụng Destructuring (`const { name, age } = user`) và Spread Operator (`...`).
*   Sử dụng các hàm duyệt mảng của ES6: `map()`, `filter()`, `reduce()`, `find()` thay cho các vòng lặp `for`/`while` truyền thống.

### 3.2. TypeScript Nghiêm Ngặt
*   **Cấm sử dụng kiểu `any`**: Mọi biến, tham số hàm, thuộc tính props của Component và dữ liệu nhận về từ API đều phải định nghĩa `type` hoặc `interface` rõ ràng.
*   Tạo các tệp tin type dùng chung trong thư mục `src/types/` (ví dụ: `user.type.ts`, `product.type.ts`).

### 3.3. React Hooks & Components
*   Chỉ sử dụng **Functional Components** kết hợp với **Hooks** (`useState`, `useEffect`, `useContext`...). Không sử dụng Class Components kiểu cũ.
*   Quản lý Side Effects (`useEffect`): Luôn chỉ định rõ ràng mảng phụ thuộc (dependency array `[]`) để tránh lặp vô hạn (infinite loop).

---

## 4. Quy Trình Phối Hợp & Kết Nối API với Back-end

### 4.1. Quy trình kết nối API
1.  **Giao diện & Mock Data trước**: FE tạo giao diện và mockup các dữ liệu dạng tĩnh.
2.  **Thống nhất API Contract**: Dựa vào Mock Data của FE, đội BE sẽ xây dựng các API khớp với định dạng dữ liệu đó và cung cấp tài liệu Swagger.
3.  **Tích hợp**: FE sử dụng Axios (hoặc Fetch) cấu hình trong thư mục `services/` để gọi API thật.

### 4.2. Cấu hình Authenticate JWT
*   Lưu trữ token: Nhận Access Token từ API đăng nhập của BE và lưu vào `LocalStorage` hoặc `SessionStorage`.
*   Đính kèm token tự động: Sử dụng Axios Interceptors để đính kèm token vào Header `Authorization: Bearer <token>` trên mỗi request gửi đi.
*   Xử lý lỗi Token hết hạn (401/403): Cấu hình interceptor để bắt lỗi 401/403 từ server để tự động chuyển người dùng về trang đăng nhập.

### 4.3. Xử lý Ngày Tháng (Date & Time)
*   **Định dạng gửi/nhận**: Truyền nhận ngày tháng ở định dạng chuẩn **ISO 8601 UTC** (`yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`).
*   **Hiển thị**: FE nhận dữ liệu UTC từ BE và thực hiện định dạng sang múi giờ địa phương (GMT+7) khi hiển thị lên giao diện.

---

## 5. Quy Định Phiên Làm Việc Nhóm (6 Người) & Quản Lý Logs
*   **Số lượng thành viên**: Nhóm phát triển có **6 thành viên**.
*   **Hỏi tên 1 lần duy nhất**: Agent chỉ hỏi tên của lập trình viên **1 lần duy nhất** khi dự án vừa được tải (clone) từ GitHub về máy tính lần đầu để làm việc. Khi đã xác định được tên, các phiên sau không cần hỏi lại.
    *   **Nếu là Anh**: Tiếp tục ghi nhận các chỉnh sửa vào file cập nhật chung như cũ (`.agents/learnings/2026-06-24-autowash-pro-frontend-implementation.md`).
    *   **Nếu là thành viên khác**: Agent tạo thêm file nhật ký mới tên dạng `.agents/learnings/journal-[tên].md` để lưu lại quá trình làm việc của cá nhân đó.
*   **Quy tắc tham chiếu chéo**: Khi mượn code hoặc tham chiếu logic từ tệp của người khác, phải đọc kỹ file nguồn và file log của họ để nắm rõ ngữ cảnh. Tuyệt đối không ghi đè log của người khác, chỉ ghi vào log của mình.
*   **Xóa sạch Front-end để build lại**:
    *   **BẮT BUỘC**: Ở phiên tiếp theo bắt đầu viết code Front-end, Agent phải **xóa sạch toàn bộ thư mục Front-end hiện tại** (hoặc các file mã nguồn FE cũ) để xây dựng và biên dịch lại giao diện từ đầu, tránh các lỗi xung đột tệp tin cũ.

