import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';
import { useAudio } from './useAudio';
import { useCallback } from 'react';
import { syncUserStats } from '../firebase';

export type GamePhase = 'ready' | 'playing' | 'ended' | 'gameover';

interface WaveStatus {
  shotsHit: number;
  shotsMissed: number;
  maliciousHit: number;
  benignHit: number;
  xpGained: number;
}

interface PacketSniperState {
  // Game state
  gamePhase: GamePhase;
  playerName: string;
  level: number;
  xp: number;
  score: number;
  ammo: number;
  maxAmmo: number;
  rechargeRate: number;
  isPaused: boolean;
  
  // Wave tracking
  waveNumber: number;
  difficulty: number;
  waveStatus: WaveStatus;
  
  // Shot tracking
  shotFired: { x: number, y: number } | null;
  gameOverReason: string;
  
  // Stats tracking
  totalThreatsDestroyed: number;
  totalThreatsMissed: number;
  totalShots: number;
  totalHits: number;
  justLeveledUp: boolean;
  
  // Actions
  setPlayerName: (name: string) => void;
  setPlayerStats: (stats: {
    level?: number;
    score?: number;
    totalThreatsDestroyed?: number;
    totalThreatsMissed?: number;
    totalShots?: number;
    totalHits?: number;
    xp?: number;
  }) => void;
  startGame: () => void;
  startWave: () => void;
  endWave: () => void;
  restartGame: () => void;
  gameOver: (reason?: string) => void;
  togglePause: () => void;
  
  // Shooting mechanics
  shoot: (x: number, y: number) => void;
  resetShotFired: () => void;
  registerHit: (isMalicious: boolean, xpOverride?: number) => void;
  registerMiss: () => void;
  registerCorruptedPacketPassed: () => void;
  awardBonusXp: (amount: number) => void;
  updateThreatsMissed: () => void;
  clearLevelUpFlag: () => void;
}

export const usePacketSniper = create<PacketSniperState>()(
  subscribeWithSelector((set, get) => {
    // Load saved data from localStorage
    const savedData = getLocalStorage('packetSniper_playerData') || {
      playerName: 'Agent',
      level: 1,
      xp: 0,
      score: 0,
      waveNumber: 0,
      totalThreatsDestroyed: 0,
      totalThreatsMissed: 0,
      totalShots: 0,
      totalHits: 0
    };
    
    // Initial game state
    return {
      // Game state
      gamePhase: 'ready',
      playerName: savedData.playerName,
      level: savedData.level || 1,
      xp: savedData.xp || 0,
      score: savedData.score || 0,
      ammo: 10,
      maxAmmo: 10,
      rechargeRate: 0.5, // Ammo per second
      isPaused: false,
      
      // Wave tracking
      waveNumber: savedData.waveNumber || 0,
      difficulty: 1,
      waveStatus: {
        shotsHit: 0,
        shotsMissed: 0,
        maliciousHit: 0,
        benignHit: 0,
        xpGained: 0
      },
      
      // Shot tracking
      shotFired: null,
      gameOverReason: 'system-failure',
      
      // Stats tracking
      totalThreatsDestroyed: savedData.totalThreatsDestroyed || 0,
      totalThreatsMissed: savedData.totalThreatsMissed || 0,
      totalShots: savedData.totalShots || 0,
      totalHits: savedData.totalHits || 0,
      justLeveledUp: false,
      
      // Set player name
      setPlayerName: (name) => {
        set({ playerName: name });
        
        // Update localStorage
        const currentData = getLocalStorage('packetSniper_playerData') || {};
        setLocalStorage('packetSniper_playerData', {
          ...currentData,
          playerName: name
        });
      },
      
      // Set player stats from external source (e.g., Firebase)
      setPlayerStats: (stats) => {
        set((state) => ({
          level: stats.level !== undefined ? stats.level : state.level,
          score: stats.score !== undefined ? stats.score : state.score,
          xp: stats.xp !== undefined ? stats.xp : state.xp,
          totalThreatsDestroyed: stats.totalThreatsDestroyed !== undefined ? stats.totalThreatsDestroyed : state.totalThreatsDestroyed,
          totalThreatsMissed: stats.totalThreatsMissed !== undefined ? stats.totalThreatsMissed : state.totalThreatsMissed,
          totalShots: stats.totalShots !== undefined ? stats.totalShots : state.totalShots,
          totalHits: stats.totalHits !== undefined ? stats.totalHits : state.totalHits
        }));
        
        // Update localStorage with new stats
        const currentData = getLocalStorage('packetSniper_playerData') || {};
        setLocalStorage('packetSniper_playerData', {
          ...currentData,
          level: stats.level !== undefined ? stats.level : get().level,
          xp: stats.xp !== undefined ? stats.xp : get().xp,
          score: stats.score !== undefined ? stats.score : get().score,
          totalThreatsDestroyed: stats.totalThreatsDestroyed !== undefined ? stats.totalThreatsDestroyed : get().totalThreatsDestroyed,
          totalThreatsMissed: stats.totalThreatsMissed !== undefined ? stats.totalThreatsMissed : get().totalThreatsMissed,
          totalShots: stats.totalShots !== undefined ? stats.totalShots : get().totalShots,
          totalHits: stats.totalHits !== undefined ? stats.totalHits : get().totalHits
        });
      },
      
      // Start the game
      startGame: () => {
        set({ gamePhase: 'playing' });
        
        // If this is the first wave, reset stats
        if (get().waveNumber === 0) {
          set({
            waveNumber: 1,
            score: 0,
            ammo: 10,
            waveStatus: {
              shotsHit: 0,
              shotsMissed: 0,
              maliciousHit: 0,
              benignHit: 0,
              xpGained: 0
            }
          });
        }
        
        // Start ammo recharge
        const rechargeInterval = setInterval(() => {
          set((state) => {
            if (state.gamePhase !== 'playing') {
              clearInterval(rechargeInterval);
              return {};
            }
            
            // Only recharge if below max ammo
            if (state.ammo < state.maxAmmo) {
              // Recharge rate increases with level
              const levelBonus = 1 + (state.level - 1) * 0.1;
              return { 
                ammo: Math.min(state.maxAmmo, state.ammo + state.rechargeRate * levelBonus / 10) 
              };
            }
            
            return {};
          });
        }, 100); // Recharge tick every 100ms
      },
      
      // Start a new wave
      startWave: () => {
        // Increment wave number
        const newWaveNumber = get().waveNumber + 1;
        const { level } = get();
        
        // Increase difficulty with each wave and level
        // Level has a stronger impact on difficulty than wave number
        const levelDifficultyBonus = Math.pow(level, 0.5) * 0.1; // Square root of level for balanced scaling
        const newDifficulty = 1 + (newWaveNumber - 1) * 0.2 + levelDifficultyBonus;
        
        // Reset wave status
        set({
          gamePhase: 'playing',
          waveNumber: newWaveNumber,
          difficulty: newDifficulty,
          ammo: get().maxAmmo, // Refill ammo at start of wave
          waveStatus: {
            shotsHit: 0,
            shotsMissed: 0,
            maliciousHit: 0,
            benignHit: 0,
            xpGained: 0
          }
        });
        
        // Save progress
        const currentData = getLocalStorage('packetSniper_playerData') || {};
        setLocalStorage('packetSniper_playerData', {
          ...currentData,
          waveNumber: newWaveNumber,
          level: get().level,
          xp: get().xp,
          score: get().score
        });
      },
      
      // End the current wave
      endWave: () => {
        // Handle rewards and status updates
        set((state) => {
          // Calculate score additions
          const waveBonus = state.waveNumber * 50;
          const maliciousHitBonus = state.waveStatus.maliciousHit * 100;
          const accuracyBonus = Math.floor(state.waveStatus.maliciousHit / Math.max(1, (state.waveStatus.shotsHit + state.waveStatus.shotsMissed)) * 100);
          
          const totalScore = state.score + waveBonus + maliciousHitBonus + accuracyBonus;
          
          // Calculate XP gain
          const waveXP = state.waveStatus.xpGained;
          const totalXP = state.xp + waveXP;
          
          // Check for level up
          const xpForNextLevel = Math.pow(state.level, 1.5) * 1000;
          let newLevel = state.level;
          let remainingXP = totalXP;
          let leveledUp = false;
          
          if (totalXP >= xpForNextLevel) {
            newLevel = state.level + 1;
            remainingXP = totalXP - xpForNextLevel;
            leveledUp = true;
            
            // Play level up sound
            useAudio.getState().playLevelUp();
          }
          
          // Update localStorage
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            level: newLevel,
            xp: remainingXP,
            score: totalScore,
            totalThreatsDestroyed: state.totalThreatsDestroyed,
            totalThreatsMissed: state.totalThreatsMissed,
            totalShots: state.totalShots,
            totalHits: state.totalHits
          });

          // Sync data with Firebase
          syncUserStats();
          
          return {
            gamePhase: 'ended',
            score: totalScore,
            level: newLevel,
            xp: remainingXP,
            justLeveledUp: leveledUp
          };
        });
      },
      
      // Game over - too many malicious packets got through
      gameOver: (reason = 'system-failure') => {
        set((state) => {
          // Save progress anyway
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            level: state.level,
            xp: state.xp,
            score: state.score,
            totalThreatsDestroyed: state.totalThreatsDestroyed,
            totalThreatsMissed: state.totalThreatsMissed,
            totalShots: state.totalShots,
            totalHits: state.totalHits
          });

          // Sync data with Firebase
          syncUserStats();
          
          return {
            gamePhase: 'gameover',
            gameOverReason: reason
          };
        });
      },
      
      // Restart the game
      restartGame: () => {
        set({
          gamePhase: 'ready'
        });
      },
      
      // Fire a shot
      shoot: (x, y) => {
        const { ammo, gamePhase, totalShots } = get();
        
        // Only shoot if in playing phase and has ammo
        if (gamePhase === 'playing' && ammo >= 1) {
          // Just register the shot coordinates, don't decrease ammo yet
          // Ammo will be decreased only on successful hits
          set({
            shotFired: { x, y },
            totalShots: totalShots + 1 // Track total shots fired
          });
          
          // Save updated stats to localStorage
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            totalShots: totalShots + 1
          });
        }
      },
      
      // Reset shot fired state
      resetShotFired: () => {
        set({ shotFired: null });
      },
      
      // Register a hit
      registerHit: (isMalicious: boolean, xpOverride?: number) => {
        set((state) => {
          // Base XP for hitting any target
          const baseXP = 10;
          
          // Bonus XP for hitting malicious packets
          const maliciousBonus = isMalicious ? 50 : 0;
          
          // Level bonus (higher levels get more XP)
          const levelBonus = Math.floor((state.level - 1) * 0.2 * baseXP);
          
          // Calculate total XP gained, or use the override if provided
          const xpGained = xpOverride !== undefined ? xpOverride : baseXP + maliciousBonus + levelBonus;
          
          // Update wave status
          const waveStatus = {
            ...state.waveStatus,
            shotsHit: state.waveStatus.shotsHit + 1,
            xpGained: state.waveStatus.xpGained + xpGained
          };
          
          if (isMalicious) {
            waveStatus.maliciousHit = state.waveStatus.maliciousHit + 1;
          } else {
            waveStatus.benignHit = state.waveStatus.benignHit + 1;
          }
          
          // Update total stats
          const totalHits = state.totalHits + 1;
          const totalThreatsDestroyed = isMalicious ? state.totalThreatsDestroyed + 1 : state.totalThreatsDestroyed;
          
          // Add XP
          const totalXP = state.xp + xpGained;
          
          // Check for level up
          const xpForNextLevel = Math.pow(state.level, 1.5) * 1000;
          let newLevel = state.level;
          let remainingXP = totalXP;
          let leveledUp = false;
          
          if (totalXP >= xpForNextLevel) {
            newLevel = state.level + 1;
            remainingXP = totalXP - xpForNextLevel;
            leveledUp = true;
            
            // Play level up sound
            useAudio.getState().playLevelUp();
          }
          
          // Update localStorage
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            level: newLevel,
            xp: remainingXP,
            totalThreatsDestroyed,
            totalHits,
            totalShots: state.totalShots + 1
          });

          // Sync with Firebase
          syncUserStats();
          
          return {
            waveStatus,
            xp: remainingXP,
            level: newLevel,
            justLeveledUp: leveledUp,
            totalThreatsDestroyed,
            totalHits,
            totalShots: state.totalShots + 1
          };
        });
      },
      
      // Register a miss
      registerMiss: () => {
        set((state) => {
          // Update wave status
          const waveStatus = {
            ...state.waveStatus,
            shotsMissed: state.waveStatus.shotsMissed + 1
          };

          // Update localStorage
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            totalShots: state.totalShots + 1
          });

          // Sync with Firebase
          syncUserStats();
          
          return {
            waveStatus,
            totalShots: state.totalShots + 1
          };
        });
      },
      
      // Register a corrupted packet passing through (not shot)
      registerCorruptedPacketPassed: () => {
        set((state) => {
          // Update threats missed count
          const totalThreatsMissed = state.totalThreatsMissed + 1;
          
          // Update localStorage
          const currentData = getLocalStorage('packetSniper_playerData') || {};
          setLocalStorage('packetSniper_playerData', {
            ...currentData,
            totalThreatsMissed
          });

          // Sync with Firebase
          syncUserStats();
          
          return {
            totalThreatsMissed
          };
        });
      },
      
      // Update threats missed counter
      updateThreatsMissed: () => {
        const { totalThreatsMissed } = get();
        const newTotalThreatsMissed = totalThreatsMissed + 1;
        
        set({
          totalThreatsMissed: newTotalThreatsMissed
        });
        
        // Save updated stats to localStorage
        const currentData = getLocalStorage('packetSniper_playerData') || {};
        setLocalStorage('packetSniper_playerData', {
          ...currentData,
          totalThreatsMissed: newTotalThreatsMissed
        });
      },
      
      // Award bonus XP (for level milestones, etc.)
      awardBonusXp: (amount) => {
        const { xp, level } = get();
        
        // Add the bonus XP
        const newXp = xp + amount;
        
        // Updated XP formula - much higher requirements for level up
        const xpForNextLevel = 1000 + Math.pow(level, 2) * 200;
        let newLevel = level;
        
        // For bonus XP, we do allow level ups if enough XP is earned
        if (newXp >= xpForNextLevel + 50) {
          newLevel = level + 1;
          
          // Set the level up flag if we actually leveled up
          set({ justLeveledUp: true });
          
          // Clear the flag after 3 seconds
          setTimeout(() => {
            set({ justLeveledUp: false });
          }, 3000);
        }
        
        // Update the XP and level
        set({
          xp: newXp,
          level: newLevel
        });
        
        // Save the updated values
        const currentData = getLocalStorage('packetSniper_playerData') || {};
        setLocalStorage('packetSniper_playerData', {
          ...currentData,
          level: newLevel,
          xp: newXp
        });
      },
      
      // Clear the level up flag (used by UI components)
      clearLevelUpFlag: () => {
        set({ justLeveledUp: false });
      },
      
      // Toggle pause state
      togglePause: () => {
        const currentPauseState = get().isPaused;
        set({ isPaused: !currentPauseState });
      }
    };
  })
);
