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

// Chuỗi tọa độ ngôi sao 5 cánh màu vàng đồng
const starPoints = (() => {
  const cx = 25;
  const cy = 25;
  const spikes = 5;
  const outerRadius = 21;
  const innerRadius = 8.0; // Bán kính đỉnh trong tạo hình ngôi sao 5 cánh cân xứng
  let rot = (Math.PI / 2) * 3;
  let points = [];
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius;
    let y = cy + Math.sin(rot) * outerRadius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    rot += step;

    let x2 = cx + Math.cos(rot) * innerRadius;
    let y2 = cy + Math.sin(rot) * innerRadius;
    points.push(`${x2.toFixed(2)},${y2.toFixed(2)}`);
    rot += step;
  }
  return points.join(" ");
})();

export default function SpinWheel({ names = [], onSpinEnd, isSpinning, setIsSpinning }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const drumImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Các thông số quay vật lý
  const spinAngleStart = useRef(0);
  const spinTime = useRef(0);
  const spinTimeTotal = useRef(0);
  const startAngle = useRef(0);
  const currentAngle = useRef(0);
  const lastTickIndex = useRef(-1); // Theo dõi phân vùng gần nhất đi qua kim chỉ để phát âm thanh

  // Tải trước hình ảnh trống đồng Đông Sơn
  useEffect(() => {
    const img = new Image();
    img.src = "/dong_son_drum.jpg";
    img.onload = () => {
      drumImageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  // Sử dụng danh sách tên mặc định nếu truyền vào mảng trống
  const activeNames = names.length > 0 ? names : ["Tên 1", "Tên 2", "Tên 3", "Tên 4", "Tên 5"];
  const numSlices = activeNames.length;
  const arcSize = (2 * Math.PI) / numSlices;

  // Tạo dải màu sắc cổ điển nhưng rực rỡ dựa trên chỉ mục và số lượng
  const getSliceColor = (index) => {
    const colors = [
      "#c23b22", // Đỏ gạch / Đỏ đô
      "#d97706", // Cam đất
      "#eab308", // Vàng cát
      "#16a34a", // Xanh lá cây
      "#0284c7", // Xanh lam
      "#7c3aed"  // Tím huế
    ];
    return colors[index % colors.length];
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
    const radius = size / 2 - 15; // Chừa thêm lề cho viền gỗ ngoài

    ctx.clearRect(0, 0, size, size);

    // 1. Vẽ vòng tròn nền tối ngoài cùng tạo chiều sâu (Shadow)
    ctx.beginPath();
    ctx.arc(center, center, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // 2. Vẽ các múi màu (Slices) hình quạt rực rỡ
    for (let i = 0; i < numSlices; i++) {
      const angle = startAngle.current + i * arcSize;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.closePath();
      ctx.fillStyle = getSliceColor(i);
      ctx.fill();

      // Vẽ viền múi mảnh mờ ảo tạo chiều sâu
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Vẽ chữ (Tên) xoay hướng tâm trên từng múi màu
    for (let i = 0; i < numSlices; i++) {
      const angle = startAngle.current + i * arcSize;
      ctx.save();
      ctx.fillStyle = "#ffffff"; // Màu trắng nổi bật
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)"; // Đổ bóng sẫm tối đa giúp chữ rõ ràng
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
      ctx.font = `bold ${radius / 8.8}px "Times New Roman", Times, serif`;
      
      // Di chuyển gốc tọa độ về tâm và xoay
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      
      // Căn lề chữ từ mép vòng quay vào trong
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      
      const text = activeNames[i];
      // Cắt bớt nếu tên quá dài
      const maxTextWidth = radius * 0.70;
      let displayText = text;
      if (ctx.measureText(text).width > maxTextWidth) {
        while (ctx.measureText(displayText + "...").width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText = displayText + "...";
      }

      ctx.fillText(displayText, radius - 20, 0); // Cách vành ngoài 20px
      ctx.restore();
    }

    // 4. Vẽ viền ngoài 3D giả gỗ và đồng thau cổ kính chạm khắc ôm lấy bánh xe
    // Vành gỗ sẫm ngoài cùng
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#4d2c18"; // Màu gỗ gụ/gỗ mun sẫm
    ctx.lineWidth = 16;
    ctx.stroke();

    // Vành chỉ đồng thau sáng ở giữa vành gỗ
    ctx.beginPath();
    ctx.arc(center, center, radius - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d9a752"; // Vàng đồng thau
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vành chỉ trong cùng ngăn với múi quay
    ctx.beginPath();
    ctx.arc(center, center, radius - 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#8c6239"; // Màu đồng thau sẫm
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Các điểm chấm đồng trang trí giả lập hoa văn chạm khắc trên viền ngoài
    const numDecorations = Math.max(24, numSlices * 2);
    for (let d = 0; d < numDecorations; d++) {
      const decAngle = (d * 2 * Math.PI) / numDecorations;
      ctx.beginPath();
      ctx.arc(center + Math.cos(decAngle) * (radius - 4), center + Math.sin(decAngle) * (radius - 4), 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffde00"; // Hạt đồng vàng
      ctx.fill();
    }
    ctx.restore();
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
  }, [names, numSlices, imageLoaded]);

  // Vòng lặp hoạt ảnh quay vật lý
  const rotateWheel = () => {
    spinTime.current += 16.67; // Tương đương 1 frame 60fps (1000ms / 60)
    if (spinTime.current >= spinTimeTotal.current) {
      stopRotateWheel();
      return;
    }

    const p = spinTime.current / spinTimeTotal.current;
    // Sử dụng hàm mũ 2.8 để tốc độ giảm mượt mà và trôi rà rà cực chậm ở giai đoạn cuối nhằm tăng kịch tính
    const spinAngle = spinAngleStart.current * Math.pow(1 - p, 2.8);
    startAngle.current += (spinAngle * Math.PI) / 180;
    
    // Giữ góc quay trong khoảng [0, 2 * Math.PI] để dễ tính toán
    startAngle.current = startAngle.current % (2 * Math.PI);
    currentAngle.current = startAngle.current;
    
    drawWheel();

    // XỬ LÝ ÂM THANH TÍCH TẮC tại hướng 12 giờ:
    // Kim chỉ nằm ở đỉnh (góc 1.5 * Math.PI hoặc -Math.PI / 2).
    let relativeAngle = (1.5 * Math.PI - startAngle.current) % (2 * Math.PI);
    if (relativeAngle < 0) {
      relativeAngle += 2 * Math.PI;
    }
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

    // Tính toán người thắng cuộc ở vị trí 12 giờ:
    let relativeAngle = (1.5 * Math.PI - startAngle.current) % (2 * Math.PI);
    if (relativeAngle < 0) {
      relativeAngle += 2 * Math.PI;
    }
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

      // Thiết lập thông số quay chậm rãi và kịch tính hơn
      spinAngleStart.current = Math.random() * 4 + 8; // Tốc độ góc ban đầu vừa phải (8 - 12 độ/frame)
      spinTime.current = 0;
      spinTimeTotal.current = Math.random() * 1500 + 6500; // Kéo dài thời gian quay (6.5s - 8.0s) để có giai đoạn rà rà ở cuối
      
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
      {/* Nút quay trung tâm mặt trống đồng 3D cổ kính */}
      <button
        className="spin-center-button"
        onClick={handleSpinClick}
        disabled={isSpinning || activeNames.length === 0}
      >
        <svg viewBox="0 0 50 50" className="bronze-star-icon">
          <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffcc" />
              <stop offset="30%" stopColor="#ffde00" />
              <stop offset="70%" stopColor="#e6a100" />
              <stop offset="100%" stopColor="#805900" />
            </linearGradient>
            <filter id="gold-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1.2" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.75"/>
            </filter>
          </defs>
          <polygon points={starPoints} fill="url(#gold-gradient)" filter="url(#gold-shadow)" />
        </svg>
      </button>
      {/* Kim chỉ Chim Lạc */}
      <div ref={pointerRef} className="wheel-pointer" />
    </div>
  );
}
