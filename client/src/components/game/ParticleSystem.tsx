import { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  x: number;
  y: number;
  color: string;
}

// Particle system for visual feedback when shooting packets
const ParticleSystem = ({ x, y, color }: ParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 200;
    canvas.height = 200;
    
    // Particle parameters
    const particleCount = 30;
    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      life: number;
      maxLife: number;
      angle: number;
    }[] = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 5 + 1,
        speed: Math.random() * 3 + 1,
        life: 0,
        maxLife: Math.random() * 20 + 10,
        angle: Math.random() * Math.PI * 2
      });
    }
    
    // Animation variables
    let animationFrameId: number;
    let finished = false;
    
    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      let allDead = true;
      
      for (const p of particles) {
        // Update position
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.life++;
        
        // Calculate opacity based on life
        const opacity = 1 - p.life / p.maxLife;
        
        // If particle is still alive, draw it
        if (p.life < p.maxLife) {
          allDead = false;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }
      }
      
      // Stop animation if all particles are dead
      if (allDead && !finished) {
        finished = true;
        return;
      }
      
      // Continue animation
      if (!finished) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [color]);
  
  return (
    <canvas
      ref={canvasRef}
      className="particle-system absolute pointer-events-none"
      style={{
        left: `${x - 100}px`,
        top: `${y - 100}px`,
        width: '200px',
        height: '200px',
        zIndex: 100
      }}
    />
  );
};

export default ParticleSystem;
