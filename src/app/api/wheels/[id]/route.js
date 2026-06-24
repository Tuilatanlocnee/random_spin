import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wheel from "@/lib/models/Wheel";

/**
 * API GET: Lấy thông tin chi tiết một vòng quay theo ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params; // await params để tương thích Next.js 15+
    await dbConnect();

    const wheel = await Wheel.findById(id);
    if (!wheel) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy vòng quay" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: wheel }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Lỗi khi lấy thông tin vòng quay: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * API PUT: Cập nhật thông tin vòng quay
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const body = await request.json();
    
    const updatedData = {};
    if (body.title !== undefined) updatedData.title = body.title;
    if (body.names !== undefined) {
      if (!Array.isArray(body.names) || body.names.length === 0) {
        return NextResponse.json(
          { success: false, error: "Danh sách tên không hợp lệ" },
          { status: 400 }
        );
      }
      updatedData.names = body.names;
    }
    if (body.removeOnHit !== undefined) updatedData.removeOnHit = body.removeOnHit;

    const wheel = await Wheel.findByIdAndUpdate(id, updatedData, {
      new: true, // Trả về đối tượng sau khi update
      runValidators: true, // Chạy trình xác thực schema
    });

    if (!wheel) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy vòng quay để cập nhật" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: wheel }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Lỗi khi cập nhật vòng quay: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * API DELETE: Xóa một vòng quay khỏi cơ sở dữ liệu
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const deletedWheel = await Wheel.findByIdAndDelete(id);

    if (!deletedWheel) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy vòng quay để xóa" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Xóa vòng quay thành công" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Lỗi khi xóa vòng quay: " + error.message },
      { status: 500 }
    );
  }
}
