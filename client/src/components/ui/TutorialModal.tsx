import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Mouse,
  MousePointer,
  Shield,
  Target,
  Zap,
  AlertCircle,
  Crosshair,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LocalVideoModal from "./LocalVideoModal";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLocalVideoOpen, setIsLocalVideoOpen] = useState(false);

  const tutorialSteps = [
    {
      title: "Welcome to Packet Sniper!",
      icon: <Target className="h-6 w-6 text-cyan-400" />,
      content: (
        <div>
          {/* YouTube Video Tutorial */}
          <div className="mb-6 flex flex-col items-center justify-center">
            <div
              className="relative w-3/4"
              style={{ paddingBottom: "35.25%" /* 16:9 ratio */ }}
            >
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=S3X7H45DD3lBT9_d"
                title="Packet Sniper Tutorial Video"
                className="absolute top-0 left-0 w-full h-full rounded-md shadow-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>

            {/* Fallback Button */}
            <button
              className="mt-4 text-sm text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 transition"
              onClick={() => setIsLocalVideoOpen(true)}
            >
              YouTube not working? Click here to view offline
            </button>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg mb-4">
            <h4 className="text-cyan-400 font-bold mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Game Objective
            </h4>
            <p className="text-gray-300 text-sm">
              Shoot down harmful network packets before they reach your system.
              The longer you survive, the harder the waves become!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Controls",
      icon: <Mouse className="h-6 w-6 text-yellow-400" />,
      content: (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <h4 className="text-yellow-400 font-bold mb-2 flex items-center">
                <MousePointer className="h-4 w-4 mr-2" />
                Aiming
              </h4>
              <p className="text-gray-300 text-sm">
                Move your mouse to position the crosshair over target packets.
              </p>
            </div>

            <div className="bg-gray-800 p-3 rounded-lg">
              <h4 className="text-yellow-400 font-bold mb-2 flex items-center">
                <Mouse className="h-4 w-4 mr-2" />
                Shooting
              </h4>
              <p className="text-gray-300 text-sm">
                Left-click to fire at packets. Be careful with your ammo!
              </p>
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="text-yellow-400 font-bold mb-2 flex items-center">
              <Crosshair className="h-4 w-4 mr-2" />
              Precision Mode
            </h4>
            <p className="text-gray-300 text-sm">
              Right-click to enter precision aiming mode for more accurate
              shots. This slows down your cursor for better targeting.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Packet Types",
      icon: <Shield className="h-6 w-6 text-red-400" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-gray-800 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h4 className="text-red-400 font-bold">Malicious Packets</h4>
              <p className="text-gray-300 text-sm">
                These harmful packets glow red or have warning indicators. Shoot
                them down to earn points and XP!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-800 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-green-900 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h4 className="text-green-400 font-bold">Safe Packets</h4>
              <p className="text-gray-300 text-sm">
                Legitimate network traffic appears green or blue. DO NOT shoot
                these - let them pass through safely!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-800 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-purple-900 border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-purple-400 font-bold">Special Packets</h4>
              <p className="text-gray-300 text-sm">
                Encrypted or special packets may have unique behaviors. Some
                offer bonuses, others pose greater threats!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Game Progression",
      icon: <Zap className="h-6 w-6 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="text-purple-400 font-bold mb-2">Leveling Up</h4>
            <p className="text-gray-300 text-sm mb-2">
              As you defeat malicious packets, you'll gain XP and level up.
              Higher levels grant faster ammo regeneration and access to special
              abilities.
            </p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full w-3/4" />
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="text-red-400 font-bold mb-2">Wave Difficulty</h4>
            <p className="text-gray-300 text-sm">
              Each wave gets progressively harder with faster and more complex
              packets. Stay focused and prioritize the most dangerous threats!
            </p>
          </div>

          <div className="text-sm text-center text-gray-400 mt-4">
            Your stats and progress are saved automatically when logged in.
          </div>
        </div>
      ),
    },
  ];

  const currentTutorial = tutorialSteps[currentStep];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step reached, close the tutorial
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-gray-900 border border-gray-700 text-white font-mono max-w-2xl">
          <button
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
            onClick={onClose}
            title="Close tutorial"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="border-b border-gray-800 pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              {currentTutorial.icon}
              <span className="text-white">{currentTutorial.title}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Step progress indicator */}
          <div className="flex gap-1 mt-2 mb-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full ${
                  index === currentStep ? "bg-cyan-500 w-8" : "bg-gray-700 w-5"
                }`}
              />
            ))}
          </div>

          <div className="py-4 min-h-[16rem]">{currentTutorial.content}</div>

          <DialogFooter className="flex justify-between border-t border-gray-800 pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={currentStep === 0 ? "opacity-0" : ""}
            >
              Previous
            </Button>

            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-cyan-500 to-purple-600"
            >
              {currentStep < tutorialSteps.length - 1 ? "Next" : "Got It!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Local Video Modal */}
      <LocalVideoModal isOpen={isLocalVideoOpen} onClose={() => setIsLocalVideoOpen(false)} />
    </>
  );
};

export default TutorialModal;
