import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wheel from "@/lib/models/Wheel";

/**
 * API GET: Lấy danh sách các vòng quay gần đây
 */
export async function GET() {
  try {
    await dbConnect();
    // Lấy 10 vòng quay được cập nhật gần nhất
    const wheels = await Wheel.find({}).sort({ updatedAt: -1 }).limit(10);
    return NextResponse.json({ success: true, data: wheels }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách vòng quay: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * API POST: Tạo mới một vòng quay
 */
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!body.names || !Array.isArray(body.names) || body.names.length === 0) {
      return NextResponse.json(
        { success: false, error: "Danh sách tên không được trống" },
        { status: 400 }
      );
    }

    const newWheel = await Wheel.create({
      title: body.title || "Vòng quay ngẫu nhiên",
      names: body.names,
      removeOnHit: body.removeOnHit || false,
    });

    return NextResponse.json({ success: true, data: newWheel }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Không thể tạo vòng quay: " + error.message },
      { status: 500 }
    );
  }
}
