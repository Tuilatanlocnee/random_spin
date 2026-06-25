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
  const getSliceColor = (index) => {
    // Bảng màu kim loại đồng cổ kính Đông Sơn (Đồng đỏ, đồng vàng cổ, xanh gỉ đồng cổ)
    const colors = [
      "#3b2616", // Đồng đỏ sẫm
      "#243a2f", // Xanh gỉ đồng cổ
      "#8b6534", // Đồng thau cổ
      "#5a3d24", // Đồng nâu đậm
      "#1b2e25", // Xanh lục bảo cổ sẫm
    ];
    return colors[index % colors.length];
  };

  // Vẽ vòng quay trên Canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Helper để vẽ chim Lạc Đông Sơn cách điệu sải cánh bay
    const drawChimLac = (c, x, y, size, angle) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.beginPath();
      
      // Họa tiết chim Lạc Đông Sơn đặc trưng bay ngược chiều kim đồng hồ
      c.moveTo(-size * 1.1, -size * 0.05); // Mỏ chim dài nhọn hướng bay
      c.lineTo(-size * 0.2, 0);          // Mỏ dưới
      c.lineTo(-size * 0.1, -size * 0.4); // Mào lông sau đầu dài vút
      c.lineTo(size * 0.15, -size * 0.1);  // Đầu sau mào
      c.lineTo(size * 0.8, size * 0.1);   // Thân dài bay ngang
      c.lineTo(size * 1.6, size * 0.35);  // Đuôi dài rộng vút cong
      c.lineTo(size * 1.1, size * 0.2);   // Bụng đuôi
      c.lineTo(size * 0.3, size * 0.25);  // Bụng
      c.lineTo(-size * 0.2, size * 0.12); // Bụng cổ mỏ
      c.closePath();
      c.fillStyle = "rgba(212, 175, 55, 0.75)"; // Màu vàng đồng sáng mờ
      c.fill();
      
      // Cánh vút ngược lên trên đón gió
      c.beginPath();
      c.moveTo(size * 0.2, -size * 0.1);
      c.quadraticCurveTo(size * 0.6, -size * 0.85, size * 0.95, -size * 1.15); // Cánh trước
      c.lineTo(size * 0.4, -size * 0.28);
      c.quadraticCurveTo(size * 0.05, -size * 0.55, -size * 0.05, -size * 0.65); // Cánh sau nhỏ
      c.closePath();
      c.fillStyle = "rgba(212, 175, 55, 0.75)";
      c.fill();
      
      c.restore();
    };

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

    // 2. Vẽ từng lát (slice) của vòng quay trống đồng
    for (let i = 0; i < numSlices; i++) {
      const angle = startAngle.current + i * arcSize;
      ctx.beginPath();
      ctx.arc(center, center, radius, angle, angle + arcSize, false);
      ctx.lineTo(center, center);
      ctx.fillStyle = getSliceColor(i);
      ctx.fill();

      // Viền phân tách giữa các múi trống (Đường chỉ đồng vàng khắc chìm)
      ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Vẽ chữ (Tên) xoay hướng tâm
      ctx.save();
      ctx.fillStyle = "#ffe6a3"; // Màu đồng vàng sáng để dễ đọc trên nền đồng sẫm
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)"; // Bóng tối đậm tăng độ rõ nét
      ctx.shadowBlur = 3;
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

    // A. Vẽ ngôi sao mặt trời Đông Sơn 12 cánh ở tâm (xung quanh núm đồng)
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const starAngle = (2 * Math.PI / 12) * i;
      const nextAngle = (2 * Math.PI / 12) * (i + 0.5);
      ctx.lineTo(center + Math.cos(starAngle) * 60, center + Math.sin(starAngle) * 60); // Đỉnh cánh sao
      ctx.lineTo(center + Math.cos(nextAngle) * 35, center + Math.sin(nextAngle) * 35); // Chân cánh sao
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(212, 175, 55, 0.4)"; // Màu vàng đồng sáng mờ
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vẽ thêm các vạch tia sáng nhỏ xen kẽ giữa các cánh sao mặt trời
    ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 12; i++) {
      const lightAngle = (2 * Math.PI / 12) * (i + 0.5);
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(lightAngle) * 35, center + Math.sin(lightAngle) * 35);
      ctx.lineTo(center + Math.cos(lightAngle) * 52, center + Math.sin(lightAngle) * 52);
      ctx.stroke();
    }
    ctx.restore();

    // B. Vẽ vành họa tiết răng cưa vòng trong (Radius khoảng radius * 0.42)
    ctx.save();
    const innerRadius = radius * 0.42;
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Vẽ nét răng cưa đặc trưng
    ctx.beginPath();
    const numTeeth = 72;
    for (let p = 0; p <= numTeeth; p++) {
      const pAngle = (2 * Math.PI / numTeeth) * p;
      const rDiff = p % 2 === 0 ? 3 : -3;
      ctx.lineTo(center + Math.cos(pAngle) * (innerRadius + rDiff), center + Math.sin(pAngle) * (innerRadius + rDiff));
    }
    ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();

    // C. Vẽ vòng Chim Lạc sải cánh bay ngược chiều kim đồng hồ (Radius khoảng radius * 0.65)
    ctx.save();
    const numBirds = 6;
    const birdRadius = radius * 0.65;
    const birdSize = 13;
    for (let b = 0; b < numBirds; b++) {
      // Chim Lạc được vẽ trực tiếp trên mặt trống nên góc xoay sẽ chuyển động cùng trống
      const currentBirdAngle = startAngle.current + (2 * Math.PI / numBirds) * b;
      const bx = center + Math.cos(currentBirdAngle) * birdRadius;
      const by = center + Math.sin(currentBirdAngle) * birdRadius;
      // Đầu hướng bay tiếp tuyến ngược chiều kim đồng hồ
      drawChimLac(ctx, bx, by, birdSize, currentBirdAngle - Math.PI / 2);
    }
    ctx.restore();

    // D. Vẽ vành họa tiết chấm tròn liên kết vòng ngoài (Radius khoảng radius * 0.82)
    ctx.save();
    const outerPatternRadius = radius * 0.82;
    ctx.beginPath();
    ctx.arc(center, center, outerPatternRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Vẽ thêm 4 vòng tròn đồng tâm bổ trợ mờ để tạo kết cấu trống đồng nhiều vành
    const extraRings = [0.28, 0.53, 0.74, 0.88];
    ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
    ctx.lineWidth = 0.8;
    extraRings.forEach(rCoeff => {
      ctx.beginPath();
      ctx.arc(center, center, radius * rCoeff, 0, 2 * Math.PI);
      ctx.stroke();
    });
    ctx.restore();

    // E. Vẽ lớp phủ Conic Gradient tạo bóng đổ kim loại 3D phản quang (Metallic Anisotropic Shading)
    // Giúp mặt trống có ánh kim và bóng đồng thau cổ kính tĩnh trên màn hình
    const lightAngle = (5 * Math.PI) / 4; // Hướng sáng Tây Bắc
    const conicGrad = ctx.createConicGradient(lightAngle, center, center);
    conicGrad.addColorStop(0, "rgba(255, 255, 255, 0.28)");  // Ánh kim đồng thau sáng
    conicGrad.addColorStop(0.12, "rgba(0, 0, 0, 0.15)");
    conicGrad.addColorStop(0.3, "rgba(0, 0, 0, 0.42)");      // Góc tối đồng gỉ
    conicGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)"); // Ánh kim phụ
    conicGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.42)");
    conicGrad.addColorStop(0.88, "rgba(0, 0, 0, 0.15)");
    conicGrad.addColorStop(1, "rgba(255, 255, 255, 0.28)");
    
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = conicGrad;
    ctx.fill();

    // F. Vẽ lớp phủ Radial Gradient tạo độ nổi khối chóp vòm nhẹ của trống đồng
    const radialGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    radialGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");  // Tâm sáng
    radialGrad.addColorStop(0.2, "rgba(255, 255, 255, 0.1)");
    radialGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.05)");
    radialGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.25)");      // Vỏ trống tối dần
    radialGrad.addColorStop(1, "rgba(0, 0, 0, 0.65)");        // Thành ngoài trống sẫm hẳn
    
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = radialGrad;
    ctx.fill();

    // G. Vẽ vành tre/đồng dày ngoài cùng (Outer Bronze Rim) với hiệu ứng ánh sáng 3D
    const rimGrad = ctx.createLinearGradient(0, 0, size, size);
    rimGrad.addColorStop(0, "#ffeab3"); // Vành sáng đồng thau góc trên bên trái
    rimGrad.addColorStop(0.5, "#a47c43"); // Màu đồng ở giữa
    rimGrad.addColorStop(1, "#362213");  // Vành tối góc dưới bên phải
    
    ctx.beginPath();
    ctx.arc(center, center, radius - 1.5, 0, 2 * Math.PI);
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 5.5;
    ctx.stroke();

    // H. Vẽ bóng đổ của núm trống đồng ở tâm (Đông Nam để tạo chiều sâu nâng cao)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3.5;
    ctx.shadowOffsetY = 4.5;
    ctx.beginPath();
    // Giúp nút đỏ nhìn như được cắm/lồng thật sự vào chóp nón lá
    ctx.beginPath();
    ctx.arc(center, center, 35.5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(101, 67, 33, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // H. Vẽ khuyên đỏ bổ trợ nhỏ ngay chân nút
    ctx.beginPath();
    ctx.arc(center, center, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#da251d";
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
      />
      {/* Kim chỉ */}
      <div ref={pointerRef} className="wheel-pointer" />
    </div>
  );
}
