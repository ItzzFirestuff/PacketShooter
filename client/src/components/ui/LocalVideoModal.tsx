import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface LocalVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocalVideoModal = ({ isOpen, onClose }: LocalVideoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white font-mono max-w-4xl">
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          onClick={onClose}
          title="Close video"
          aria-label="Close video"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl">
            <span className="text-white">How to Play - Offline Tutorial</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" /* 16:9 aspect ratio */ }}>
            {/* Local video player using Google Drive embedded video */}
            <iframe
              src="https://drive.google.com/file/d/1PFpuL5_aJsQRt4Cc_yWTZodZBjHZO60V/preview"
              className="absolute top-0 left-0 w-full h-full rounded-md shadow-lg"
              allow="autoplay"
              allowFullScreen
            ></iframe>
            
            {/* Alternative implementation using direct video file */}
            {/* <video
              src="/videos/tutorial.mp4"
              className="absolute top-0 left-0 w-full h-full rounded-md shadow-lg"
              controls
              autoPlay
              playsInline
            >
              Your browser does not support the video tag.
            </video> */}
          </div>
          
          <div className="mt-4 text-sm text-gray-400 text-center">
            If you have trouble viewing this video, please download it directly{' '}
            <a 
              href="https://drive.google.com/uc?export=download&id=1PFpuL5_aJsQRt4Cc_yWTZodZBjHZO60V" 
              className="text-cyan-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocalVideoModal; 