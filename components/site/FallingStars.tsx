"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  angle: number;
}

export function FallingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check user preference for motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    const maxStars = window.innerWidth < 640 ? 40 : 100; // Less stars on mobile for performance

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize stars with 3D depth perspective
    const initStars = () => {
      stars = [];
      for (let i = 0; i < maxStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 0.9 + 0.1, // Depth factor
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.2, // Falling speed
          opacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          angle: Math.random() * Math.PI * 2,
        });
      }
    };

    initStars();

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, opacity: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.fillStyle = `rgba(210, 148, 46, ${opacity})`; // Brand gold
      ctx.shadowBlur = r * 4;
      ctx.shadowColor = "#d2942e"; // Soft gold glow

      // Draw a 4-pointed star
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.lineTo(0, 0 - r * 2.5);
        ctx.lineTo(r / 3, 0);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // 3D falling motion: fall downwards, move slightly outwards based on depth
        star.y += star.speed * star.z * 1.5;
        // Drift slightly horizontally
        star.x += Math.sin(star.angle + star.y * 0.01) * 0.15;

        // Twinkle effect (sine wave opacity oscillation)
        star.angle += star.twinkleSpeed;
        const currentOpacity = star.opacity + Math.sin(star.angle) * 0.25;

        // If star goes off screen, reset to top
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
          star.z = Math.random() * 0.9 + 0.1;
        }
        if (star.x > canvas.width) {
          star.x = 0;
        } else if (star.x < 0) {
          star.x = canvas.width;
        }

        // Draw the star with depth scale
        drawStar(ctx, star.x, star.y, star.size * star.z, Math.max(0.1, Math.min(1, currentOpacity)));
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
