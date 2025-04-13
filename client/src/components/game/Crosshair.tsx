import { useEffect, useState } from 'react';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';

const Crosshair = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);
  const { shoot } = usePacketSniper();
  
  useEffect(() => {
    // Handle mouse movement to update crosshair position
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsMouseActive(true);
    };
    
    // Handle mouse clicking for shooting
    const handleMouseClick = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        shoot(position.x, position.y);
      }
    };
    
    // Handle keyboard (spacebar) for shooting
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        shoot(position.x, position.y);
        e.preventDefault(); // Prevent page scrolling
      }
    };
    
    // Hide the default cursor and show our custom crosshair
    document.body.style.cursor = 'none';
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('keydown', handleKeyDown);
    
    // Set a timeout to hide the crosshair if mouse is inactive
    const inactivityTimer = setTimeout(() => {
      if (isMouseActive) {
        setIsMouseActive(false);
      }
    }, 3000);
    
    // Cleanup function
    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(inactivityTimer);
    };
  }, [position, isMouseActive, shoot]);
  
  return (
    <div 
      className={`crosshair ${isMouseActive ? 'active' : 'inactive'}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '32px',
        height: '32px',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="15" stroke="#0CFF0C" strokeWidth="1" opacity="0.5" />
        <circle cx="16" cy="16" r="2" fill="#0CFF0C" />
        <line x1="16" y1="2" x2="16" y2="14" stroke="#0CFF0C" strokeWidth="1" />
        <line x1="16" y1="18" x2="16" y2="30" stroke="#0CFF0C" strokeWidth="1" />
        <line x1="2" y1="16" x2="14" y2="16" stroke="#0CFF0C" strokeWidth="1" />
        <line x1="18" y1="16" x2="30" y2="16" stroke="#0CFF0C" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default Crosshair;
