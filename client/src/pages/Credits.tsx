import { useState, useEffect, useRef, WheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Music, VolumeX, SkipForward } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { unlockAudio } from '@/lib/sounds';
import { toast } from 'sonner';

const Credits = () => {
  const navigate = useNavigate();
  const [showBackButton, setShowBackButton] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // Default scroll speed
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Easter egg messages
  const easterEggs = [
    "Pixels were harmed in the making of this game",
    "Try pressing Alt+F4 for invincibility",
    "Bonus level: Complete your taxes while playing",
    "Did you know? This game is 100% bug-free. The bugs are features.",
    "Packets don't actually look like this... or do they?",
    "60% of the time, it works every time",
    "That one bug took 3 days to fix. It was a typo.",
    "Pro tip: you can't actually shoot real network traffic",
    "Coffee consumption during development: ∞",
    "No AI was hurt during development... just our sanity",
    "The grid is a lie",
    "First rule of PacketSniper: You don't talk about the code quality",
    "Soundtrack: Keyboard smashing in E minor",
  ];

  useEffect(() => {
    // Set up ambient audio
    audioRef.current = new Audio('/sounds/credits.mp3');
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.preload = 'auto';
      
      // Try to play the audio immediately - modern browsers may block this
      audioRef.current.play()
        .then(() => {
          console.log("Credits music started successfully");
          setIsAudioPlaying(true);
        })
        .catch(e => {
          console.log("Auto-play prevented by browser:", e);
          // Show a toast notification suggesting to enable audio
          setTimeout(() => {
            toast.info(
              "Enable audio for the full credits experience!", 
              { 
                duration: 5000,
                icon: <Music size={16} />
              }
            );
          }, 1500);
        });
    }

    // Show back button after a delay
    const timer = setTimeout(() => {
      setShowBackButton(true);
    }, 45000); // Show after 45 seconds
    
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      // Play audio with better error handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Credits music started by user");
          })
          .catch(e => {
            console.error("Audio play failed:", e);
            // Try again after user interaction
            const unlockAudio = () => {
              if (audioRef.current) {
                audioRef.current.play()
                  .then(() => {
                    console.log("Credits music started after unlock");
                    document.removeEventListener('click', unlockAudio);
                  })
                  .catch(e => console.error("Still couldn't play audio:", e));
              }
            };
            document.addEventListener('click', unlockAudio, { once: true });
          });
      }
    }
    
    setIsAudioPlaying(!isAudioPlaying);
  };
  
  const handleBackToHome = () => {
    navigate('/');
  };

  // Handle mouse wheel scrolling to control credits speed
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      // Scrolling down - speed up credits
      setScrollSpeed(prev => Math.min(prev + 0.5, 3)); // Cap at 3x speed
    } else if (e.deltaY < 0) {
      // Scrolling up - slow down credits
      setScrollSpeed(prev => Math.max(prev - 0.5, 0.5)); // Minimum 0.5x speed
    }
  };

  // Add a new function to handle container clicks
  const handleContainerClick = () => {
    if (audioRef.current && !isAudioPlaying) {
      // Try to unlock audio system first
      unlockAudio().then(() => {
        // Then try to play our specific audio
        audioRef.current?.play()
          .then(() => {
            setIsAudioPlaying(true);
            console.log("Credits music started from container click");
          })
          .catch(e => {
            console.error("Still couldn't play audio after container click:", e);
          });
      });
    }
  };

  // The credits content as a markdown string
  const creditsContent = `# 🕹️ PacketSniper — Credits

A fast-paced security-themed arcade game  
Built with passion by **Firestuff** aka *DaksshDev*  
📺 [YouTube – @Itzzfirestuff](https://www.youtube.com/@Itzzfirestuff)

This project is fully open source and available on GitHub!  
Check it out, star it, or fork it and create your own version 🚀

---

## 🌐 Open Source Philosophy

PacketSniper is proudly open source and community-friendly.  
It's built for learning, vibing, and pushing tech boundaries with just a laptop and a dream.  
Feel free to dive into the code, mod the mechanics, or improve anything you find.

---

## 🛠️ Technologies Used

### 🔧 Core Stack
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Firebase (RTDB & Auth)](https://firebase.google.com/) – Backend, Realtime Database, Auth & Hosting
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

### 💅 UI & UX
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [Sonner](https://sonner.emilkowal.dev/)

### 🧠 Forms, Validation & Meta
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation Error](https://github.com/colinhacks/zod-validation-error)
- [CMDK](https://github.com/pacocoursey/cmdk)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
- [@tanstack/react-query](https://tanstack.com/query/latest)

---

## 🎮 Visuals & Effects
- [Three.js](https://threejs.org/)
- [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- [@react-three/drei](https://github.com/pmndrs/drei)
- [Pixi.js](https://pixijs.com/)
- [Matter.js](https://brm.io/matter-js/)
- [Postprocessing](https://github.com/vanruesc/postprocessing)
- [GSAP](https://gsap.com/)
- [React Confetti](https://github.com/alampros/react-confetti)
- [Meshline](https://github.com/spite/THREE.MeshLine)
- [Embla Carousel](https://www.embla-carousel.com/)
- [react-zoom-pan-pinch](https://github.com/prc5/react-zoom-pan-pinch)
- [React Use Gesture](https://github.com/pmndrs/react-use-gesture)

---

## 📦 Backend, Auth & Infra
- [Firebase](https://firebase.google.com/) – Real-time Database + Auth + Hosting
- [Passport](https://www.passportjs.org/)
- [Passport-Local](https://github.com/jaredhanson/passport-local)
- [Express Session](https://github.com/expressjs/session)
- [Connect PG Simple](https://www.npmjs.com/package/connect-pg-simple)
- [MemoryStore](https://www.npmjs.com/package/memorystore)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Drizzle Kit](https://orm.drizzle.team/docs/overview)
- [Neon Database](https://neon.tech/)

---

## ⚙️ Dev Tools & DX
- [Replit](https://replit.com/)
- [Cursor](https://www.cursor.so/) – Pair programming on steroids
- [Vite Plugin GLSL](https://github.com/UstymUkhman/vite-plugin-glsl)
- [Esbuild](https://esbuild.github.io/)
- [TSX](https://github.com/esbuild-kit/tsx)
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)
- [Tailwind Merge](https://github.com/dcastil/tailwind-merge)
- [Tailwind Scrollbar](https://www.npmjs.com/package/tailwind-scrollbar)
- [Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate)
- [PostCSS](https://postcss.org/)

---

## 🔄 Utilities & More
- [WS](https://github.com/websockets/ws)
- [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [Clsx](https://github.com/lukeed/clsx)
- [Class Variance Authority](https://github.com/joe-bell/cva)
- [Date-Fns](https://date-fns.org/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Vaul](https://vaul.shadcn.com/)
- [Input OTP](https://github.com/ajaymarathe/input-otp)
- [React Day Picker](https://react-day-picker.js.org/)

---

## 👀 Shoutouts & Vibes

- To every open source dev who unknowingly helped shape this project
- To all the fellow learners and creators out there
- To players who grind XP like it's the end of the world 💀
- And to YOU — if you're reading this and planning to contribute, fork, or mod this game, you're already part of the crew

---

> © Firestuff — 2025  
> Licensed under MIT.  
> [YouTube Channel](https://www.youtube.com/@Itzzfirestuff)  
> Source Code: *Coming soon to GitHub*  
> Let's keep building cool sh*t 🔥
`;

  // Get a random easter egg
  const randomEasterEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)];

  // Define custom components for ReactMarkdown
  const components = {
    h1: (props: any) => <h1 className="text-4xl font-bold text-cyan-400 mb-6 glow-text" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-bold text-cyan-400 mt-8 mb-4 glow-text-subtle" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-bold text-cyan-500 mt-5 mb-3" {...props} />,
    p: (props: any) => <p className="mb-4 text-white leading-relaxed" {...props} />,
    a: (props: any) => <a className="text-cyan-300 hover:text-cyan-100 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
    ul: (props: any) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
    li: (props: any) => <li className="mb-1 text-gray-200" {...props} />,
    hr: () => <hr className="border-cyan-900/50 my-10 w-3/4 mx-auto" />,
    strong: (props: any) => <strong className="font-bold text-cyan-200" {...props} />,
    em: (props: any) => <em className="italic text-purple-300" {...props} />,
    blockquote: (props: any) => <blockquote className="border-l-4 border-cyan-700 pl-4 italic text-gray-400 my-4" {...props} />,
  };

  return (
    <div 
      ref={containerRef}
      className="credits-container h-screen w-screen bg-black text-white overflow-hidden relative flex flex-col items-center"
      onWheel={handleWheel}
      onClick={handleContainerClick}
    >
      {/* Grid backdrop for cyberpunk aesthetic */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(#0f0 0.5px, transparent 0.5px), linear-gradient(90deg, #0f0 0.5px, transparent 0.5px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Star field background */}
      <div className="fixed inset-0" style={{ 
        background: 'linear-gradient(to bottom, #000 0%, #00111a 100%)', 
        boxShadow: 'inset 0 0 100px rgba(0, 200, 255, 0.15)',
        zIndex: -1
      }}>
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              backgroundColor: Math.random() > 0.9 ? '#c0f0ff' : 'white',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 5 + 2}s infinite alternate`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* Speed indicator */}
      <div className="fixed top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-cyan-900 text-xs text-gray-400 z-50 flex items-center">
        <span>Scroll Speed: </span>
        <div className="ml-2 flex space-x-1">
          {[1, 2, 3].map(n => (
            <div 
              key={n} 
              className={`h-1.5 w-4 rounded-full ${scrollSpeed >= n ? 'bg-cyan-400' : 'bg-gray-700'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Credits content - fixed container with animated inner content */}
      <div className="h-screen w-full max-w-4xl overflow-hidden">
        <div 
          ref={contentRef}
          className="credits-content pt-[100vh]"
          style={{
            animation: `scrollUp ${90 / scrollSpeed}s linear forwards`,
            willChange: 'transform',
          }}
        >
          <div className="max-w-2xl mx-auto text-center opacity-0 animate-fadeIn animation-delay-500">
            <div className="prose prose-invert max-w-none mx-auto text-center">
              <ReactMarkdown components={components}>
                {creditsContent}
              </ReactMarkdown>
            </div>
            
            {/* Easter egg */}
            <div className="mt-12 text-gray-500 italic animate-pulse text-sm">
              "{randomEasterEgg}"
            </div>
            
            {/* Add extra space at the bottom for better scrolling */}
            <div className="h-[50vh]"></div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="fixed bottom-8 z-50 flex flex-col items-center gap-4">
        {showBackButton && (
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="animate-fadeIn bg-gray-900/70 backdrop-blur-sm border-cyan-800 hover:bg-gray-800 hover:border-cyan-600 transition-all duration-300"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        )}
      </div>
      
      {/* Skip button - always visible */}
      <Button 
        variant="outline" 
        onClick={handleBackToHome}
        className="fixed top-4 right-20 text-gray-400 hover:text-white z-50 bg-gray-900/40 border-gray-700 hover:bg-gray-800/60 hover:border-cyan-700 backdrop-blur-sm"
      >
        <SkipForward size={16} className="mr-2" /> 
        Skip
      </Button>
      
      {/* Audio controls */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleAudio} 
        className={`fixed top-4 right-4 z-50 ${isAudioPlaying 
          ? 'text-cyan-400 hover:text-cyan-300 border-cyan-800 hover:border-cyan-600' 
          : 'text-gray-400 hover:text-white border-gray-700'} transition-all duration-300`}
      >
        {isAudioPlaying ? <Music size={20} className="animate-pulse" /> : <VolumeX size={20} />}
      </Button>
      
      {/* Global CSS */}
      <style>
        {`
          @keyframes scrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-100%); }
          }
          
          @keyframes twinkle {
            0% { opacity: 0.3; filter: blur(1px); }
            100% { opacity: 1; filter: blur(0px); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 1.5s ease-in-out forwards;
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          .animation-delay-500 {
            animation-delay: 500ms;
          }
          
          .glow-text {
            text-shadow: 0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3);
          }
          
          .glow-text-subtle {
            text-shadow: 0 0 5px rgba(34, 211, 238, 0.3);
          }
        `}
      </style>
    </div>
  );
};

export default Credits; 