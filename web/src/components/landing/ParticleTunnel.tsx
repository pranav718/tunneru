'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 8500;
const TUNNEL_RADIUS = 160;
const CAMERA_Z = 180;
const FAR_Z = -1000;
const NEAR_Z = CAMERA_Z + 40;

function createCircleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const ParticleTunnel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0c0d, 0.0018);

    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 2000);
    camera.position.set(0, 0, CAMERA_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const originalRadii = new Float32Array(PARTICLE_COUNT);
    const thetas = new Float32Array(PARTICLE_COUNT);

    const cream = new THREE.Color(0xe7d0c8);
    const teal = new THREE.Color(0x81d1d0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const isMouthCluster = Math.random() < 0.35;
      const zNorm = isMouthCluster ? Math.pow(Math.random(), 2.2) * 0.35 : Math.random();
      const z = FAR_Z + zNorm * (NEAR_Z - FAR_Z);

      const theta = Math.random() * Math.PI * 2;
      const radiusJitter = (Math.random() - 0.5) * 36 + (Math.random() - 0.5) * 18;
      const r = TUNNEL_RADIUS + radiusJitter;

      thetas[i] = theta;
      originalRadii[i] = r;

      positions[i3] = r * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(theta);
      positions[i3 + 2] = z;

      speeds[i] = 0.55 + Math.random() * 0.65;

      const isTeal = Math.random() < 0.28;
      const baseColor = isTeal ? teal : cream;
      const shade = 0.7 + Math.random() * 0.3;

      colors[i3] = baseColor.r * shade;
      colors[i3 + 1] = baseColor.g * shade;
      colors[i3 + 2] = baseColor.b * shade;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const spriteTexture = createCircleTexture();
    const material = new THREE.PointsMaterial({
      size: 4.8,
      map: spriteTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
      opacity: 0.82,
    });

    const points = new THREE.Points(geometry, material);
    points.position.set(width > 900 ? 120 : 0, -10, 0);
    scene.add(points);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      mouse.targetX = normX * 0.35;
      mouse.targetY = normY * 0.25;
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      points.position.set(width > 900 ? 120 : 0, -10, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      points.rotation.y = mouse.x * 0.65;
      points.rotation.x = mouse.y * 0.45;
      points.rotation.z += 0.0008;

      const pos = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += speeds[i];

        if (pos[i3 + 2] > NEAR_Z) {
          pos[i3 + 2] = FAR_Z + (pos[i3 + 2] - NEAR_Z);

          const theta = Math.random() * Math.PI * 2;
          const radiusJitter = (Math.random() - 0.5) * 36 + (Math.random() - 0.5) * 18;
          const r = TUNNEL_RADIUS + radiusJitter;
          thetas[i] = theta;
          originalRadii[i] = r;

          pos[i3] = r * Math.cos(theta);
          pos[i3 + 1] = r * Math.sin(theta);
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      spriteTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full pointer-events-none select-none"
      style={{ overflow: 'hidden' }}
    />
  );
};
