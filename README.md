# Vòng Quay Ngẫu Nhiên - Random Spin Wheel Premium

Ứng dụng vòng quay ngẫu nhiên trực quan, mượt mà và hiện đại (tương tự như [wheelofnames.com](https://wheelofnames.com/vi)) được xây dựng bằng **Next.js (React)** kết hợp với cơ sở dữ liệu **MongoDB**.

---

## 🌟 Tính năng Nổi bật

- **Vòng quay Canvas HTML5**: Hoạt động mượt mà với hiệu ứng gia tốc và giảm tốc vật lý (ease-out).
- **Không giới hạn dữ liệu**: Cho phép nhập danh sách tên tùy ý không giới hạn số lượng.
- **Tần suất trúng đồng đều**: Tất cả các tên đều có xác suất trúng giải bằng nhau (chia góc vẽ bằng nhau).
- **Âm thanh tích tắc sống động**: Tự động phát âm thanh tích tắc khi quay qua từng cung bằng **Web Audio API** (không cần tải file âm thanh ngoài).
- **Hiệu ứng pháo hoa ăn mừng**: Hiệu ứng Canvas pháo hoa rực rỡ bắn khắp màn hình khi tìm ra người chiến thắng.
- **Hai chế độ tùy chọn**:
  1. *Loại bỏ tên*: Tự động xóa tên người trúng khỏi danh sách cho các lượt quay sau.
  2. *Giữ lại tên*: Tiếp tục giữ lại tên của người trúng trên vòng quay.
- **Lưu trữ & Chia sẻ**: Lưu cấu hình vòng quay lên cơ sở dữ liệu **MongoDB** để lấy liên kết chia sẻ hoặc tải lại vòng quay trên các thiết bị khác nhau.
- **Giao diện Premium**: Thiết kế Dark Mode kết hợp Glassmorphism (kính mờ) sang trọng và bắt mắt.

---

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án

Để cài đặt và chạy ứng dụng này trên môi trường máy tính cục bộ của bạn, vui lòng tham khảo tài liệu hướng dẫn chi tiết tại đây:

👉 **[Hướng dẫn Cài đặt & Sử dụng chi tiết](file:///d:/random_spin/docs/setup_guide.md)**

### Tóm tắt các lệnh cơ bản:

1. **Cấu hình database**:
   Copy `.env.example` thành `.env` và điền chuỗi kết nối MongoDB của bạn.
2. **Cài đặt thư viện**:
   ```bash
   npm install
   ```
3. **Khởi chạy Server**:
   ```bash
   npm run dev
   ```
   Sau đó mở trình duyệt tại địa chỉ [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 16 (App Router), React 19, Vanilla CSS.
- **Backend API**: Next.js Route Handlers.
- **Database**: MongoDB & Mongoose.

Chúc bạn có những trải nghiệm thú vị với vòng quay!
