import mongoose from "mongoose";

// Lấy MONGODB_URI từ biến môi trường
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Vui lòng định nghĩa biến môi trường MONGODB_URI trong file .env"
  );
}

/**
 * Trong môi trường development, Next.js sử dụng cơ chế hot reloading.
 * Nếu không cache kết nối, mỗi lần reload sẽ tạo ra một kết nối mới tới MongoDB
 * dẫn đến việc cạn kiệt tài nguyên kết nối của database.
 * Ở đây chúng ta lưu kết nối vào biến toàn cục (global) được bảo toàn qua các lần reload.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
