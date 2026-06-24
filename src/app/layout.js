import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vòng Quay Ngẫu Nhiên - Random Spin Wheel Premium",
  description:
    "Công cụ quay số và chọn tên ngẫu nhiên trực quan, mượt mà, không giới hạn lượt thêm dữ liệu. Hỗ trợ lưu trữ lên MongoDB, chia sẻ liên kết và tùy chọn loại bỏ tên sau khi trúng.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
