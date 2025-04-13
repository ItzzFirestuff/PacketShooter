import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useEffect, useState } from 'react';
import Home from '@/pages/Home';
import Game from '@/pages/Game';
import Credits from '@/pages/Credits';
import NotFound from '@/pages/not-found';
import { queryClient } from './lib/queryClient';
import { useAudio } from './lib/stores/useAudio';
import { initSounds, unlockAudio } from './lib/sounds';

// Gen Z style console warning
console.log("%c⚠️ HOLD UP BESTIE! ⚠️", "color: yellow; font-size: 24px; font-weight: bold; background-color: black; padding: 10px; border-radius: 5px;");
console.log("%cDon't go copy-pasting stuff in here unless you're 100% sure what you're doing!", "color: red; font-size: 16px;");
console.log("%cSomeone could be trying to steal your data and that's not the vibe we want. No cap fr fr.", "color: white; font-size: 14px;");
console.log("%c👾 Stay safe out there! 👾", "color: #00ff00; font-size: 16px; font-weight: bold;");

function App() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Initialize sound effects when the app loads
  useEffect(() => {
    initSounds();
    
    // Add click listener to unlock audio on first user interaction
    const handleUserInteraction = async () => {
      if (!audioInitialized) {
        console.log('User interaction detected, unlocking audio...');
        try {
          await unlockAudio();
          useAudio.getState().playBackgroundMusic();
          setAudioInitialized(true);
          console.log('Audio successfully unlocked');
        } catch (error) {
          console.error('Failed to unlock audio:', error);
        }
      }
    };
    
    // Add various event listeners to catch any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: false });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [audioInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
