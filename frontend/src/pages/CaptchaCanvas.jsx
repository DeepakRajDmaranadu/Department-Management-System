import React, { useEffect, useRef } from "react";

export const CaptchaCanvas = ({ text }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(63, 63, 70, 0.25)";
    ctx.lineWidth = 1;
    const gridGap = 8;
    for (let x = 0; x < canvas.width; x += gridGap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridGap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(161, 161, 170, ${0.1 + Math.random() * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = "bold 22px monospace";
    ctx.textBaseline = "middle";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = 12 + i * 20;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      const angle = ((Math.random() * 24 - 12) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const brightness = Math.floor(Math.random() * 50) + 180;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(228, 228, 231, ${Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={36}
      className="rounded border border-zinc-800"
    />
  );
};
