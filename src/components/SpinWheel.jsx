"use client";

import React, { useEffect, useRef, useState } from "react";

// Khởi tạo AudioContext toàn cục (lười tạo để tránh lag)
let globalAudioCtx = null;
const getAudioContext = () => {
  if (typeof window !== "undefined" && !globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return globalAudioCtx;
};

/**
 * Phát âm thanh tích tắc (tick sound) khi vòng quay chuyển phân vùng
 */
const playTickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Dùng sóng 'triangle' để tiếng click nghe giòn và giống thật hơn 'sine'
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    // Điều chỉnh âm lượng giảm cực nhanh để tạo tiếng click khô gọn
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Trình duyệt chặn âm thanh trước khi click
  }
};

/**
 * Phát âm thanh chiến thắng khi dừng quay
 */
const playWinSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // Tạo 3 nốt nhạc nối tiếp nhau để tạo hiệu ứng chúc mừng (do re mi)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.12);
      
      gain.gain.setValueAtTime(0.15, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.3);
    });
  } catch (e) {
    // Lỗi bỏ qua
  }
};

export default function SpinWheel({ names = [], onSpinEnd, isSpinning, setIsSpinning }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  
  // Các thông số quay vật lý
  const spinAngleStart = useRef(0);
  const spinTime = useRef(0);
  const spinTimeTotal = useRef(0);
  const startAngle = useRef(0);
  const currentAngle = useRef(0);
  const lastTickIndex = useRef(-1); // Theo dõi phân vùng gần nhất đi qua kim chỉ để phát âm thanh

  // Sử dụng danh sách tên mặc định nếu truyền vào mảng trống
  const activeNames = names.length > 0 ? names : ["Tên 1", "Tên 2", "Tên 3", "Tên 4", "Tên 5"];
  const numSlices = activeNames.length;
  const arcSize = (2 * Math.PI) / numSlices;

  // Tạo dải màu sắc rực rỡ dựa trên chỉ mục và số lượng
  const getSliceColor = (index, total) => {
    // Phối màu HSL để đảm bảo các phần kề nhau không bị trùng màu và có độ tương phản cao
    const hue = (index * (360 / total)) % 360;
    return `hsl(${hue}, 75%, 50%)`;
  };

  // Vẽ vòng quay trên Canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Lấy kích thước thực tế của canvas từ CSS (luôn vuông do wrapper aspect-ratio: 1)
    const size = canvas.clientWidth || 450;

    // Reset canvas kích thước thực tế để vẽ sắc nét (Retina display)
    canvas.width = size * 2;
    canvas.height = size * 2;
    
    ctx.scale(2, 2);

    const center = size / 2;
    const radius = size / 2 - 4; // Chừa lề viền ngoài cực nhỏ để vòng quay to tối đa

    ctx.clearRect(0, 0, size, size);

    // 1. Vẽ vòng tròn nền tối ngoài cùng tạo chiều sâu (Shadow)
    ctx.beginPath();
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // 2. Vẽ từng lát (slice) của vòng quay
    for (let i = 0; i < numSlices; i++) {
      const angle = startAngle.current + i * arcSize;
      ctx.beginPath();
      ctx.arc(center, center, radius, angle, angle + arcSize, false);
      ctx.lineTo(center, center);
      ctx.fillStyle = getSliceColor(i, numSlices);
      ctx.fill();

      // Viền phân tách giữa các phần
      ctx.strokeStyle = "rgba(8, 11, 17, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Vẽ chữ (Tên) xoay hướng tâm
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 4;
      ctx.font = `bold ${radius / 10}px "Times New Roman"`;
      
      // Di chuyển gốc tọa độ về tâm và xoay
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      
      // Căn lề chữ từ mép vòng quay vào trong
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      
      const text = activeNames[i];
      // Cắt bớt nếu tên quá dài
      const maxTextWidth = radius * 0.75;
      let displayText = text;
      if (ctx.measureText(text).width > maxTextWidth) {
        while (ctx.measureText(displayText + "...").width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText = displayText + "...";
      }

      ctx.fillText(displayText, radius - 20, 0);
      ctx.restore();
    }

    // 4. Vẽ viền tròn trang trí ngoài cùng (Outer Border)
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 5. Vẽ khuyên tròn nhỏ ở tâm tạo thẩm mỹ
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.fill();
  };

  // Logic cập nhật vòng quay
  useEffect(() => {
    drawWheel();
    // Lắng nghe sự kiện resize để vẽ lại canvas sắc nét
    const handleResize = () => {
      drawWheel();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [names, numSlices]);

  // Vòng lặp hoạt ảnh quay vật lý
  const rotateWheel = () => {
    spinTime.current += 16.67; // Tương đương 1 frame 60fps (1000ms / 60)
    if (spinTime.current >= spinTimeTotal.current) {
      stopRotateWheel();
      return;
    }

    // Hàm giảm tốc từ từ (Ease Out Easing Function)
    const easeOut = (t, b, c, d) => {
      const ts = (t /= d) * t;
      const tc = ts * t;
      return b + c * (tc * ts + -5 * ts * ts + 10 * tc + -10 * ts + 5 * t);
    };

    const spinAngle = spinAngleStart.current - easeOut(spinTime.current, 0, spinAngleStart.current, spinTimeTotal.current);
    startAngle.current += (spinAngle * Math.PI) / 180;
    
    // Giữ góc quay trong khoảng [0, 2 * Math.PI] để dễ tính toán
    startAngle.current = startAngle.current % (2 * Math.PI);
    currentAngle.current = startAngle.current;
    
    drawWheel();

    // XỬ LÝ ÂM THANH TÍCH TẮC:
    // Kim chỉ nằm ở bên phải (góc 0 hoặc 2*Math.PI).
    // Ta tính chỉ số của lát cắt hiện tại đang chỉ tới.
    // Góc thực tế của kim chỉ so với startAngle là:
    const relativeAngle = (2 * Math.PI - startAngle.current) % (2 * Math.PI);
    const currentSliceIndex = Math.floor(relativeAngle / arcSize) % numSlices;
    
    if (currentSliceIndex !== lastTickIndex.current) {
      playTickSound();
      lastTickIndex.current = currentSliceIndex;

      // Hiệu ứng giật kim chỉ khi chuyển phần (Kim chỉ dao động nhẹ)
      if (pointerRef.current) {
        pointerRef.current.classList.add("tick");
        setTimeout(() => {
          if (pointerRef.current) pointerRef.current.classList.remove("tick");
        }, 60);
      }
    }

    requestAnimationFrame(rotateWheel);
  };

  // Dừng quay và công bố kết quả
  const stopRotateWheel = () => {
    setIsSpinning(false);
    playWinSound();

    // Tính toán người thắng cuộc:
    // Kim chỉ ở bên phải (góc 0).
    const relativeAngle = (2 * Math.PI - startAngle.current) % (2 * Math.PI);
    const winnerIndex = Math.floor(relativeAngle / arcSize) % numSlices;
    const winner = activeNames[winnerIndex];

    if (onSpinEnd) {
      onSpinEnd(winner);
    }
  };

  // Kích hoạt quay từ component cha qua biến isSpinning
  useEffect(() => {
    if (isSpinning) {
      // Thiết lập AudioContext khi có tương tác người dùng
      getAudioContext();

      // Thiết lập thông số quay ngẫu nhiên ngẫu hứng
      spinAngleStart.current = Math.random() * 10 + 15; // Tốc độ góc ban đầu (độ/khung hình)
      spinTime.current = 0;
      spinTimeTotal.current = Math.random() * 2000 + 4000; // Tổng thời gian quay (4 - 6 giây)
      
      rotateWheel();
    }
  }, [isSpinning]);

  // Click vào nút quay ở giữa hoặc vòng quay
  const handleSpinClick = () => {
    if (isSpinning || numSlices === 0) return;
    setIsSpinning(true);
  };

  return (
    <div className="wheel-container-wrapper">
      <canvas
        ref={canvasRef}
        className="wheel-canvas"
        onClick={handleSpinClick}
      />
      {/* Nút quay trung tâm */}
      <button
        className="spin-center-button"
        onClick={handleSpinClick}
        disabled={isSpinning || activeNames.length === 0}
      >
        QUAY
      </button>
      {/* Kim chỉ */}
      <div ref={pointerRef} className="wheel-pointer" />
    </div>
  );
}
