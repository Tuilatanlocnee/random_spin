import mongoose from "mongoose";

// Định nghĩa cấu trúc Schema cho Vòng Quay (Wheel)
const WheelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Vui lòng cung cấp tiêu đề cho vòng quay"],
      trim: true,
      maxlength: [100, "Tiêu đề không được vượt quá 100 ký tự"],
      default: "Vòng quay ngẫu nhiên",
    },
    names: {
      type: [String],
      required: [true, "Vòng quay phải có ít nhất một tên"],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Danh sách tên không được để trống",
      },
    },
    removeOnHit: {
      type: Boolean,
      default: false, // Mặc định là vẫn giữ lại tên trên vòng quay sau khi trúng
    },
  },
  {
    // Tự động thêm trường createdAt và updatedAt
    timestamps: true,
  }
);

// Tránh lỗi Compile model khi chạy hot-reload trong Next.js
export default mongoose.models.Wheel || mongoose.model("Wheel", WheelSchema);
