import { useState, useEffect, useCallback, useRef } from "react";
import Packet from "./Packet";
import ParticleSystem from "./ParticleSystem";
import { usePacketSniper } from "@/lib/stores/usePacketSniper";
import { generatePacketContent } from "@/lib/packetData";
import { useAudio } from "@/lib/stores/useAudio";
import { nanoid } from "nanoid";

// Define packet types
type PacketType = "benign" | "malicious" | "corrupted" | "databreach" | "encrypted";

// Get particle color based on packet type - moved outside component to avoid dependency cycle
const getParticleColor = (packetType: PacketType): string => {
  switch (packetType) {
    case "malicious":
      return "#ff5555"; // Red
    case "corrupted":
      return "#ffaa00"; // Yellow/Orange
    case "databreach":
      return "#ff0000"; // Bright Red
    case "encrypted":
      return "#bb00ff"; // Neon Purple
    default:
      return "#55ff55"; // Green
  }
};

interface PacketData {
  id: string;
  x: number;
  y: number;
  speed: number;
  direction: "left" | "right";
  packetType: PacketType;
  content: string;
  width: number;
  height: number;
  opacity: number;
  health: number;
  maxHealth: number;
  glow?: boolean;
  isHeatWave: boolean;
  isAnimated?: boolean;
}

interface HitParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

const GameCanvas = () => {
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [hitParticles, setHitParticles] = useState<HitParticle[]>([]);
  const [missedMaliciousCount, setMissedMaliciousCount] = useState(0);
  const [criticalHits, setCriticalHits] = useState<
    { id: string; timestamp: number; level: number; x: number; y: number }[]
  >([]);
  
  // Track if there's a data breach packet approaching the edge
  const [screenDangerGlow, setScreenDangerGlow] = useState(false);
  
  // Track the closest data breach packet position for dimming effect
  const [dangerProximity, setDangerProximity] = useState(0); // 0-1 value, 1 being closest to edge
  
  // Level-up overlay state
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);
  const [levelUpAmount, setLevelUpAmount] = useState(0);

  // Scope zoom state
  const [scopeActive, setScopeActive] = useState(false);
  const [scopePosition, setScopePosition] = useState({ x: 0, y: 0 });
  
  // Critical hit tracking (for double-click mechanics)
  const lastClickRef = useRef<{
    packetId: string;
    timestamp: number;
    x: number;
    y: number;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    gamePhase, 
    difficulty,
    shotFired,
    resetShotFired,
    registerHit,
    registerMiss,
    gameOver,
    registerCorruptedPacketPassed,
    awardBonusXp,
    level,
    totalThreatsMissed,
    updateThreatsMissed,
    isPaused,
    score,
    xp,
  } = usePacketSniper();

  const { playHit, playSuccess } = useAudio();
  
  // Reference to track last time danger sound was played
  const lastDangerSoundRef = useRef<number>(0);

  // Hyperspeed special effects
  const [cameraEffects, setCameraEffects] = useState({
    rotationAngle: 0,
    shakeIntensity: 0,
    distortionLevel: 0,
  });
  const cameraEffectRef = useRef<NodeJS.Timeout | null>(null);

  // Heat Wave mode state
  const [heatWaveActive, setHeatWaveActive] = useState(false);
  const [heatWaveTimeRemaining, setHeatWaveTimeRemaining] = useState(0);
  const heatWaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heatWaveCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Power Mode state
  const [powerModeActive, setPowerModeActive] = useState(false);
  const [powerModeTimeRemaining, setPowerModeTimeRemaining] = useState(0);
  const [firewallShieldActive, setFirewallShieldActive] = useState(false);
  const [firewallTimeRemaining, setFirewallTimeRemaining] = useState(0);
  const powerModeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firewallTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scope tip state
  const [showScopeTip, setShowScopeTip] = useState(false);
  const scopeTipShownRef = useRef(false);
  
  // Function to generate a new packet
  const generatePacket = useCallback(
    (isHeatWavePacket = false) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Always flow left to right
      const direction = "right" as const;
    const x = -100; // Start from left
    
    // To prevent overlap, divide the screen height into sections based on current packets
    const sections = 5; // Number of vertical sections
    const sectionHeight = (windowHeight - 200) / sections;
    
    // Choose a random section and position within that section to reduce overlap
    const sectionIndex = Math.floor(Math.random() * sections);
      const y =
        100 +
        sectionIndex * sectionHeight +
        Math.random() * (sectionHeight * 0.7);

      // Special difficulty scaling after level 10
      // For levels 1-9: moderate scaling
      // For level 10-14: HYPERSPEED mode but still playable
      // For level 15-19: Slow down to keep it playable while still challenging
      // For level 20-90: Keep speed high but stable
      // For level 91+: Gradually increase again
      let levelSpeedBonus;
      let speedRandomFactor;
      let difficultyImpact;

      if (level < 10) {
        // Normal scaling for levels 1-9
        levelSpeedBonus = level * 1.2;
        speedRandomFactor = 70;
        difficultyImpact = 0.15;
      } else if (level < 15) {
        // HYPERSPEED mode for level 10-14
        // Exponential scaling with diminishing returns to prevent impossible speeds
        const levelFactor = 15 + Math.pow(level - 9, 1.2) * 5; // Much more aggressive scaling after level 10
        levelSpeedBonus = levelFactor * 2.5; // Increased multiplier for hyperspeed
        speedRandomFactor = 40; // Less randomness at high levels for more predictable gameplay
        difficultyImpact = 0.25; // Higher difficulty impact
      } else if (level < 20) {
        // Level 15-19 - Slow down to keep it playable while still challenging
        // Cap the speed increase and reduce randomness for better playability
        const levelFactor = 50; // Fixed level factor to prevent further scaling
        levelSpeedBonus = levelFactor * 1.8; // Reduced multiplier to slow things down
        speedRandomFactor = 30; // Even less randomness for more predictable gameplay
        difficultyImpact = 0.2; // Slightly reduced difficulty impact
      } else if (level <= 90) {
        // Level 20-90 - Keep speed high but stable
        // Fixed values to maintain consistent challenge without increasing difficulty
        levelSpeedBonus = 55 * 1.7; // High fixed speed bonus
        speedRandomFactor = 25; // Low randomness for consistent gameplay
        difficultyImpact = 0.18; // Fixed difficulty impact
      } else {
        // Level 91+ - Gradually increase speed again
        // Small incremental scaling for ultra-high levels
        const extraLevelFactor = Math.min((level - 90) * 0.5, 30); // Cap the extra scaling
        levelSpeedBonus = (55 + extraLevelFactor) * 1.7;
        speedRandomFactor = 25;
        difficultyImpact = 0.18 + Math.min((level - 90) * 0.002, 0.1); // Slight difficulty increase
      }

      // Speed calculation with level-based scaling
      let baseSpeed = 25 + Math.min(level, 5) * 8 + levelSpeedBonus;

      // During Heat Wave, packets move faster
      if (isHeatWavePacket) {
        baseSpeed *= 0.3; // 30% faster during Heat Wave
      }

      const speed =
        (baseSpeed + Math.random() * speedRandomFactor) *
        (1 + difficulty * difficultyImpact);

      // Set initial probabilities for early levels - more balanced distribution
      // With special adjustments for level 10+
      // Level 1: 30% malicious (red), 13% corrupted (yellow), ~57% benign (green)
      let dangerProbability, maliciousProbability, corruptedProbability;
      
      // Make quantum packets very rare normally (0.2%) but 20% chance during heat waves
      let encryptedPacketChance = isHeatWavePacket ? 0.2 : 0.002;

      if (level > 12) {
        // Disco mode (level 13+) - adjust quantum packet chance
        encryptedPacketChance = isHeatWavePacket ? 0.2 : 0.003; // Still rare normally (0.3%), consistent 20% in heat waves
      }

      if (isHeatWavePacket) {
        // Scale smarter to keep it spicy but not insane
        const levelFactor = Math.max(0, level - 9);

        dangerProbability = Math.min(0.15, 0.05 + levelFactor * 0.003); // Max 15%
        maliciousProbability = Math.min(0.35, 0.15 + levelFactor * 0.01); // Max 35%
        corruptedProbability = Math.min(0.15, 0.05 + levelFactor * 0.005); // Max 15%
      } else if (level < 10) {
        // Normal probability scaling for levels 1-9
        dangerProbability = Math.min(0.01 + level * 0.002, 0.05);
        maliciousProbability = Math.min(0.3 + level * 0.01, 0.45);
        corruptedProbability = Math.min(0.13 + level * 0.005, 0.18);
      } else {
        // More challenging probability distribution for level 10+
        // But still somewhat balanced to keep the game playable
        dangerProbability = Math.min(0.05 + (level - 9) * 0.004, 0.08); // More data breach packets
        maliciousProbability = Math.min(0.45 + (level - 9) * 0.01, 0.55); // More malicious packets
        corruptedProbability = 0.15; // Fixed moderate amount of corrupted packets
      }

      // Determine packet type based on calculated probabilities
    const random = Math.random();
    let packetType: PacketType;
    let glow = false;
      let isAnimated = false;

      // Check for encrypted legendary packet
      if (random < encryptedPacketChance) {
        packetType = "encrypted";
        glow = true;
        isAnimated = true;
      }
    // Data breach packets are very rare but increase with level
      else if (random < dangerProbability) {
        packetType = "databreach";
        glow = true; // Add glowing effect
      } 
    // Malicious packets increase with level
      else if (random < dangerProbability + maliciousProbability) {
        packetType = "malicious";
      } 
    // Corrupted packets increase with level
      else if (
        random <
        dangerProbability + maliciousProbability + corruptedProbability
      ) {
        packetType = "corrupted";
      }
      // Benign packets - more common in early levels (~57% at level 1)
      else {
        packetType = "benign";
      }
    
      const content = generatePacketContent(packetType !== "benign");
    const width = 160 + Math.random() * 120;
    const height = 64 + Math.random() * 32;
    
    // For non-benign packets, randomly assign 1-3 health points
    // Data breach packets have more health (3-5 points)
    let maxHealth = 1;
    
      if (packetType === "databreach") {
      maxHealth = 3 + Math.floor(Math.random() * 3); // 3-5 health points
      } else if (packetType !== "benign") {
      maxHealth = 1 + Math.floor(Math.random() * 3); // 1-3 health points
    }

      // In Heat Wave mode, packets are tougher
      if (isHeatWavePacket && packetType !== "benign") {
        maxHealth += 6; // ten more health point for Heat Wave packets
    }
    
    return {
      id: nanoid(),
      x,
      y,
      speed,
      direction,
      packetType,
      content,
      width,
      height,
      opacity: 1,
      health: maxHealth,
      maxHealth,
        glow,
        isHeatWave: isHeatWavePacket,
        isAnimated: isAnimated
    };
    },
    [difficulty, level, generatePacketContent]
  );
  
  // Start spawning packets when game is playing
  useEffect(() => {
    if (gamePhase === "playing" && !isPaused) {
      // Reset missed malicious counter when starting new game
      setMissedMaliciousCount(0);
      
      // Initial packet spawn count - scale differently after level 10
      let initialCount;
      if (level < 10) {
        // Fewer packets in early levels
        initialCount = 2 + Math.floor(level * 0.4);
      } else {
        // IMPROVED SCALING: Logarithmic growth with randomization
        // Base count with logarithmic scaling (smoother curve)
        const basePackets = 3;
        const logGrowth = Math.floor(Math.log2(level - 8)); // log2 curve starting effectively at level 10

        // Add randomness - sometimes spawn an extra packet (30% chance)
        const randomBonus = Math.random() < 0.3 ? 1 : 0;

        // Cap at 7 max initial packets (still challenging but not overwhelming)
        initialCount = Math.min(basePackets + logGrowth + randomBonus, 7);
      }

      // For level 10+, stagger the initial packet spawning instead of all at once
      if (level >= 10) {
        // Only spawn 3 packets initially
        const immediatePackets = Math.min(3, initialCount);
        const initialPackets = Array.from({ length: immediatePackets }, () =>
          generatePacket(false)
        );
      setPackets(initialPackets);
      
        // Stagger the remaining packets with short delays
        if (initialCount > immediatePackets) {
          const remainingCount = initialCount - immediatePackets;

          // Spawn remaining packets with 300ms delays between each
          for (let i = 0; i < remainingCount; i++) {
            setTimeout(() => {
              if (gamePhase === "playing" && !isPaused) {
                const newPacket = generatePacket(false);
                setPackets((prev) => [...prev, newPacket]);
              }
            }, (i + 1) * 100); // Stagger by 300ms each
          }
        }
      } else {
        // Normal behavior for levels 1-9
        const initialPackets = Array.from({ length: initialCount }, () =>
          generatePacket(false)
        );
        setPackets(initialPackets);
      }

      // Setup spawn interval with special scaling for level 10+
      let spawnRate;
      let burstMode = false;

      if (level < 10) {
        // Normal spawn rate scaling for levels 1-9
        const levelSpawnBonus = Math.min(level * 8, 350);
        spawnRate = Math.max(900 - level * 40 - levelSpawnBonus, 250);
      } else {
        // HYPERSPEED spawn rate after level 10 - but with burst cooldown pattern
        const hyperLevelFactor = 15 + Math.pow(level - 9, 1.2) * 3;
        const levelSpawnBonus = Math.min(hyperLevelFactor * 15, 650);

        // Base spawn rate - still fast but not constant barrage
        spawnRate = Math.max(500 - (level - 9) * 40 - levelSpawnBonus, 200);

        // Enable burst mode for level 10+
        burstMode = true;
      }

      // For level 10+, use burst spawn pattern instead of continuous
      if (burstMode) {
        let burstActive = false;
        const burstSize = 2 + Math.min(Math.floor((level - 9) * 0.5), 2); // 2-4 packets per burst
        const burstDuration = Math.max(500, 1200 - (level - 9) * 80); // Duration of burst (ms)
        const cooldownDuration = Math.max(1000, 2500 - (level - 9) * 100); // Cooldown between bursts (ms)

        // Burst spawning interval
      spawnIntervalRef.current = setInterval(() => {
          if (!burstActive) {
            // Start a burst
            burstActive = true;

            // Spawn burst of packets
            for (let i = 0; i < burstSize; i++) {
              setTimeout(() => {
                if (gamePhase === "playing" && !isPaused) {
                  const newPacket = generatePacket(false);
                  setPackets((prev) => [...prev, newPacket]);
                }
              }, i * (burstDuration / burstSize));
            }

            // End burst and start cooldown
            setTimeout(() => {
              burstActive = false;
            }, burstDuration);
          }
        }, burstDuration + cooldownDuration);
      } else {
        // Normal continuous spawning for levels 1-9
        spawnIntervalRef.current = setInterval(() => {
          const newPacket = generatePacket(false);
          setPackets((prev) => [...prev, newPacket]);
      }, spawnRate);
      }
      
      // Clean up old particles and critical hit effects
      cleanupIntervalRef.current = setInterval(() => {
        const now = Date.now();
        // Remove particles older than 1 second
        setHitParticles((prev) => prev.filter((p) => now - p.timestamp < 1000));
        // Remove critical hit indicators older than 1.5 seconds
        setCriticalHits((prev) => prev.filter((c) => now - c.timestamp < 1500));
      }, 500);
    }
    
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [gamePhase, level, generatePacket, isPaused]);

  // Handle pausing - clear intervals when game is paused
  useEffect(() => {
    if (isPaused && gamePhase === "playing") {
      // Clear any active intervals when paused
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }

      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    } else if (
      !isPaused &&
      gamePhase === "playing" &&
      !spawnIntervalRef.current
    ) {
      // Restart intervals when unpaused if they don't exist
      const levelSpawnBonus = Math.min(level * 8, 350);
      const spawnRate = Math.max(900 - level * 40 - levelSpawnBonus, 250);
      spawnIntervalRef.current = setInterval(() => {
        const newPacket = generatePacket(false);
        setPackets((prev) => [...prev, newPacket]);
      }, spawnRate);

      cleanupIntervalRef.current = setInterval(() => {
        const now = Date.now();
        setHitParticles((prev) => prev.filter((p) => now - p.timestamp < 1000));
        setCriticalHits((prev) => prev.filter((c) => now - c.timestamp < 1500));
      }, 500);
    }
  }, [isPaused, gamePhase, level, generatePacket]);
  
  // Check for level milestone and award bonus XP
  useEffect(() => {
    // Check if level is divisible by 5 (every 5 levels)
    if (level > 0 && level % 5 === 0) {
      // Award 500 XP bonus for reaching level milestone
      const bonusXp = 500;
      
      // Only show the overlay if we're in playing phase (not when loading saved games)
      if (gamePhase === "playing") {
        // Award the bonus XP without showing the overlay
        awardBonusXp(bonusXp);
      }
    }
  }, [level, gamePhase, awardBonusXp]);
  
  // Handle packet removal when they exit the screen
  const handlePacketExit = useCallback(
    (id: string, packetType: PacketType) => {
      setPackets((prev) => prev.filter((p) => p.id !== id));
    
    // Handle different packet types when they exit the screen
    switch (packetType) {
        case "malicious":
        case "corrupted":
        case "databreach":
        // Any non-benign packet that exits is a missed threat
        updateThreatsMissed();
        
        // For malicious packets specifically, also track missed malicious counter
          if (packetType === "malicious") {
          // If a malicious packet exits, increment the miss counter
            setMissedMaliciousCount((prev) => {
            const newCount = prev + 1;
            
            // Game over if 10 or more malicious packets have been missed
            if (newCount >= 10) {
                gameOver("malicious-breach");
            }
            
            return newCount;
          });
          } else if (packetType === "databreach") {
          // If a data breach packet exits, instant game over
            gameOver("data-breach");
          } else if (packetType === "corrupted") {
          // Corrupted packets reduce XP when allowed to pass
          registerCorruptedPacketPassed();
        }
        break;
    }
    },
    [gameOver, registerCorruptedPacketPassed, updateThreatsMissed]
  );

  // Handle packet hit from clicking or shooting
  const handlePacketHit = useCallback(
    (id: string, packetType: PacketType, x: number, y: number) => {
      // Special handling for encrypted legendary packets
      if (packetType === "encrypted") {
        handleEncryptedPacketHit(id, x, y);
        return;
      }

    const now = Date.now();
    let criticalHitLevel = 0;
    
    // Check for critical hit (rapid clicks on same packet)
    if (lastClickRef.current && lastClickRef.current.packetId === id) {
      // If we click the same packet within 500ms, it's a critical hit
      if (now - lastClickRef.current.timestamp < 500) {
        criticalHitLevel = 1; // x2 damage
        
        // Display critical hit effect
          setCriticalHits((prev) => [
          ...prev,
          {
            id: nanoid(),
            timestamp: now,
            level: criticalHitLevel,
            x: x || lastClickRef.current?.x || 0,
              y: y || lastClickRef.current?.y || 0,
            },
        ]);
      }
    }
    
    // Update last click reference
    lastClickRef.current = {
      packetId: id,
      timestamp: now,
      x: x || 0,
        y: y || 0,
    };
    
      setPackets((prev) => {
      // Find the packet
        const packetIndex = prev.findIndex((p) => p.id === id);
      if (packetIndex === -1) return prev;
      
      const packet = prev[packetIndex];
      
      // Only process hits on non-benign packets
        if (packet.packetType === "benign") {
        return prev;
      }
      
      // Decrease health - critical hits do double damage
      const damageAmount = criticalHitLevel > 0 ? 2 : 1;
      const newHealth = packet.health - damageAmount;
      
      if (newHealth <= 0) {
        // Packet is destroyed
        // Register hit with game state with appropriate XP based on packet type
        let xpOverride;
        
          switch (packet.packetType) {
            case "databreach":
            // Data breach packets are the hardest to kill and most dangerous
            // Scale XP reward based on health to reward difficulty
            xpOverride = 30 * packet.maxHealth; // High XP for dangerous data breach packets
            break;
            case "corrupted":
            // Corrupted packets are medium difficulty
            xpOverride = 15 * packet.maxHealth; // Medium XP for corrupted packets
            break;
            case "malicious":
            // Standard malicious packets
            xpOverride = 8 * packet.maxHealth; // Base XP for standard malicious packets
            break;
          default:
            xpOverride = 0;
        }
        
          // Double XP during Power Mode
          registerHit(true, powerModeActive ? xpOverride * 2 : xpOverride);
        
        // Create visual effect at packet position
        const particleColor = getParticleColor(packet.packetType);
          setHitParticles((prevParticles) => [
          ...prevParticles,
          {
            id: nanoid(),
            x: packet.x,
            y: packet.y,
            color: particleColor,
              timestamp: now,
            },
        ]);
        
        // Special effects on packet destruction based on level
        if (level === 12) {
          // Level 12: Full screen flash on packet destruction
          const flash = document.createElement("div");
          flash.className = "fixed inset-0 bg-white z-50 pointer-events-none";
          flash.style.opacity = packet.packetType === "databreach" ? "0.6" : "0.3";
          document.body.appendChild(flash);
          
          // Fade out the flash
          setTimeout(() => {
            flash.style.transition = "opacity 0.5s ease-out";
            flash.style.opacity = "0";
            setTimeout(() => {
              document.body.removeChild(flash);
            }, 500);
          }, 50);
        } else if (level > 12) {
          // Level 13+: Disco flash with color based on packet type
          const getFlashColor = () => {
            switch (packet.packetType) {
              case "malicious": return "rgba(255, 0, 0, 0.3)";
              case "corrupted": return "rgba(255, 200, 0, 0.3)";
              case "databreach": return "rgba(255, 0, 100, 0.4)";
              default: return "rgba(0, 255, 0, 0.2)";
            }
          };
          
          const flash = document.createElement("div");
          flash.className = "fixed inset-0 z-50 pointer-events-none";
          flash.style.backgroundColor = getFlashColor();
          document.body.appendChild(flash);
          
          // Fade out the flash
          setTimeout(() => {
            flash.style.transition = "opacity 0.4s ease-out";
            flash.style.opacity = "0";
            setTimeout(() => {
              document.body.removeChild(flash);
            }, 400);
          }, 50);
          
          // Extra camera shake in disco mode when packets are destroyed
          if (["malicious", "corrupted", "databreach", "encrypted"].includes(packet.packetType)) {
            setCameraEffects(prev => ({
              ...prev,
              shakeIntensity: prev.shakeIntensity + (packet.packetType === "databreach" ? 15 : 8)
            }));
            
            // Reset shake intensity after a delay
            setTimeout(() => {
              setCameraEffects(prev => ({
                ...prev,
                shakeIntensity: Math.max(0, prev.shakeIntensity - (packet.packetType === "databreach" ? 15 : 8))
              }));
            }, 400);
          }
        }
        
        // Remove the packet
          return prev.filter((p) => p.id !== id);
      } else {
        // Just decrease health
        const updatedPackets = [...prev];
        updatedPackets[packetIndex] = {
          ...packet,
            health: newHealth,
        };
        return updatedPackets;
      }
    });
    },
    [registerHit, powerModeActive, level]
  );

  // Process encrypted packet hit (legendary packet)
  const handleEncryptedPacketHit = (packetId: string, x: number, y: number) => {
    // Remove the packet
    setPackets(prev => prev.filter(p => p.id !== packetId));
    
    // Create special visual effect
    for (let i = 0; i < 20; i++) { // Create multiple particles for a more dramatic effect
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        setHitParticles(prevParticles => [
          ...prevParticles,
          {
            id: nanoid(),
            x: x + offsetX,
            y: y + offsetY,
            color: getParticleColor("encrypted"),
            timestamp: Date.now(),
          },
        ]);
      }, i * 50);
    }
    
    // Special effects based on level
    if (level === 12) {
      // Level 12: Intense full screen flash on quantum packet destruction
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 bg-purple-200 z-50 pointer-events-none";
      flash.style.opacity = "0.8";
      document.body.appendChild(flash);
      
      // Fade out the flash
      setTimeout(() => {
        flash.style.transition = "opacity 0.7s ease-out";
        flash.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 700);
      }, 100);
    } else if (level > 12) {
      // Level 13+: Rainbow disco flash with rotating colors
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 z-50 pointer-events-none";
      
      // Create a rainbow gradient effect
      const hue1 = Math.random() * 360;
      const hue2 = (hue1 + 180) % 360;
      flash.style.background = `linear-gradient(45deg, hsla(${hue1}, 100%, 60%, 0.6), hsla(${hue2}, 100%, 60%, 0.6))`;
      document.body.appendChild(flash);
      
      // Fade out the flash
      setTimeout(() => {
        flash.style.transition = "opacity 0.6s ease-out";
        flash.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 600);
      }, 100);
      
      // Extreme camera shake for quantum packets in disco mode
      setCameraEffects(prev => ({
        ...prev,
        shakeIntensity: prev.shakeIntensity + 25,
        rotationAngle: (Math.random() * 3 - 1.5)
      }));
      
      // Reset shake intensity after a delay
      setTimeout(() => {
        setCameraEffects(prev => ({
          ...prev,
          shakeIntensity: Math.max(0, prev.shakeIntensity - 25),
          rotationAngle: 0
        }));
      }, 600);
    }
    
    // Start power mode (legendary packet special ability)
    startPowerMode();
    
    // Award massive bonus XP
    const bonusXp = 200 * (1 + Math.floor(level * 0.5));
    awardBonusXp(bonusXp);
    
    // Play success sound
    playSuccess();
  };

  // Disable right-click context menu and handle scope activation
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Only enable scope zoom for level 5+
      if (level >= 5 && gamePhase === "playing") {
        // Toggle scope - if active, deactivate it; if inactive, activate it
        setScopeActive((prev) => !prev);
        setScopePosition({ x: e.clientX, y: e.clientY });
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (scopeActive) {
        setScopePosition({ x: e.clientX, y: e.clientY });
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousemove", handleMouseMove);

    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [level, gamePhase, scopeActive]);
  
  // Handle shooting - check for hits
  useEffect(() => {
    if (shotFired && containerRef.current) {
      const { x, y } = shotFired;
      let hitPacket = false;
      
      // Loop through packets to check for hits
      setPackets((prev) => {
        const newPackets = [...prev];
        
        for (let i = 0; i < newPackets.length; i++) {
          const packet = newPackets[i];
          
          // Calculate packet boundaries
          const packetLeft = packet.x - packet.width / 2;
          const packetRight = packet.x + packet.width / 2;
          const packetTop = packet.y - packet.height / 2;
          const packetBottom = packet.y + packet.height / 2;
          
          // Check if shot is within packet boundaries
          if (
            x >= packetLeft &&
            x <= packetRight &&
            y >= packetTop &&
            y <= packetBottom
          ) {
            // Special handling for encrypted legendary packets
            if (packet.packetType === "encrypted") {
              handleEncryptedPacketHit(packet.id, x, y);
              hitPacket = true;
              break;
            }

            // Cannot shoot benign packets
            if (packet.packetType === "benign") {
              continue;
            }
            
            hitPacket = true;
            
            // Play hit sound
            playHit();
            
            // Create particles
            const particleColor = getParticleColor(packet.packetType);
            setHitParticles((prevParticles) => [
              ...prevParticles,
              {
                id: nanoid(),
                x,
                y,
                color: particleColor,
                timestamp: Date.now(),
              },
            ]);
            
            // Decrease health
            const newHealth = packet.health - 1;
            
            if (newHealth <= 0) {
              // Packet is destroyed
              // Register hit with game state with appropriate XP based on packet type
              let xpOverride;
              
              switch (packet.packetType) {
                case "databreach":
                  // Data breach packets are the hardest to kill and most dangerous
                  // Scale XP reward based on health to reward difficulty
                  xpOverride = 30 * packet.maxHealth; // High XP for dangerous data breach packets
                  break;
                case "corrupted":
                  // Corrupted packets are medium difficulty
                  xpOverride = 15 * packet.maxHealth; // Medium XP for corrupted packets
                  break;
                case "malicious":
                  // Standard malicious packets
                  xpOverride = 8 * packet.maxHealth; // Base XP for standard malicious packets
                  break;
                default:
                  xpOverride = 0;
              }
              
              // Double XP during Power Mode
              registerHit(true, powerModeActive ? xpOverride * 2 : xpOverride);
              
              // Remove the packet
              newPackets.splice(i, 1);
              break;
            } else {
              // Just decrease health
              newPackets[i] = {
                ...packet,
                health: newHealth,
              };
              break;
            }
          }
        }
        
        return newPackets;
      });
      
      // If no packet was hit AND not in power mode, register a miss
      // In power mode, we get infinite ammo so no misses
      if (!hitPacket && !powerModeActive) {
        registerMiss();
      }
      
      // Reset shot
      resetShotFired();
    }
  }, [
    shotFired, 
    resetShotFired, 
    registerHit, 
    registerMiss, 
    playHit,
    getParticleColor,
    powerModeActive
  ]);
  
  // Check for data breach packets approaching the edge
  useEffect(() => {
    if (gamePhase === "playing") {
      // Check if any data breach packet is close to the right edge
      const screenWidth = window.innerWidth;
      const dangerZone = screenWidth * 0.7; // Consider 70% of screen width as danger zone
      const criticalZone = screenWidth * 0.85; // Critical danger zone, very close to the edge
      
      // Find the most dangerous data breach packet (closest to the right edge)
      let mostDangerousX = 0;
      
      packets.forEach((packet) => {
        if (packet.packetType === "databreach" && packet.x > mostDangerousX) {
          mostDangerousX = packet.x;
        }
      });
      
      // Calculate the danger proximity (0 = safe, 1 = at critical zone)
      let proximity = 0;
      
      if (mostDangerousX > dangerZone) {
        // Calculate proximity as a value between 0-1
        proximity = Math.min(
          1,
          (mostDangerousX - dangerZone) / (criticalZone - dangerZone)
        );
      }
      
      setDangerProximity(proximity);
      
      const hasDataBreachInDangerZone = proximity > 0;
      
      // Play warning sound when entering danger zone, but not too frequently
      const now = Date.now();
      if (
        hasDataBreachInDangerZone &&
        now - lastDangerSoundRef.current > 1500
      ) {
        playHit(); // Use the existing hit sound as a warning
        lastDangerSoundRef.current = now;
      }
      
      setScreenDangerGlow(hasDataBreachInDangerZone);
    } else {
      setScreenDangerGlow(false);
      setDangerProximity(0);
    }
  }, [packets, gamePhase, playHit]);
  
  // Handle hyperspeed camera effects
  useEffect(() => {
    // Only apply effects when in hyperspeed mode (level 10+) and playing
    if (level >= 10 && gamePhase === "playing" && !isPaused) {
      // Clear any existing effects interval
      if (cameraEffectRef.current) {
        clearInterval(cameraEffectRef.current);
      }

      // Set initial effects
      setCameraEffects({
        rotationAngle: 0,
        shakeIntensity: 0,
        distortionLevel: 0.2 + Math.min((level - 9) * 0.05, 0.3), // Increases with level
      });

      // Create dynamic effects that change over time
      cameraEffectRef.current = setInterval(() => {
        setCameraEffects((prev) => {
          // Random shake based on level
          const maxShake = Math.min((level - 9) * 0.2, 1.5);
          const newShake = Math.random() * maxShake;

          // Subtle rotation that fluctuates between negative and positive
          const rotationRange = Math.min((level - 9) * 0.15, 0.8); // Max 0.8 degrees
          const newRotation = Math.random() * rotationRange * 2 - rotationRange;

          // Subtle distortion changes
          const baseDistortion = 0.2 + Math.min((level - 9) * 0.05, 0.3);
          const distortionVariation = Math.random() * 0.1 - 0.05;

          return {
            rotationAngle: newRotation,
            shakeIntensity: newShake,
            distortionLevel: baseDistortion + distortionVariation,
          };
        });
      }, 150); // Update effects several times per second

      return () => {
        if (cameraEffectRef.current) {
          clearInterval(cameraEffectRef.current);
          cameraEffectRef.current = null;
        }
      };
    } else {
      // Reset effects when not in hyperspeed
      setCameraEffects({
        rotationAngle: 0,
        shakeIntensity: 0,
        distortionLevel: 0,
      });

      if (cameraEffectRef.current) {
        clearInterval(cameraEffectRef.current);
        cameraEffectRef.current = null;
      }
    }
  }, [level, gamePhase, isPaused]);

  // Calculate XP needed for next level with the harder formula
  const xpForNextLevel = 1000 + Math.pow(level, 2) * 200;
  const currentLevelXp = xp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;

  // Get background style based on level
  const getBackgroundStyle = () => {
    // Change background with level progression
    const baseColor = "#0f0"; // Green base
    let bgColor = "black";
    let gridColor = baseColor;
    let gridOpacity = 0.1;
    let gridSize = 40;
    
    if (level > 3) {
      // Level 4+ - darker blue hue
      bgColor = "#000022";
      gridColor = "#00ffff";
      gridOpacity = 0.15;
    }
    
    if (level > 7) {
      // Level 8+ - red tones
      bgColor = "#220000";
      gridColor = "#ff0044";
      gridOpacity = 0.15;
      gridSize = 30; // Smaller grid
    }
    
    if (level > 9) {
      // Level 10+ - HYPERSPEED mode visual effect
      bgColor = "#330033"; // Deep purple base
      gridColor = "#ff00ff"; // Bright magenta grid
      gridOpacity = 0.25; // More intense grid
      gridSize = 20; // Smaller grid for faster visual effect
    }

    if (level === 12) {
      // Level 12 - Full black background with flashing effects
      bgColor = "#000000"; // Pure black
      gridColor = "#ffffff"; // White for maximum contrast
      gridOpacity = 0.4; // High opacity for stark grid
      gridSize = 25; // Medium grid size
    }

    if (level > 12 && level < 15) {
      // Level 13-14 - Disco party theme
      // Use rainbow colors that change over time
      const hue = (Date.now() / 50) % 360;
      bgColor = "#110022"; // Dark purple base
      gridColor = `hsl(${hue}, 100%, 70%)`; // Rotating hue for disco effect
      gridOpacity = 0.4;
      gridSize = 15; // Small grid for intense visual effect
    }

    if (level >= 15 && level < 20) {
      // Level 15-19 - Enhanced disco mode with more intense visual effects
      // Faster color rotation and more vibrant colors
      const hue = (Date.now() / 40) % 360; // Faster color transition
      const secondHue = (hue + 180) % 360; // Complementary color
      bgColor = "#100030"; // Dark purple/blue base
      gridColor = `hsl(${hue}, 100%, 70%)`; // Fully saturated colors
      gridOpacity = 0.45; // Higher opacity for more visibility
      gridSize = 18; // Medium-small grid for balance of visual interest
    }
    
    if (level >= 20 && level <= 90) {
      // Level 20-90 - Super disco mode with intense visuals but stable gameplay
      // Even faster color rotation and more vibrant pulsing effects
      const time = Date.now();
      const hue = (time / 30) % 360; // Very fast color transition
      const pulseAmount = (Math.sin(time / 500) + 1) / 2; // Pulsing effect
      
      bgColor = "#15002a"; // Rich deep purple base
      gridColor = `hsl(${hue}, 100%, ${60 + pulseAmount * 20}%)`; // Pulsing brightness
      gridOpacity = 0.4 + pulseAmount * 0.15; // Pulsing opacity
      gridSize = 16; // Smaller grid for more energy
    }
    
    if (level > 90) {
      // Level 91+ - Ultra high level visuals showing increasing challenge
      // Strong blue-to-purple gradient with pulsing grid
      const timeMultiplier = (level - 90) * 0.02; // Faster pulse at higher levels
      const time = Date.now();
      const hue = (time / (25 - Math.min(timeMultiplier * 10, 15))) % 360; // Extremely fast color transition
      const secondHue = (hue + 180) % 360; // Complementary color
      
      bgColor = "#210035"; // Deep purple/magenta base
      gridColor = `hsl(${hue}, 100%, 70%)`; // Brightest grid
      gridOpacity = 0.45 + Math.sin(time / 800) * 0.15; // Strong pulsing opacity
      gridSize = 14; // Very small grid for maximum visual intensity
    }

    // Create animation class based on level for grid movement effect
    let animationClass = "";
    if (level >= 10 && level < 13) {
      animationClass = "hyperspeed-grid";
    }
    
    if (level >= 13 && level < 15) {
      animationClass = "disco-grid"; // Standard disco animation
    }
    
    if (level >= 15 && level < 20) {
      animationClass = "enhanced-disco-grid"; // More intense disco effect
    }
    
    if (level >= 20 && level <= 90) {
      animationClass = "super-disco-grid"; // Super intense disco effect
    }
    
    if (level > 90) {
      animationClass = "ultra-grid"; // Special animation for ultra-high levels
    }
    
    // Generate appropriate background gradient based on level
    let backgroundImage = `radial-gradient(circle, ${bgColor} 0%, #000000 100%)`;
    
    if (level === 12) {
      backgroundImage = "none"; // Pure black for level 12
    } else if (level > 12 && level < 15) {
      // Basic disco effects
      backgroundImage = `radial-gradient(circle, ${bgColor} 0%, #000000 100%), 
                        radial-gradient(circle at 30% 50%, rgba(255, 0, 255, 0.3) 0%, transparent 50%), 
                        radial-gradient(circle at 70% 50%, rgba(0, 255, 255, 0.3) 0%, transparent 50%)`;
    } else if (level >= 15 && level < 20) {
      // Enhanced disco effects
      const hue1 = (Date.now() / 40) % 360;
      const hue2 = (hue1 + 120) % 360;
      const hue3 = (hue1 + 240) % 360;
      
      backgroundImage = `radial-gradient(circle, ${bgColor} 0%, #000000 100%),
                        radial-gradient(circle at 25% 30%, hsla(${hue1}, 100%, 60%, 0.35) 0%, transparent 60%),
                        radial-gradient(circle at 75% 30%, hsla(${hue2}, 100%, 60%, 0.35) 0%, transparent 60%),
                        radial-gradient(circle at 50% 70%, hsla(${hue3}, 100%, 60%, 0.35) 0%, transparent 60%)`;
    } else if (level >= 20 && level <= 90) {
      // Super disco effects
      const time = Date.now();
      const hue1 = (time / 30) % 360;
      const hue2 = (hue1 + 120) % 360;
      const hue3 = (hue1 + 240) % 360;
      const pulseAmount = (Math.sin(time / 500) + 1) / 2;
      
      backgroundImage = `radial-gradient(circle, ${bgColor} 0%, #000020 100%),
                        radial-gradient(circle at 20% 30%, hsla(${hue1}, 100%, 70%, ${0.3 + pulseAmount * 0.2}) 0%, transparent 50%),
                        radial-gradient(circle at 80% 30%, hsla(${hue2}, 100%, 70%, ${0.3 + pulseAmount * 0.2}) 0%, transparent 50%),
                        radial-gradient(circle at 50% 70%, hsla(${hue3}, 100%, 70%, ${0.3 + pulseAmount * 0.2}) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${0.05 + pulseAmount * 0.05}) 0%, transparent 70%)`;
    } else if (level > 90) {
      // Ultra level effects
      const time = Date.now();
      const hue1 = (time / 20) % 360;
      const hue2 = (hue1 + 120) % 360;
      const hue3 = (hue1 + 240) % 360;
      const pulseAmount = (Math.sin(time / 400) + 1) / 2;
      
      backgroundImage = `radial-gradient(circle, ${bgColor} 0%, #000030 100%),
                        radial-gradient(circle at 25% 25%, hsla(${hue1}, 100%, 70%, ${0.4 + pulseAmount * 0.2}) 0%, transparent 40%),
                        radial-gradient(circle at 75% 25%, hsla(${hue2}, 100%, 70%, ${0.4 + pulseAmount * 0.2}) 0%, transparent 40%),
                        radial-gradient(circle at 50% 65%, hsla(${hue3}, 100%, 70%, ${0.4 + pulseAmount * 0.2}) 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${0.1 + pulseAmount * 0.1}) 0%, transparent 60%)`;
    }
    
    return {
      containerClass: `game-canvas fixed inset-0 overflow-hidden transition-all duration-1000 ease-in-out`,
      containerStyle: {
        backgroundColor: bgColor,
        backgroundImage: backgroundImage,
        userSelect: "none", // Make text non-selectable
        WebkitUserSelect: "none", // Safari support
        MozUserSelect: "none", // Firefox support
        msUserSelect: "none", // IE/Edge support
      },
      gridStyle: {
        backgroundImage: `linear-gradient(${gridColor} 0.5px, transparent 0.5px), linear-gradient(90deg, ${gridColor} 0.5px, transparent 0.5px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        opacity: gridOpacity,
      },
      animationClass,
    };
  };
  
  const bgStyle = getBackgroundStyle();

  // Calculate camera transform styles for hyperspeed effects
  const getCameraEffectStyles = () => {
    if (level < 10 || isPaused) return {};

    const { rotationAngle, shakeIntensity, distortionLevel } = cameraEffects;

    // Random position offset for shake effect
    const shakeX = (Math.random() * 2 - 1) * shakeIntensity;
    const shakeY = (Math.random() * 2 - 1) * shakeIntensity;

    // Extra shake for disco mode (level 13-14)
    let shakeMultiplier = 1;
    if (level > 12 && level < 15) {
      shakeMultiplier = 2.5; // Intense shake for disco mode
    } else if (level >= 15) {
      shakeMultiplier = 1.5; // Moderate shake for level 15+ (still exciting but more playable)
    }
    
    return {
      transform: `
        rotate(${rotationAngle}deg) 
        translate(${shakeX * shakeMultiplier}px, ${shakeY * shakeMultiplier}px)
        perspective(1000px) 
        rotateX(${distortionLevel}deg)
      `,
      filter: `contrast(${1 + distortionLevel * 0.2}) saturate(${
        1 + distortionLevel * 0.3
      })`,
      transition: "filter 0.3s",
    };
  };

  // Heat Wave special event - increased chances in disco mode (level 13+)
  useEffect(() => {
    // Only check for Heat Wave in hyperspeed mode (level 10+) and when playing
    if (
      level >= 10 &&
      gamePhase === "playing" &&
      !isPaused &&
      !heatWaveActive
    ) {
      // Clear any existing check interval
      if (heatWaveCheckRef.current) {
        clearInterval(heatWaveCheckRef.current);
      }

      // Check for Heat Wave event every 15 seconds, or 10 seconds in disco mode
      let checkInterval = 15000; // Default 15 seconds
      
      // Heat Wave chance adjusted by level
      let heatWaveChance = 0.1; // 10% base chance
      
      if (level > 12 && level < 15) {
        // Disco mode (level 13-14) - more frequent and higher chance
        checkInterval = 10000; // 10 seconds
        heatWaveChance = 0.2; // 20% chance
      } else if (level >= 15 && level < 20) {
        // Level 15-19 - maintain visual excitement but slightly less frequent
        checkInterval = 12000; // 12 seconds
        heatWaveChance = 0.15; // 15% chance
      } else if (level >= 20 && level <= 90) {
        // Level 20-90 - consistent Heat Wave challenge
        checkInterval = 12000; // 12 seconds
        heatWaveChance = 0.15; // 15% chance
      } else if (level > 90) {
        // Level 91+ - slightly more frequent Heat Waves for added challenge
        checkInterval = 11000; // 11 seconds
        heatWaveChance = 0.18; // 18% chance
      }

      heatWaveCheckRef.current = setInterval(() => {
        if (Math.random() < heatWaveChance) {
          startHeatWave();
        }
      }, checkInterval);

      return () => {
        if (heatWaveCheckRef.current) {
          clearInterval(heatWaveCheckRef.current);
          heatWaveCheckRef.current = null;
        }
      };
    }
  }, [level, gamePhase, isPaused, heatWaveActive]);

  // Dev key handler for testing Heat Wave (press '1')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "1" &&
        level >= 10 &&
        gamePhase === "playing" &&
        !isPaused &&
        !heatWaveActive
      ) {
        startHeatWave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [level, gamePhase, isPaused, heatWaveActive]);

  // Heat Wave timer countdown
  useEffect(() => {
    if (heatWaveActive && heatWaveTimeRemaining > 0) {
      // Update timer every second
      const timerInterval = setInterval(() => {
        setHeatWaveTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            endHeatWave();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [heatWaveActive, heatWaveTimeRemaining]);

  // Handle game phase changes or pausing to properly manage Heat Wave
  useEffect(() => {
    // End Heat Wave if game is paused or phase changes
    if ((isPaused || gamePhase !== "playing") && heatWaveActive) {
      endHeatWave();
    }
  }, [isPaused, gamePhase]);

  // Start Heat Wave mode
  const startHeatWave = () => {
    // Already in Heat Wave mode
    if (heatWaveActive) return;
    
    // Heat wave duration based on level - shorter at high levels to prevent frustration
    let heatWaveDuration = 5 + Math.floor(Math.random() * 6); // 5-10 seconds default
    
    // Level 15+ slightly longer heat waves since the game is slower overall
    if (level >= 15 && level < 20) {
      heatWaveDuration = 6 + Math.floor(Math.random() * 5); // 6-10 seconds
    } else if (level >= 20 && level <= 90) {
      // Level 20-90 - consistent heat wave duration
      heatWaveDuration = 6 + Math.floor(Math.random() * 5); // 6-10 seconds
    } else if (level > 90) {
      // Level 91+ - slightly shorter heat waves but more intense
      heatWaveDuration = 5 + Math.floor(Math.random() * 4); // 5-8 seconds
    }
    
    setHeatWaveActive(true);
    setHeatWaveTimeRemaining(heatWaveDuration);
    
    // Clear any existing spawn intervals
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    
    // Initial burst of packets - adjusted by level
    let burstCount = 8 + Math.min(Math.floor((level - 9) * 0.5), 7); // 8-15 packets in initial burst
    
    // Level 15+ adjusted burst size
    if (level >= 15 && level < 20) {
      burstCount = Math.max(10, burstCount - 2);
    } else if (level >= 20 && level <= 90) {
      // Level 20-90 - consistent burst size
      burstCount = Math.min(12, 10 + Math.floor((level - 20) / 35)); // 10-12 packets
    } else if (level > 90) {
      // Level 91+ - gradually increasing burst size
      burstCount = 12 + Math.min(Math.floor((level - 90) / 10), 3); // 12-15 packets
    }
    
    // 20% chance to guarantee a quantum packet at the start of the heat wave
    const guaranteedQuantumPacket = Math.random() < 0.2;
    
    // Create and spawn packets for the initial burst
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        if (gamePhase === "playing" && !isPaused) {
          // For the first packet in the burst, potentially force a quantum packet
          if (i === 0 && guaranteedQuantumPacket) {
            // Create a forced quantum packet
            const quantumPacket: PacketData = {
              id: nanoid(),
              x: -100, // Start from left
              y: 100 + Math.random() * (window.innerHeight - 200), // Random vertical position
              speed: (150 + Math.random() * 40) * (level >= 15 ? 0.7 : 1), // Speed adjustment
              direction: "right",
              packetType: "encrypted",
              content: generatePacketContent(true),
              width: 160 + Math.random() * 120,
              height: 64 + Math.random() * 32,
              opacity: 1,
              health: 1,
              maxHealth: 1,
              glow: true,
              isHeatWave: true,
              isAnimated: true
            };
            
            setPackets(prev => [...prev, quantumPacket]);
          } else {
            // Generate a regular heat wave packet
            const newPacket = generatePacket(true);
            setPackets(prev => [...prev, newPacket]);
          }
        }
      }, i * 100); // Rapid fire packets
    }
    
    // Insane spawn rate during Heat Wave - adjusted by level
    let heatWaveSpawnRate = Math.max(150, 400 - level * 15); // Very fast spawn rate
    
    // Level 15-19 slightly reduced spawn rate
    if (level >= 15 && level < 20) {
      heatWaveSpawnRate = Math.max(200, heatWaveSpawnRate + 50);
    } else if (level >= 20 && level <= 90) {
      // Level 20-90 - consistent spawn rate
      heatWaveSpawnRate = 230; // Fixed spawn rate
    } else if (level > 90) {
      // Level 91+ - gradually increasing spawn rate
      heatWaveSpawnRate = Math.max(180, 230 - (level - 90) * 2);
    }
    
    // Super fast packet spawn during Heat Wave
    spawnIntervalRef.current = setInterval(() => {
      if (gamePhase === "playing" && !isPaused) {
        // 50% chance to spawn multiple packets at once
        const packetsToSpawn =
          Math.random() < 0.5 ? 1 : 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < packetsToSpawn; i++) {
          setTimeout(() => {
            const newPacket = generatePacket(true); // Generate Heat Wave packet
            setPackets((prev) => [...prev, newPacket]);
          }, i * 50);
        }
      }
    }, heatWaveSpawnRate);
    
    // Play warning sound for Heat Wave
    playHit();
    setTimeout(() => playHit(), 200);
    setTimeout(() => playHit(), 400);
  };

  // End Heat Wave mode and return to normal packet spawning
  const endHeatWave = () => {
    setHeatWaveActive(false);
    setHeatWaveTimeRemaining(0);

    // Clear Heat Wave spawn interval
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    // Restart normal spawn interval
    if (gamePhase === "playing" && !isPaused) {
      // Setup normal spawn interval with special scaling for level 10+
      let spawnRate;
      let burstMode = false;

      if (level < 10) {
        // Normal spawn rate scaling for levels 1-9
        const levelSpawnBonus = Math.min(level * 8, 350);
        spawnRate = Math.max(900 - level * 40 - levelSpawnBonus, 250);
      } else {
        // HYPERSPEED spawn rate after level 10 - but with burst cooldown pattern
        const hyperLevelFactor = 15 + Math.pow(level - 9, 1.2) * 3;
        const levelSpawnBonus = Math.min(hyperLevelFactor * 15, 650);

        // Base spawn rate - still fast but not constant barrage
        spawnRate = Math.max(500 - (level - 9) * 40 - levelSpawnBonus, 200);

        // Enable burst mode for level 10+
        burstMode = true;
      }

      // For level 10+, use burst spawn pattern instead of continuous
      if (burstMode) {
        let burstActive = false;
        const burstSize = 2 + Math.min(Math.floor((level - 9) * 0.5), 2); // 2-4 packets per burst
        const burstDuration = Math.max(500, 1200 - (level - 9) * 80); // Duration of burst (ms)
        const cooldownDuration = Math.max(1000, 2500 - (level - 9) * 100); // Cooldown between bursts (ms)

        // Burst spawning interval
        spawnIntervalRef.current = setInterval(() => {
          if (!burstActive) {
            // Start a burst
            burstActive = true;

            // Spawn burst of packets
            for (let i = 0; i < burstSize; i++) {
              setTimeout(() => {
                if (gamePhase === "playing" && !isPaused) {
                  const newPacket = generatePacket();
                  setPackets((prev) => [...prev, newPacket]);
                }
              }, i * (burstDuration / burstSize));
            }

            // End burst and start cooldown
            setTimeout(() => {
              burstActive = false;
            }, burstDuration);
          }
        }, burstDuration + cooldownDuration);
      } else {
        // Normal continuous spawning for levels 1-9
        spawnIntervalRef.current = setInterval(() => {
          const newPacket = generatePacket();
          setPackets((prev) => [...prev, newPacket]);
        }, spawnRate);
      }
    }
  };

  // Handle Power Mode timer countdown
  useEffect(() => {
    if (powerModeActive && powerModeTimeRemaining > 0) {
      // Update timer every second
      const timerInterval = setInterval(() => {
        setPowerModeTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            endPowerMode();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timerInterval);
    }
  }, [powerModeActive, powerModeTimeRemaining]);
  
  // Handle Firewall Shield timer countdown
  useEffect(() => {
    if (firewallShieldActive && firewallTimeRemaining > 0) {
      // Update timer every second
      const timerInterval = setInterval(() => {
        setFirewallTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            endFirewallShield();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timerInterval);
    }
  }, [firewallShieldActive, firewallTimeRemaining]);
  
  // Handle game phase changes or pausing to properly manage Power Mode
  useEffect(() => {
    // End Power Mode if game is paused or phase changes
    if ((isPaused || gamePhase !== "playing") && (powerModeActive || firewallShieldActive)) {
      endPowerMode();
      endFirewallShield();
    }
  }, [isPaused, gamePhase]);
  
  // Process Firewall Shield effect
  useEffect(() => {
    if (firewallShieldActive && gamePhase === "playing" && !isPaused) {
      // Find all non-benign packets and destroy them
      setPackets(prev => {
        const newPackets = [...prev];
        const destroyedPackets: PacketData[] = [];
        
        // Filter out all dangerous packets
        const remainingPackets = newPackets.filter(packet => {
          if (packet.packetType !== "benign" && packet.packetType !== "encrypted") {
            destroyedPackets.push(packet);
            return false;
          }
          return true;
        });
        
        // Create particle effects and award XP for destroyed packets
        destroyedPackets.forEach(packet => {
          // Create visual effect at packet position
          const particleColor = getParticleColor(packet.packetType);
          setHitParticles(prevParticles => [
            ...prevParticles,
            {
              id: nanoid(),
              x: packet.x,
              y: packet.y,
              color: particleColor,
              timestamp: Date.now(),
            },
          ]);
          
          // Award XP based on packet type
          let xpAmount = 0;
          switch (packet.packetType) {
            case "databreach":
              xpAmount = 30 * packet.maxHealth;
              break;
            case "corrupted":
              xpAmount = 15 * packet.maxHealth;
              break;
            case "malicious":
              xpAmount = 8 * packet.maxHealth;
              break;
          }
          
          if (xpAmount > 0) {
            registerHit(true, xpAmount);
          }
        });
        
        return remainingPackets;
      });
    }
  }, [firewallShieldActive, packets, gamePhase, isPaused]);
  
  // Start Power Mode
  const startPowerMode = () => {
    // Already in Power Mode
    if (powerModeActive) return;
    
    setPowerModeActive(true);
    setPowerModeTimeRemaining(5); // 5 seconds duration
    
    // Start Firewall Shield for 10 seconds
    startFirewallShield();
    
    // Slow down all packets (simulate time slow)
    setPackets(prev => prev.map(packet => ({
      ...packet,
      speed: packet.speed * 0.5, // Half speed for time slow effect
    })));
    
    // Play power up sound three times
    playSuccess();
    setTimeout(() => playSuccess(), 200);
    setTimeout(() => playSuccess(), 400);
  };
  
  // End Power Mode
  const endPowerMode = () => {
    setPowerModeActive(false);
    setPowerModeTimeRemaining(0);
    
    // Reset packet speeds to normal
    setPackets(prev => prev.map(packet => {
      // Original speed was halved, so double it to restore
      return {
        ...packet,
        speed: packet.speed * 2, 
      };
    }));
    
    // Clear timer
    if (powerModeTimerRef.current) {
      clearInterval(powerModeTimerRef.current);
      powerModeTimerRef.current = null;
    }
  };
  
  // Start Firewall Shield
  const startFirewallShield = () => {
    // Already has shield active
    if (firewallShieldActive) {
      // Just reset the timer
      setFirewallTimeRemaining(10);
      return;
    }
    
    setFirewallShieldActive(true);
    setFirewallTimeRemaining(10); // 10 seconds duration
  };
  
  // End Firewall Shield
  const endFirewallShield = () => {
    setFirewallShieldActive(false);
    setFirewallTimeRemaining(0);
    
    // Clear timer
    if (firewallTimerRef.current) {
      clearInterval(firewallTimerRef.current);
      firewallTimerRef.current = null;
    }
  };

  // Show scope tip at level 5
  useEffect(() => {
    if (level >= 5 && !scopeTipShownRef.current && gamePhase === 'playing') {
      setShowScopeTip(true);
      scopeTipShownRef.current = true;
      
      // Hide tip after 10 seconds
      const tipTimer = setTimeout(() => {
        setShowScopeTip(false);
      }, 10000);
      
      return () => clearTimeout(tipTimer);
    }
  }, [level, gamePhase]);
  
  return (
    <div 
      ref={containerRef}
      className={`${bgStyle.containerClass} ${
        isPaused ? "filter blur-sm transition-all duration-200" : ""
      }`}
      style={{
        backgroundColor: bgStyle.containerStyle.backgroundColor,
        backgroundImage: bgStyle.containerStyle.backgroundImage,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        ...getCameraEffectStyles(),
      }}
    >
      {/* Grid background for cyberpunk effect */}
      <div
        className={`grid-bg absolute inset-0 ${bgStyle.animationClass} ${
          heatWaveActive ? "heat-wave-grid" : ""
        }`}
        style={{
          ...bgStyle.gridStyle,
          ...(heatWaveActive
            ? {
                backgroundImage: `linear-gradient(#ff3300 0.5px, transparent 0.5px), linear-gradient(90deg, #ff3300 0.5px, transparent 0.5px)`,
                opacity: 0.3,
              }
            : {}),
        }}
      />

      {/* Heat Wave Overlay */}
      {heatWaveActive && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Red pulsing overlay */}
          <div className="absolute inset-0 bg-red-900 bg-opacity-20 animate-pulse" />

          {/* Heat distortion effect */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cfilter id='heat' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='2' seed='5'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='10'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' filter='url(%23heat)'/%3E%3C/svg%3E\")",
              opacity: 0.2,
              mixBlendMode: "overlay",
              animation: "heatDistort 2s infinite alternate",
            }}
          />

          {/* Fire particles at the bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{
              background:
                "linear-gradient(to top, rgba(255,100,0,0.2) 0%, rgba(255,120,20,0.1) 40%, transparent 100%)",
            }}
          />

          {/* Heat Wave timer */}
          <div className="absolute top-28 right-4 bg-red-900 bg-opacity-80 border-2 border-red-500 text-red-300 px-4 py-2 rounded-lg font-mono text-lg z-30 flex flex-col items-center">
            <span className="font-bold text-red-100 animate-pulse mb-1">HEAT WAVE</span>
            <div className="w-full bg-red-950 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(heatWaveTimeRemaining / heatWaveTimeRemaining) * 100}%` }}
              />
            </div>
            <span className="text-sm mt-1">{heatWaveTimeRemaining}s</span>
          </div>

          {/* Warning text */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-6xl opacity-30 pointer-events-none select-none"
            style={{ textShadow: "0 0 10px #ff0000" }}
          >
            DANGER
          </div>
        </div>
      )}

      {/* Chromatic aberration effect for hyperspeed mode */}
      {level >= 10 && gamePhase === "playing" && !isPaused && (
        <>
          {/* Red channel offset */}
          <div
            className="absolute inset-0 z-1 mix-blend-screen pointer-events-none"
            style={{
              backgroundColor: "rgba(255,0,0,0.5)",
              transform: `translateX(${cameraEffects.distortionLevel * 2}px)`,
              opacity: 0.3,
              filter: "blur(1px)",
            }}
          />

          {/* Blue channel offset */}
          <div
            className="absolute inset-0 z-1 mix-blend-screen pointer-events-none"
            style={{
              backgroundColor: "rgba(0,0,255,0.5)",
              transform: `translateX(-${cameraEffects.distortionLevel * 2}px)`,
              opacity: 0.3,
              filter: "blur(1px)",
            }}
          />

          {/* Scanline effect */}
          <div
            className="absolute inset-0 z-1 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)",
              backgroundSize: `100% ${
                4 + Math.floor(cameraEffects.distortionLevel * 2)
              }px`,
              opacity: 0.3 + cameraEffects.distortionLevel * 0.2,
            }}
          />

          {/* Motion blur overlay */}
          <div
            className="absolute inset-0 z-1 pointer-events-none"
            style={{
              backdropFilter: `blur(${cameraEffects.distortionLevel * 1.5}px)`,
              opacity: 0.15,
            }}
          />
        </>
      )}

      {/* HYPERSPEED indicator for level 10+ */}
      {level >= 10 && gamePhase === "playing" && !isPaused && (
        <div
          className={`absolute top-20 right-4 bg-purple-900 ${
            heatWaveActive ? "bg-red-900" : "bg-purple-900"
          } bg-opacity-70 border-2 ${
            heatWaveActive ? "border-red-500" : "border-purple-500"
          } ${
            heatWaveActive ? "text-red-300" : "text-purple-300"
          } px-3 py-1 rounded-full font-mono text-sm animate-pulse z-20`}
        >
          <span className="font-bold">
            {heatWaveActive ? "HEAT WAVE ACTIVE" : "HYPERSPEED MODE"}
          </span>
        </div>
      )}

      {/* Score and XP UI elements (moved from GameUI) */}
      {gamePhase === "playing" && !isPaused && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          {/* Score display */}
          <div className="score-display flex items-center text-xl mb-2">
            <div className="w-5 h-5 mr-2 text-cyan-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <span className="text-cyan-400 font-bold">{score}</span>
            <span className="ml-3 text-gray-400">SCORE</span>
          </div>

          {/* XP and Level */}
          <div className="xp-level-container mb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1 text-yellow-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span className="text-yellow-400 text-sm font-bold">
                  LVL {level}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {Math.round(currentLevelXp)}/{Math.round(xpForNextLevel)} XP
              </span>
            </div>
            <div className="h-1 w-40 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Pause reminder */}
          <div className="text-xs text-gray-400">
            Press <span className="text-white">ESC</span> to Pause
          </div>
        </div>
      )}
      
      {/* Screen dimming based on data breach packet proximity */}
      {dangerProximity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-5"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${dangerProximity * 0.6})`,
            transition: "background-color 300ms ease",
          }}
        />
      )}
      
      {/* Full screen danger glow when data breach packet approaches edge */}
      {screenDangerGlow && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 animate-pulse"
          style={{
            backgroundColor: `rgba(255, 0, 0, ${0.15 + dangerProximity * 0.2})`,
            boxShadow: `inset 0 0 ${50 + dangerProximity * 50}px ${
              20 + dangerProximity * 30
            }px rgba(255, 0, 0, ${0.3 + dangerProximity * 0.3})`,
            border: `${
              8 + Math.floor(dangerProximity * 4)
            }px solid rgba(255, 0, 0, ${0.4 + dangerProximity * 0.4})`,
            transition: "all 300ms ease",
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold animate-pulse text-center"
            style={{
              fontSize: `${2 + dangerProximity * 1.5}rem`,
              textShadow: `0 0 ${5 + dangerProximity * 15}px rgba(255, 0, 0, ${
                0.7 + dangerProximity * 0.3
              })`,
            }}
          >
            DATA BREACH IMMINENT!
            {dangerProximity > 0.8 && (
              <div className="mt-4 text-xl">SYSTEM FAILURE IMPENDING</div>
            )}
          </div>
        </div>
      )}
      
      {/* Display missed malicious packets counter */}
      {gamePhase === "playing" && (
        <div className="absolute top-4 right-4 bg-red-900 bg-opacity-50 border border-red-500 text-red-300 px-3 py-1 rounded font-mono text-sm">
          <span>THREATS MISSED: {missedMaliciousCount}/10</span>
        </div>
      )}
      
      {/* Render all packets */}
      {packets.map((packet) => (
        <Packet
          key={packet.id}
          id={packet.id}
          x={packet.x}
          y={packet.y}
          speed={packet.speed}
          direction={packet.direction}
          packetType={packet.packetType}
          content={packet.content}
          width={packet.width}
          height={packet.height}
          opacity={packet.opacity}
          health={packet.health}
          maxHealth={packet.maxHealth}
          glow={packet.glow}
          onExit={handlePacketExit}
          onHit={handlePacketHit}
        />
      ))}
      
      {/* Particle effects for hits */}
      {hitParticles.map((particle) => (
        <ParticleSystem
          key={particle.id}
          x={particle.x}
          y={particle.y}
          color={particle.color}
        />
      ))}
      
      {/* Critical hit effects */}
      {criticalHits.map((crit) => (
        <div 
          key={crit.id}
          className={`absolute pointer-events-none font-bold ${
            crit.level === 3 
              ? "text-purple-300 text-xl animate-bounce" 
              : "text-yellow-300 animate-pulse"
          }`}
          style={{
            left: `${crit.x}px`,
            top: `${crit.y}px`,
            backgroundColor: crit.level === 3 
              ? "rgba(75, 0, 130, 0.7)" 
              : "rgba(0, 0, 0, 0.7)",
            border: crit.level === 3 
              ? "2px solid rgba(200, 100, 255, 0.8)" 
              : "1px solid rgba(255, 255, 0, 0.5)",
            borderRadius: "4px",
            padding: "2px 6px",
            textShadow: crit.level === 3 
              ? "0 0 5px #f0f, 0 0 10px #f0f, 0 0 15px #f0f" 
              : "0 0 5px #ff0, 0 0 10px #ff0",
            zIndex: 100,
            transform: "translate(-50%, -50%)",
          }}
        >
          {crit.level === 3 
            ? "QUANTUM POWER MODE!" 
            : crit.level === 1 
              ? "CRITICAL x2!" 
              : "HIT x1"
          }
        </div>
      ))}
      
      {/* Tactical Scope (only visible when active and level >= 5) */}
      {scopeActive && level >= 5 && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${scopePosition.x}px`,
            top: `${scopePosition.y}px`,
            width: "300px",
            height: "300px",
            transform: "translate(-50%, -50%)",
            transition: "left 0.05s, top 0.05s",
          }}
        >
          {/* Scope visual effect */}
          <div
            className="absolute w-full h-full rounded-full overflow-hidden border-8 border-black"
            style={{
              boxShadow:
                "inset 0 0 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Vignette effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,30,60,0.3) 0%, rgba(0,0,0,0.8) 100%)",
                backdropFilter: "brightness(1.2) contrast(1.2)",
                pointerEvents: "none",
              }}
            />

            {/* Scope overlay with crosshairs */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Crosshairs */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-70" />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500 opacity-70" />

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-red-500 transform -translate-x-1/2 -translate-y-1/2" />

              {/* Range indicators */}
              <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-red-500 opacity-50 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-red-500 opacity-30 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

              {/* Enhanced vignette effect */}
              <div
                className="absolute inset-0 rounded-full opacity-70"
                style={{
                  background:
                    "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.9) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Scan line effect */}
              <div
                className="absolute inset-0 rounded-full opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 2px)",
                  backgroundSize: "100% 2px",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Outer scope frame */}
          <div className="absolute w-full h-full rounded-full border-4 border-gray-800 pointer-events-none">
            <div className="absolute top-0 left-1/2 h-8 w-16 bg-gray-800 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="text-red-500 text-xs font-mono">TACTICAL</span>
            </div>
            <div className="absolute bottom-0 left-1/2 h-8 w-16 bg-gray-800 transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
              <span className="text-cyan-500 text-xs font-mono">SN1P3R</span>
            </div>
            <div className="absolute right-0 top-1/2 h-8 w-8 bg-gray-800 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full">
              <span className="text-yellow-500 text-xs font-mono">TAC</span>
            </div>
          </div>
        </div>
      )}

      {/* Firewall Shield effect */}
      {firewallShieldActive && (
        <div className="absolute inset-0 z-15 pointer-events-none">
          {/* Shield grid pattern */}
          <div className="absolute inset-0" 
            style={{
              backgroundImage: `linear-gradient(rgba(100, 200, 255, 0.3) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(100, 200, 255, 0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.5,
              boxShadow: 'inset 0 0 50px rgba(100, 200, 255, 0.5)',
              animation: 'pulse 2s infinite',
            }}
          />
          
          {/* Shield border */}
          <div className="absolute inset-0 border-8 border-cyan-500 opacity-30 animate-pulse" />
          
          {/* Shield timer */}
          <div className="absolute top-36 right-4 bg-cyan-900 bg-opacity-80 border-2 border-cyan-500 text-cyan-300 px-4 py-2 rounded-lg font-mono text-lg z-30 flex flex-col items-center">
            <span className="font-bold text-cyan-100 animate-pulse mb-1">FIREWALL SHIELD</span>
            <div className="w-full bg-cyan-950 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${(firewallTimeRemaining / 10) * 100}%` }}
              />
            </div>
            <span className="text-sm mt-1">{firewallTimeRemaining}s</span>
          </div>
        </div>
      )}

      {/* Power Mode effect */}
      {powerModeActive && (
        <div className="absolute inset-0 z-15 pointer-events-none">
          {/* Power mode visual effect */}
          <div className="absolute inset-0 animate-pulse"
            style={{
              boxShadow: 'inset 0 0 100px rgba(255, 255, 0, 0.3), inset 0 0 50px rgba(255, 150, 0, 0.3)',
              background: 'radial-gradient(circle, rgba(255,255,0,0.05) 0%, transparent 70%)',
            }}
          />
          
          {/* Time slow indicator */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 255, 0, 0.1), rgba(255, 255, 0, 0.1) 10px, transparent 10px, transparent 20px)`,
            }}
          />
          
          {/* Power mode timer */}
          <div className="absolute top-44 right-4 bg-yellow-900 bg-opacity-80 border-2 border-yellow-500 text-yellow-300 px-4 py-2 rounded-lg font-mono text-lg z-30 flex flex-col items-center">
            <span className="font-bold text-yellow-100 animate-pulse mb-1">POWER MODE</span>
            <div className="w-full bg-yellow-950 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${(powerModeTimeRemaining / 5) * 100}%` }}
              />
            </div>
            <span className="text-sm mt-1">{powerModeTimeRemaining}s</span>
          </div>
          
          {/* Floating indicators for active bonuses */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <div className="bg-black bg-opacity-70 border border-yellow-500 text-yellow-300 px-3 py-1 rounded-full text-sm">
              ∞ AMMO
            </div>
            <div className="bg-black bg-opacity-70 border border-cyan-500 text-cyan-300 px-3 py-1 rounded-full text-sm">
              SLOW TIME
            </div>
            <div className="bg-black bg-opacity-70 border border-green-500 text-green-300 px-3 py-1 rounded-full text-sm">
              2x XP
            </div>
          </div>
        </div>
      )}

      {/* Tactical Scope Tip */}
      {level >= 5 && (
        <div className={`fixed bottom-4 left-4 bg-cyan-900 bg-opacity-80 border-2 border-cyan-500 text-cyan-100 px-4 py-2 rounded-lg font-mono text-sm z-30 flex items-center ${showScopeTip ? 'animate-bounce' : ''}`}>
          <svg className="w-5 h-5 mr-2 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="8" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <line x1="12" y1="2" x2="12" y2="4" strokeWidth="2" />
            <line x1="12" y1="20" x2="12" y2="22" strokeWidth="2" />
            <line x1="2" y1="12" x2="4" y2="12" strokeWidth="2" />
            <line x1="20" y1="12" x2="22" y2="12" strokeWidth="2" />
          </svg>
          <div>
            <span className="font-bold">TACTICAL SCOPE UNLOCKED!</span>
            <div className="text-xs opacity-80">Right-click anywhere to activate</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
