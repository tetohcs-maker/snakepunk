export interface Point {
  x: number;
  y: number;
}

export interface Food {
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'normal' | 'power' | 'mega';
  pulse: number;
}

export interface Snake {
  id: string;
  segments: Point[];
  direction: number; // angle in radians
  targetDirection: number;
  speed: number;
  score: number;
  alive: boolean;
  name: string;
  color: string;
  accentColor: string;
  isPlayer: boolean;
  boosting: boolean;
  boostCooldown: number;
  punkLevel: number; // 0=baby, 1=kid, 2=teen, 3=punk, 4=mega punk
  eyeAnimation: number;
  deathTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  snakes: Snake[];
  foods: Food[];
  particles: Particle[];
  camera: Point;
  worldSize: number;
  gameOver: boolean;
  highScore: number;
}
