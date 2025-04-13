import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type PacketType = 'benign' | 'malicious' | 'corrupted' | 'databreach' | 'encrypted';

interface PacketProps {
  id: string;
  x: number;
  y: number;
  speed: number;
  direction: 'left' | 'right';
  packetType: PacketType;
  content: string;
  width: number;
  height: number;
  opacity: number;
  health: number;
  maxHealth: number;
  glow?: boolean;
  onExit: (id: string, packetType: PacketType) => void;
  onHit: (id: string, packetType: PacketType, x: number, y: number) => void;
}

const Packet = ({
  id,
  x,
  y,
  speed,
  direction,
  packetType,
  content,
  width,
  height,
  opacity,
  health,
  maxHealth,
  glow,
  onExit,
  onHit
}: PacketProps) => {
  const [position, setPosition] = useState({ x, y });
  const [currentHealth, setCurrentHealth] = useState(health);
  const animationRef = useRef<number | null>(null);
  const isExiting = useRef(false);
  
  // Binary rain and quantum effects for encrypted packets
  const [binaryRain, setBinaryRain] = useState<string[]>([]);
  const [quantumPulse, setQuantumPulse] = useState(0);
  
  // Update health if it changes from parent
  useEffect(() => {
    setCurrentHealth(health);
  }, [health]);

  const screenWidth = window.innerWidth;
  const isInDangerZone = packetType === 'databreach' && position.x > screenWidth * 0.7;
  
  // Data breach packets should always have glow
  const shouldGlow = glow || packetType === 'databreach';

  // Animation loop for packet movement
  useEffect(() => {
    const animate = () => {
      setPosition(prevPosition => {
        let newX;
        if (direction === 'right') {
          newX = prevPosition.x + speed / 60; // For 60 FPS
        } else {
          newX = prevPosition.x - speed / 60;
        }

        // Check if packet has exited the screen
        if ((direction === 'right' && newX > screenWidth + width / 2) || 
            (direction === 'left' && newX < -width / 2)) {
          if (!isExiting.current) {
            isExiting.current = true;
            onExit(id, packetType);
          }
        }

        return { ...prevPosition, x: newX };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [id, direction, speed, width, onExit, packetType]);
  
  // Generate binary rain for encrypted packets
  useEffect(() => {
    if (packetType === "encrypted") {
      // Generate random binary strings
      const generateBinary = () => {
        const binaries = [];
        for (let i = 0; i < 5; i++) {
          let binary = "";
          for (let j = 0; j < 8; j++) {
            binary += Math.round(Math.random()).toString();
          }
          binaries.push(binary);
        }
        return binaries;
      };
      
      // Initial binary rain
      setBinaryRain(generateBinary());
      
      // Change binary rain every 200ms
      const interval = setInterval(() => {
        setBinaryRain(generateBinary());
      }, 200);
      
      // Pulse effect
      const pulseInterval = setInterval(() => {
        setQuantumPulse(prev => (prev + 1) % 100);
      }, 50);
      
      return () => {
        clearInterval(interval);
        clearInterval(pulseInterval);
      };
    }
  }, [packetType]);

  // Function to handle when packet is hit
  const handleHit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHit(id, packetType, position.x, position.y);
  };

  const healthPercentage = (currentHealth / maxHealth) * 100;

  // Determine the styles based on packet type
  const getStyles = () => {
    switch (packetType) {
      case 'malicious':
        return {
          containerClass: 'bg-red-900 border-red-500 text-white',
          headerClass: 'border-b border-red-700 text-red-300',
          healthBarColor: 'bg-red-500'
        };
      case 'corrupted':
        return {
          containerClass: 'bg-yellow-900 border-yellow-500 text-white',
          headerClass: 'border-b border-yellow-700 text-yellow-300',
          healthBarColor: 'bg-yellow-500'
        };
      case 'databreach':
        return {
          containerClass: 'bg-rose-900 border-rose-500 text-white',
          headerClass: 'border-b border-rose-700 text-rose-300',
          healthBarColor: 'bg-rose-500'
        };
      case 'encrypted':
        return {
          containerClass: 'border-purple-500 text-white',
          headerClass: 'border-b border-purple-700 text-purple-300',
          healthBarColor: `bg-purple-500`
        };
      default:
        return {
          containerClass: 'bg-green-900 border-green-500 text-green-300',
          headerClass: 'border-b border-green-700 text-green-500',
          healthBarColor: 'bg-green-500'
        };
    }
  };

  const styles = getStyles();
  
  // Special glowing effect for data breach and encrypted packets
  const glowStyle = shouldGlow ? {
    boxShadow: packetType === 'encrypted' 
      ? `0 0 ${10 + Math.sin(quantumPulse * 0.1) * 5}px rgba(170, 0, 255, ${0.5 + (Math.sin(quantumPulse * 0.1) + 1) / 4})`
      : isInDangerZone 
        ? '0 0 15px 5px rgba(255, 0, 0, 0.7), 0 0 30px 10px rgba(255, 0, 0, 0.5), 0 0 45px 15px rgba(255, 0, 0, 0.3)'
        : '0 0 10px rgba(255, 0, 0, 0.7)'
  } : {};
  
  // Get packet background color based on type
  const getPacketColor = () => {
    switch (packetType) {
      case "malicious":
        return "linear-gradient(to bottom, #990000, #660000)";
      case "corrupted":
        return "linear-gradient(to bottom, #996600, #664400)";
      case "databreach":
        return "linear-gradient(to bottom, #990033, #660022)";
      case "encrypted":
        return `linear-gradient(45deg, #4a0080, rgb(187, 0, 255, 0.7), #4a0080)`;
      default:
        return "linear-gradient(to bottom, #006600, #004400)";
    }
  };
  
  // Get packet border style
  const getBorderStyle = () => {
    if (packetType === "encrypted") {
      return {
        borderColor: `rgba(255, 255, 255, ${0.5 + (Math.sin(quantumPulse * 0.1) + 1) / 4})`,
        borderWidth: '2px'
      };
    }
    return {};
  };
  
  // Prepare packet content based on type
  const getPacketContent = () => {
    if (packetType === "encrypted") {
      return (
        <div className="flex flex-col items-center justify-center h-full relative p-1">
          {/* Diamond/Quantum symbol */}
          <div className="text-2xl mb-1 animate-pulse" style={{color: `hsl(${(quantumPulse * 3.6) % 360}, 100%, 75%)`}}>
            💎
          </div>
          
          {/* Special quantum encrypted text */}
          <div className="text-center font-bold tracking-wider text-xs">
            QUANTUM ENCRYPTED
          </div>
          
          {/* Binary rain effect in background */}
          <div className="absolute inset-0 overflow-hidden opacity-25">
            {binaryRain.map((binary, index) => (
              <div 
                key={`${id}-binary-${index}`} 
                className="absolute text-xs font-mono"
                style={{
                  left: `${(index / 5) * 100}%`,
                  top: `${(quantumPulse + index * 20) % 100}%`,
                  color: `hsl(${(quantumPulse * 3.6 + index * 30) % 360}, 100%, 75%)`
                }}
              >
                {binary}
              </div>
            ))}
          </div>
          
          {/* Glowing light effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(170, 0, 255, ${0.3 + (Math.sin(quantumPulse * 0.1) + 1) / 6}) 0%, transparent 70%)`,
              filter: `blur(${2 + Math.sin(quantumPulse * 0.1) * 2}px)`
            }}
          />
        </div>
      );
    }
    
    return (
      <>
        <div className="packet-header flex justify-between items-center text-[0.6rem] mb-1">
          <span>{packetType.toUpperCase()}</span>
          {currentHealth > 1 && (
            <span>
              HP: {currentHealth}/{maxHealth}
            </span>
          )}
        </div>
        <div className="packet-content whitespace-nowrap">
          {content}
        </div>
      </>
    );
  };

  return (
    <div
      className={cn(
        "packet fixed font-mono text-xs border border-opacity-60 shadow-lg rounded-sm",
        styles.containerClass,
        isInDangerZone ? "animate-pulse" : "",
        packetType === "encrypted" ? "encrypted-packet" : ""
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: 'translate(-50%, -50%)',
        opacity,
        background: getPacketColor(),
        animation: packetType === "encrypted" ? `encryptedPulse 2s infinite alternate` : undefined,
        overflow: 'hidden',
        ...glowStyle,
        ...getBorderStyle(),
        zIndex: isInDangerZone ? 50 : 10
      }}
      onClick={handleHit}
    >
      {getPacketContent()}
      
      {/* Health bar for packets with multiple hit points */}
      {packetType !== 'benign' && maxHealth > 1 && (
        <div className="health-bar mt-1 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${packetType === "encrypted" 
              ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" 
              : styles.healthBarColor}`}
            style={{ 
              width: `${healthPercentage}%`,
              ...(packetType === "encrypted" ? {
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear'
              } : {})
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Packet;
