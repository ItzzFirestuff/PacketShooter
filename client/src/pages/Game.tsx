import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/ui/GameUI';
import Crosshair from '@/components/game/Crosshair';
import EngyStarBootScreen from '@/components/ui/EngyStarBootScreen';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { useAudio } from '@/lib/stores/useAudio';
import { syncUserStats, getCurrentUser } from '@/lib/firebase';

const Game = () => {
  const navigate = useNavigate();
  const { gamePhase, playerName, setPlayerName, startGame, level } = usePacketSniper();
  const { updateBackgroundMusicBasedOnLevel, stopBackgroundMusic, isMuted } = useAudio();
  const [bootComplete, setBootComplete] = useState(false);
  
  // If player name is not set, initialize with a default or from user data
  useEffect(() => {
    const user = getCurrentUser();
    
    if (user) {
      // Use name from authenticated user
      setPlayerName(user.userData.username);
    } else if (!playerName) {
      // Fallback to default name
      setPlayerName('CyberAgent');
    }
  }, [playerName, setPlayerName]);
  
  // Play the appropriate background music based on player level when game starts
  useEffect(() => {
    if (gamePhase === 'playing') {
      // Wait a brief moment to ensure user interaction has occurred
      // (from button clicks to start the game) before playing audio
      const audioPlayTimer = setTimeout(() => {
        if (!isMuted) {
          updateBackgroundMusicBasedOnLevel(level);
        }
      }, 300);
      
      return () => {
        clearTimeout(audioPlayTimer);
        if (gamePhase !== 'playing') {
          stopBackgroundMusic();
        }
      };
    }
  }, [gamePhase, level, updateBackgroundMusicBasedOnLevel, stopBackgroundMusic, isMuted]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to go back to home
      if (e.key === 'Escape' && gamePhase === 'ready') {
        navigate('/');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, gamePhase]);
  
  // Game Over handler
  const handleGameOver = useCallback(() => {
    // Sync user stats with Firebase on game over
    syncUserStats();
    
    // Play failure sound
    const audio = new Audio('/sounds/failure.mp3');
    audio.volume = 0.5;
    audio.play();
  }, []);
  
  // Handle boot sequence completion
  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    // Automatically start the game after boot sequence is complete
    startGame();
  }, [startGame]);
  
  return (
    <div className="game-container relative w-screen h-screen overflow-hidden bg-black">
      {/* Game background */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 40, 0.8) 0%, rgba(0, 0, 0, 1) 100%)',
        }}
      ></div>
      
      {/* Show boot screen if boot sequence is not complete */}
      {!bootComplete && gamePhase === 'ready' && (
        <EngyStarBootScreen onComplete={handleBootComplete} />
      )}
      
      {/* Only show the game content when the boot sequence is complete */}
      {(bootComplete || gamePhase !== 'ready') && (
        <>
          {/* Game canvas where packets appear */}
          <GameCanvas />
          
          {/* Game UI overlay */}
          <GameUI />
          
          {/* Custom crosshair cursor */}
          <Crosshair />
        </>
      )}
    </div>
  );
};

export default Game;
