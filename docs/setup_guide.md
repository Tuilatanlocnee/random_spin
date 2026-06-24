# Hướng dẫn Cài đặt & Sử dụng Vòng Quay Random (Full Stack Next.js + MongoDB)

Tài liệu này cung cấp hướng dẫn từng bước để cài đặt, cấu hình và chạy thử nghiệm ứng dụng Vòng Quay Random trên môi trường cục bộ (Localhost).

---

## 1. Tổng quan Kiến trúc

Ứng dụng được thiết kế theo mô hình **Full Stack Single Page App (SPA)** sử dụng **Next.js (React)** tích hợp sẵn API Routes ở Backend để giao tiếp trực tiếp với cơ sở dữ liệu **MongoDB**.

- **Frontend (Giao diện)**:
  - Khởi tạo giao diện bằng React.
  - Sử dụng Canvas HTML5 để vẽ vòng quay và pháo hoa động, tối ưu hóa hiệu năng render 60fps mượt mà.
  - Sử dụng **Web Audio API** để tự động tạo âm thanh tích tắc và âm thanh chúc mừng trực tiếp từ trình duyệt mà không cần file âm thanh phụ trợ bên ngoài.
  - Sử dụng Vanilla CSS để thiết kế giao diện Glassmorphism và Dark Mode hiện đại, sang trọng.
- **Backend (API)**:
  - Các API Routes `/api/wheels` và `/api/wheels/[id]` phụ trách lưu trữ, chỉnh sửa và xóa cấu hình vòng quay.
- **Database (Cơ sở dữ liệu)**:
  - **MongoDB** đóng vai trò lưu trữ lâu dài danh sách tên, cài đặt vòng quay để người dùng có thể chia sẻ và tải lại trên thiết bị khác thông qua một ID duy nhất.
  - Sử dụng **Mongoose** để giao tiếp và kiểm tra tính hợp lệ của dữ liệu trước khi ghi vào database.

---

## 2. Yêu cầu Hệ thống (Prerequisites)

Để khởi chạy dự án, hệ thống của bạn cần đáp ứng các điều kiện sau:
- **Node.js**: Phiên bản **v18+** (Khuyên dùng v20+ hoặc v24+).
- **MongoDB**: Máy chủ MongoDB đang chạy cục bộ (Localhost) ở cổng `27017` hoặc tài khoản **MongoDB Atlas** trực tuyến.

---

## 3. Cấu hình Biến môi trường

Trước khi chạy ứng dụng, hãy làm theo các bước sau để thiết lập kết nối Database:

1. Sao chép file cấu hình mẫu `.env.example` thành file `.env` ở thư mục gốc:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và cập nhật đường dẫn kết nối MongoDB của bạn (nếu dùng cổng mặc định cục bộ thì có thể giữ nguyên):
   ```env
   MONGODB_URI=mongodb://localhost:27017/random_spin
   ```

---

## 4. Hướng dẫn Chạy từng bước (Step-by-step)

Mở Terminal tại thư mục gốc dự án `d:\random_spin` và thực hiện các lệnh sau:

### Bước 1: Cài đặt Dependencies
Cài đặt các gói thư viện cần thiết:
```bash
npm install
```
*Kết quả mong đợi:* Terminal sẽ hiển thị quá trình tải và kết thúc với thông báo `added x packages... audited y packages in z seconds`.

### Bước 2: Chạy Server Phát triển (Development Server)
Khởi chạy dự án ở chế độ phát triển:
```bash
npm run dev
```
*Kết quả mong đợi:* Terminal hiển thị thông tin sẵn sàng:
```text
▲ Next.js 16.2.9 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.x.x:3000
✓ Ready in 708ms
```

### Bước 3: Kiểm tra trên Trình duyệt
Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000).
*Kết quả mong đợi:* Giao diện ứng dụng Vòng Quay Random Premium hiện lên ở chế độ Dark Mode với vòng quay mặc định chứa 8 tên và bảng điều khiển ở bên phải.

---

## 5. Kịch bản Kiểm thử (Test Cases)

Hãy thực hiện các bước sau để kiểm tra toàn bộ tính năng của ứng dụng:

### Kịch bản 1: Thêm/Sửa danh sách tên và quay thử
1. Nhập danh sách tên mới của bạn vào khung Textarea ở bên phải (Mỗi tên trên một dòng).
2. Quan sát vòng quay: Các phần màu sắc của vòng quay sẽ tự động chia đều góc vẽ tương ứng với số lượng tên bạn đã nhập.
3. Nhấp vào nút **QUAY** ở giữa vòng quay hoặc bấm nút quay tương ứng.
4. **Kết quả mong đợi**:
   - Vòng quay bắt đầu tăng tốc và giảm tốc dần từ từ.
   - Nghe thấy tiếng "tích tắc" (tick sound) mỗi khi vòng quay lướt qua kim chỉ màu đỏ bên phải.
   - Khi dừng lại, pháo hoa rực rỡ sẽ bắn khắp màn hình.
   - Một Modal thông báo chúc mừng người chiến thắng hiện lên ở giữa màn hình.

### Kịch bản 2: Tùy chọn Loại bỏ hoặc Giữ lại tên trúng
1. Sau khi Kịch bản 1 kết thúc và Modal chúc mừng xuất hiện:
   - Thử click nút **Đóng (Giữ lại tên)**: Xác nhận Modal đóng, pháo hoa dừng và tên người trúng vẫn còn trên vòng quay.
   - Quay lại lần nữa. Khi Modal xuất hiện, click nút **Loại bỏ tên này khỏi vòng quay**: Xác nhận tên người vừa trúng biến mất khỏi cả vòng quay lẫn danh sách Textarea.
2. Tích chọn checkbox **Tự động loại bỏ tên trúng** trong phần Tùy chọn quay.
3. Thực hiện quay. Khi vòng quay dừng, click nút **Đóng**: Xác nhận tên trúng tự động biến mất mà không cần bạn bấm nút loại bỏ thủ công.

### Kịch bản 3: Lưu trữ và Chia sẻ vòng quay (MongoDB)
1. Đặt tên tiêu đề vòng quay của bạn (Ví dụ: "Chọn món ăn trưa nay").
2. Nhấp vào nút **Lưu lên Server**.
3. **Kết quả mong đợi**:
   - Ứng dụng gọi API kết nối tới MongoDB để lưu lại.
   - Xuất hiện một khung viền đứt nét màu xanh chứa đường dẫn chia sẻ (Dạng: `http://localhost:3000/?id=xxxx`).
   - Đường dẫn trên URL trình duyệt tự động cập nhật thêm tham số `?id=xxxx`.
   - Danh sách "Vòng quay gần đây của bạn" ở góc dưới bên phải cập nhật thêm vòng quay vừa lưu kèm ngày tạo và số lượng tên.
4. Copy link chia sẻ đó, mở một tab ẩn danh mới hoặc trình duyệt khác và dán link vào.
5. **Kết quả mong đợi**: Trang web tự động tải đúng tiêu đề, danh sách tên và các cấu hình bạn đã lưu từ database lên vòng quay.
