import { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/lib/stores/useAudio';

interface EngyStarBootScreenProps {
  onComplete: () => void;
}

const EngyStarBootScreen = ({ onComplete }: EngyStarBootScreenProps) => {
  const [loadingText, setLoadingText] = useState('Initializing system...');
  const [progress, setProgress] = useState(0);
  const [bootSoundPlayed, setBootSoundPlayed] = useState(false);
  const bootSoundRef = useRef<HTMLAudioElement | null>(null);
  const { stopBackgroundMusic } = useAudio();
  
  // ASCII FireOS logo - much cleaner block letters
  const asciiLogo = [
    "███████╗██╗██████╗ ███████╗ ██████╗ ███████╗",
    "██╔════╝██║██╔══██╗██╔════╝██╔═══██╗██╔════╝",
    "█████╗  ██║██████╔╝█████╗  ██║   ██║███████╗",
    "██╔══╝  ██║██╔══██╗██╔══╝  ██║   ██║╚════██║",
    "██║     ██║██║  ██║███████╗╚██████╔╝███████║",
    "╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝",
    "                                            "
  ];
  
  // Simple loading messages that will rotate
  const loadingMessages = [
    "Initializing system...",
    "Loading security modules...",
    "Connecting to authentication server...",
    "Preparing game environment...",
    "Loading packet defense system...",
    "Initializing threat database...",
    "Calibrating targeting system...",
    "Establishing secure connection...",
    "System check complete."
  ];

  // Stop background music when component mounts
  useEffect(() => {
    // Stop any background music that might be playing
    stopBackgroundMusic();
    
    // Create and play boot sound
    bootSoundRef.current = new Audio('/sounds/boot.mp3');
    if (bootSoundRef.current) {
      bootSoundRef.current.volume = 0.7;
      bootSoundRef.current.play()
        .then(() => {
          setBootSoundPlayed(true);
        })
        .catch(error => {
          console.log("Boot sound play prevented:", error);
          // If sound fails to play, still continue with boot sequence
          setBootSoundPlayed(true);
        });
    }
    
    // Cleanup
    return () => {
      if (bootSoundRef.current) {
        bootSoundRef.current.pause();
        bootSoundRef.current = null;
      }
    };
  }, [stopBackgroundMusic]);

  useEffect(() => {
    // Only start the boot sequence if sound has played or failed
    if (!bootSoundPlayed) return;
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (1 + Math.random() * 2);
        // If progress nearly complete, go to 100
        if (newProgress > 98) {
          clearInterval(progressInterval);
          
          // Call onComplete callback after a short delay
          setTimeout(() => {
            onComplete();
          }, 1000);
          
          return 100;
        }
        return newProgress;
      });
    }, 200);
    
    // Update loading text periodically
    const textInterval = setInterval(() => {
      // Calculate which message to show based on progress
      const messageIndex = Math.min(
        Math.floor((progress / 100) * loadingMessages.length),
        loadingMessages.length - 1
      );
      setLoadingText(loadingMessages[messageIndex]);
      
      // If progress is complete, clear the interval
      if (progress >= 100) {
        clearInterval(textInterval);
      }
    }, 1500);
    
    // Occasional soft beep sounds during boot
    const beepInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const beepSound = new Audio('/sounds/hit.mp3');
        beepSound.volume = 0.1;
        beepSound.play().catch(e => console.log("Beep sound play prevented:", e));
      }
    }, 2000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearInterval(beepInterval);
    };
  }, [onComplete, bootSoundPlayed, progress]);
  
  return (
    <div className="fixed inset-0 bg-black font-mono z-50 flex flex-col items-center justify-center">
      {/* FireOS Logo */}
      <div className="mb-8 text-center">
        <div className="text-red-500 font-mono whitespace-pre fire-text">
          {asciiLogo.map((line, index) => (
            <div key={index} className="text-xs md:text-base">{line}</div>
          ))}
        </div>
        
        {/* Version text */}
        <div className="text-gray-500 mt-2 text-sm">
          VERSION 0.12 BETA
        </div>
      </div>
      
      {/* Simple loading section */}
      <div className="w-full max-w-md px-4">
        {/* Loading text - single line that updates */}
        <div className="text-amber-500 text-center mb-2 h-6 bios-text">
          {loadingText}
        </div>
        
        {/* Clean progress bar */}
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Percentage */}
        <div className="text-right text-xs text-gray-500 mt-1">
          {Math.floor(progress)}%
        </div>
      </div>
      
      {/* Footer text */}
      <div className="absolute bottom-4 text-center text-xs text-gray-600">
        <div>FireOS Gaming Platform</div>
        <div>© 2024 ITZZ Corporation</div>
      </div>
    </div>
  );
};

export default EngyStarBootScreen; 