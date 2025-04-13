import { useEffect, useState } from 'react';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Target, Award, AlertCircle, Crosshair, Play, Home, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaveStats from './WaveStats';
import Leaderboard from './Leaderboard';
import TutorialOverlay from './TutorialOverlay';
import GameStats from './GameStats';

const GameUI = () => {
  const navigate = useNavigate();
  const [showTutorialState, setShowTutorialState] = useState(true);
  const [showScopeHint, setShowScopeHint] = useState(false);
  const [scopeHintTimer, setScopeHintTimer] = useState<NodeJS.Timeout | null>(null);
  
  const {
    gamePhase,
    score,
    xp,
    level,
    waveNumber,
    waveStatus,
    startGame,
    startWave,
    restartGame,
    gameOverReason,
    justLeveledUp,
    clearLevelUpFlag,
    isPaused,
    togglePause
  } = usePacketSniper();
  
  // Determine which screen to show based on game phase
  const showMenu = gamePhase === 'ready';
  const showWaveComplete = gamePhase === 'ended';
  const showGameOver = gamePhase === 'gameover';
  const showTutorial = showTutorialState && gamePhase === 'ready' && waveNumber === 0;
  
  // Calculate XP needed for next level with the new harder formula
  const xpForNextLevel = 1000 + Math.pow(level, 2) * 200;
  const currentLevelXp = xp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorialState(false);
  };
  
  // Show tactical scope hint when player reaches level 5
  useEffect(() => {
    if (level >= 5 && gamePhase === 'playing') {
      // Display the scope hint for 8 seconds when reaching level 5
      setShowScopeHint(true);
      
      // Clear any existing timer
      if (scopeHintTimer) {
        clearTimeout(scopeHintTimer);
      }
      
      // Hide the hint after 8 seconds
      const timer = setTimeout(() => {
        setShowScopeHint(false);
      }, 8000);
      
      setScopeHintTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [level, gamePhase]);
  
  // Handle ESC key for pausing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gamePhase === 'playing') {
        togglePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gamePhase, togglePause]);
  
  // Resume game function
  const handleResume = () => {
    togglePause();
  };
  
  // Exit to main menu function
  const handleExitToMenu = () => {
    togglePause();
    restartGame();
    // Navigate to the main page
    navigate('/');
  };
  
  return (
    <div className="game-ui fixed inset-0 pointer-events-none z-10 font-mono">
      {/* Level up notification */}
      {justLeveledUp && gamePhase === 'playing' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black bg-opacity-80 border-2 border-yellow-400 rounded-lg p-6 animate-bounce">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">LEVEL UP!</h2>
            <p className="text-2xl text-cyan-300">Level {level} Reached</p>
          </div>
        </div>
      )}
      
      {/* Pause Menu */}
      {isPaused && gamePhase === 'playing' && (
        <div className="pause-menu fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50 pointer-events-auto">
          <div className="bg-gray-900 border-2 border-cyan-700 rounded-lg p-8 w-96 max-w-full backdrop-blur-md">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">GAME PAUSED</h2>
            
            <div className="flex flex-col gap-3">
              <button 
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-colors rounded text-white font-bold cursor-pointer"
                onClick={handleResume}
              >
                <Play className="w-5 h-5" />
                <span>Resume Game</span>
              </button>
              
              <button 
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 transition-colors rounded text-white font-bold cursor-pointer"
                onClick={handleExitToMenu}
              >
                <Home className="w-5 h-5" />
                <span>Exit to Main Menu</span>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-cyan-400">Current Score:</span>
                <span className="text-white font-bold">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">Level:</span>
                <span className="text-white font-bold">{level}</span>
              </div>
            </div>
            
            <div className="mt-6 text-gray-400 text-sm text-center">
              Press <span className="text-white font-bold">ESC</span> again to resume
            </div>
          </div>
        </div>
      )}
      
      {/* Always visible UI elements */}
      {(gamePhase === 'playing') && (
        <div className="hud-container p-6 pointer-events-auto">
          {/* Top row - removed score and XP */}
          <div className="flex justify-between items-start mb-4">
            {/* Empty space where score and XP used to be */}
            <div className="w-40"></div>
            
            {/* Pause reminder removed as it's now in GameCanvas */}
            <div className="w-40"></div>
          </div>
          
          {/* Bottom row */}
          <div className="fixed bottom-6 left-6 right-6">
            {/* Tactical Scope Hint for Level 5+ */}
            {showScopeHint && level >= 5 && (
              <div className="max-w-md mx-auto bg-black bg-opacity-80 border border-cyan-600 rounded-md p-3 text-center animate-pulse">
                <div className="flex items-center justify-center">
                  <Crosshair className="w-5 h-5 mr-2 text-cyan-400" />
                  <span className="text-cyan-400 font-bold">TACTICAL SCOPE UNLOCKED</span>
                </div>
                <p className="text-gray-300 text-sm mt-1">Right-click to toggle tactical aiming mode</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Menu screen */}
      {showMenu && (
        <div className="menu-screen fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 pointer-events-auto">
          <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Left Side - Leaderboard */}
            <div className="order-3 md:order-1 md:w-1/4 flex flex-col items-center md:items-end">
              <div className="w-full max-w-sm">
                <h3 className="text-xl text-cyan-400 font-bold mb-3 text-center md:text-right">Top Snipers</h3>
                <Leaderboard />
              </div>
            </div>
            
            {/* Center - Game Title and Controls */}
            <div className="order-1 md:order-2 md:w-2/4 flex flex-col items-center">
              <div className="game-title mb-8">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-2 text-center">PACKET SNIPER</h1>
                <p className="text-gray-400 text-lg text-center">Hunt down malicious network packets</p>
              </div>
              
              <div 
                className="start-button px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded text-white text-xl font-bold cursor-pointer hover:from-cyan-600 hover:to-purple-700 transition-all hover:scale-105 w-full max-w-xs text-center"
                onClick={() => startGame()}
              >
                {waveNumber === 0 ? 'START GAME' : 'CONTINUE'}
              </div>
              
              {waveNumber > 0 && (
                <div className="mt-4">
                  <Badge variant="outline" className="text-cyan-400 border-cyan-500">
                    <Award className="w-4 h-4 mr-1" />
                    <span>Current score: {score}</span>
                  </Badge>
                </div>
              )}
              
              {/* Back button */}
              <button
                className="mt-6 px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 transition-all rounded text-white font-bold cursor-pointer flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            
            {/* Right Side - Career Stats */}
            <div className="order-2 md:order-3 md:w-1/4 flex flex-col items-center md:items-start">
              <div className="w-full max-w-sm">
                <h3 className="text-xl text-yellow-400 font-bold mb-3 text-center md:text-left">Career Stats</h3>
                <GameStats alwaysExpanded={true} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Wave complete screen */}
      {showWaveComplete && (
        <div className="wave-complete-screen fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 pointer-events-auto">
          <WaveStats />
          
          <div className="actions flex gap-4 mt-8">
            <button 
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded text-white font-bold cursor-pointer"
              onClick={() => startWave()}
            >
              Next Wave
            </button>
            
            <button 
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded text-white font-bold cursor-pointer"
              onClick={() => {
                restartGame();
                navigate('/');
              }}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
      
      {/* Game Over screen */}
      {showGameOver && (
        <div className="game-over-screen fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 pointer-events-auto">
          <div className="text-center mb-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            
            {gameOverReason === 'data-breach' && (
              <>
                <h2 className="text-5xl font-bold text-red-500 mb-4 animate-pulse">CRITICAL BREACH</h2>
                <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                  <p className="text-red-300 text-lg mb-2">A high-priority data breach packet penetrated network defenses!</p>
                  <p className="text-yellow-300 text-md">Sensitive data has been compromised.</p>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="px-3 py-1 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-300 text-sm animate-pulse">
                    <span className="font-mono">SYSTEM COMPROMISED</span>
                  </div>
                </div>
              </>
            )}
            
            {gameOverReason === 'malicious-breach' && (
              <>
                <h2 className="text-3xl font-bold text-red-500 mb-2">NETWORK OVERRUN</h2>
                <p className="text-gray-300 text-lg mb-4">Too many malicious packets reached the network!</p>
              </>
            )}
            
            {gameOverReason === 'system-failure' && (
              <>
                <h2 className="text-3xl font-bold text-red-500 mb-2">SYSTEM FAILURE</h2>
                <p className="text-gray-300 text-lg mb-4">The network defense system has shut down unexpectedly.</p>
              </>
            )}
            
            <div className="stats bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6">
              <p className="text-cyan-400 text-xl mb-2">Final Score: <span className="font-bold">{score}</span></p>
              <p className="text-yellow-400">Level Reached: <span className="font-bold">{level}</span></p>
              <p className="text-red-400 text-sm mt-2">-500 XP Penalty Applied</p>
            </div>
            
            <div className="actions flex gap-4 mt-8">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded text-white font-bold cursor-pointer"
                onClick={() => {
                  restartGame();
                  navigate('/');
                }}
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tutorial overlay */}
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
    </div>
  );
};

export default GameUI;
