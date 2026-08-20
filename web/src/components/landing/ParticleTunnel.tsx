'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  theta: number;
  z: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
}

const PARTICLE_COUNT = 2400;
const STREAM_COUNT = 200;
const TUNNEL_RADIUS = 180;
const TUNNEL_DEPTH = 800;
const FOV = 600;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ParticleTunnel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ pitch: 0, yaw: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const streamRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        z: Math.random() * TUNNEL_DEPTH - TUNNEL_DEPTH * 0.3,
        radius: TUNNEL_RADIUS + (Math.random() - 0.5) * 20,
        speed: 0.3 + Math.random() * 0.8,
        size: 0.5 + Math.random() * 1.5,
        hue: Math.random() > 0.7 ? 1 : 0,
      });
    }
    particlesRef.current = particles;

    const stream: Particle[] = [];
    for (let i = 0; i < STREAM_COUNT; i++) {
      stream.push({
        theta: Math.random() * Math.PI * 2,
        z: Math.random() * TUNNEL_DEPTH - TUNNEL_DEPTH * 0.3,
        radius: Math.random() * 30,
        speed: 2 + Math.random() * 3,
        size: 0.8 + Math.random() * 1.2,
        hue: Math.random() > 0.5 ? 1 : 0,
      });
    }
    streamRef.current = stream;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    initParticles();

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: 0, y: 0 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const blush = { r: 231, g: 208, b: 200 };
    const teal = { r: 129, g: 209, b: 208 };

    const project = (x: number, y: number, z: number, cx: number, cy: number) => {
      const pitch = rotRef.current.pitch;
      const yaw = rotRef.current.yaw;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y1 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;

      const depth = z2 + TUNNEL_DEPTH * 0.6;
      if (depth <= 10) return null;

      const scale = FOV / depth;
      return {
        sx: cx + x1 * scale,
        sy: cy + y1 * scale,
        scale,
        depth,
      };
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const targetYaw = mouseRef.current.x * 0.35;
      const targetPitch = mouseRef.current.y * -0.25;
      rotRef.current.yaw = lerp(rotRef.current.yaw, targetYaw, 0.04);
      rotRef.current.pitch = lerp(rotRef.current.pitch, targetPitch, 0.04);

      const allParticles: { p: Particle; isStream: boolean }[] = [];

      particlesRef.current.forEach((p) => {
        p.theta += p.speed * 0.003;
        p.z -= p.speed * 0.15;
        if (p.z < -TUNNEL_DEPTH * 0.3) p.z = TUNNEL_DEPTH * 0.7;
        allParticles.push({ p, isStream: false });
      });

      streamRef.current.forEach((p) => {
        p.z -= p.speed;
        if (p.z < -TUNNEL_DEPTH * 0.3) {
          p.z = TUNNEL_DEPTH * 0.7;
          p.theta = Math.random() * Math.PI * 2;
          p.radius = Math.random() * 30;
        }
        allParticles.push({ p, isStream: true });
      });

      const projected = allParticles
        .map(({ p, isStream }) => {
          const x = Math.cos(p.theta) * p.radius;
          const y = Math.sin(p.theta) * p.radius;
          const proj = project(x, y, p.z, cx, cy);
          if (!proj) return null;
          return { ...proj, p, isStream };
        })
        .filter(Boolean) as {
        sx: number;
        sy: number;
        scale: number;
        depth: number;
        p: Particle;
        isStream: boolean;
      }[];

      projected.sort((a, b) => a.depth - b.depth);

      projected.forEach(({ sx, sy, scale, depth, p, isStream }) => {
        const maxDepth = TUNNEL_DEPTH * 1.2;
        const normalizedDepth = Math.min(depth / maxDepth, 1);
        const alpha = isStream
          ? (1 - normalizedDepth * 0.7) * 0.9
          : (1 - normalizedDepth * 0.8) * 0.5;

        const color = p.hue === 1 ? teal : blush;
        const drawSize = p.size * scale * (isStream ? 1.5 : 1);

        if (drawSize < 0.2) return;

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(drawSize, 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
      });

      const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      glowGradient.addColorStop(0, 'rgba(129, 209, 208, 0.04)');
      glowGradient.addColorStop(0.5, 'rgba(231, 208, 200, 0.02)');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ display: 'block' }}
    />
  );
};
