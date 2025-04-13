import { useState } from 'react';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { Award, Target, Shield, Zap, X, Clock, Hash, BarChart2, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CareerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: { username: string; tagId: string } | null;
}

const CareerStatsModal = ({ isOpen, onClose, userData }: CareerStatsModalProps) => {
  const {
    level,
    xp,
    score,
    totalThreatsDestroyed,
    totalThreatsMissed,
    totalShots,
    totalHits
  } = usePacketSniper();
  
  // Calculate accuracy percentage
  const accuracy = totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0;
  
  // Calculate XP needed for next level
  const xpForNextLevel = 1000 + Math.pow(level, 2) * 200;
  const currentLevelXp = xp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;
  
  // Calculate threat ratio
  const threatRatio = totalThreatsDestroyed + totalThreatsMissed > 0 
    ? (totalThreatsDestroyed / (totalThreatsDestroyed + totalThreatsMissed)) * 100 
    : 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-xl w-full font-mono">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl text-cyan-400 flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Agent Career Stats
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {userData?.username}'s cybersecurity performance metrics
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Agent Info */}
          <div className="flex items-center mb-6 bg-gray-800 p-3 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center mr-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{userData?.username}</div>
              <div className="text-cyan-400 text-sm">#{userData?.tagId}</div>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <div className="flex items-center text-yellow-400 font-bold">
                <Zap className="h-4 w-4 mr-1" />
                Level {level}
              </div>
              <div className="text-gray-400 text-sm">
                {Math.round(score)} points
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* XP Progress */}
            <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-yellow-400">
                  <Zap className="h-4 w-4 mr-1" />
                  <span>Experience</span>
                </div>
                <span className="text-sm text-gray-400">
                  {Math.round(currentLevelXp)} / {Math.round(xpForNextLevel)} XP
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">
                {Math.round(xpForNextLevel - currentLevelXp)} XP needed for Level {level + 1}
              </div>
            </div>
            
            {/* Threats */}
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-cyan-400">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Accuracy</span>
                </div>
                <span className="text-cyan-300 font-mono">{accuracy}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Shots:</span>
                  <span className="text-gray-300">{totalShots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hits:</span>
                  <span className="text-gray-300">{totalHits}</span>
                </div>
              </div>
            </div>
            
            {/* Threat Ratio */}
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-red-400">
                  <Shield className="h-4 w-4 mr-1" />
                  <span>Threat Elimination</span>
                </div>
                <span className="text-red-300 font-mono">{Math.round(threatRatio)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                  style={{ width: `${threatRatio}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Destroyed:</span>
                  <span className="text-green-400">{totalThreatsDestroyed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Missed:</span>
                  <span className="text-red-400">{totalThreatsMissed}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard
              icon={<Award className="h-4 w-4 text-purple-400" />}
              label="Top Score"
              value={Math.round(score).toString()}
              color="purple"
            />
            <StatCard
              icon={<BarChart2 className="h-4 w-4 text-cyan-400" />}
              label="Total XP"
              value={Math.round(xp).toString()}
              color="cyan"
            />
            <StatCard
              icon={<Heart className="h-4 w-4 text-red-400" />}
              label="System Health"
              value="100%"
              color="red"
            />
            <StatCard
              icon={<Clock className="h-4 w-4 text-yellow-400" />}
              label="Agent Level"
              value={level.toString()}
              color="yellow"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'purple' | 'cyan' | 'red' | 'yellow';
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => {
  const colorClasses = {
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400'
  };
  
  return (
    <div className="p-2 bg-gray-800 rounded-lg flex flex-col items-center justify-center">
      <div className="flex items-center mb-1">
        {icon}
        <span className="text-xs text-gray-400 ml-1">{label}</span>
      </div>
      <div className={`text-lg font-bold ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
};

export default CareerStatsModal; 