import { create } from "zustand";
import { usePacketSniper } from "./usePacketSniper";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hellMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  levelUpSound: HTMLAudioElement | null;
  isMuted: boolean;
  activeMusic: 'normal' | 'hell' | null;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHellMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setLevelUpSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playBackgroundMusic: () => void;
  updateBackgroundMusicBasedOnLevel: (level: number) => void;
  stopBackgroundMusic: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playLevelUp: () => void;
  play: (soundType: 'hit' | 'success' | 'levelUp') => void;
  initializeAudio: () => Promise<void>;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hellMusic: null,
  hitSound: null,
  successSound: null,
  levelUpSound: null,
  isMuted: false, // Start with sound enabled
  activeMusic: null,
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHellMusic: (music) => set({ hellMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setLevelUpSound: (sound) => set({ levelUpSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic, hellMusic } = get();
    const newMutedState = !isMuted;
    
    set({ isMuted: newMutedState });
    
    // Handle background music when toggling mute
    if (newMutedState) {
      // Immediate sound off - stop all audio
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset playback position
      }
      
      if (hellMusic) {
        hellMusic.pause();
        hellMusic.currentTime = 0;
      }
      
      // Stop any other audio that might be playing
      const sounds = document.querySelectorAll('audio');
      sounds.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    } else {
      // Only attempt to play background music when unmuting
      const level = usePacketSniper.getState().level;
      get().updateBackgroundMusicBasedOnLevel(level);
    }
    
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  // Initialize audio - use this after user interaction to enable audio
  initializeAudio: async () => {
    try {
      const { isMuted } = get();
      
      // Check if we've already loaded the audio files
      if (get().backgroundMusic && get().hellMusic) {
        return Promise.resolve(); // Already initialized
      }
      
      // Create a silent audio context to unlock audio on iOS/Safari
      let audioContext;
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume the audio context if it's suspended (needed for some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Create and play a silent buffer - helps with unlocking audio on mobile
        const silentBuffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (e) {
        console.log('Audio context creation failed:', e);
      }
      
      // Load all audio files with proper flags for better browser compatibility
      const loadAudioFile = (src: string, volume: number, shouldLoop: boolean = false) => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.loop = shouldLoop;
        audio.preload = 'auto'; // Preload the audio
        audio.muted = true;     // Initially muted to avoid autoplay issues
        
        // Try a quick play-pause to help "warm up" the audio element
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = isMuted; // Set to the actual mute state
            }).catch(e => {
              // This is expected due to autoplay policy
              audio.muted = isMuted;
            });
          }
        } catch (e) {
          // Ignore errors from browsers that don't support the Promise API
        }
        
        return audio;
      };
      
      // Load the background music
      const backgroundMusic = loadAudioFile('/sounds/gameplay.mp3', 0.4, true);
      
      // Load the hell music
      const hellMusic = loadAudioFile('/sounds/hell.mp3', 0.5, true);
      
      // Load sound effects
      const hitSound = loadAudioFile('/sounds/hit.mp3', 0.3);
      const successSound = loadAudioFile('/sounds/success.mp3', 0.5);
      const levelUpSound = loadAudioFile('/sounds/level-up.mp3', 0.6);
      
      // Store audio elements in state
      set({ 
        backgroundMusic, 
        hellMusic, 
        hitSound, 
        successSound, 
        levelUpSound 
      });
      
      // Note: we don't try to play any music here - that will happen 
      // after user interaction through the playBackgroundMusic function
      
      return Promise.resolve();
    } catch (error) {
      console.error("Audio initialization error:", error);
      return Promise.reject(error);
    }
  },
  
  playBackgroundMusic: () => {
    const { isMuted } = get();
    if (!isMuted) {
      // Check if we have user interaction by accessing AudioContext state
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // If we can create an audio context and it's running, we should be able to play
        if (audioContext.state === "running") {
          const level = usePacketSniper.getState().level;
          get().updateBackgroundMusicBasedOnLevel(level);
        } else {
          console.log("Audio context not running, waiting for user interaction");
          // Try to resume the audio context
          audioContext.resume().then(() => {
            const level = usePacketSniper.getState().level;
            get().updateBackgroundMusicBasedOnLevel(level);
          }).catch(err => {
            console.log("Could not resume audio context:", err);
          });
        }
      } catch (e) {
        console.log("Error checking audio context:", e);
        // Fallback - just try to play
        const level = usePacketSniper.getState().level;
        get().updateBackgroundMusicBasedOnLevel(level);
      }
    }
  },
  
  updateBackgroundMusicBasedOnLevel: (level) => {
    const { backgroundMusic, hellMusic, isMuted, activeMusic } = get();
    
    if (isMuted) return; // Don't play anything if muted
    
    // Helper function to safely play audio with error handling
    const safePlay = (audio: HTMLAudioElement | null, musicType: 'normal' | 'hell') => {
      if (!audio) return;
      
      // Make sure the audio isn't muted (might have been muted during initialization)
      audio.muted = false;
      
      // Reset playback position
      audio.currentTime = 0;
      
      // Try to play with error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          set({ activeMusic: musicType });
        }).catch(error => {
          console.log(`${musicType} music play prevented:`, error);
          
          // If it fails with NotAllowedError, set up a one-time event listener
          // for user interaction to retry playing
          if (error.name === "NotAllowedError") {
            const playOnInteraction = () => {
              audio.play().catch(e => console.log("Retry play failed:", e));
              set({ activeMusic: musicType });
              
              // Remove the event listener after first interaction
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('keydown', playOnInteraction);
              document.removeEventListener('touchstart', playOnInteraction);
            };
            
            // Add event listeners for common user interactions
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('keydown', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
          }
        });
      }
    };
    
    if (level >= 10) {
      // Play hell music for level 10+
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      
      if (hellMusic && activeMusic !== 'hell') {
        safePlay(hellMusic, 'hell');
      }
    } else {
      // Play normal gameplay music for levels under 10
      if (hellMusic) {
        hellMusic.pause();
        hellMusic.currentTime = 0;
      }
      
      if (backgroundMusic && activeMusic !== 'normal') {
        safePlay(backgroundMusic, 'normal');
      }
    }
  },
  
  stopBackgroundMusic: () => {
    const { backgroundMusic, hellMusic, activeMusic } = get();
    
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
    
    if (hellMusic) {
      hellMusic.pause();
      hellMusic.currentTime = 0;
    }
    
    // Only update state if activeMusic isn't already null
    if (activeMusic !== null) {
      set({ activeMusic: null });
    }
  },
  
  play: (soundType) => {
    const state = get();
    if (state.isMuted) {
      console.log(`${soundType} sound skipped (muted)`);
      return;
    }
    
    let sound: HTMLAudioElement | null = null;
    let volume = 0.5;
    
    // Select the appropriate sound based on type
    switch (soundType) {
      case 'hit':
        sound = state.hitSound;
        volume = 0.3;
        break;
      case 'success':
        sound = state.successSound;
        volume = 0.5;
        break;
      case 'levelUp':
        sound = state.levelUpSound;
        volume = 0.6;
        break;
    }
    
    if (!sound) {
      console.log(`${soundType} sound not available`);
      return;
    }
    
    // Clone the sound to allow overlapping playback
    const soundClone = sound.cloneNode() as HTMLAudioElement;
    soundClone.volume = volume;
    soundClone.play().catch(error => {
      console.log(`${soundType} sound play prevented:`, error);
    });
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    } else if (isMuted) {
      console.log("Hit sound skipped (muted)");
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    } else if (isMuted) {
      console.log("Success sound skipped (muted)");
    }
  },
  
  playLevelUp: () => {
    const { levelUpSound, isMuted } = get();
    if (levelUpSound && !isMuted) {
      levelUpSound.currentTime = 0;
      levelUpSound.play().catch(error => {
        console.log("Level up sound play prevented:", error);
      });
    } else if (isMuted) {
      console.log("Level up sound skipped (muted)");
    }
  }
}));
