"use client";

import React, { useState, useEffect, useRef } from "react";
import SpinWheel from "@/components/SpinWheel";
import Fireworks from "@/components/Fireworks";

// Danh sách tên mặc định ban đầu
const DEFAULT_NAMES = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Lê Hoàng C",
  "Phạm Minh D",
  "Hoàng Anh E",
  "Vũ Quốc F",
  "Đỗ Diệu G",
  "Bùi Tấn H"
];

export default function Home() {
  // --- States ---
  const [names, setNames] = useState([]);
  const [inputText, setInputText] = useState("");
  const [wheelTitle, setWheelTitle] = useState("Vòng quay ngẫu nhiên");
  const [removeOnHit, setRemoveOnHit] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [removedNames, setRemovedNames] = useState([]); // Tên đã bị loại bỏ
  
  // Winner và Modal chúc mừng
  const [winner, setWinner] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Tương tác MongoDB
  const [savedWheels, setSavedWheels] = useState([]);
  const [currentWheelId, setCurrentWheelId] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Khởi tạo dữ liệu ---
  useEffect(() => {
    // 1. Đọc dữ liệu từ localStorage (nếu có)
    const localNames = localStorage.getItem("spin_wheel_names");
    const localTitle = localStorage.getItem("spin_wheel_title");
    const localRemove = localStorage.getItem("spin_wheel_remove_on_hit");

    let initialNames = DEFAULT_NAMES;
    if (localNames) {
      try {
        const parsed = JSON.parse(localNames);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialNames = parsed;
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu names từ localStorage");
      }
    }

    setNames(initialNames);
    setInputText(initialNames.join("\n"));
    if (localTitle) setWheelTitle(localTitle);
    if (localRemove) setRemoveOnHit(localRemove === "true");

    const localRemoved = localStorage.getItem("spin_wheel_removed_names");
    if (localRemoved) {
      try {
        const parsed = JSON.parse(localRemoved);
        if (Array.isArray(parsed)) {
          setRemovedNames(parsed);
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu removedNames từ localStorage");
      }
    }

    // 2. Tải danh sách vòng quay đã lưu gần đây từ MongoDB
    fetchSavedWheels();

    // 3. Kiểm tra xem có tải vòng quay cụ thể qua URL params (?id=xxx)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        loadWheelFromDb(id);
      }
    }
  }, []);

  // --- Tải danh sách vòng quay từ DB ---
  const fetchSavedWheels = async () => {
    try {
      const res = await fetch("/api/wheels");
      const result = await res.json();
      if (result.success) {
        setSavedWheels(result.data);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách vòng quay từ database:", e);
    }
  };

  // --- Tải thông tin vòng quay cụ thể từ DB ---
  const loadWheelFromDb = async (id) => {
    try {
      const res = await fetch(`/api/wheels/${id}`);
      const result = await res.json();
      if (result.success && result.data) {
        const wheel = result.data;
        setWheelTitle(wheel.title);
        setNames(wheel.names);
        setInputText(wheel.names.join("\n"));
        setRemoveOnHit(wheel.removeOnHit);
        setCurrentWheelId(wheel._id);
        
        // Tạo link chia sẻ
        const url = `${window.location.origin}/?id=${wheel._id}`;
        setShareUrl(url);
      } else {
        alert("Không tìm thấy vòng quay này trên hệ thống!");
        // Xóa query id trên URL để tránh lặp lại lỗi
        window.history.replaceState({}, document.title, "/");
      }
    } catch (e) {
      console.error("Lỗi khi tải vòng quay từ DB:", e);
    }
  };

  // --- Đồng bộ hóa tên nhập vào ---
  const handleNamesChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    
    // Tách dòng thành mảng tên, loại bỏ dòng trống
    const parsedNames = text
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    
    setNames(parsedNames);
    localStorage.setItem("spin_wheel_names", JSON.stringify(parsedNames));
  };

  // Thay đổi tiêu đề vòng quay
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setWheelTitle(title);
    localStorage.setItem("spin_wheel_title", title);
  };

  // Thay đổi cấu hình Loại bỏ khi trúng
  const handleRemoveOnHitChange = (e) => {
    const checked = e.target.checked;
    setRemoveOnHit(checked);
    localStorage.setItem("spin_wheel_remove_on_hit", checked ? "true" : "false");
  };

  // --- Các hành động trên danh sách tên ---
  
  // Xáo trộn danh sách tên (Shuffle)
  const handleShuffle = () => {
    if (names.length <= 1) return;
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setNames(shuffled);
    setInputText(shuffled.join("\n"));
    localStorage.setItem("spin_wheel_names", JSON.stringify(shuffled));
  };

  // Xóa sạch danh sách tên (Clear)
  const handleClear = () => {
    setNames([]);
    setInputText("");
    localStorage.setItem("spin_wheel_names", JSON.stringify([]));
  };

  // Khôi phục mặc định (Reset)
  const handleReset = () => {
    setNames(DEFAULT_NAMES);
    setInputText(DEFAULT_NAMES.join("\n"));
    setWheelTitle("Vòng quay ngẫu nhiên");
    setRemoveOnHit(false);
    setRemovedNames([]);
    setCurrentWheelId(null);
    setShareUrl("");
    localStorage.setItem("spin_wheel_names", JSON.stringify(DEFAULT_NAMES));
    localStorage.setItem("spin_wheel_title", "Vòng quay ngẫu nhiên");
    localStorage.setItem("spin_wheel_remove_on_hit", "false");
    localStorage.setItem("spin_wheel_removed_names", JSON.stringify([]));
    
    // Quay lại URL gốc không chứa id query
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, "/");
    }
  };

  // Khôi phục một tên cụ thể từ danh sách loại bỏ về danh sách chính
  const handleRestoreName = (nameToRestore) => {
    const updatedRemoved = removedNames.filter((n) => n !== nameToRestore);
    setRemovedNames(updatedRemoved);
    localStorage.setItem("spin_wheel_removed_names", JSON.stringify(updatedRemoved));

    const updatedNames = [...names, nameToRestore];
    setNames(updatedNames);
    setInputText(updatedNames.join("\n"));
    localStorage.setItem("spin_wheel_names", JSON.stringify(updatedNames));

    if (currentWheelId) {
      fetch(`/api/wheels/${currentWheelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: updatedNames, title: wheelTitle, removeOnHit }),
      }).then(() => fetchSavedWheels());
    }
  };

  // Khôi phục tất cả tên bị loại bỏ
  const handleRestoreAllRemoved = () => {
    if (removedNames.length === 0) return;
    const updatedNames = [...names, ...removedNames];
    setNames(updatedNames);
    setInputText(updatedNames.join("\n"));
    localStorage.setItem("spin_wheel_names", JSON.stringify(updatedNames));

    setRemovedNames([]);
    localStorage.setItem("spin_wheel_removed_names", JSON.stringify([]));

    if (currentWheelId) {
      fetch(`/api/wheels/${currentWheelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: updatedNames, title: wheelTitle, removeOnHit }),
      }).then(() => fetchSavedWheels());
    }
  };

  // Xóa sạch lịch sử tên bị loại bỏ
  const handleClearRemovedHistory = () => {
    setRemovedNames([]);
    localStorage.setItem("spin_wheel_removed_names", JSON.stringify([]));
  };

  // --- Lưu vòng quay lên MongoDB (Lưu / Cập nhật) ---
  const handleSaveWheel = async () => {
    if (names.length === 0) {
      alert("Vui lòng nhập ít nhất một tên trước khi lưu!");
      return;
    }

    setIsSaving(true);
    try {
      const url = currentWheelId ? `/api/wheels/${currentWheelId}` : "/api/wheels";
      const method = currentWheelId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: wheelTitle,
          names,
          removeOnHit,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const savedData = result.data;
        setCurrentWheelId(savedData._id);
        
        const originUrl = typeof window !== "undefined" ? window.location.origin : "";
        const shareLink = `${originUrl}/?id=${savedData._id}`;
        setShareUrl(shareLink);
        
        // Cập nhật lại thanh địa chỉ URL của trình duyệt mà không reload trang
        window.history.replaceState({}, document.title, `/?id=${savedData._id}`);
        
        // Làm mới danh sách hiển thị
        fetchSavedWheels();
        alert("Đã lưu vòng quay thành công!");
      } else {
        alert("Lỗi: " + (result.error || "Không thể lưu vòng quay"));
      }
    } catch (e) {
      console.error("Lỗi khi lưu vòng quay:", e);
      alert("Đã xảy ra lỗi khi kết nối tới máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Xóa vòng quay khỏi DB ---
  const handleDeleteWheel = async (id, e) => {
    e.stopPropagation(); // Ngăn việc kích hoạt load khi bấm nút xóa
    if (!confirm("Bạn có chắc chắn muốn xóa vòng quay đã lưu này?")) return;

    try {
      const res = await fetch(`/api/wheels/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        // Nếu xóa đúng cái đang hiển thị, reset trạng thái ID hiện tại
        if (currentWheelId === id) {
          setCurrentWheelId(null);
          setShareUrl("");
          window.history.replaceState({}, document.title, "/");
        }
        fetchSavedWheels();
      } else {
        alert("Không thể xóa: " + result.error);
      }
    } catch (error) {
      console.error("Lỗi khi xóa vòng quay:", error);
    }
  };

  // --- Sao chép link chia sẻ ---
  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Xử lý sự kiện quay thành công (Dừng quay) ---
  const handleSpinEnd = (winnerName) => {
    setWinner(winnerName);
    setShowModal(true);
  };

  // Đóng modal mà không xóa tên
  const handleModalClose = () => {
    setShowModal(false);
    
    // Nếu chọn chế độ tự động loại bỏ tên khi trúng
    if (removeOnHit) {
      removeNameFromWheel(winner);
    }
  };

  // Loại bỏ tên người trúng và đóng modal
  const handleRemoveWinner = () => {
    removeNameFromWheel(winner);
    setShowModal(false);
  };

  // Hàm phụ xóa tên khỏi vòng quay và đẩy vào danh sách loại bỏ
  const removeNameFromWheel = (nameToRemove) => {
    const updatedNames = names.filter((n) => n !== nameToRemove);
    setNames(updatedNames);
    setInputText(updatedNames.join("\n"));
    localStorage.setItem("spin_wheel_names", JSON.stringify(updatedNames));

    // Thêm vào danh sách tên đã bị loại bỏ
    const updatedRemoved = [...removedNames, nameToRemove];
    setRemovedNames(updatedRemoved);
    localStorage.setItem("spin_wheel_removed_names", JSON.stringify(updatedRemoved));

    // Nếu đang chỉnh sửa vòng quay đã lưu trên Server, ta tự động cập nhật
    if (currentWheelId) {
      // Thực hiện cập nhật không cần chờ thông báo để trải nghiệm mượt mà
      fetch(`/api/wheels/${currentWheelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: updatedNames, title: wheelTitle, removeOnHit }),
      }).then(() => fetchSavedWheels());
    }
  };

  return (
    <div className="app-container">
      {/* Hiệu ứng pháo hoa toàn màn hình khi trúng giải */}
      <Fireworks active={showModal} />

      {/* Thanh Header Navigation Bar */}
      <header className="app-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20M19.07 4.93l-14.14 14.14M4.93 4.93l14.14 14.14" />
            </svg>
          </div>
          <span className="navbar-brand">random spin</span>
        </div>
        
        <div className="navbar-right">
          <button className="navbar-btn" onClick={handleReset} disabled={isSpinning}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Mới</span>
          </button>
          <button className="navbar-btn" onClick={() => alert("Ứng dụng Vòng Quay Random Premium v1.0 - Được xây dựng bằng Next.js & MongoDB.")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Thông tin</span>
          </button>
        </div>
      </header>

      {/* Layout chính */}
      <main className="main-layout">
        
        {/* Cột trái: Vòng quay */}
        <section className="wheel-section">
          <SpinWheel
            names={names}
            isSpinning={isSpinning}
            setIsSpinning={setIsSpinning}
            onSpinEnd={handleSpinEnd}
          />

          {isSpinning && (
            <p style={{ marginTop: "1rem", color: "#00f2fe", fontWeight: "600", animation: "pulse 1.5s infinite" }}>
              Đang quay... Hãy chờ đợi kết quả!
            </p>
          )}
        </section>

        {/* Cột phải: Bảng điều khiển */}
        <section className="control-section">
          
          {/* Nhập danh sách tên */}
          <div className="glass-card input-group">
            <div className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Danh sách tên ({names.length})</span>
            </div>
            <textarea
              className="names-textarea"
              placeholder="Nhập mỗi tên trên một dòng..."
              value={inputText}
              onChange={handleNamesChange}
              disabled={isSpinning}
            />
            
            <div className="btn-row" style={{ marginTop: "0.5rem" }}>
              <button className="btn btn-secondary" onClick={handleShuffle} disabled={isSpinning || names.length <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Xáo trộn
              </button>
              <button className="btn btn-secondary" onClick={handleClear} disabled={isSpinning || names.length === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Xóa sạch
              </button>
            </div>
          </div>

          {/* Cấu hình & Tùy chọn */}
          <div className="glass-card">
            <div className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Tùy chọn quay</span>
            </div>
            
            <div className="options-group">
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={removeOnHit}
                  onChange={handleRemoveOnHitChange}
                  disabled={isSpinning}
                />
                <span className="custom-checkbox"></span>
                <div>
                  <span className="option-label">Tự động loại bỏ tên trúng</span>
                  <span className="option-description">Khi quay trúng, tên sẽ tự động biến mất khỏi vòng quay cho lượt tiếp theo.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Khung chứa các tên đã bị loại bỏ */}
          <div className="glass-card">
            <div className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="8" x2="23" y2="14" />
                <line x1="23" y1="8" x2="17" y2="14" />
              </svg>
              <span>Tên đã bị loại bỏ ({removedNames.length})</span>
            </div>
            
            {removedNames.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                Chưa có tên nào bị loại bỏ.
              </p>
            ) : (
              <div>
                <div className="saved-wheels-list" style={{ maxHeight: "150px" }}>
                  {removedNames.map((name, index) => (
                    <div key={index} className="saved-wheel-item" style={{ padding: "0.5rem 0.75rem" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{name}</span>
                      <button className="btn-icon" onClick={() => handleRestoreName(name)} title="Khôi phục tên này">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <polyline points="16 3 21 8 16 13" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="btn-row" style={{ marginTop: "1rem" }}>
                  <button className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem" }} onClick={handleRestoreAllRemoved}>
                    Khôi phục tất cả
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem" }} onClick={handleClearRemovedHistory}>
                    Xóa lịch sử
                  </button>
                </div>
              </div>
            )}
          </div>


        </section>
      </main>

      {/* Modal Chúc mừng kết quả */}
      <div className={`modal-overlay ${showModal ? "active" : ""}`} onClick={handleModalClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">Xin chúc mừng!</div>
          <div className="modal-winner-name">{winner}</div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleRemoveWinner}>
              Loại bỏ tên này khỏi vòng quay
            </button>
            <button className="btn btn-secondary" onClick={handleModalClose}>
              Đóng (Giữ lại tên)
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 Random Spin Wheel Premium. Được xây dựng bằng Next.js & MongoDB.</p>
      </footer>
    </div>
  );
}
