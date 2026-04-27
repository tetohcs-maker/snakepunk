import { useState, useEffect } from 'react';
import Game from './game/Game';

function SnakeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="45" r="30" fill="#FF1493" stroke="#000" strokeWidth="3" />
      {/* Mohawk */}
      <polygon points="35,18 38,0 41,18" fill="#00FF41" />
      <polygon points="43,16 46,-2 49,16" fill="#00FF41" />
      <polygon points="51,15 54,-3 57,15" fill="#00FF41" />
      <polygon points="59,16 62,-2 65,16" fill="#00FF41" />
      {/* Eyes */}
      <circle cx="40" cy="40" r="8" fill="#000" />
      <circle cx="60" cy="40" r="8" fill="#000" />
      <circle cx="40" cy="40" r="5" fill="#ff0" />
      <circle cx="60" cy="40" r="5" fill="#ff0" />
      <ellipse cx="40" cy="40" rx="1.5" ry="4" fill="#000" />
      <ellipse cx="60" cy="40" rx="1.5" ry="4" fill="#000" />
      {/* Mouth */}
      <line x1="38" y1="58" x2="62" y2="57" stroke="#000" strokeWidth="2" />
      {/* Piercing */}
      <circle cx="50" cy="52" r="2.5" fill="#C0C0C0" />
      {/* Body */}
      <ellipse cx="50" cy="80" rx="15" ry="10" fill="#FF1493" stroke="#000" strokeWidth="2" />
      <ellipse cx="35" cy="90" rx="10" ry="7" fill="#FF1493" stroke="#000" strokeWidth="2" />
    </svg>
  );
}

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function MainMenu({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; speed: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    setMobile(isTouchDevice());
    const colors = ['#FF1493', '#00FF41', '#FF4500', '#8B00FF', '#00FFFF', '#FFD700', '#FF00FF'];
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 10 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
    }));
    setParticles(p);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(name.trim() || 'Punk Baby');
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0a12] flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float opacity-30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDuration: `${p.speed}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content - scrollable for small screens */}
      <div
        className="relative z-10 text-center px-4 w-full max-w-md mx-auto overflow-y-auto max-h-screen py-6"
        style={{
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <SnakeIcon className="w-20 h-20 md:w-28 md:h-28 animate-bounce-slow" />
        </div>

        <h1
          className="text-4xl md:text-6xl font-bold mb-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'Bangers, cursive', letterSpacing: 4 }}
        >
          PUNK SNAKE
        </h1>
        <p className="text-base md:text-lg text-gray-400 mb-1" style={{ fontFamily: 'Bangers, cursive', letterSpacing: 3 }}>
          .IO
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Comece como bebê 👶 e evolua para MEGA PUNK 💀
        </p>

        {/* Evolution preview */}
        <div className="flex justify-center items-center gap-1.5 md:gap-3 mb-6">
          {[
            { emoji: '👶', label: 'Baby', color: 'text-green-400' },
            { emoji: '→', label: '', color: 'text-gray-600' },
            { emoji: '🧒', label: 'Kid', color: 'text-cyan-400' },
            { emoji: '→', label: '', color: 'text-gray-600' },
            { emoji: '🎸', label: 'Teen', color: 'text-purple-400' },
            { emoji: '→', label: '', color: 'text-gray-600' },
            { emoji: '🤘', label: 'Punk', color: 'text-yellow-400' },
            { emoji: '→', label: '', color: 'text-gray-600' },
            { emoji: '💀', label: 'MEGA', color: 'text-red-500' },
          ].map((item, i) => (
            <div key={i} className={`${item.color} text-center`}>
              <div className="text-lg md:text-2xl">{item.emoji}</div>
              {item.label && <div className="text-[7px] md:text-[9px] mt-0.5">{item.label}</div>}
            </div>
          ))}
        </div>

        {/* Name input */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome punk..."
            maxLength={15}
            className="w-64 md:w-72 px-5 py-3 bg-gray-900/80 border-2 border-gray-700 rounded-xl text-white text-center text-sm
                     focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all
                     placeholder-gray-600"
            style={{ fontFamily: 'Bangers, cursive', letterSpacing: 2, fontSize: 16 /* prevents iOS zoom */ }}
          />

          <button
            type="submit"
            className="px-10 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500
                     text-white rounded-xl font-bold text-lg transition-all active:scale-95
                     shadow-lg shadow-pink-500/30 border border-pink-400/20"
            style={{ fontFamily: 'Bangers, cursive', letterSpacing: 4 }}
          >
            🎸 JOGAR!
          </button>
        </form>

        {/* Instructions - adapted for mobile/desktop */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-sm mx-auto">
          {mobile ? (
            <>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">👆</div>
                <div className="text-[8px] text-gray-400 leading-tight">Arraste para mover</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">🚀</div>
                <div className="text-[8px] text-gray-400 leading-tight">Botão para boost</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">🍕</div>
                <div className="text-[8px] text-gray-400 leading-tight">Coma e cresça!</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">🖱️</div>
                <div className="text-[8px] text-gray-400 leading-tight">Mouse para mover</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">🚀</div>
                <div className="text-[8px] text-gray-400 leading-tight">Click / Space = Boost</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                <div className="text-lg mb-0.5">🍕</div>
                <div className="text-[8px] text-gray-400 leading-tight">Coma e cresça!</div>
              </div>
            </>
          )}
        </div>

        <p className="text-gray-600 text-[8px] mt-4">
          Elimine outros jogadores para roubar pontos! ⚡ Cuidado com as bordas!
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-30vh) translateX(10px); opacity: 0.5; }
          50% { transform: translateY(-60vh) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-90vh) translateX(5px); opacity: 0.1; }
          100% { transform: translateY(-100vh) translateX(0); opacity: 0; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [playerName, setPlayerName] = useState('Punk Baby');

  // Prevent pull-to-refresh and other gestures globally
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (screen === 'game') {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [screen]);

  const handleStart = (name: string) => {
    setPlayerName(name);
    setScreen('game');
    // Request fullscreen on mobile
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (_e) { /* ignore */ }
  };

  const handleExit = () => {
    setScreen('menu');
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_e) { /* ignore */ }
  };

  if (screen === 'game') {
    return <Game playerName={playerName} onExit={handleExit} />;
  }

  return <MainMenu onStart={handleStart} />;
}
