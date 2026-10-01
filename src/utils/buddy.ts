import { STATUS_COLORS } from '../constants/projects';
import type { AgentStatus } from '../types/agent';

export interface PointerCoord {
  x: number;
  y: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rgb(c: [number, number, number], factor = 1): string {
  return `rgb(${Math.floor(c[0] * factor)}, ${Math.floor(c[1] * factor)}, ${Math.floor(c[2] * factor)})`;
}

export class BuddyRenderer {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cssSize: number;
  private lx = 0;
  private ly = 0;
  private col: [number, number, number] = [...STATUS_COLORS.idle];
  private nextBlink = 1.5;
  private blinkAt = -1;

  constructor(canvas: HTMLCanvasElement, cssSize: number) {
    this.cv = canvas;
    this.cssSize = cssSize;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public draw(
    t: number,
    st: AgentStatus,
    e: number,
    ptr: PointerCoord,
    reducedMotion = false
  ): void {
    const ctx = this.ctx;
    const css = this.cssSize;
    const m = reducedMotion ? 0 : 1;

    ctx.clearRect(0, 0, css, css);
    const rect = this.cv.getBoundingClientRect();

    let tx = clamp((ptr.x - (rect.left + rect.width / 2)) / 260, -1, 1);
    let ty = clamp((ptr.y - (rect.top + rect.height / 2)) / 260, -1, 1);

    if (st === 'working') {
      tx = Math.sin(t * 1.6) * 0.7;
      ty = 0.35;
    }
    if (st === 'waiting') {
      tx *= 0.3;
      ty *= 0.3;
    }

    this.lx += (tx - this.lx) * 0.15;
    this.ly += (ty - this.ly) * 0.15;

    const targetColor = STATUS_COLORS[st];
    for (let i = 0; i < 3; i++) {
      this.col[i] += (targetColor[i] - this.col[i]) * 0.12;
    }

    if (t > this.nextBlink) {
      this.blinkAt = t;
      this.nextBlink = t + 2 + Math.random() * 3;
    }
    const bt = t - this.blinkAt;
    const blink = bt >= 0 && bt < 0.14 ? 1 - Math.sin((bt / 0.14) * Math.PI) * 0.9 : 1;

    let ox = 0;
    let oy = 0;
    let sx = 1;
    let sy = 1;
    let k = 1;
    let b: number;

    if (st === 'idle') {
      b = Math.sin(t * 2.1);
      sx = 1 + 0.015 * b * m;
      sy = 1 - 0.02 * b * m;
    }
    if (st === 'working') {
      b = Math.sin(t * 7);
      sx = 1 + 0.035 * b * m;
      sy = 1 - 0.035 * b * m;
      oy = -Math.abs(Math.sin(t * 3.5)) * 1.5 * m;
    }
    if (st === 'waiting') {
      oy = -Math.abs(Math.sin(t * 4.5)) * 6 * m;
      k = 1.18;
    }
    if (st === 'done' && e < 1.3) {
      oy = -Math.abs(Math.sin(e * Math.PI * 2.5)) * 9 * (1 - e / 1.3) * m;
    }
    if (st === 'error') {
      ox = Math.sin(t * 45) * 2 * m * Math.max(0, 1 - e / 0.7);
    }

    ctx.save();
    const u = css / 100;
    ctx.translate(css / 2 + ox * u, css / 2 + oy * u);
    ctx.scale(u * sx, u * sy);

    // Body: smooth squircle
    const R = 36;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const x = R * (cosA < 0 ? -1 : 1) * Math.pow(Math.abs(cosA), 0.55);
      const y = R * (sinA < 0 ? -1 : 1) * Math.pow(Math.abs(sinA), 0.55);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(0, -R, 0, R);
    g.addColorStop(0, rgb(this.col));
    g.addColorStop(1, rgb(this.col, 0.78));
    ctx.fillStyle = g;
    ctx.fill();

    // Specular highlight on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-13, -27, 11, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const ink = '#14161f';
    const ey = -3 + this.ly * 4;

    // Eyes
    [-13, 13].forEach((bx) => {
      const x = bx + this.lx * 5;
      if (st === 'done') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, ey + 3, 6, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();
      } else if (st === 'error') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 5, ey - 5);
        ctx.lineTo(x + 5, ey + 5);
        ctx.moveTo(x + 5, ey - 5);
        ctx.lineTo(x - 5, ey + 5);
        ctx.stroke();
      } else {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(x, ey, 6 * k, 9 * k * blink, 0, 0, Math.PI * 2);
        ctx.fill();
        if (blink > 0.5) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x + 2, ey - 3.5 * k, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';

    // Mouth / Cheeks based on status
    if (st === 'waiting') {
      ctx.beginPath();
      ctx.ellipse(0, 15, 3.6, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (st === 'done') {
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 9, 7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 110, 150, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-24, 11, 4.6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(24, 11, 4.6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (st === 'error') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-5, 17);
      ctx.lineTo(5, 17);
      ctx.stroke();
    }

    ctx.restore();
  }
}
