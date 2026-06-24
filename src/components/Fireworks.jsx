"use client";

import React, { useEffect, useRef } from "react";

export default function Fireworks({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Thiết lập kích thước canvas toàn màn hình
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId;
    const particles = [];
    const rockets = [];

    // Lớp Hạt pháo hoa (sau khi nổ)
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        // Vận tốc ngẫu nhiên theo hình tròn, tăng tốc độ một chút cho rực rỡ
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.12; // Hạt rơi xuống tự nhiên hơn
        this.friction = 0.95; // Lực cản không khí
        this.alpha = 1;
        this.decay = Math.random() * 0.012 + 0.008; // Pháo hoa cháy lâu hơn một chút
        this.size = Math.random() * 3.5 + 2; // Tăng kích thước hạt cho rõ nét (2px - 5.5px)
        this.history = []; // Lưu các vị trí cũ để vẽ đuôi trail
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 6) {
          this.history.shift();
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw() {
        // Vẽ đuôi trail mờ dần của hạt pháo hoa
        for (let i = 0; i < this.history.length; i++) {
          const pos = this.history[i];
          const opacity = (i / this.history.length) * this.alpha * 0.4;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, this.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.restore();
        }

        // Vẽ hạt chính
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12; // Tăng phát sáng để lấp lánh hơn
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    // Lớp Quả pháo bay lên
    class Rocket {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        // Đích nổ ở nửa trên màn hình
        this.targetY = Math.random() * (canvas.height * 0.4) + canvas.height * 0.1;
        this.speed = Math.random() * 5 + 9; // Bay nhanh hơn một chút
        this.angle = Math.atan2(this.targetY - this.y, Math.random() * 120 - 60);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = -this.speed;
        this.color = `hsl(${Math.random() * 360}, 100%, 65%)`; // Màu sắc rực rỡ hơn
        this.history = []; // Lưu các vị trí cũ để vẽ đuôi lửa bay lên
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 8) {
          this.history.shift();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy *= 0.98; // Giảm dần tốc độ
      }

      draw() {
        // Vẽ đuôi lửa bay lên
        for (let i = 0; i < this.history.length; i++) {
          const pos = this.history[i];
          const opacity = (i / this.history.length) * 0.3;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.restore();
        }

        // Vẽ đầu quả pháo
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }

      hasExploded() {
        return this.vy >= -1 || this.y <= this.targetY;
      }

      explode() {
        const particleCount = Math.floor(Math.random() * 30) + 70; // 70-100 hạt cho mỗi phát nổ rực rỡ
        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle(this.x, this.y, this.color));
        }
      }
    }

    // Vòng lặp vẽ và cập nhật hoạt ảnh
    const animate = () => {
      // Xoá sạch canvas từng frame để giữ canvas luôn trong suốt
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Tỷ lệ sinh ra quả pháo mới (nhiều hơn một chút cho hoành tráng)
      if (Math.random() < 0.08 && rockets.length < 7) {
        rockets.push(new Rocket());
      }

      // Cập nhật & Vẽ quả pháo bay lên
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.update();
        rocket.draw();

        if (rocket.hasExploded()) {
          rocket.explode();
          rockets.splice(i, 1);
        }
      }

      // Cập nhật & Vẽ các hạt pháo hoa nổ
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Bắt đầu hoạt ảnh
    animate();

    // Dọn dẹp sự kiện và dừng frame
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="fireworks-canvas" />;
}
