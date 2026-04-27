import { Snake, Food, Particle, GameState, Point } from './types';
import {
  WORLD_SIZE,
  SEGMENT_SIZE,
  INITIAL_LENGTH,
  MAX_FOOD,
  NUM_BOTS,
  TURN_SPEED,
  BASE_SPEED,
  BOOST_SPEED,
  BOOST_COST,
  FOOD_SPAWN_RATE,
  PUNK_COLORS,
  BOT_NAMES,
} from './constants';

function randomInWorld(margin = 200): number {
  return margin + Math.random() * (WORLD_SIZE - margin * 2);
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angleDiff(a: number, b: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function getCollisionRadius(score: number): number {
  return SEGMENT_SIZE + score * 0.3;
}

function createSnake(id: string, name: string, isPlayer: boolean): Snake {
  const x = randomInWorld();
  const y = randomInWorld();
  const direction = Math.random() * Math.PI * 2;
  const colorSet = PUNK_COLORS[Math.floor(Math.random() * PUNK_COLORS.length)];

  const segments: Point[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    segments.push({
      x: x - Math.cos(direction) * i * SEGMENT_SIZE * 0.8,
      y: y - Math.sin(direction) * i * SEGMENT_SIZE * 0.8,
    });
  }

  return {
    id,
    segments,
    direction,
    targetDirection: direction,
    speed: BASE_SPEED,
    score: 0,
    alive: true,
    name,
    color: colorSet.main,
    accentColor: colorSet.accent,
    isPlayer,
    boosting: false,
    boostCooldown: 0,
    punkLevel: 0,
    eyeAnimation: Math.random() * 100,
    deathTimer: 0,
  };
}

function createFood(type: 'normal' | 'power' | 'mega' = 'normal'): Food {
  const colors = ['#ff0', '#0ff', '#f0f', '#0f0', '#f90', '#f00', '#90f', '#ff69b4'];
  return {
    x: randomInWorld(50),
    y: randomInWorld(50),
    size: type === 'mega' ? 8 : type === 'power' ? 5 : 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    type,
    pulse: Math.random() * Math.PI * 2,
  };
}

function spawnParticles(x: number, y: number, color: string, count: number, particles: Particle[]) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}

export function initGameState(playerName: string): GameState {
  const snakes: Snake[] = [];

  // Player
  snakes.push(createSnake('player', playerName, true));

  // Bots
  for (let i = 0; i < NUM_BOTS; i++) {
    snakes.push(createSnake(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
  }

  // Initial food
  const foods: Food[] = [];
  for (let i = 0; i < MAX_FOOD; i++) {
    const rand = Math.random();
    foods.push(createFood(rand < 0.05 ? 'mega' : rand < 0.2 ? 'power' : 'normal'));
  }

  return {
    snakes,
    foods,
    particles: [],
    camera: { x: snakes[0].segments[0].x, y: snakes[0].segments[0].y },
    worldSize: WORLD_SIZE,
    gameOver: false,
    highScore: 0,
  };
}

function updateBot(snake: Snake, state: GameState) {
  if (!snake.alive) return;

  const head = snake.segments[0];

  // Find nearest food
  let nearestFood: Food | null = null;
  let nearestDist = Infinity;

  for (const food of state.foods) {
    const d = distance(head, food);
    // Prefer bigger food
    const effectiveDist = d / (food.type === 'mega' ? 3 : food.type === 'power' ? 2 : 1);
    if (effectiveDist < nearestDist) {
      nearestDist = effectiveDist;
      nearestFood = food;
    }
  }

  // Avoid walls
  const wallDist = 200;
  let avoidAngle: number | null = null;
  if (head.x < wallDist) avoidAngle = 0;
  else if (head.x > WORLD_SIZE - wallDist) avoidAngle = Math.PI;
  if (head.y < wallDist) avoidAngle = Math.PI / 2;
  else if (head.y > WORLD_SIZE - wallDist) avoidAngle = -Math.PI / 2;

  // Avoid other snakes (if they're bigger)
  let dangerAngle: number | null = null;
  let dangerDist = Infinity;

  for (const other of state.snakes) {
    if (other.id === snake.id || !other.alive) continue;

    for (let i = 0; i < Math.min(other.segments.length, 20); i++) {
      const seg = other.segments[i];
      const d = distance(head, seg);
      if (d < 60 && d < dangerDist) {
        dangerDist = d;
        dangerAngle = Math.atan2(head.y - seg.y, head.x - seg.x);
      }
    }
  }

  if (dangerAngle !== null && dangerDist < 40) {
    snake.targetDirection = dangerAngle;
    snake.boosting = snake.score > 5;
  } else if (avoidAngle !== null) {
    snake.targetDirection = avoidAngle;
  } else if (nearestFood) {
    snake.targetDirection = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
    snake.boosting = nearestDist < 100 && snake.score > 10 && Math.random() > 0.95;
  } else {
    // Wander
    snake.targetDirection += (Math.random() - 0.5) * 0.2;
  }
}

export function updateGameState(
  state: GameState,
  mouseAngle: number | null,
  isBoosting: boolean
): GameState {
  const { snakes, foods, particles } = state;

  // Update snakes
  for (const snake of snakes) {
    if (!snake.alive) {
      snake.deathTimer++;
      continue;
    }

    // Set direction
    if (snake.isPlayer) {
      if (mouseAngle !== null) {
        snake.targetDirection = mouseAngle;
      }
      snake.boosting = isBoosting && snake.score > 3;
    } else {
      updateBot(snake, state);
    }

    // Smooth turning
    const diff = angleDiff(snake.direction, snake.targetDirection);
    snake.direction += diff * TURN_SPEED;

    // Speed
    snake.speed = snake.boosting ? BOOST_SPEED : BASE_SPEED;

    // Boost cost
    if (snake.boosting && snake.score > 0) {
      snake.score = Math.max(0, snake.score - BOOST_COST * 0.05);

      // Drop food when boosting
      if (Math.random() < 0.15) {
        const tail = snake.segments[snake.segments.length - 1];
        foods.push({
          x: tail.x + (Math.random() - 0.5) * 10,
          y: tail.y + (Math.random() - 0.5) * 10,
          size: 3,
          color: snake.color,
          type: 'normal',
          pulse: Math.random() * Math.PI * 2,
        });

        // Remove last segment
        if (snake.segments.length > INITIAL_LENGTH) {
          snake.segments.pop();
        }
      }

      // Boost particles
      if (Math.random() < 0.5) {
        const tail = snake.segments[snake.segments.length - 1];
        spawnParticles(tail.x, tail.y, snake.accentColor, 1, particles);
      }
    }

    // Move head
    const head = snake.segments[0];
    const newHead: Point = {
      x: head.x + Math.cos(snake.direction) * snake.speed,
      y: head.y + Math.sin(snake.direction) * snake.speed,
    };

    // Check wall collision
    if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
      snake.alive = false;
      spawnParticles(head.x, head.y, snake.color, 20, particles);

      // Drop food on death
      for (let i = 0; i < snake.segments.length; i += 2) {
        const seg = snake.segments[i];
        foods.push({
          x: seg.x + (Math.random() - 0.5) * 20,
          y: seg.y + (Math.random() - 0.5) * 20,
          size: 4,
          color: snake.color,
          type: 'power',
          pulse: Math.random() * Math.PI * 2,
        });
      }
      continue;
    }

    // Insert new head, remove tail
    snake.segments.unshift(newHead);

    // Control body length based on score
    const targetLength = INITIAL_LENGTH + Math.floor(snake.score * 1.5);
    while (snake.segments.length > targetLength) {
      snake.segments.pop();
    }

    // Eat food
    const headRadius = getCollisionRadius(snake.score) * 1.3;
    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i];
      const d = distance(newHead, food);
      if (d < headRadius + food.size) {
        const points = food.type === 'mega' ? 5 : food.type === 'power' ? 2 : 1;
        snake.score += points;
        spawnParticles(food.x, food.y, food.color, 5, particles);
        foods.splice(i, 1);
      }
    }

    // Check collision with other snakes
    const myRadius = getCollisionRadius(snake.score);
    for (const other of snakes) {
      if (other.id === snake.id || !other.alive) continue;

      // Check head vs other body
      for (let i = 3; i < other.segments.length; i++) {
        const seg = other.segments[i];
        const otherRadius = getCollisionRadius(other.score);
        const d = distance(newHead, seg);
        if (d < myRadius + otherRadius * 0.6) {
          // Snake dies
          snake.alive = false;
          spawnParticles(newHead.x, newHead.y, snake.color, 30, particles);

          // Other snake gets some score
          other.score += Math.floor(snake.score * 0.3);

          // Drop food on death
          for (let j = 0; j < snake.segments.length; j += 2) {
            const deadSeg = snake.segments[j];
            foods.push({
              x: deadSeg.x + (Math.random() - 0.5) * 20,
              y: deadSeg.y + (Math.random() - 0.5) * 20,
              size: 4,
              color: snake.color,
              type: 'power',
              pulse: Math.random() * Math.PI * 2,
            });
          }
          break;
        }
      }
    }

    // Update punk level
    if (snake.score < 5) snake.punkLevel = 0;
    else if (snake.score < 15) snake.punkLevel = 1;
    else if (snake.score < 35) snake.punkLevel = 2;
    else if (snake.score < 60) snake.punkLevel = 3;
    else snake.punkLevel = 4;
  }

  // Respawn dead bots
  for (let i = 0; i < snakes.length; i++) {
    const snake = snakes[i];
    if (!snake.alive && !snake.isPlayer && snake.deathTimer > 120) {
      snakes[i] = createSnake(snake.id, snake.name, false);
    }
  }

  // Spawn food
  if (foods.length < MAX_FOOD) {
    for (let i = 0; i < FOOD_SPAWN_RATE; i++) {
      const rand = Math.random();
      foods.push(createFood(rand < 0.02 ? 'mega' : rand < 0.15 ? 'power' : 'normal'));
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Limit particles
  while (particles.length > 500) {
    particles.shift();
  }

  // Camera follows player
  const player = snakes.find(s => s.isPlayer);
  if (player && player.alive) {
    const head = player.segments[0];
    state.camera.x += (head.x - state.camera.x) * 0.1;
    state.camera.y += (head.y - state.camera.y) * 0.1;
    state.highScore = Math.max(state.highScore, Math.floor(player.score));
  }

  // Check game over
  if (player && !player.alive) {
    state.gameOver = true;
  }

  return state;
}

export function respawnPlayer(state: GameState, playerName: string): GameState {
  const idx = state.snakes.findIndex(s => s.isPlayer);
  if (idx >= 0) {
    state.snakes[idx] = createSnake('player', playerName, true);
  }
  state.gameOver = false;
  return state;
}
