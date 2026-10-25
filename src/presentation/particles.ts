import type { Point } from './board-view';

type ParticleKind = 'spark' | 'ring' | 'confetti';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  size: number;
  color: string;
  age: number;
  ttl: number;
  rotation: number;
  spin: number;
}

export interface BurstOptions {
  readonly count: number;
  readonly colors: readonly string[];
  readonly speed: number;
  readonly size: number;
  readonly ttl?: number;
  readonly gravity?: number;
}

const MAX_PARTICLES = 3000;

export class Particles {
  private readonly context: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private frame = 0;
  private lastTime = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not supported');
    this.context = context;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  burst({ x, y }: Point, { count, colors, speed, size, ttl = 0.7, gravity = 600 }: BurstOptions): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      this.add({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - speed * 0.3,
        gravity,
        drag: 0.15,
        size: size * (0.5 + Math.random() * 0.8),
        color: pick(colors),
        age: 0,
        ttl: ttl * (0.6 + Math.random() * 0.6),
        rotation: 0,
        spin: 0,
      });
    }
    this.start();
  }

  ring({ x, y }: Point, color: string, radius: number): void {
    this.add({ kind: 'ring', x, y, vx: 0, vy: 0, gravity: 0, drag: 1, size: radius, color, age: 0, ttl: 0.6, rotation: 0, spin: 0 });
    this.start();
  }

  confetti(count: number, colors: readonly string[]): void {
    for (let i = 0; i < count; i++) {
      this.add({
        kind: 'confetti',
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 220,
        vy: 80 + Math.random() * 260,
        gravity: 220,
        drag: 0.55,
        size: 6 + Math.random() * 7,
        color: pick(colors),
        age: 0,
        ttl: 3.5 + Math.random() * 1.5,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 14,
      });
    }
    this.start();
  }

  clear(): void {
    this.particles = [];
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  private add(particle: Particle): void {
    if (this.particles.length < MAX_PARTICLES) this.particles.push(particle);
  }

  private start(): void {
    if (this.frame) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (time: number): void => {
    const dt = Math.max(0, Math.min((time - this.lastTime) / 1000, 0.05));
    this.lastTime = time;
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.particles = this.particles.filter((particle) => {
      particle.age += dt;
      return particle.age < particle.ttl;
    });
    for (const particle of this.particles) {
      this.move(particle, dt);
      this.draw(particle);
    }
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = 'source-over';
    this.frame = this.particles.length > 0 ? requestAnimationFrame(this.tick) : 0;
  };

  private move(particle: Particle, dt: number): void {
    const damping = particle.drag ** dt;
    particle.vx *= damping;
    particle.vy = particle.vy * damping + particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rotation += particle.spin * dt;
    if (particle.kind === 'confetti') particle.x += Math.sin(particle.age * 4 + particle.rotation) * 40 * dt;
  }

  private draw(particle: Particle): void {
    const { context } = this;
    const progress = particle.age / particle.ttl;
    context.fillStyle = particle.color;
    context.strokeStyle = particle.color;

    if (particle.kind === 'spark') {
      context.globalCompositeOperation = 'lighter';
      context.globalAlpha = 1 - progress;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * (0.4 + 0.6 * (1 - progress)), 0, Math.PI * 2);
      context.fill();
      return;
    }

    if (particle.kind === 'ring') {
      context.globalCompositeOperation = 'lighter';
      context.globalAlpha = 1 - progress;
      context.lineWidth = 4 * (1 - progress) + 0.5;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * (1 - (1 - progress) ** 3), 0, Math.PI * 2);
      context.stroke();
      return;
    }

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = Math.min(1, (particle.ttl - particle.age) / 0.6);
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.scale(1, Math.cos(particle.age * 6 + particle.rotation));
    context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    context.restore();
  }

  private resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * ratio;
    this.canvas.height = window.innerHeight * ratio;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
