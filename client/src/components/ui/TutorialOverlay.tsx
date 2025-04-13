import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Shield, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay = ({ onComplete }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to Packet Sniper",
      content: "Your mission is to identify and eliminate malicious network packets while preserving benign traffic.",
      icon: <Target className="h-12 w-12 text-cyan-400" />,
    },
    {
      title: "Targeting System",
      content: "Move your mouse to aim. Shoot packets by clicking or pressing SPACEBAR.",
      icon: <Target className="h-12 w-12 text-cyan-400" />,
    },
    {
      title: "Packet Identification",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-900 border border-red-500"></div>
            <span className="text-red-400">RED packets are malicious - shoot these!</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-900 border border-green-500"></div>
            <span className="text-green-400">GREEN packets are benign - avoid these!</span>
          </div>
        </div>
      ),
      icon: <AlertTriangle className="h-12 w-12 text-yellow-400" />,
    },
    {
      title: "Ammo System",
      content: "Shooting costs ammo. Hitting malicious packets refills ammo. Missing or hitting benign packets drains ammo. If your ammo runs out, you'll need to wait for it to recharge.",
      icon: <Shield className="h-12 w-12 text-purple-400" />,
    },
    {
      title: "Experience & Levels",
      content: "Gain XP for hitting malicious packets. Lose XP for hitting benign ones. Higher levels unlock faster recharge rates.",
      icon: <Zap className="h-12 w-12 text-yellow-400" />,
    },
    {
      title: "Ready to Start?",
      content: "Complete waves by eliminating all packets. Each wave gets progressively harder. Good luck, agent!",
      icon: <CheckCircle2 className="h-12 w-12 text-green-400" />,
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Close the tutorial properly if on the last step
      onComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="tutorial-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 pointer-events-auto">
      <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            {steps[currentStep].icon}
            <h2 className="text-xl font-bold mt-4 mb-2 text-white">{steps[currentStep].title}</h2>
            <div className="text-gray-300 text-center">
              {steps[currentStep].content}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1 mb-6">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-cyan-400' : 'bg-gray-700'}`}
              ></div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded text-sm ${currentStep === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              className={`px-4 py-2 rounded text-sm ${currentStep === steps.length - 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-cyan-600 hover:bg-cyan-700'} text-white cursor-pointer`}
            >
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialOverlay;
