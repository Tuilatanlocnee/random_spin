"use client";

import React, { useEffect, useRef } from "react";

/**
 * Tổng hợp toàn bộ âm thanh chúc mừng hoành tráng (Confetti Pop + Tiếng vỗ tay + Tiếng hò reo đám đông) bằng Web Audio API
 */
const playCelebrationAudio = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // 1. Hàm phát tiếng nổ pháo giấy Stereo (Confetti Pop)
    const playConfettiPop = (panValue, delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      // Tiếng bụp trầm thuốc phóng
      osc.type = "sine";
      osc.frequency.setValueAtTime(170, now + delay);
      osc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.16);

      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.16);

      // Tiếng rào rào xẹt ra của pháo giấy
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      filter.Q.value = 1.3;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now + delay);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);

      if (panner) {
        panner.pan.setValueAtTime(panValue, now + delay);
        osc.connect(panner);
        noiseGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(ctx.destination);
        noiseGain.connect(ctx.destination);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
      noise.start(now + delay);
      noise.stop(now + delay + 0.45);
    };

    // 2. Hàm tổng hợp tiếng vỗ tay rào rào của đám đông (Applause Simulation)
    const playApplause = (delay, duration) => {
      // Tạo 10 nguồn vỗ tay riêng lẻ chồng chập để tạo hiệu ứng đám đông
      const voices = 10;
      for (let i = 0; i < voices; i++) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Tạo tiếng nhiễu trắng được làm mượt nhẹ kết hợp điều biến biên độ nhấp nháy ngẫu nhiên
        let lastOut = 0.0;
        for (let j = 0; j < bufferSize; j++) {
          const white = Math.random() * 2 - 1;
          lastOut = 0.85 * lastOut + 0.15 * white; // Lowpass filter đơn giản

          // Tạo chu kỳ vỗ tay (8Hz đến 16Hz)
          const time = j / ctx.sampleRate;
          const rate = 7 + Math.random() * 9;
          const mod = 0.45 + 0.55 * Math.sin(2 * Math.PI * rate * time + Math.random() * 12);
          data[j] = lastOut * mod;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(750 + Math.random() * 650, now);
        filter.Q.value = 1.4;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now + delay);
        // Tăng vỗ tay lên dần trong 0.6s
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.6);
        // Nhạt dần âm lượng ở cuối
        gain.gain.setValueAtTime(0.08, now + delay + duration - 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        noise.connect(filter);
        filter.connect(gain);

        if (panner) {
          panner.pan.setValueAtTime(Math.random() * 1.6 - 0.8, now); // Trải đều từ trái sang phải
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          gain.connect(ctx.destination);
        }

        noise.start(now + delay);
        noise.stop(now + delay + duration);
      }
    };

    // 3. Hàm tổng hợp tiếng la hét hò reo "Woohoo! Yeah!" của đám đông (Cheering simulation)
    const playCheeringVocal = (delay, duration) => {
      const voices = 4;
      for (let i = 0; i < voices; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        osc.type = "sawtooth"; // Hài âm thô giống tiếng hét
        
        const baseFreq = 220 + Math.random() * 160; // Giọng nam/nữ reo hò
        osc.frequency.setValueAtTime(baseFreq, now + delay);
        // Tiếng la hét bay vút tần số lên cao rồi hạ dần: "Woooaaah!"
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + delay + 0.25);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + delay + duration - 0.6);
        osc.frequency.exponentialRampToValueAtTime(70, now + delay + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1100; // Bộ lọc làm dịu bớt âm răng cưa sắc bén

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.03, now + delay + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        osc.connect(filter);
        filter.connect(gain);

        if (panner) {
          panner.pan.setValueAtTime(Math.random() * 1.2 - 0.6, now);
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          gain.connect(ctx.destination);
        }

        osc.start(now + delay);
        osc.stop(now + delay + duration);
      }
    };

    // KÍCH HOẠT HỆ THỐNG ÂM THANH:
    // Tiếng nổ pháo giấy dồn dập
    playConfettiPop(-0.6, 0);      // Ống trái nổ lúc 0ms
    playConfettiPop(0.6, 0.12);     // Ống phải nổ lúc 120ms
    playConfettiPop(0.0, 0.28);     // Ống giữa nổ phụ lúc 280ms
    
    // Tiếng vỗ tay và hò reo của đám đông kéo dài 4.5 giây
    playApplause(0.1, 4.5);
    playCheeringVocal(0.15, 3.2);

  } catch (e) {
    console.error("Lỗi khi tổng hợp âm thanh ăn mừng:", e);
  }
};

class ConfettiParticle {
  constructor(x, y, angle, speed, shape = "rect") {
    this.x = x;
    this.y = y;
    this.shape = shape;
    
    // Định dạng kích cỡ hạt theo hình dáng
    if (this.shape === "ribbon") {
      this.sizeWidth = Math.random() * 3.5 + 2.5;
      this.sizeHeight = Math.random() * 18 + 14; // Dải ruy băng dài uốn lượn
    } else {
      this.sizeWidth = Math.random() * 8 + 6;
      this.sizeHeight = Math.random() * 6 + 4;
    }
    
    // Tông màu lễ hội rực rỡ
    const hues = [
      Math.random() * 40 + 10,   // Đỏ gạch / Cam đất
      Math.random() * 30 + 40,   // Vàng đồng / Cát vàng
      Math.random() * 120 + 100, // Xanh lá cây nhạt
      Math.random() * 40 + 330,  // Đỏ hồng cánh sen
      Math.random() * 40 + 200   // Xanh lam ngọc
    ];
    this.color = `hsl(${hues[Math.floor(Math.random() * hues.length)]}, 95%, 60%)`;
    
    // Vận tốc ban đầu dựa trên góc bắn
    const rad = angle * Math.PI / 180;
    const finalSpeed = speed * (Math.random() * 0.6 + 0.7);
    this.vx = Math.cos(rad) * finalSpeed;
    this.vy = Math.sin(rad) * finalSpeed;
    
    this.gravity = this.shape === "ribbon" ? 0.11 : 0.17; // Ruy băng bay bổng rơi chậm hơn
    this.friction = 0.955; // Lực cản không khí
    
    // Trục xoay 3D
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() * 6 - 3) * 2.5;
    
    // Đung đưa nhẹ tạo sự tự nhiên khi rơi
    this.oscillationSpeed = Math.random() * 0.08 + 0.04;
    this.oscillationAngle = Math.random() * Math.PI * 2;
    this.oscillationRange = this.shape === "ribbon" ? Math.random() * 2.5 + 1.5 : Math.random() * 1.5 + 0.5;
    
    this.alpha = 1.0;
    this.decay = Math.random() * 0.0035 + 0.003; // Rơi lâu hơn và biến mất từ từ
    
    // Hiệu ứng lấp lánh (Sparkle)
    this.sparkle = Math.random() < 0.35; // 35% số hạt có khả năng lấp lánh óng ánh
    this.sparkleSpeed = Math.random() * 0.18 + 0.08;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.oscillationAngle += this.oscillationSpeed;
    this.x += this.vx + Math.sin(this.oscillationAngle) * this.oscillationRange;
    this.y += this.vy;

    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    
    // Nhấp nháy lấp lánh
    let currentAlpha = this.alpha;
    if (this.sparkle) {
      currentAlpha = this.alpha * (0.35 + 0.65 * Math.abs(Math.sin(Date.now() * this.sparkleSpeed)));
    }
    
    ctx.globalAlpha = Math.max(0, currentAlpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.fillStyle = this.color;
    
    ctx.beginPath();
    if (this.shape === "circle") {
      ctx.arc(0, 0, this.sizeWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === "triangle") {
      ctx.moveTo(0, -this.sizeHeight / 2);
      ctx.lineTo(this.sizeWidth / 2, this.sizeHeight / 2);
      ctx.lineTo(-this.sizeWidth / 2, this.sizeHeight / 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === "ribbon") {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.sizeWidth;
      ctx.moveTo(0, -this.sizeHeight / 2);
      ctx.bezierCurveTo(
        this.sizeWidth * 2.5, -this.sizeHeight / 4,
        -this.sizeWidth * 2.5, this.sizeHeight / 4,
        0, this.sizeHeight / 2
      );
      ctx.stroke();
    } else {
      // rect
      ctx.rect(-this.sizeWidth / 2, -this.sizeHeight / 2, this.sizeWidth, this.sizeHeight);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default function Fireworks({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Thiết lập canvas toàn màn hình
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId;
    const particles = [];
    const shapes = ["rect", "circle", "triangle", "ribbon"];

    // 1. Phát âm thanh ăn mừng tích hợp vỗ tay, reo hò Stereo
    playCelebrationAudio();

    // Hàm bắn pháo giấy từ một vị trí với số lượng hạt chỉ định
    const fireConfetti = (startX, startY, baseAngle, spread, speedBase, count) => {
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() * spread - spread / 2);
        const speed = speedBase + (Math.random() * 8);
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        particles.push(new ConfettiParticle(startX, startY, angle, speed, shape));
      }
    };

    // BẮN PHÁO GIẤY THEO 3 ĐỢT LIÊN TIẾP DỒN DẬP:
    // Đợt 1 (0ms): Bắn từ góc dưới bên trái và góc dưới bên phải
    fireConfetti(0, canvas.height, -45, 35, 14, 110);
    
    let timeoutRight;
    let timeoutCenter;
    let timeoutFlurry;

    // Đợt 2 (120ms): Bắn từ góc phải tương thích tiếng nổ Stereo bên phải
    timeoutRight = setTimeout(() => {
      fireConfetti(canvas.width, canvas.height, -135, 35, 14, 110);
    }, 120);

    // Đợt 3 (280ms): Bắn bùng nổ từ chính giữa dưới màn hình tủa ra xung quanh
    timeoutCenter = setTimeout(() => {
      fireConfetti(canvas.width / 2, canvas.height, -90, 70, 16, 120);
    }, 280);

    // Đợt 4 (600ms): Một đợt bắn rào nhẹ phụ họa từ hai lề
    timeoutFlurry = setTimeout(() => {
      fireConfetti(0, canvas.height * 0.8, -35, 20, 10, 40);
      fireConfetti(canvas.width, canvas.height * 0.8, -145, 20, 10, 40);
    }, 600);

    // Vòng lặp vẽ hoạt ảnh
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cập nhật & Vẽ các mảnh pháo giấy
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        // Xóa các mảnh đã rã hoàn toàn hoặc rơi hẳn khỏi màn hình
        if (p.alpha <= 0 || p.y > canvas.height + 30) {
          particles.splice(i, 1);
        }
      }

      // Tiếp tục lặp hoạt ảnh nếu vẫn còn hạt
      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Bắt đầu chạy hoạt ảnh
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(timeoutRight);
      clearTimeout(timeoutCenter);
      clearTimeout(timeoutFlurry);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="fireworks-canvas" />;
}
