import { useEffect, useRef } from 'react';
import styles from './ParticlesLayer.module.css';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

const PARTICLE_COUNT = 55;

function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 2.2 + Math.random() * 4.2,
    speed: 8 + Math.random() * 18, // px/s hacia arriba
    drift: (Math.random() - 0.5) * 6, // px/s lateral
    opacity: 0.45 + Math.random() * 0.55,
    twinkleSpeed: 0.6 + Math.random() * 1.4,
    twinklePhase: Math.random() * Math.PI * 2,
  };
}

/**
 * Chispas/particulas flotando lento hacia arriba, en canvas (no
 * DOM/CSS por elemento) para que las particulas animando full-time en un
 * kiosco no le cuesten reflow al resto de la pantalla. Capa decorativa
 * encima del estado Idle del pitch.
 */
export function ParticlesLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement ?? canvas);

    let lastTs = performance.now();
    let frameId: number;

    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.y -= particle.speed * dt;
        particle.x += particle.drift * dt;
        particle.twinklePhase += particle.twinkleSpeed * dt;

        if (particle.y < -10) {
          particle.y = height + 10;
          particle.x = Math.random() * width;
        }
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;

        const twinkle = 0.6 + 0.4 * Math.sin(particle.twinklePhase);
        const alpha = (particle.opacity * twinkle).toFixed(3);
        // Rojo de marca con brillo suave (glow), no blanco solido - se ve
        // tanto sobre fondos claros como sobre las franjas rojas de marca.
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(234, 0, 41, ${(Number(alpha) * 0.35).toFixed(3)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(234, 0, 41, ${alpha})`;
        ctx.fill();
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
