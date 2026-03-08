import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shield, Swords, Users, Crown, AlertTriangle, Send, TerminalSquare, User, X, Check, MessageSquare, ChevronUp, ChevronDown, Sun, Moon, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClaudeSVG, ChatGPTSVG, GeminiSVG, DeepSeekSVG, OllamaSVG, KimiSVG, HumanSVG } from './ModelLogos';

// ============================================
// BACKEND API INTEGRATION
// ============================================

async function apiStartBattle(atk, def, atkSub, defSub, playMode, gameMode, targetWord) {
  const res = await fetch('/api/battle/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attacker: atk,
      defender: def,
      attackerSubModel: atkSub,
      defenderSubModel: defSub,
      playMode: playMode,
      gameMode: gameMode,
      targetWord: targetWord
    })
  });
  return res.json();
}

async function apiTakeTurn(battleId) {
  const res = await fetch(`/api/battle/turn?battle_id=${battleId}`, {
    method: 'POST'
  });
  return res.json();
}

async function apiGetOllamaModels() {
  const res = await fetch('/api/ollama/models');
  return res.json();
}

// ============================================
// STATIC DATA & CONFIG
// ============================================

const MODELS = [
  { id: 'claude', name: 'Claude', provider: 'Anthropic', Logo: ClaudeSVG },
  { id: 'chatgpt', name: 'ChatGPT', provider: 'OpenAI', Logo: ChatGPTSVG },
  { id: 'gemini', name: 'Gemini', provider: 'Google', Logo: GeminiSVG },
  { id: 'deepseek', name: 'DeepSeek', provider: 'DeepSeek', Logo: DeepSeekSVG },
  { id: 'ollama', name: 'Ollama', provider: 'Local', Logo: OllamaSVG },
  { id: 'kimi', name: 'Kimi K2.5', provider: 'Moonshot AI', Logo: KimiSVG },
];

const GAMES = [
  { id: 'word_guessing', name: 'Word-Guessing Game' },
  { id: 'tictactoe', name: 'Tic-Tac-Toe' },
  { id: 'rockpapsci', name: 'Rock-Paper-Scissors' },
];

const MOCK_ATTACKERS_SCORE = [
  { rank: 1, model: 'Claude', id: 'claude', bestWin: 12, wins: 1450, winRate: '68%' },
  { rank: 2, model: 'ChatGPT', id: 'chatgpt', bestWin: 14, wins: 1320, winRate: '64%' },
  { rank: 3, model: 'DeepSeek', id: 'deepseek', bestWin: 16, wins: 890, winRate: '59%' },
  { rank: 4, model: 'Gemini', id: 'gemini', bestWin: 21, wins: 1100, winRate: '52%' },
];

const MOCK_DEFENDERS_SCORE = [
  { rank: 1, model: 'Claude', id: 'claude', survived: 850, total: 1200, survivalRate: '71%' },
  { rank: 2, model: 'ChatGPT', id: 'chatgpt', survived: 790, total: 1150, survivalRate: '69%' },
  { rank: 3, model: 'Ollama', id: 'ollama', survived: 210, total: 340, survivalRate: '62%' },
  { rank: 4, model: 'Gemini', id: 'gemini', survived: 680, total: 1120, survivalRate: '61%' },
];

const SECTIONS = ['hero', 'arena', 'live', 'scoreboard'];

// ============================================
// HELPERS
// ============================================

const getModelInfo = (id) => {
    if (id?.toLowerCase() === 'human') return { name: 'Human', Logo: HumanSVG };
    return MODELS.find(m => m.id === id) || { name: id, Logo: HumanSVG };
};

const fireConfetti = (isAttackerWin) => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
  const colors = isAttackerWin ? ['#dc2626', '#fbbf24', '#ffffff'] : ['#cccccc', '#ffffff', '#666666'];

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 }, colors }));
  }, 250);
};

// ============================================
// UI COMPONENTS
// ============================================

const EmberParticles = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-model-red rounded-full"
        initial={{ opacity: 0, x: Math.random() * window.innerWidth, y: window.innerHeight + 100 }}
        animate={{ opacity: [0, 0.8, 0], y: -100, x: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)` }}
        transition={{ duration: Math.random() * 8 + 5, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
        style={{ boxShadow: '0 0 8px 2px rgba(220, 38, 38, 0.6)' }}
      />
    ))}
  </div>
);

const DotNavigation = ({ activeSection, scrollTo }) => (
  <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
    {SECTIONS.map((sec, idx) => (
      <button key={sec} onClick={() => scrollTo(idx)} className="group relative flex items-center p-2">
        <span className={`absolute right-8 text-xs font-bold uppercase tracking-wider transition-all duration-300 origin-right ${activeSection === idx ? 'opacity-100 text-model-red scale-100' : 'opacity-0 scale-75 text-gray-600 group-hover:opacity-100'}`}>
          {sec}
        </span>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSection === idx ? 'bg-model-red scale-150 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'bg-gray-700 group-hover:bg-model-blood'}`} />
      </button>
    ))}
  </div>
);

const Navbar = ({ authState, openLogin, scrollTo, theme, toggleTheme }) => (
  <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-900 border-opacity-50">
    <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
      <div className="flex items-center gap-2 font-black text-xl tracking-widest text-white cursor-pointer" onClick={() => scrollTo(0)}>
        <TerminalSquare className="text-model-red w-6 h-6" />
        <span>MODEL<span className="text-model-red">PIT</span></span>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors flex items-center justify-center">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {authState.isLoggedIn ? (
          <div className="flex items-center gap-3 text-sm font-bold text-model-red ml-2">
            <User className="w-5 h-5" />
            <span className="uppercase tracking-wider">{authState.username}</span>
          </div>
        ) : (
          <button onClick={openLogin} className="text-xs uppercase font-bold tracking-widest hover:text-model-red text-gray-400 transition-colors border-b-2 border-transparent hover:border-model-red pb-1 ml-2">
            Log In
          </button>
        )}
      </div>
    </div>
  </nav>
);

const HeroSection = ({ scrollTo }) => (
  <section className="snap-section flex flex-col items-center justify-center pt-16 px-4 text-center bg-transparent">
    <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 border border-model-red/30 bg-model-red/5 text-model-red text-xs font-bold uppercase tracking-[0.2em] mb-8"
      >
        <AlertTriangle className="w-4 h-4" /> Global Combat Protocol
      </motion.div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase drop-shadow-[0_10px_30px_rgba(220,38,38,0.3)]">
        Prompt <span className="text-model-red drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">Combat</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12 font-medium">
        Extract the secret. <span className="text-model-red font-bold typing-cursor">Defend your logic.</span>
      </p>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => scrollTo(1)}
        className="group relative px-10 py-5 bg-model-red text-white font-black uppercase tracking-[0.2em] text-sm overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.4)]"
      >
        <span className="relative z-10 group-hover:text-black transition-colors duration-300">Enter Arena</span>
        <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
      </motion.button>
    </div>
  </section>
);

const FighterCard = ({ model, isSelected, onSelect, subModel, setSubModel, ollamaModels }) => {
  const { Logo } = model;
  const isOllama = model.id === 'ollama';

  return (
    <motion.div 
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(model.id)}
      className={`cursor-pointer relative p-4 bg-[#111] border-2 transition-all duration-300 flex flex-col items-center gap-4 ${isSelected ? 'border-model-red shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-gradient-to-b from-[#1a1a1a] to-[#2a0808]' : 'border-gray-800 hover:border-gray-600'}`}
    >
      <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-xl overflow-hidden shadow-lg bg-black border border-gray-800">
        <Logo className="w-full h-full object-cover" />
      </div>
      <div className="text-center w-full">
        <h3 className={`font-black uppercase tracking-wider text-xs xl:text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>{model.name}</h3>
        {isSelected && isOllama && (
            <select 
                value={subModel} 
                onChange={(e) => setSubModel(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full mt-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-white p-1 focus:outline-none"
            >
                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                {ollamaModels.length === 0 && <option value="">None Found</option>}
            </select>
        )}
        <div className={`h-1 w-full mt-2 rounded-full ${isSelected ? 'bg-model-red' : 'bg-gray-800'}`}></div>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 text-model-red">
          <Check className="w-5 h-5 drop-shadow-[0_0_5px_rgba(220,38,38,1)]" />
        </div>
      )}
    </motion.div>
  );
};

const ArenaSection = ({ authState, startBattle, openLogin, ollamaModels }) => {
  const [playMode, setPlayMode] = useState('AI vs AI');
  const [gameMode, setGameMode] = useState('word_guessing');
  const [atkModel, setAtkModel] = useState(null);
  const [defModel, setDefModel] = useState(null);
  const [atkSub, setAtkSub] = useState('');
  const [defSub, setDefSub] = useState('');
  const [targetWord, setTargetWord] = useState('');

  useEffect(() => {
    if (ollamaModels.length > 0) {
        if (!atkSub) setAtkSub(ollamaModels[0]);
        if (!defSub) setDefSub(ollamaModels[0]);
    }
  }, [ollamaModels]);

  const handleRandomWord = () => {
    const words = ['OBLIVION', 'PHANTOM', 'CYBERPUNK', 'VOID', 'MATRIX', 'SOLARIS'];
    setTargetWord(words[Math.floor(Math.random() * words.length)]);
  };
  
  const canQueue = playMode === 'AI vs AI' ? (atkModel && defModel) : defModel;

  const handleQueue = () => {
    if (!authState.isLoggedIn) { openLogin(); return; }
    startBattle(playMode === 'Human vs AI' ? 'Human' : atkModel, defModel, atkSub, defSub, playMode, gameMode, targetWord || 'OBLIVION');
  };

  return (
    <section className="snap-section py-24 px-4 bg-transparent flex flex-col justify-center max-h-screen relative z-10">
      <div className="text-center mb-6 flex flex-col items-center gap-4">
        <div className="inline-flex flex-wrap border-2 border-gray-800 bg-[#050505] p-1 justify-center max-w-full">
          <button className={`px-4 sm:px-8 py-2 font-black text-xs uppercase tracking-widest transition-all ${playMode === 'AI vs AI' ? 'bg-model-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => { setPlayMode('AI vs AI'); setAtkModel(null); }}>AI vs AI</button>
          <button className={`px-4 sm:px-8 py-2 font-black text-xs uppercase tracking-widest transition-all ${playMode === 'Human vs AI' ? 'bg-model-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => { setPlayMode('Human vs AI'); setAtkModel(null); }}>Human vs AI</button>
        </div>
        
        <select value={gameMode} onChange={e => setGameMode(e.target.value)} className="bg-[#111] border border-gray-800 text-white text-xs px-4 py-2 outline-none font-bold uppercase tracking-widest cursor-pointer w-full max-w-xs">
          {GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0 relative">
        <div className={`w-full lg:w-1/2 lg:pr-12 flex flex-col items-center ${playMode === 'Human vs AI' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.2em] mb-4 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Attacker</h2>
          {playMode === 'Human vs AI' ? (
             <div className="w-full flex flex-col items-center justify-center h-48 border border-model-red/30 bg-model-red/5 p-8 text-center"><HumanSVG className="w-16 h-16 mb-4" /><p className="text-white font-bold uppercase tracking-widest text-sm">Human Override</p></div>
          ) : (
            <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
              {MODELS.map(m => <FighterCard key={`atk-${m.id}`} model={m} isSelected={atkModel === m.id} onSelect={setAtkModel} subModel={atkSub} setSubModel={setAtkSub} ollamaModels={ollamaModels} />)}
            </div>
          )}
        </div>

        <motion.div animate={{ scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }} transition={{ duration: 2, repeat: Infinity }} className="lg:absolute left-1/2 top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 text-4xl lg:text-5xl font-black italic text-model-red z-10 bg-[#0a0a0a] p-3 rounded-full border-4 border-[#0a0a0a] drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
          VS
        </motion.div>

        <div className="w-full lg:w-1/2 lg:pl-12 flex flex-col items-center">
          <h2 className="text-2xl font-black text-gray-500 italic uppercase tracking-[0.2em] mb-4 text-center">Defender</h2>
          <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
            {MODELS.map(m => <FighterCard key={`def-${m.id}`} model={m} isSelected={defModel === m.id} onSelect={setDefModel} subModel={defSub} setSubModel={setDefSub} ollamaModels={ollamaModels} />)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center items-center pb-8 gap-6 w-full max-w-md mx-auto">
        {gameMode === 'word_guessing' && (
            <div className="flex w-full flex-col gap-2 relative z-20">
            <label className="text-xs uppercase font-bold tracking-widest text-gray-500 text-center">Target Word Config</label>
            <div className="flex w-full gap-2">
                <input type="text" value={targetWord} onChange={e => setTargetWord(e.target.value)} placeholder="e.g. OBLIVION" className="flex-1 bg-[#111] border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-model-red font-mono transition-colors" />
                <button onClick={handleRandomWord} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors border border-gray-600">
                Random Word
                </button>
            </div>
            </div>
        )}

        <motion.button whileHover={canQueue ? { scale: 1.05 } : {}} whileTap={canQueue ? { scale: 0.95 } : {}} disabled={!canQueue} onClick={handleQueue} className={`px-16 py-4 font-black uppercase tracking-[0.3em] text-sm transition-all duration-300 w-full sm:w-auto ${canQueue ? 'bg-model-red text-white hover:bg-white hover:text-model-red shadow-[0_0_40px_rgba(220,38,38,0.5)]' : 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'}`}>
          {canQueue ? 'Fight!' : 'Select Fighters'}
        </motion.button>
      </div>
    </section>
  );
};

const LiveBattleSection = ({ battleState, authState, takeTurn, setBattleState }) => {
  const messagesEndRef = useRef(null);
  const [humanInput, setHumanInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  
  const [fightAnimState, setFightAnimState] = useState('idle');
  const [healthFlash, setHealthFlash] = useState(false);
  
  const [isWaitingForServer, setIsWaitingForServer] = useState(false);

  useEffect(() => { 
    if(isChatExpanded) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [battleState.messages, isChatExpanded]);

  useEffect(() => {
    if (battleState.resources < 100) {
      setHealthFlash(true);
      setTimeout(() => setHealthFlash(false), 200);
    }
  }, [battleState.resources]);

  useEffect(() => {
      let interval;
      if (autoPlay && battleState.battleId && !battleState.finished) {
          interval = setInterval(() => {
              handleNextTurn();
          }, 3000);
      }
      return () => clearInterval(interval);
  }, [autoPlay, battleState.battleId, battleState.finished]);

  const handleNextTurn = async () => {
    if (isWaitingForServer || !battleState.battleId || battleState.finished) return;
    setIsWaitingForServer(true);
    triggerClashAnimation();
    try {
        await takeTurn();
    } catch (e) {
        setAutoPlay(false);
    }
    setIsWaitingForServer(false);
  };

  const handleSend = () => {
    if (!humanInput.trim()) return;
    setHumanInput('');
  };

  const triggerClashAnimation = () => {
    setFightAnimState('clashing');
    setTimeout(() => {
      if (Math.random() > 0.7) {
        setFightAnimState('critical');
        setTimeout(() => setFightAnimState('retreat'), 300);
      } else {
        setFightAnimState('retreat');
      }
      setTimeout(() => setFightAnimState('idle'), 500);
    }, 200);
  };
  
  const healthPercent = battleState.resources;
  const isLowHealth = battleState.resources <= 30;
  const healthBarColor = healthPercent > 50 ? 'bg-white' : healthPercent > 30 ? 'bg-model-gold' : 'bg-model-red animate-pulse';

  const AtkLogo = getModelInfo(battleState.attackerModel).Logo;
  const DefLogo = getModelInfo(battleState.defenderModel).Logo;
  
  const lastMessage = battleState.messages.length > 0 ? battleState.messages[battleState.messages.length-1] : null;

  const atkVariants = {
    idle: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }},
    clashing: { x: window.innerWidth * 0.15, scale: 1.1, rotate: 10, transition: { type: "spring", stiffness: 300, damping: 20 }},
    retreat: { x: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 25 }},
    critical: { x: window.innerWidth * 0.15, scale: 1.3, rotate: 15, transition: { duration: 0.1 }},
  };

  const defVariants = {
    idle: { y: [0, 10, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }},
    clashing: { x: -window.innerWidth * 0.15, scale: 1.1, rotate: -10, transition: { type: "spring", stiffness: 300, damping: 20 }},
    retreat: { x: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 25 }},
    critical: { rotate: [-10, 10, -10, 10, 0], x: [-10, 10, -10, 10, 0], scale: 0.9, transition: { duration: 0.3 } },
  };

  return (
    <section className="snap-section relative flex flex-col justify-center bg-transparent overflow-hidden px-4 z-10 transition-all duration-300">
      <AnimatePresence>
        {isLowHealth && battleState.gameMode === 'word_guessing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: Math.sin(Date.now() / 100) * 0.2 + 0.3 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none z-0 box-shadow-[inset_0_0_150px_rgba(220,38,38,0.8)] border-8 border-model-red/40" />
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex gap-2 z-40 opacity-20 hover:opacity-100 transition-opacity flex-col">
        <button 
            disabled={isWaitingForServer || !battleState.battleId || battleState.finished}
            className="bg-model-red text-white text-xs px-4 py-2 font-bold uppercase tracking-widest border border-model-blood shadow-[0_0_10px_rgba(220,38,38,0.3)] disabled:opacity-30 flex items-center gap-2" 
            onClick={handleNextTurn}
        >
          <Play className="w-3 h-3" /> Next Turn
        </button>
        <button 
            className={`border text-white text-xs px-4 py-2 font-bold uppercase tracking-widest ${autoPlay ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-800 border-gray-600'}`} 
            onClick={() => setAutoPlay(!autoPlay)}
        >
          {autoPlay ? 'Auto: ON' : 'Auto: OFF'}
        </button>
      </div>

      <div className={`w-full max-w-6xl mx-auto flex flex-col relative z-20 transition-all duration-500 ease-in-out ${isChatExpanded ? 'h-[90vh]' : 'h-auto items-center justify-center my-auto'}`}>
        
        <div className={`flex justify-between items-center w-full transition-all duration-500 ${isChatExpanded ? 'mb-6 scale-90 origin-top' : 'mb-16 scale-110'}`}>
          <div className="w-[30%] relative z-30">
             <div className="flex items-center gap-3 mb-4 justify-end">
               <span className="font-black text-2xl text-white uppercase tracking-wider text-right">{getModelInfo(battleState.attackerModel).name}</span>
               <motion.div variants={atkVariants} animate={fightAnimState} className="relative z-40">
                  <AtkLogo className={`rounded-xl bg-black border-2 shadow-xl object-cover transition-colors ${healthFlash ? 'border-white !bg-white' : 'border-model-red'} ${isChatExpanded ? 'w-16 h-16' : 'w-24 h-24'}`} />
               </motion.div>
             </div>
             
             {battleState.gameMode === 'word_guessing' && (
                <>
                    <div className="h-4 w-full bg-[#111] border-2 border-gray-800 skew-x-12 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative">
                        <motion.div className={`h-full float-right absolute right-0 top-0 bottom-0 ${healthFlash ? 'bg-white' : healthBarColor} shadow-[0_0_10px_rgba(255,255,255,0.5)]`} initial={false} animate={{ width: `${healthPercent}%` }} transition={{ type: "spring", stiffness: 40 }} />
                        <AnimatePresence>
                            {healthFlash && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-white" />}
                        </AnimatePresence>
                    </div>
                    <div className="text-right text-xs uppercase font-bold tracking-widest mt-2 text-gray-500">Resources: <span className={isLowHealth ? 'text-model-red font-black text-sm' : 'text-white'}>{battleState.resources}/100</span></div>
                </>
             )}
          </div>

          <div className="w-[35%] flex flex-col items-center justify-center relative z-20">
            <AnimatePresence>
              {(fightAnimState === 'clashing' || fightAnimState === 'critical') && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: fightAnimState === 'critical' ? 2 : 1.2 }} exit={{ opacity: 0 }} className={`absolute inset-0 rounded-full blur-[50px] z-0 ${fightAnimState === 'critical' ? 'bg-white' : 'bg-model-red'}`} />
              )}
            </AnimatePresence>

            <div className={`px-6 py-3 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border-2 border-gray-800 shadow-[0_5px_15px_rgba(0,0,0,0.4)] text-center skew-x-[-12deg] z-10 transition-all min-w-[200px] ${fightAnimState === 'critical' ? 'scale-110 border-model-red shadow-[0_0_20px_rgba(220,38,38,0.3)]' : ''}`}>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block skew-x-[12deg] mb-1">{battleState.gameMode.replace('_', ' ')}</span>
              <div className="skew-x-[12deg] flex flex-col items-center">
                  {battleState.gameMode === 'word_guessing' ? (
                      <span className={`font-black text-model-red tracking-[0.2em] font-mono drop-shadow-md ${isChatExpanded ? 'text-xl' : 'text-3xl'}`}>{battleState.secretWord}</span>
                  ) : (
                      <pre className="font-mono text-white text-xs leading-tight">{battleState.gameState}</pre>
                  )}
              </div>
            </div>
          </div>

          <div className="w-[30%] relative z-30">
             <div className="flex items-center gap-3 mb-4 justify-start">
               <motion.div variants={defVariants} animate={fightAnimState} className="relative z-40">
                  <DefLogo className={`rounded-xl bg-black border-2 shadow-xl object-cover transition-colors ${fightAnimState === 'critical' ? 'border-white filter brightness-150' : 'border-gray-500'} ${isChatExpanded ? 'w-16 h-16' : 'w-24 h-24'}`} />
               </motion.div>
               <span className="font-black text-2xl text-white uppercase tracking-wider">{getModelInfo(battleState.defenderModel).name}</span>
             </div>
             <div className="h-4 w-full bg-[#111] border-2 border-gray-800 skew-x-[-12deg] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative">
               <div className={`h-full w-full transition-colors ${fightAnimState === 'critical' ? 'bg-model-red animate-pulse' : 'bg-gray-500'}`} />
             </div>
             <div className={`text-left text-xs uppercase font-bold tracking-widest mt-2 transition-colors ${fightAnimState === 'critical' ? 'text-model-red' : 'text-gray-500'}`}>
                {fightAnimState === 'critical' ? 'SHIELD FLUX!' : 'Defensive Core'}
             </div>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col items-center z-20">
          {!isChatExpanded && lastMessage && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-[#0d0d0d] border border-gray-800 p-4 mb-6 relative overflow-hidden text-center cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setIsChatExpanded(true)}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-model-red via-model-blood to-transparent" />
              <div className="flex justify-center items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-3">
                <MessageSquare className="w-3 h-3" /> Live Interception ({battleState.messages.length} msgs)
              </div>
              <p className="text-gray-300 italic text-sm line-clamp-2 px-8">\"${lastMessage.text}\"</p>
              <div className="mt-4 flex justify-center text-model-red text-xs font-bold uppercase tracking-widest items-center gap-1 hover:text-white transition-colors">
                 Expand Feed <ChevronDown className="w-4 h-4" />
              </div>
            </motion.div>
          )}

          {isChatExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full flex-1 flex flex-col bg-[#050505] border border-gray-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] mb-4">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-900 bg-black">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Live Feed ({battleState.messages.length})</span>
                <button onClick={() => setIsChatExpanded(false)} className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors">
                  Collapse <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 max-h-[50vh] relative">
                <AnimatePresence initial={false}>
                  {battleState.messages.map((msg, idx) => {
                    const isAtk = msg.role === 'attacker' || msg.role?.includes('1') || msg.role === 'Player 1';
                    const Logo = isAtk ? AtkLogo : DefLogo;
                    return (
                      <motion.div key={msg.id || idx} initial={{ opacity: 0, x: isAtk ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className={`flex w-full mb-6 ${isAtk ? 'justify-start' : 'justify-end'}`}>
                        <div className={`flex max-w-[80%] gap-3 items-end ${isAtk ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className="w-8 h-8 rounded-sm bg-black border border-gray-700 flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            <Logo className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col relative">
                            <div className={`p-4 text-sm font-medium leading-relaxed shadow-lg ${isAtk ? 'bg-[#110505] border border-model-red/30 text-gray-200 rounded-tr-xl rounded-br-xl rounded-tl-xl' : 'bg-[#111] border border-gray-800 text-gray-300 rounded-tl-xl rounded-bl-xl rounded-tr-xl'}`}>
                              <div className="text-[8px] opacity-40 uppercase font-black mb-1">{msg.role}</div>
                              {msg.text}
                              {msg.analysis && (
                                  <details className="mt-2 opacity-50 text-[10px] border-t border-white/10 pt-1">
                                      <summary className="cursor-pointer">Logic Analysis</summary>
                                      <div className="italic py-1">{msg.analysis}</div>
                                  </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {isWaitingForServer && (
                <div className="w-full bg-[#1a1a1a] p-2 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse border-t border-gray-800 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div> Processing Turn...
                </div>
              )}

              {battleState.playMode === 'Human vs AI' && authState.isLoggedIn && !battleState.finished ? (
                <div className="flex items-center gap-3 bg-[#0a0a0a] p-3 border-t border-gray-800">
                  <span className="text-model-red font-mono font-bold pl-2">&gt;</span>
                  <input type="text" value={humanInput} onChange={(e) => setHumanInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="INPUT DIRECTIVE..." className="flex-1 bg-transparent px-2 py-2 text-white placeholder-gray-600 font-mono text-sm focus:outline-none" />
                  <button onClick={handleSend} disabled={!humanInput.trim()} className="bg-model-red text-black p-2 hover:bg-white transition-colors disabled:opacity-30"><Send className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="bg-[#050505] border-t border-gray-900 p-3 text-center text-xs font-black uppercase tracking-[0.3em] text-gray-600">Spectator Mode</div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

const ScoreboardSection = ({ scoreboardState }) => {
  return (
    <section className="snap-section py-24 px-4 bg-transparent border-t border-gray-900 relative z-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto backdrop-blur-md bg-black/40 p-8 rounded-2xl border border-gray-900">
        <h2 className="text-4xl font-black text-center text-white mb-16 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">Global Rankings</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6 pb-2 border-b border-gray-800">
              <Trophy className="w-8 h-8 text-model-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Top Extractor</h3>
            </div>
            <div className="space-y-3">
              {scoreboardState.attackers.map((row) => {
                const Logo = getModelInfo(row.id).Logo;
                const isGold = row.rank === 1;
                return (
                  <motion.div key={row.rank} whileHover={{ scale: 1.02, x: 10 }} className={`flex items-center p-3 border transition-colors bg-[#0a0a0a]/80 group ${isGold ? 'border-model-gold shadow-[0_0_20px_rgba(251,191,36,0.15)] bg-[#1a1400]/80' : 'border-gray-800'}`}>
                    <div className="w-12 text-center">
                      {isGold ? <Crown className="w-6 h-6 text-model-gold mx-auto" /> : <span className="font-black text-xl text-gray-600">{row.rank}</span>}
                    </div>
                    <div className="flex items-center gap-4 ml-2 w-1/3">
                      <Logo className="w-8 h-8 rounded-sm bg-black border border-gray-700" />
                      <span className={`font-black uppercase tracking-wider ${isGold ? 'text-model-gold' : 'text-gray-200'}`}>{row.model}</span>
                    </div>
                    <div className="flex flex-1 justify-between items-center text-sm px-4">
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Best Win</div>
                        <div className={`font-mono font-bold text-lg ${isGold ? 'text-model-gold' : 'text-model-red'}`}>{row.bestWin} <span className="text-[10px] text-gray-600">msgs</span></div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rate</div>
                        <div className="font-bold text-white">{row.winRate}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-6 pb-2 border-b border-gray-800">
              <Shield className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Top Defender</h3>
            </div>
            <div className="space-y-3">
              {scoreboardState.defenders.map((row) => {
                const Logo = getModelInfo(row.id).Logo;
                const isGold = row.rank === 1;
                return (
                  <motion.div key={row.rank} whileHover={{ scale: 1.02, x: 10 }} className={`flex items-center p-3 border transition-colors bg-[#0a0a0a]/80 group ${isGold ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-[#111]/80' : 'border-gray-800'}`}>
                    <div className="w-12 text-center">
                      {isGold ? <Shield className="w-6 h-6 text-white mx-auto fill-white/20" /> : <span className="font-black text-xl text-gray-600">{row.rank}</span>}
                    </div>
                    <div className="flex items-center gap-4 ml-2 w-1/3">
                      <Logo className="w-8 h-8 rounded-sm bg-black border border-gray-700" />
                      <span className={`font-black uppercase tracking-wider ${isGold ? 'text-white' : 'text-gray-300'}`}>{row.model}</span>
                    </div>
                    <div className="flex flex-1 justify-between items-center text-sm px-4">
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Survived</div>
                        <div className={`font-mono font-bold text-lg ${isGold ? 'text-white' : 'text-gray-400'}`}>{row.survived}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rate</div>
                        <div className="font-bold text-gray-300">{row.survivalRate}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#050505] border-2 border-gray-800 w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-model-red transition-colors"><X className="w-6 h-6" /></button>
        <div className="flex gap-6 border-b border-gray-800 mb-8 pb-3">
          <button className={`font-black tracking-widest text-sm transition-colors ${tab === 'login' ? 'text-white border-b-2 border-model-red pb-3 -mb-[14px]' : 'text-gray-600 hover:text-gray-400'}`} onClick={() => setTab('login')}>LOG IN</button>
          <button className={`font-black tracking-widest text-sm transition-colors ${tab === 'signup' ? 'text-white border-b-2 border-model-red pb-3 -mb-[14px]' : 'text-gray-600 hover:text-gray-400'}`} onClick={() => setTab('signup')}>SIGN UP</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(tab === 'login' ? email : username, password); }} className="space-y-5">
          {tab === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Fighter Handle</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#111] border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-model-red font-mono transition-colors" required />
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Username</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#111] border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-model-red font-mono transition-colors" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#111] border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-model-red font-mono transition-colors" required />
          </div>
          <button type="submit" className="w-full bg-model-red hover:bg-white hover:text-model-red text-white font-black uppercase tracking-[0.3em] py-4 mt-8 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            {tab === 'login' ? 'Log In' : 'Register Identity'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const VictoryScreen = ({ winner, battleState, onClose }) => {
  useEffect(() => {
    if (winner) fileConfettiTrigger();
  }, [winner]);

  const fileConfettiTrigger = () => fireConfetti(winner === 'attacker' || winner === 'agent1');

  if (!winner) return null;
  const isAtkWin = winner === 'attacker' || winner === 'agent1';
  const isDraw = winner === 'draw';
  
  const AtkLogo = getModelInfo(battleState.attackerModel).Logo;
  const DefLogo = getModelInfo(battleState.defenderModel).Logo;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-4 backdrop-blur-sm">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] ${isDraw ? 'bg-gray-500/20' : isAtkWin ? 'bg-model-red/40' : 'bg-white/20'}`} />
        </div>

        <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 15 }} className={`max-w-3xl w-full p-16 border-4 flex flex-col items-center relative overflow-hidden bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-10 ${isDraw ? 'border-gray-700' : isAtkWin ? 'border-model-gold' : 'border-gray-400'}`}>
          {isDraw ? (
              <>
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Draw</h2>
                <p className="text-gray-400 font-bold tracking-widest text-sm uppercase text-center mb-12">Neither side could gain the upper hand.</p>
              </>
          ) : isAtkWin ? (
            <>
              <motion.div animate={{ rotateY: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="text-model-gold drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] mb-6"><Trophy className="w-24 h-24" /></motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Victor: {getModelInfo(battleState.attackerModel).name}</h2>
              {battleState.gameMode === 'word_guessing' && (
                  <div className="px-8 py-3 bg-model-gold/10 border border-model-gold text-model-gold mb-16 inline-block font-mono text-3xl font-black tracking-[0.2em] shadow-[inset_0_0_20px_rgba(251,191,36,0.2)]">\"${battleState.secretWord}\"</div>
              )}
            </>
          ) : (
            <>
              <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] mb-6"><Shield className="w-24 h-24" /></motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md text-center">Victor: {getModelInfo(battleState.defenderModel).name}</h2>
            </>
          )}

          <div className="flex items-center gap-16 w-full justify-center mb-12">
            <div className={`text-center transition-all ${isAtkWin ? 'scale-110' : 'opacity-40 grayscale'}`}>
                <AtkLogo className={`w-24 h-24 rounded-lg bg-black border-2 mx-auto mb-3 ${isAtkWin ? 'border-model-gold shadow-[0_0_30px_rgba(251,191,36,0.5)]' : 'border-gray-700'}`} />
                <div className="text-xl font-black text-white">{getModelInfo(battleState.attackerModel).name}</div>
            </div>
            <div className="text-model-red text-4xl font-black italic opacity-30">VS</div>
            <div className={`text-center transition-all ${!isAtkWin && !isDraw ? 'scale-110' : 'opacity-40 grayscale'}`}>
                <DefLogo className={`w-24 h-24 rounded-lg bg-black border-2 mx-auto mb-3 ${!isAtkWin && !isDraw ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'border-gray-700'}`} />
                <div className="text-xl font-black text-white">{getModelInfo(battleState.defenderModel).name}</div>
            </div>
          </div>

          <button onClick={onClose} className={`mt-12 px-12 py-4 border-2 font-black uppercase tracking-[0.3em] text-sm transition-all hover:bg-white hover:text-black hover:border-white ${isAtkWin ? 'border-model-gold text-model-gold' : 'border-gray-500 text-white'}`}>
            Return to Pit
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// MAIN ROOT
// ============================================

export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef(null);
  const [theme, setTheme] = useState('dark');
  const [authState, setAuthState] = useState({ isLoggedIn: false, username: null });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const [ollamaModels, setOllamaModels] = useState([]);
  
  const [battleState, setBattleState] = useState({
    battleId: null,
    isActive: false, 
    attackerModel: 'claude', 
    defenderModel: 'chatgpt', 
    secretWord: 'OBLIVION',
    messages: [], 
    resources: 100, 
    playMode: 'AI vs AI', 
    gameMode: 'word_guessing', 
    gameState: '',
    round: 0,
    finished: false,
    winner: null
  });
  
  const [scoreboardState] = useState({
    attackers: MOCK_ATTACKERS_SCORE,
    defenders: MOCK_DEFENDERS_SCORE,
  });

  useEffect(() => {
    const fetchOllama = async () => {
        try {
            const data = await apiGetOllamaModels();
            setOllamaModels(data.models || []);
        } catch (e) { console.error(e); }
    };
    fetchOllama();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        setActiveSection(index);
      }
    };
    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el && el.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  };

  const scrollTo = (index) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
    }
  };

  const handleStartBattle = async (atk, def, atkSub, defSub, playMode, gameMode, word) => {
    try {
        const data = await apiStartBattle(atk, def, atkSub, defSub, playMode, gameMode, word);
        setBattleState(prev => ({
            ...prev,
            battleId: data.battleId,
            isActive: true,
            attackerModel: atk,
            defenderModel: def,
            secretWord: word,
            playMode: playMode,
            gameMode: gameMode,
            messages: [],
            resources: 100,
            gameState: '',
            round: 0,
            finished: false,
            winner: null
        }));
        scrollTo(2);
    } catch (e) {
        console.error("Failed to start battle", e);
    }
  };

  const takeTurn = async () => {
    if (!battleState.battleId) return;
    try {
        const data = await apiTakeTurn(battleState.battleId);
        setBattleState(prev => ({
            ...prev,
            messages: data.messages || [],
            resources: data.resources,
            gameState: data.state,
            round: data.round,
            finished: data.finished,
            winner: data.winner
        }));
    } catch (e) {
        console.error("Turn failed", e);
        throw e;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0a] text-gray-100 flex flex-col font-sans selection:bg-model-red/30 selection:text-white relative">
      <EmberParticles />
      <Navbar authState={authState} openLogin={() => setIsLoginOpen(true)} scrollTo={scrollTo} theme={theme} toggleTheme={toggleTheme} />
      <DotNavigation activeSection={activeSection} scrollTo={scrollTo} />
      
      <main ref={containerRef} className="snap-container flex-1 mt-16 relative z-10">
        <HeroSection scrollTo={scrollTo} />
        <ArenaSection authState={authState} startBattle={handleStartBattle} openLogin={() => setIsLoginOpen(true)} ollamaModels={ollamaModels} />
        <LiveBattleSection battleState={battleState} authState={authState} takeTurn={takeTurn} setBattleState={setBattleState} />
        <ScoreboardSection scoreboardState={scoreboardState} />
      </main>

      <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={(u) => { setAuthState({ isLoggedIn: true, username: u }); setIsLoginOpen(false); }} />
      <VictoryScreen winner={battleState.winner} battleState={battleState} onClose={() => setBattleState(prev => ({...prev, winner: null}))} />
    </div>
  );
}

