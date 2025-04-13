import React from 'react';
import { Target, Crosshair, Eye, Cpu, Brain, MousePointer, Gamepad2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border border-cyan-900 text-white font-mono max-w-lg p-3 rounded-lg">
        <DialogHeader className="mb-2 border-b border-gray-800 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Welcome to Packet Sniper
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed text-sm">
            Packet Sniper is a cybersecurity-themed arcade game that improves your reflexes, 
            focus, and precision while teaching the basics of network security. Your mission: 
            identify and eliminate malicious packets while allowing safe network traffic to pass.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
              <div className="bg-cyan-900 p-1.5 rounded-full">
                <Eye className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-cyan-400 text-xs">Improves Vision</h3>
                <p className="text-xs text-gray-300">Trains your eyes to quickly identify visual patterns.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
              <div className="bg-purple-900 p-1.5 rounded-full">
                <MousePointer className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-purple-400 text-xs">Refines Precision</h3>
                <p className="text-xs text-gray-300">Develops mouse accuracy and control.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
              <div className="bg-yellow-900 p-1.5 rounded-full">
                <Brain className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 text-xs">Enhances Focus</h3>
                <p className="text-xs text-gray-300">Strengthens concentration and reaction time.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
              <div className="bg-green-900 p-1.5 rounded-full">
                <Cpu className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-green-400 text-xs">Tech Knowledge</h3>
                <p className="text-xs text-gray-300">Learn cybersecurity concepts while playing.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-3 rounded-lg border border-gray-700">
            <h3 className="text-sm font-bold mb-2 text-cyan-400 flex items-center">
              <Gamepad2 className="mr-2 h-4 w-4" /> Quick Start:
            </h3>
            <ul className="space-y-1.5 text-gray-300 text-xs">
              <li className="flex items-center gap-2">
                <div className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</div>
                <span>Create an account to track your progress</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</div>
                <span>Click "LAUNCH MISSION" to begin gameplay</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</div>
                <span>Use your mouse to aim and click to shoot malicious packets (red)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">4</div>
                <span>Avoid shooting legitimate packets (green/blue)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-gray-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">5</div>
                <span>Level up and climb the leaderboard!</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="mt-3 pt-2 border-t border-gray-800">
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700"
          >
            Got it, Let's Go!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal; 