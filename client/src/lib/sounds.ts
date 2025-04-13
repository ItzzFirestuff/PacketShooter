import { useAudio } from './stores/useAudio';

/**
 * Initialize and load all game sounds
 */
export function initSounds() {
  console.log('Initializing sounds...');
  // Access the audio store
  const audioStore = useAudio.getState();
  
  // Load background music
  const bgMusic = new Audio('/sounds/background.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.preload = 'auto';
  audioStore.setBackgroundMusic(bgMusic);
  
  // Load hit sound
  const hitSound = new Audio('/sounds/hit.mp3');
  hitSound.volume = 0.5;
  hitSound.preload = 'auto';
  audioStore.setHitSound(hitSound);
  
  // Load success sound
  const successSound = new Audio('/sounds/success.mp3');
  successSound.volume = 0.5;
  successSound.preload = 'auto';
  audioStore.setSuccessSound(successSound);
  
  // Use success sound for level up (until we have a dedicated sound)
  // We're making a copy to avoid conflicts when both need to play
  const levelUpSound = new Audio('/sounds/success.mp3');
  levelUpSound.volume = 0.7; // A bit louder for level up events
  levelUpSound.preload = 'auto';
  audioStore.setLevelUpSound(levelUpSound);
  
  // Log that sounds are ready
  console.log('Sounds initialized successfully');
}

/**
 * Play a sound by creating a clone of it
 * This allows multiple instances to play simultaneously
 */
export function playSound(sound: HTMLAudioElement | null, volume = 1) {
  if (!sound) {
    console.log('Cannot play sound: Sound is null');
    return;
  }
  
  try {
    const soundClone = sound.cloneNode() as HTMLAudioElement;
    soundClone.volume = volume;
    
    const playPromise = soundClone.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Sound play prevented:", error);
        
        // Try unlocking audio on user interaction
        document.addEventListener('click', function unlockAudio() {
          soundClone.play().catch(e => console.log('Still cannot play audio:', e));
          document.removeEventListener('click', unlockAudio);
        }, { once: true });
      });
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Initialize audio context and try to unlock audio playback
 * Call this after user interaction
 */
export async function unlockAudio() {
  const audioStore = useAudio.getState();
  
  try {
    await audioStore.initializeAudio();
    return true;
  } catch (error) {
    console.error('Failed to unlock audio:', error);
    return false;
  }
}
