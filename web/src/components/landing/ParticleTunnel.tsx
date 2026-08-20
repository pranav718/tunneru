'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  theta: number;
  z: number;
  radius: number;
  speed: number;
  size: number;
  type: 'request' | 'response' | 'sync';
}

interface ByteToken {
  text: string;
  theta: number;
  z: number;
  radius: number;
  speed: number;
  type: 'request' | 'response' | 'meta';
}

const RING_COUNT = 14;
const RING_SEGMENTS = 24;
const PARTICLE_COUNT = 1800;
const TOKEN_COUNT = 32;
const TUNNEL_RADIUS = 160;
const TUNNEL_DEPTH = 900;
const FOV = 520;

const BYTE_STRINGS = [
  '0x01', '0x02', '0x04', '0xFF', 'SYN', 'ACK', 'FIN',
  'STREAM:01', 'STREAM:03', 'LEN:64', 'POST', 'GET',
  '200_OK', 'TCP_EST', '9B_MUX', 'LOCAL:3000', 'INGRESS',
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ParticleTunnel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ pitch: 0, yaw: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const tokensRef = useRef<ByteToken[]>([]);
  const animRef = useRef<number>(0);

  const initData = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const rand = Math.random();
      const type: 'request' | 'response' | 'sync' =
        rand < 0.5 ? 'request' : rand < 0.85 ? 'response' : 'sync';
      
      const inConduit = Math.random() < 0.25;
      const radius = inConduit
        ? Math.random() * 40
        : TUNNEL_RADIUS + (Math.random() - 0.5) * 30;

      particles.push({
        theta: Math.random() * Math.PI * 2,
        z: Math.random() * TUNNEL_DEPTH - TUNNEL_DEPTH * 0.2,
        radius,
        speed: inConduit ? 2.5 + Math.random() * 3.5 : 0.6 + Math.random() * 1.2,
        size: inConduit ? 1.0 + Math.random() * 1.5 : 0.6 + Math.random() * 1.0,
        type,
      });
    }
    particlesRef.current = particles;

    const tokens: ByteToken[] = [];
    for (let i = 0; i < TOKEN_COUNT; i++) {
      const str = BYTE_STRINGS[Math.floor(Math.random() * BYTE_STRINGS.length)];
      const rand = Math.random();
      const type: 'request' | 'response' | 'meta' =
        rand < 0.45 ? 'request' : rand < 0.8 ? 'response' : 'meta';
      tokens.push({
        text: str,
        theta: Math.random() * Math.PI * 2,
        z: Math.random() * TUNNEL_DEPTH - TUNNEL_DEPTH * 0.1,
        radius: 60 + Math.random() * 80,
        speed: 1.2 + Math.random() * 2.0,
        type,
      });
    }
    tokensRef.current = tokens;
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
    initData();

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

    const colorTeal = { r: 129, g: 209, b: 208 };
    const colorBlush = { r: 231, g: 208, b: 200 };
    const colorMint = { r: 183, g: 241, b: 224 };
    const colorDim = { r: 94, g: 87, b: 92 };

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

      const depth = z2 + TUNNEL_DEPTH * 0.55;
      if (depth <= 15) return null;

      const scale = FOV / depth;
      return {
        sx: cx + x1 * scale,
        sy: cy + y1 * scale,
        scale,
        depth,
      };
    };

    let frameCount = 0;

    const animate = () => {
      frameCount++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const targetYaw = mouseRef.current.x * 0.4;
      const targetPitch = mouseRef.current.y * -0.3;
      rotRef.current.yaw = lerp(rotRef.current.yaw, targetYaw, 0.04);
      rotRef.current.pitch = lerp(rotRef.current.pitch, targetPitch, 0.04);

      const ringOffset = (frameCount * 0.8) % (TUNNEL_DEPTH / RING_COUNT);
      for (let r = 0; r < RING_COUNT; r++) {
        const ringZ = r * (TUNNEL_DEPTH / RING_COUNT) - ringOffset;
        const ringPoints: { sx: number; sy: number; depth: number }[] = [];

        for (let s = 0; s < RING_SEGMENTS; s++) {
          const theta = (s / RING_SEGMENTS) * Math.PI * 2;
          const x = Math.cos(theta) * TUNNEL_RADIUS;
          const y = Math.sin(theta) * TUNNEL_RADIUS;
          const proj = project(x, y, ringZ, cx, cy);
          if (proj) ringPoints.push(proj);
        }

        if (ringPoints.length > 2) {
          const avgDepth = ringPoints.reduce((acc, pt) => acc + pt.depth, 0) / ringPoints.length;
          const maxDepth = TUNNEL_DEPTH * 1.1;
          const normDepth = Math.min(avgDepth / maxDepth, 1);
          const alpha = Math.max(0, (1 - normDepth) * 0.18);

          ctx.beginPath();
          ringPoints.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.sx, pt.sy);
            else ctx.lineTo(pt.sx, pt.sy);
          });
          ctx.closePath();
          ctx.strokeStyle = `rgba(${colorBlush.r}, ${colorBlush.g}, ${colorBlush.b}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

        }
      }

      particlesRef.current.forEach((p) => {
        p.theta += p.speed * 0.002;
        p.z -= p.speed;
        if (p.z < -TUNNEL_DEPTH * 0.2) {
          p.z = TUNNEL_DEPTH * 0.8;
        }
      });

      tokensRef.current.forEach((t) => {
        t.z -= t.speed;
        if (t.z < -TUNNEL_DEPTH * 0.15) {
          t.z = TUNNEL_DEPTH * 0.75;
          t.theta = Math.random() * Math.PI * 2;
          t.text = BYTE_STRINGS[Math.floor(Math.random() * BYTE_STRINGS.length)];
        }
      });

      const projectedParticles = particlesRef.current
        .map((p) => {
          const x = Math.cos(p.theta) * p.radius;
          const y = Math.sin(p.theta) * p.radius;
          const proj = project(x, y, p.z, cx, cy);
          if (!proj) return null;
          return { ...proj, p };
        })
        .filter(Boolean) as {
        sx: number;
        sy: number;
        scale: number;
        depth: number;
        p: Particle;
      }[];

      const projectedTokens = tokensRef.current
        .map((t) => {
          const x = Math.cos(t.theta) * t.radius;
          const y = Math.sin(t.theta) * t.radius;
          const proj = project(x, y, t.z, cx, cy);
          if (!proj) return null;
          return { ...proj, t };
        })
        .filter(Boolean) as {
        sx: number;
        sy: number;
        scale: number;
        depth: number;
        t: ByteToken;
      }[];

      projectedParticles.sort((a, b) => a.depth - b.depth);

      projectedParticles.forEach(({ sx, sy, scale, depth, p }) => {
        const maxDepth = TUNNEL_DEPTH * 1.2;
        const normDepth = Math.min(depth / maxDepth, 1);
        const alpha = Math.max(0, (1 - normDepth * 0.75) * 0.7);

        let color = colorTeal;
        if (p.type === 'response') color = colorBlush;
        if (p.type === 'sync') color = colorMint;

        const drawSize = p.size * scale;
        if (drawSize < 0.25) return;

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(drawSize, 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
      });

      projectedTokens.forEach(({ sx, sy, scale, depth, t }) => {
        const maxDepth = TUNNEL_DEPTH * 1.2;
        const normDepth = Math.min(depth / maxDepth, 1);
        const alpha = Math.max(0, (1 - normDepth * 0.8) * 0.85);

        let color = colorTeal;
        if (t.type === 'response') color = colorBlush;
        if (t.type === 'meta') color = colorMint;

        const fontSize = Math.max(6, Math.min(11, 9 * scale));
        ctx.font = `${fontSize}px "SF Mono", "Fira Code", monospace`;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fillText(t.text, sx, sy);
      });

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
      glow.addColorStop(0, 'rgba(129, 209, 208, 0.05)');
      glow.addColorStop(0.5, 'rgba(231, 208, 200, 0.02)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.font = '9px "SF Mono", monospace';
      ctx.fillStyle = 'rgba(154, 147, 154, 0.4)';
      ctx.fillText('conduit: persistent tcp', 12, 18);
      ctx.fillText('mux: 9B binary framing', 12, 30);
      ctx.fillStyle = 'rgba(129, 209, 208, 0.6)';
      ctx.fillText('active stream', w - 85, 18);
      ctx.restore();

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initData]);

  return (
    <div className="w-full h-full relative group">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: 'block' }}
      />
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-[9px] font-mono text-[var(--text-dim)] border-t border-[var(--border-subtle)]/40 pt-2">
        <span className="text-[var(--teal)]">requests</span>
        <span className="text-[var(--blush)]">responses</span>
        <span className="text-[var(--status-success)]">sync framing</span>
      </div>
    </div>
  );
};
