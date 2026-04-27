import { Snake, Food, Particle, Point, GameState } from './types';
import { SEGMENT_SIZE } from './constants';

function getPunkLevel(score: number): number {
  if (score < 5) return 0;   // Baby
  if (score < 15) return 1;  // Kid
  if (score < 35) return 2;  // Teen Punk
  if (score < 60) return 3;  // Punk
  return 4;                   // Mega Punk
}

function getSegmentSize(snake: Snake, index: number): number {
  const baseSize = SEGMENT_SIZE + snake.score * 0.3;
  const maxSize = Math.min(baseSize, 30);
  // Head is bigger, body tapers towards tail
  if (index === 0) return maxSize * 1.3;
  const ratio = 1 - (index / snake.segments.length) * 0.4;
  return maxSize * ratio;
}

function drawBabyFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number, snake: Snake, time: number) {
  const headSize = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, headSize, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cute blush
  ctx.beginPath();
  ctx.arc(-headSize * 0.4, headSize * 0.3, headSize * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,150,150,0.5)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headSize * 0.4, headSize * 0.3, headSize * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Big cute eyes
  const eyeSize = headSize * 0.35;
  const blinkPhase = Math.sin(time * 0.003 + snake.eyeAnimation);
  const eyeH = blinkPhase > 0.95 ? eyeSize * 0.1 : eyeSize;

  // Left eye
  ctx.beginPath();
  ctx.ellipse(-headSize * 0.3, -headSize * 0.15, eyeSize * 0.7, eyeH, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left pupil
  ctx.beginPath();
  ctx.arc(-headSize * 0.25, -headSize * 0.1, eyeSize * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  // Eye shine
  ctx.beginPath();
  ctx.arc(-headSize * 0.2, -headSize * 0.2, eyeSize * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Right eye
  ctx.beginPath();
  ctx.ellipse(headSize * 0.3, -headSize * 0.15, eyeSize * 0.7, eyeH, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right pupil
  ctx.beginPath();
  ctx.arc(headSize * 0.35, -headSize * 0.1, eyeSize * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  // Eye shine
  ctx.beginPath();
  ctx.arc(headSize * 0.4, -headSize * 0.2, eyeSize * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Cute tiny mouth
  ctx.beginPath();
  ctx.arc(headSize * 0.05, headSize * 0.35, headSize * 0.12, 0, Math.PI);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tiny pacifier/dummy for level 0
  if (snake.score < 3) {
    ctx.beginPath();
    ctx.arc(headSize * 0.05, headSize * 0.5, headSize * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function drawKidFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number, snake: Snake, _time: number) {
  const headSize = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, headSize, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small mohawk starting
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * headSize * 0.15, -headSize * 0.8);
    ctx.lineTo(i * headSize * 0.1, -headSize * 1.2);
    ctx.lineTo(i * headSize * 0.15 + headSize * 0.08, -headSize * 0.8);
    ctx.fillStyle = snake.accentColor;
    ctx.fill();
  }

  // Eyes - slightly edgier
  const eyeSize = headSize * 0.3;
  // Left eye
  ctx.beginPath();
  ctx.ellipse(-headSize * 0.3, -headSize * 0.1, eyeSize * 0.65, eyeSize, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-headSize * 0.25, -headSize * 0.05, eyeSize * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Right eye
  ctx.beginPath();
  ctx.ellipse(headSize * 0.3, -headSize * 0.1, eyeSize * 0.65, eyeSize, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(headSize * 0.35, -headSize * 0.05, eyeSize * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Smirk
  ctx.beginPath();
  ctx.arc(0, headSize * 0.3, headSize * 0.2, 0.1, Math.PI - 0.1);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Band-aid
  ctx.save();
  ctx.translate(headSize * 0.5, -headSize * 0.4);
  ctx.rotate(0.3);
  ctx.fillStyle = '#FFDAB9';
  ctx.fillRect(-headSize * 0.15, -headSize * 0.05, headSize * 0.3, headSize * 0.1);
  ctx.restore();

  ctx.restore();
}

function drawTeenPunkFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number, snake: Snake, time: number) {
  const headSize = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, headSize, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mohawk - bigger
  for (let i = -3; i <= 3; i++) {
    const h = headSize * (1.5 + Math.sin(time * 0.005 + i) * 0.1);
    ctx.beginPath();
    ctx.moveTo(i * headSize * 0.12, -headSize * 0.7);
    ctx.lineTo(i * headSize * 0.05, -h);
    ctx.lineTo(i * headSize * 0.12 + headSize * 0.1, -headSize * 0.7);
    ctx.fillStyle = snake.accentColor;
    ctx.fill();
  }

  // Angry eyebrows
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.55, -headSize * 0.35);
  ctx.lineTo(-headSize * 0.1, -headSize * 0.25);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(headSize * 0.55, -headSize * 0.35);
  ctx.lineTo(headSize * 0.1, -headSize * 0.25);
  ctx.stroke();

  // Eyes
  const eyeSize = headSize * 0.25;
  // Left
  ctx.beginPath();
  ctx.arc(-headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-headSize * 0.25, 0, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#c00';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-headSize * 0.25, 0, eyeSize * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Right
  ctx.beginPath();
  ctx.arc(headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headSize * 0.35, 0, eyeSize * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#c00';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headSize * 0.35, 0, eyeSize * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Nose piercing
  ctx.beginPath();
  ctx.arc(0, headSize * 0.15, headSize * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#C0C0C0';
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Snarl mouth
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.3, headSize * 0.4);
  ctx.quadraticCurveTo(-headSize * 0.1, headSize * 0.25, 0, headSize * 0.4);
  ctx.quadraticCurveTo(headSize * 0.1, headSize * 0.55, headSize * 0.3, headSize * 0.35);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPunkFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number, snake: Snake, time: number) {
  const headSize = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  // Head with dark outline
  ctx.beginPath();
  ctx.arc(0, 0, headSize, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Big mohawk
  for (let i = -4; i <= 4; i++) {
    const h = headSize * (1.8 + Math.sin(time * 0.004 + i * 0.5) * 0.2);
    ctx.beginPath();
    ctx.moveTo(i * headSize * 0.1, -headSize * 0.6);
    ctx.lineTo(i * headSize * 0.03, -h);
    ctx.lineTo(i * headSize * 0.1 + headSize * 0.08, -headSize * 0.6);
    ctx.fillStyle = snake.accentColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Skull face paint around eyes
  ctx.beginPath();
  ctx.ellipse(-headSize * 0.3, -headSize * 0.05, headSize * 0.28, headSize * 0.25, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headSize * 0.3, -headSize * 0.05, headSize * 0.28, headSize * 0.25, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Evil eyes
  const eyeSize = headSize * 0.2;
  // Left
  ctx.beginPath();
  ctx.arc(-headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-headSize * 0.28, -headSize * 0.03, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  // Fire glow
  ctx.beginPath();
  ctx.arc(-headSize * 0.3, -headSize * 0.05, eyeSize * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, ${100 + Math.sin(time * 0.01) * 50}, 0, 0.2)`;
  ctx.fill();

  // Right
  ctx.beginPath();
  ctx.arc(headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headSize * 0.32, -headSize * 0.03, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headSize * 0.3, -headSize * 0.05, eyeSize * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, ${100 + Math.sin(time * 0.01) * 50}, 0, 0.2)`;
  ctx.fill();

  // Angry eyebrows - heavy
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.6, -headSize * 0.35);
  ctx.lineTo(-headSize * 0.1, -headSize * 0.2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headSize * 0.6, -headSize * 0.35);
  ctx.lineTo(headSize * 0.1, -headSize * 0.2);
  ctx.stroke();

  // Piercings
  ctx.beginPath();
  ctx.arc(-headSize * 0.55, headSize * 0.05, headSize * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#C0C0C0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headSize * 0.55, headSize * 0.05, headSize * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#C0C0C0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, headSize * 0.2, headSize * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = '#C0C0C0';
  ctx.fill();

  // Teeth snarl
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.35, headSize * 0.4);
  ctx.lineTo(headSize * 0.35, headSize * 0.35);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Teeth
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * headSize * 0.12, headSize * 0.38);
    ctx.lineTo(i * headSize * 0.12, headSize * 0.48);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawMegaPunkFace(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number, snake: Snake, time: number) {
  const headSize = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  // Fire aura
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.005;
    const dist = headSize * 1.3 + Math.sin(time * 0.01 + i) * headSize * 0.2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist * 0.3, Math.sin(angle) * dist * 0.3, headSize * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${50 + i * 20}, 0, ${0.3 + Math.sin(time * 0.01 + i) * 0.15})`;
    ctx.fill();
  }

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, headSize, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headSize);
  gradient.addColorStop(0, snake.color);
  gradient.addColorStop(1, '#000');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = snake.accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Epic mohawk with flames
  for (let i = -5; i <= 5; i++) {
    const h = headSize * (2.2 + Math.sin(time * 0.006 + i * 0.7) * 0.3);
    ctx.beginPath();
    ctx.moveTo(i * headSize * 0.09, -headSize * 0.5);
    ctx.lineTo(i * headSize * 0.02, -h);
    ctx.lineTo(i * headSize * 0.09 + headSize * 0.07, -headSize * 0.5);
    
    const mohawkGrad = ctx.createLinearGradient(0, -headSize * 0.5, 0, -h);
    mohawkGrad.addColorStop(0, snake.accentColor);
    mohawkGrad.addColorStop(0.7, '#ff4500');
    mohawkGrad.addColorStop(1, '#ff0');
    ctx.fillStyle = mohawkGrad;
    ctx.fill();
  }

  // Skull paint - full face
  ctx.beginPath();
  ctx.ellipse(-headSize * 0.3, -headSize * 0.05, headSize * 0.3, headSize * 0.28, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headSize * 0.3, -headSize * 0.05, headSize * 0.3, headSize * 0.28, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Demon eyes
  const eyeGlow = Math.sin(time * 0.015) * 0.5 + 0.5;
  const eyeSize = headSize * 0.22;
  
  // Left
  ctx.beginPath();
  ctx.arc(-headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(255, ${Math.floor(eyeGlow * 100)}, 0)`;
  ctx.fill();
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Slit pupil
  ctx.beginPath();
  ctx.ellipse(-headSize * 0.3, -headSize * 0.05, eyeSize * 0.15, eyeSize * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Right
  ctx.beginPath();
  ctx.arc(headSize * 0.3, -headSize * 0.05, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(255, ${Math.floor(eyeGlow * 100)}, 0)`;
  ctx.fill();
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(headSize * 0.3, -headSize * 0.05, eyeSize * 0.15, eyeSize * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Heavy eyebrows
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.65, -headSize * 0.4);
  ctx.lineTo(-headSize * 0.1, -headSize * 0.22);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headSize * 0.65, -headSize * 0.4);
  ctx.lineTo(headSize * 0.1, -headSize * 0.22);
  ctx.stroke();

  // Multiple piercings
  const piercings = [
    { x: -headSize * 0.6, y: headSize * 0.05 },
    { x: headSize * 0.6, y: headSize * 0.05 },
    { x: -headSize * 0.5, y: headSize * 0.2 },
    { x: headSize * 0.5, y: headSize * 0.2 },
    { x: 0, y: headSize * 0.25 },
    { x: -headSize * 0.15, y: headSize * 0.22 },
  ];
  piercings.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, headSize * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = '#C0C0C0';
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Scar
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.5, -headSize * 0.4);
  ctx.lineTo(-headSize * 0.2, headSize * 0.1);
  ctx.strokeStyle = '#800';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fanged mouth
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.4, headSize * 0.4);
  ctx.lineTo(headSize * 0.4, headSize * 0.38);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Fangs
  ctx.beginPath();
  ctx.moveTo(-headSize * 0.25, headSize * 0.4);
  ctx.lineTo(-headSize * 0.22, headSize * 0.55);
  ctx.lineTo(-headSize * 0.18, headSize * 0.4);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headSize * 0.18, headSize * 0.39);
  ctx.lineTo(headSize * 0.22, headSize * 0.55);
  ctx.lineTo(headSize * 0.25, headSize * 0.39);
  ctx.fill();

  // Chain necklace hint at bottom
  ctx.beginPath();
  ctx.arc(0, headSize * 0.9, headSize * 0.6, -0.8, Math.PI + 0.8, true);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawSnakeBody(ctx: CanvasRenderingContext2D, snake: Snake, camera: Point, canvasW: number, canvasH: number, time: number) {
  if (!snake.alive || snake.segments.length < 2) return;

  const punkLevel = getPunkLevel(snake.score);

  // Draw body segments from tail to head
  for (let i = snake.segments.length - 1; i >= 1; i--) {
    const seg = snake.segments[i];
    const sx = seg.x - camera.x + canvasW / 2;
    const sy = seg.y - camera.y + canvasH / 2;

    if (sx < -50 || sx > canvasW + 50 || sy < -50 || sy > canvasH + 50) continue;

    const segSize = getSegmentSize(snake, i);

    ctx.beginPath();
    ctx.arc(sx, sy, segSize, 0, Math.PI * 2);

    // Body pattern based on punk level
    if (punkLevel >= 3) {
      // Spiky pattern
      if (i % 3 === 0) {
        ctx.fillStyle = snake.accentColor;
      } else if (i % 3 === 1) {
        ctx.fillStyle = '#111';
      } else {
        ctx.fillStyle = snake.color;
      }

      // Spikes on body for punk levels
      if (i % 4 === 0 && punkLevel >= 3) {
        const nextSeg = snake.segments[Math.max(0, i - 1)];
        const angle = Math.atan2(nextSeg.y - seg.y, nextSeg.x - seg.x);
        const spikeLen = segSize * (punkLevel >= 4 ? 1.0 : 0.6);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, -segSize);
        ctx.lineTo(spikeLen * 0.5, -segSize - spikeLen);
        ctx.lineTo(0, -segSize + 2);
        ctx.fillStyle = punkLevel >= 4 ? snake.accentColor : '#333';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, segSize);
        ctx.lineTo(spikeLen * 0.5, segSize + spikeLen);
        ctx.lineTo(0, segSize - 2);
        ctx.fillStyle = punkLevel >= 4 ? snake.accentColor : '#333';
        ctx.fill();

        ctx.restore();
      }
    } else if (punkLevel >= 1) {
      if (i % 2 === 0) {
        ctx.fillStyle = snake.color;
      } else {
        ctx.fillStyle = snake.accentColor;
      }
    } else {
      // Baby - soft gradient
      ctx.fillStyle = snake.color;
    }

    ctx.fill();

    // Body outline
    ctx.strokeStyle = punkLevel >= 3 ? '#000' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = punkLevel >= 3 ? 2 : 1;
    ctx.stroke();

    // Glow for mega punk
    if (punkLevel >= 4 && i % 5 === 0) {
      ctx.beginPath();
      ctx.arc(sx, sy, segSize * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 0, ${0.1 + Math.sin(time * 0.01 + i) * 0.05})`;
      ctx.fill();
    }
  }

  // Draw head
  const head = snake.segments[0];
  const hx = head.x - camera.x + canvasW / 2;
  const hy = head.y - camera.y + canvasH / 2;
  const headSize = getSegmentSize(snake, 0);

  if (hx > -100 && hx < canvasW + 100 && hy > -100 && hy < canvasH + 100) {
    switch (punkLevel) {
      case 0:
        drawBabyFace(ctx, hx, hy, headSize, snake.direction, snake, time);
        break;
      case 1:
        drawKidFace(ctx, hx, hy, headSize, snake.direction, snake, time);
        break;
      case 2:
        drawTeenPunkFace(ctx, hx, hy, headSize, snake.direction, snake, time);
        break;
      case 3:
        drawPunkFace(ctx, hx, hy, headSize, snake.direction, snake, time);
        break;
      case 4:
        drawMegaPunkFace(ctx, hx, hy, headSize, snake.direction, snake, time);
        break;
    }

    // Name tag
    const labels = ['👶', '🧒', '🎸', '🤘', '💀'];
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(10, 12)}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${labels[punkLevel]} ${snake.name}`, hx, hy - headSize - 15);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`${snake.score}`, hx, hy - headSize - 4);
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: Food, camera: Point, canvasW: number, canvasH: number, time: number) {
  const fx = food.x - camera.x + canvasW / 2;
  const fy = food.y - camera.y + canvasH / 2;

  if (fx < -20 || fx > canvasW + 20 || fy < -20 || fy > canvasH + 20) return;

  const pulse = 1 + Math.sin(time * 0.008 + food.pulse) * 0.2;
  const size = food.size * pulse;

  ctx.beginPath();
  ctx.arc(fx, fy, size, 0, Math.PI * 2);

  if (food.type === 'mega') {
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, food.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Star shape
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2 + time * 0.003;
      const r = i % 2 === 0 ? size * 1.2 : size * 0.5;
      if (i === 0) ctx.moveTo(fx + Math.cos(angle) * r, fy + Math.sin(angle) * r);
      else ctx.lineTo(fx + Math.cos(angle) * r, fy + Math.sin(angle) * r);
    }
    ctx.fillStyle = food.color;
    ctx.fill();
  } else if (food.type === 'power') {
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, food.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = food.color;
  }
  ctx.fill();

  // Glow
  ctx.beginPath();
  ctx.arc(fx, fy, size * 2, 0, Math.PI * 2);
  ctx.fillStyle = `${food.color}22`;
  ctx.fill();
}

function drawGrid(ctx: CanvasRenderingContext2D, camera: Point, canvasW: number, canvasH: number) {
  const gridSize = 80;
  const startX = -((camera.x - canvasW / 2) % gridSize);
  const startY = -((camera.y - canvasH / 2) % gridSize);

  ctx.strokeStyle = 'rgba(50, 50, 70, 0.3)';
  ctx.lineWidth = 0.5;

  for (let x = startX; x < canvasW; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
  }
  for (let y = startY; y < canvasH; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }
}

function drawBorder(ctx: CanvasRenderingContext2D, camera: Point, canvasW: number, canvasH: number, worldSize: number, time: number) {
  const offX = -camera.x + canvasW / 2;
  const offY = -camera.y + canvasH / 2;

  ctx.strokeStyle = `rgba(255, 0, ${100 + Math.sin(time * 0.005) * 100}, 0.8)`;
  ctx.lineWidth = 4;
  ctx.setLineDash([15, 10]);
  ctx.strokeRect(offX, offY, worldSize, worldSize);
  ctx.setLineDash([]);

  // Warning zone
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.15)';
  ctx.lineWidth = 40;
  ctx.strokeRect(offX + 20, offY + 20, worldSize - 40, worldSize - 40);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camera: Point, canvasW: number, canvasH: number) {
  particles.forEach(p => {
    const px = p.x - camera.x + canvasW / 2;
    const py = p.y - camera.y + canvasH / 2;
    if (px < -20 || px > canvasW + 20 || py < -20 || py > canvasH + 20) return;

    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(px, py, p.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fill();
  });
}

function drawMinimap(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const mapSize = 150;
  const mx = canvasW - mapSize - 15;
  const my = canvasH - mapSize - 15;
  const scale = mapSize / state.worldSize;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(mx - 2, my - 2, mapSize + 4, mapSize + 4);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 2, my - 2, mapSize + 4, mapSize + 4);

  // Snakes on minimap
  state.snakes.forEach(snake => {
    if (!snake.alive) return;
    const sx = mx + snake.segments[0].x * scale;
    const sy = my + snake.segments[0].y * scale;
    ctx.beginPath();
    ctx.arc(sx, sy, snake.isPlayer ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = snake.isPlayer ? '#fff' : snake.color;
    ctx.fill();
    if (snake.isPlayer) {
      ctx.strokeStyle = snake.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  time: number
) {
  // Clear
  ctx.fillStyle = '#0d0d15';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Grid
  drawGrid(ctx, state.camera, canvasW, canvasH);

  // Border
  drawBorder(ctx, state.camera, canvasW, canvasH, state.worldSize, time);

  // Foods
  state.foods.forEach(food => drawFood(ctx, food, state.camera, canvasW, canvasH, time));

  // Particles
  drawParticles(ctx, state.particles, state.camera, canvasW, canvasH);

  // Snakes (draw player last so on top)
  const sortedSnakes = [...state.snakes].sort((a, b) => {
    if (a.isPlayer) return 1;
    if (b.isPlayer) return -1;
    return 0;
  });

  sortedSnakes.forEach(snake => drawSnakeBody(ctx, snake, state.camera, canvasW, canvasH, time));

  // Minimap
  drawMinimap(ctx, state, canvasW, canvasH);
}
