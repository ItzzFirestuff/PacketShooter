import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Zap, Target, Award, User, LogOut, Youtube, Twitter, Github, FileText, Info, BarChart2, Volume2, Trash2 } from 'lucide-react';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { useAudio } from '@/lib/stores/useAudio';
import AuthModal from '@/components/AuthModal';
import Leaderboard from '@/components/Leaderboard';
import TutorialModal from '@/components/ui/TutorialModal';
import CareerStatsModal from '@/components/ui/CareerStatsModal';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { getCurrentUser, syncUserStats, logoutUser, deleteUserAccount, UserData } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Home = () => {
  const navigate = useNavigate();
  const { 
    playerName, 
    setPlayerName, 
    level, 
    score, 
    setPlayerStats 
  } = usePacketSniper();
  const { toggleMute, isMuted, initializeAudio, playBackgroundMusic, stopBackgroundMusic } = useAudio();
  
  // Authentication state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<{ username: string; tagId: string } | null>(null);
  
  // Modal states
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
  // Audio state
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const audioInitialized = useRef(false);
  
  // Check if it's the user's first visit to show welcome modal
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('packetSniper_hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsWelcomeModalOpen(true);
      localStorage.setItem('packetSniper_hasVisitedBefore', 'true');
    }
  }, []);
  
  // Handle welcome modal close
  const handleWelcomeModalClose = () => {
    setIsWelcomeModalOpen(false);
  };
  
  // Initialize audio when the component mounts, but wait for user interaction
  useEffect(() => {
    // Initialize audio (loads sound files) but don't play yet - will require user interaction
    initializeAudio().then(() => {
      audioInitialized.current = true;
      
      // Show the audio prompt after initialization
      if (!isMuted) {
        setShowAudioPrompt(true);
      }
    }).catch(error => {
      console.error("Failed to initialize audio:", error);
    });
    
    // Create a one-time interaction handler to enable audio
    const handleFirstInteraction = () => {
      if (!isMuted) {
        playBackgroundMusic();
        // Hide the prompt after interaction
        setShowAudioPrompt(false);
      }
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // Add event listeners for common user interactions
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [initializeAudio, playBackgroundMusic, isMuted]);
  
  // Sound toggle function
  const handleToggleSound = () => {
    // Toggle the mute state in the audio store
    toggleMute();
    
    // If we're unmuting, try to play background music
    if (isMuted) {
      playBackgroundMusic();
    } else {
      // If we're muting, ensure all audio is stopped immediately
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
    
    // Hide the audio prompt when the user manually toggles sound
    setShowAudioPrompt(false);
  };
  
  // Handle manual audio start button click
  const handleStartAudio = () => {
    if (isMuted) {
      // If muted, unmute and play
      toggleMute();
      playBackgroundMusic();
    }
    setShowAudioPrompt(false);
  };
  
  // Handle "Play Game" button click
  const handlePlayGame = () => {
    // Stop background music before navigating
    stopBackgroundMusic();
    // Hide audio prompt
    setShowAudioPrompt(false);
    // Navigate to game
    navigate('/game');
  };
  
  const handleViewCredits = () => {
    // Stop background music before navigating
    stopBackgroundMusic();
    // Hide audio prompt
    setShowAudioPrompt(false);
    // Navigate to credits
    navigate('/credits');
  };
  
  // Handle successful authentication
  const handleAuthSuccess = (data: { username: string; tagId: string }) => {
    setUserData(data);
    setPlayerName(data.username);
    setIsAuthenticated(true);
    
    // Get the full user data from Firebase
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.userData) {
      const userStats = currentUser.userData;
      
      // Update player stats in game state
      setPlayerStats({
        level: userStats.level || 1,
        score: userStats.score || 0,
        totalThreatsDestroyed: userStats.totalThreatsDestroyed || 0,
        totalThreatsMissed: userStats.totalThreatsMissed || 0, 
        totalShots: userStats.totalShots || 0,
        totalHits: userStats.totalHits || 0
      });
      
      toast.success(`Welcome back, ${data.username}! Your progress has been loaded.`);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserData(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteUserAccount();
      setIsAuthenticated(false);
      setUserData(null);
      // Reset player state
      setPlayerName('Agent');
      setPlayerStats({
        level: 1,
        score: 0,
        totalThreatsDestroyed: 0,
        totalThreatsMissed: 0,
        totalShots: 0,
        totalHits: 0
      });
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    }
  };
  
  // Check authentication state on component mount
  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setUserData({
          username: user.userData.username,
          tagId: user.userData.tagId
        });
        setPlayerName(user.userData.username);
        
        // Update player stats in game state
        setPlayerStats({
          level: user.userData.level || 1,
          score: user.userData.score || 0,
          totalThreatsDestroyed: user.userData.totalThreatsDestroyed || 0,
          totalThreatsMissed: user.userData.totalThreatsMissed || 0, 
          totalShots: user.userData.totalShots || 0,
          totalHits: user.userData.totalHits || 0
        });
        
        // Sync stats with Firebase
        syncUserStats();
      }
    };
    
    checkAuth();
  }, [setPlayerName, setPlayerStats]);
  
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handlePlayGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="home-container w-screen h-screen bg-black text-white font-mono">
      {/* Welcome Modal - shown on first visit */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={handleWelcomeModalClose}
      />
      
      {/* Delete account dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border border-red-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete your account? This action cannot be undone.
              All your data, including scores and progress, will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Background */}
      <div 
        className="fixed inset-0 bg-black"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(20, 70, 90, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(90, 20, 90, 0.3) 0%, transparent 50%),
            linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.95))
          `,
          backgroundSize: 'cover'
        }}
      ></div>
      
      {/* Grid overlay */}
      <div className="grid-bg fixed inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(#0f0 0.5px, transparent 0.5px), linear-gradient(90deg, #0f0 0.5px, transparent 0.5px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Credits Button in top left */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewCredits}
        className="fixed top-4 left-4 z-50 bg-gray-900/40 border-gray-700 hover:bg-gray-800/60 hover:border-cyan-700 text-gray-400 hover:text-cyan-300 backdrop-blur-sm"
      >
        <FileText size={14} className="mr-1" /> Credits
      </Button>
      
      {/* Music Toggle Button below Credits */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleSound}
        className={`fixed top-14 left-4 z-50 bg-gray-900/40 border-gray-700 backdrop-blur-sm transition-colors ${
          isMuted 
            ? "hover:bg-gray-800/60 hover:border-cyan-700 text-gray-400 hover:text-cyan-300" 
            : "bg-cyan-900/40 border-cyan-500 text-cyan-300 hover:bg-cyan-800/60"
        }`}
        title={isMuted ? "Play music" : "Stop music"}
        aria-label={isMuted ? "Play music" : "Stop music"}
      >
        {isMuted ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg> 
            Play Music
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 animate-pulse">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            Stop Music
          </>
        )}
      </Button>
      
      {/* View Source Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open('https://github.com/ItzzFirestuff/PacketSniper', '_blank')}
        className="fixed top-24 left-4 z-50 bg-gray-900/40 border-gray-700 hover:bg-gray-800/60 hover:border-cyan-700 text-gray-400 hover:text-cyan-300 backdrop-blur-sm"
        title="View Source Code"
        aria-label="View Source Code"
      >
        <Github size={14} className="mr-1" /> View Source
      </Button>
      
      {/* Audio prompt - only shown if needed */}
      {showAudioPrompt && !isMuted && (
        <div className="fixed top-24 left-4 z-50 bg-gray-900/80 border border-cyan-500 rounded-md p-3 backdrop-blur-sm max-w-xs animate-fadeIn">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 animate-pulse">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <span className="text-cyan-100 text-sm">Browser requires user action</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-cyan-900/50 hover:bg-cyan-800/70 text-cyan-200 border-cyan-700 w-full"
              onClick={handleStartAudio}
            >
              Enable Music
            </Button>
          </div>
        </div>
      )}
      
      {/* Tutorial Button in top right */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsTutorialOpen(true)}
        className="fixed top-4 right-4 z-50 bg-gray-900/40 border-gray-700 hover:bg-gray-800/60 hover:border-cyan-700 text-gray-400 hover:text-cyan-300 backdrop-blur-sm"
      >
        <Info size={14} className="mr-1" /> How to Play
      </Button>
      
      {/* Stats Button next to Tutorial Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsStatsModalOpen(true)}
        className="fixed top-4 right-28 z-50 bg-gray-900/40 border-gray-700 hover:bg-gray-800/60 hover:border-cyan-700 text-gray-400 hover:text-cyan-300 backdrop-blur-sm"
        disabled={!isAuthenticated}
      >
        <BarChart2 size={14} className="mr-1" /> Stats
      </Button>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pb-16">
        <div className="text-center mb-8 mt-6">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-1">
            PACKET SNIPER
          </h1>
          <p className="text-cyan-400 text-md mb-4">by <span className="font-bold">@Itzzfirestuff (DaksshDev)</span></p>
          <p className="text-gray-400 text-lg">Hunt down malicious network packets</p>
        </div>
        
        {/* Two-column layout for features and leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12 max-w-7xl w-full">
          {/* Features (3/5 width on desktop) */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="feature-card bg-gray-900 bg-opacity-50 border border-cyan-900 rounded-lg p-4 hover:border-cyan-500 transition-all">
                <div className="flex items-center mb-3">
                  <Target className="w-6 h-6 text-cyan-400 mr-2" />
                  <h3 className="text-lg font-bold text-cyan-400">Precision Targeting</h3>
                </div>
                <p className="text-gray-400 text-sm">Use your mouse as a precision targeting system to eliminate malicious network packets.</p>
              </div>
              
              <div className="feature-card bg-gray-900 bg-opacity-50 border border-purple-900 rounded-lg p-4 hover:border-purple-500 transition-all">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-purple-400 mr-2" />
                  <h3 className="text-lg font-bold text-purple-400">Cyber Defense</h3>
                </div>
                <p className="text-gray-400 text-sm">Identify and eliminate malicious traffic while preserving benign network communications.</p>
              </div>
              
              <div className="feature-card bg-gray-900 bg-opacity-50 border border-yellow-900 rounded-lg p-4 hover:border-yellow-500 transition-all">
                <div className="flex items-center mb-3">
                  <Zap className="w-6 h-6 text-yellow-400 mr-2" />
                  <h3 className="text-lg font-bold text-yellow-400">Skill Progression</h3>
                </div>
                <p className="text-gray-400 text-sm">Gain XP and level up as you improve your packet identification and shooting skills.</p>
              </div>
            </div>
            
            {/* Call to action */}
            <div className="play-container flex flex-col items-center bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-6">
              {/* User info/login section */}
              <div className="w-full mb-4">
                {isAuthenticated && userData ? (
                  <div className="flex justify-between items-center border border-gray-700 rounded-lg p-4 bg-gray-800 bg-opacity-50">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-2 rounded-full mr-3">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{userData.username}</div>
                        <div className="text-cyan-400 text-sm">{userData.tagId}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {(level > 1 || score > 0) && (
                        <div className="flex items-center gap-2">
                          {level > 1 && (
                            <div className="flex items-center bg-gray-900 px-2 py-1 rounded">
                              <Zap className="w-4 h-4 mr-1 text-yellow-400" />
                              <span className="text-yellow-400 font-bold">LVL {level}</span>
                            </div>
                          )}
                          
                          {score > 0 && (
                            <div className="flex items-center bg-gray-900 px-2 py-1 rounded">
                              <Award className="w-4 h-4 mr-1 text-cyan-400" />
                              <span className="text-cyan-400 font-bold">{score}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isAuthenticated && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-gray-400 hover:text-cyan-400 border border-gray-700"
                            onClick={() => setIsStatsModalOpen(true)}
                            title="View Career Stats"
                          >
                            <BarChart2 size={16} />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-gray-400 hover:text-red-400 border border-gray-700"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-gray-400 hover:text-white border border-gray-700"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center border border-gray-700 rounded-lg p-4 bg-gray-800 bg-opacity-50">
                    <div className="text-gray-400">Not logged in</div>
                    <Button 
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Login / Register
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                className="px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xl font-bold hover:from-cyan-600 hover:to-purple-700 transition-all w-full"
                onClick={handlePlayGame}
              >
                LAUNCH MISSION
              </Button>
            </div>
          </div>
          
          {/* Leaderboard (2/5 width on desktop) */}
          <div className="md:col-span-2">
            <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-4 h-full">
              <Leaderboard />
            </div>
          </div>
        </div>
        
        {/* Footer with social links */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto text-center py-4 mt-0 border-t border-gray-800">
          <div className="flex flex-col items-center">
            <div className="flex space-x-6 mb-3">
              <a href="https://youtube.com/@Itzzfirestuff" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube size={24} />
              </a>
              <a href="https://twitter.com/ItzzFirestuff" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter size={24} />
              </a>
              <a href="https://github.com/ItzzFirestuff" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Github size={24} />
              </a>
            </div>
            <p className="text-xs text-gray-500">© 2023 Packet Sniper by @firestuff. All rights reserved.</p>
          </div>
        </footer>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      
      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      
      {/* Career Stats Modal */}
      {isAuthenticated && (
        <CareerStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          userData={userData}
        />
      )}
    </div>
  );
};

export default Home;
