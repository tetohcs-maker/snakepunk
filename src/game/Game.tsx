import { useRef, useEffect, useState, useCallback } from 'react';
import { GameState } from './types';
import { initGameState, updateGameState, respawnPlayer } from './engine';
import { render } from './renderer';

interface GameProps {
  playerName: string;
  onExit: () => void;
}

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export default function Game({ playerName, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const mouseAngleRef = useRef<number | null>(null);
  const boostRef = useRef(false);
  const animRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);
  const [punkLevel, setPunkLevel] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Joystick state
  const joystickRef = useRef<{
    active: boolean;
    touchId: number | null;
    centerX: number;
    centerY: number;
    currentX: number;
    currentY: number;
  }>({
    active: false,
    touchId: null,
    centerX: 0,
    centerY: 0,
    currentX: 0,
    currentY: 0,
  });

  const [joystickPos, setJoystickPos] = useState({ cx: 0, cy: 0, dx: 0, dy: 0, active: false });

  const getPunkLabel = (level: number) => {
    switch (level) {
      case 0: return '👶 Baby';
      case 1: return '🧒 Kid';
      case 2: return '🎸 Teen Punk';
      case 3: return '🤘 Punk';
      case 4: return '💀 MEGA PUNK';
      default: return '👶 Baby';
    }
  };

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    setIsMobile(isTouchDevice());
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 100));
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    stateRef.current = initGameState(playerName);

    // ============ MOUSE CONTROLS (desktop) ============
    const handleMouseMove = (e: MouseEvent) => {
      const c = canvasRef.current;
      if (!c || !stateRef.current) return;
      const rect = c.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      mouseAngleRef.current = Math.atan2(my, mx);
    };

    const handleMouseDown = () => { boostRef.current = true; };
    const handleMouseUp = () => { boostRef.current = false; };

    // ============ TOUCH CONTROLS (mobile) ============
    const JOYSTICK_RADIUS = 60;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const js = joystickRef.current;
      const screenW = window.innerWidth;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Right side of screen = boost button area
        if (touch.clientX > screenW * 0.65) {
          boostRef.current = true;
          continue;
        }

        // Left side = joystick
        if (!js.active && touch.clientX < screenW * 0.55) {
          js.active = true;
          js.touchId = touch.identifier;
          js.centerX = touch.clientX;
          js.centerY = touch.clientY;
          js.currentX = touch.clientX;
          js.currentY = touch.clientY;
          setJoystickPos({
            cx: touch.clientX,
            cy: touch.clientY,
            dx: 0,
            dy: 0,
            active: true,
          });
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const js = joystickRef.current;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === js.touchId && js.active) {
          const dx = touch.clientX - js.centerX;
          const dy = touch.clientY - js.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = JOYSTICK_RADIUS;

          let clampedDx = dx;
          let clampedDy = dy;

          if (dist > maxDist) {
            clampedDx = (dx / dist) * maxDist;
            clampedDy = (dy / dist) * maxDist;
          }

          js.currentX = js.centerX + clampedDx;
          js.currentY = js.centerY + clampedDy;

          // Only set angle if moved enough (dead zone)
          if (dist > 10) {
            mouseAngleRef.current = Math.atan2(dy, dx);
          }

          setJoystickPos({
            cx: js.centerX,
            cy: js.centerY,
            dx: clampedDx,
            dy: clampedDy,
            active: true,
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const js = joystickRef.current;
      const screenW = window.innerWidth;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Release boost if right side
        if (touch.clientX > screenW * 0.65) {
          boostRef.current = false;
        }

        // Release joystick
        if (touch.identifier === js.touchId) {
          js.active = false;
          js.touchId = null;
          setJoystickPos(prev => ({ ...prev, active: false, dx: 0, dy: 0 }));
        }
      }

      // If no touches left, release everything
      if (e.touches.length === 0) {
        boostRef.current = false;
        js.active = false;
        js.touchId = null;
        setJoystickPos(prev => ({ ...prev, active: false, dx: 0, dy: 0 }));
      }
    };

    // ============ KEYBOARD CONTROLS ============
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        boostRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') boostRef.current = false;
    };

    // Attach listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastLeaderboardUpdate = 0;

    const gameLoop = (time: number) => {
      const state = stateRef.current;
      if (!state) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Update
      updateGameState(state, mouseAngleRef.current, boostRef.current);

      // Render
      render(ctx, state, w, h, time);

      // UI state
      const player = state.snakes.find(s => s.isPlayer);
      if (player) {
        setScore(Math.floor(player.score));
        setPunkLevel(player.punkLevel);
      }
      setHighScore(state.highScore);
      setGameOver(state.gameOver);

      // Leaderboard update throttle
      if (time - lastLeaderboardUpdate > 500) {
        lastLeaderboardUpdate = time;
        const lb = state.snakes
          .filter(s => s.alive)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map(s => ({ name: s.name, score: Math.floor(s.score) }));
        setLeaderboard(lb);
      }

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerName]);

  const handleRespawn = () => {
    if (stateRef.current) {
      respawnPlayer(stateRef.current, playerName);
      setGameOver(false);
    }
  };

  const punkColor = punkLevel >= 4 ? '#ff4500' : punkLevel >= 3 ? '#ff0' : punkLevel >= 2 ? '#f0f' : punkLevel >= 1 ? '#0ff' : '#90EE90';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: 'none' }} />

      {/* ============ HUD - Score (top-left) ============ */}
      <div className="absolute top-2 left-2 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50">
          <div className="text-[8px] text-gray-400">SCORE</div>
          <div className="text-lg text-white font-bold leading-tight" style={{ fontFamily: 'Bangers, cursive', letterSpacing: 1 }}>
            {score}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: punkColor }}>
            {getPunkLabel(punkLevel)}
          </div>
          <div className="text-[7px] text-gray-500">Best: {highScore}</div>
        </div>
      </div>

      {/* ============ Evolution Bar (top-center) ============ */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-gray-700/50">
          <div className="flex gap-1 items-center text-[10px]">
            <span className={punkLevel >= 0 ? 'opacity-100' : 'opacity-30'}>👶</span>
            <div className="w-5 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, (score / 5) * 100)}%` }} />
            </div>
            <span className={punkLevel >= 1 ? 'opacity-100' : 'opacity-30'}>🧒</span>
            <div className="w-5 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((score - 5) / 10) * 100))}%` }} />
            </div>
            <span className={punkLevel >= 2 ? 'opacity-100' : 'opacity-30'}>🎸</span>
            <div className="w-5 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((score - 15) / 20) * 100))}%` }} />
            </div>
            <span className={punkLevel >= 3 ? 'opacity-100' : 'opacity-30'}>🤘</span>
            <div className="w-5 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((score - 35) / 25) * 100))}%` }} />
            </div>
            <span className={punkLevel >= 4 ? 'opacity-100 animate-pulse' : 'opacity-30'}>💀</span>
          </div>
        </div>
      </div>

      {/* ============ Leaderboard (top-right) ============ */}
      <div className="absolute top-2 right-2 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50 min-w-[120px]">
          <div className="text-[7px] text-gray-400 mb-1 text-center">🏆 TOP</div>
          {leaderboard.map((entry, i) => (
            <div
              key={i}
              className={`flex justify-between text-[8px] py-px ${
                entry.name === playerName ? 'text-yellow-400 font-bold' : 'text-gray-400'
              }`}
            >
              <span className="truncate mr-1 max-w-[70px]">{i + 1}. {entry.name}</span>
              <span>{entry.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ MOBILE: Virtual Joystick ============ */}
      {isMobile && !gameOver && (
        <>
          {/* Joystick visual */}
          {joystickPos.active && (
            <div
              className="fixed z-30 pointer-events-none"
              style={{
                left: joystickPos.cx - 65,
                top: joystickPos.cy - 65,
                width: 130,
                height: 130,
              }}
            >
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-white/20"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                }}
              />
              {/* Inner thumb */}
              <div
                className="absolute w-12 h-12 rounded-full"
                style={{
                  left: 65 + joystickPos.dx - 24,
                  top: 65 + joystickPos.dy - 24,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 100%)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 0 20px rgba(255,255,255,0.1)',
                }}
              />
            </div>
          )}

          {/* Joystick zone hint (when not active) */}
          {!joystickPos.active && (
            <div className="fixed bottom-24 left-10 z-20 pointer-events-none opacity-30"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20" />
              </div>
              <div className="text-[8px] text-white/40 text-center mt-1">MOVE</div>
            </div>
          )}

          {/* Boost Button */}
          <div
            className="fixed z-30"
            style={{
              right: 20,
              bottom: 60,
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center select-none active:scale-90 transition-transform"
              onTouchStart={(e) => {
                e.stopPropagation();
                boostRef.current = true;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                boostRef.current = false;
              }}
              style={{
                background: boostRef.current
                  ? 'radial-gradient(circle, rgba(255,100,0,0.6) 0%, rgba(255,50,0,0.3) 100%)'
                  : 'radial-gradient(circle, rgba(255,100,0,0.3) 0%, rgba(255,50,0,0.1) 100%)',
                border: '3px solid rgba(255,100,0,0.5)',
                boxShadow: '0 0 30px rgba(255,80,0,0.2)',
              }}
            >
              <span className="text-2xl">🚀</span>
            </div>
            <div className="text-[8px] text-orange-400/60 text-center mt-1">BOOST</div>
          </div>
        </>
      )}

      {/* ============ Desktop: Controls hint ============ */}
      {!isMobile && (
        <div className="absolute bottom-3 left-3 text-gray-600 text-[9px] z-10 bg-black/40 rounded-lg p-1.5">
          <div>🖱️ Mouse = Mover</div>
          <div>🚀 Click/Space = Boost</div>
        </div>
      )}

      {/* ============ Game Over ============ */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80">
          <div className="text-center bg-gradient-to-b from-gray-900 to-black border-2 border-red-600/80 rounded-2xl p-6 max-w-xs mx-4 shadow-2xl shadow-red-900/30">
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-3xl text-red-500 mb-2" style={{ fontFamily: 'Bangers, cursive' }}>
              WASTED!
            </h2>
            <p className="text-gray-300 text-sm mb-0.5">Score: <span className="text-white font-bold">{score}</span></p>
            <p className="text-gray-500 text-[10px] mb-3">Best: {highScore}</p>
            <div className="inline-block bg-gray-800/50 rounded-lg px-3 py-1 mb-5">
              <span className="text-xs" style={{ color: punkColor }}>{getPunkLabel(punkLevel)}</span>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRespawn}
                onTouchEnd={(e) => { e.preventDefault(); handleRespawn(); }}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ fontFamily: 'Bangers, cursive', letterSpacing: 2 }}
              >
                🔄 JOGAR
              </button>
              <button
                onClick={onExit}
                onTouchEnd={(e) => { e.preventDefault(); onExit(); }}
                className="px-5 py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ fontFamily: 'Bangers, cursive', letterSpacing: 1 }}
              >
                🚪 SAIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
