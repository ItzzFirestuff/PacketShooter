import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { BarChart, ChevronDown, ChevronUp, Shield, Target, Zap } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameStatsProps {
  alwaysExpanded?: boolean;
}

const GameStats = ({ alwaysExpanded = false }: GameStatsProps) => {
  const [expanded, setExpanded] = useState(alwaysExpanded);
  
  const {
    xp,
    level,
    totalThreatsDestroyed,
    totalThreatsMissed,
    totalShots,
    totalHits
  } = usePacketSniper();
  
  // Calculate accuracy percentage
  const accuracy = totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0;
  
  // Calculate XP needed for next level with harder formula
  const xpForNextLevel = 1000 + Math.pow(level, 2) * 200;
  const currentLevelXp = xp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;
  
  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-2">
        <div 
          className={`flex justify-between items-center ${alwaysExpanded ? '' : 'cursor-pointer'}`}
          onClick={() => !alwaysExpanded && setExpanded(!expanded)}
        >
          <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
            <BarChart className="h-5 w-5" />
            Career Stats
          </CardTitle>
          {!alwaysExpanded && (
            <div>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      {/* Expanded stats section */}
      {(expanded || alwaysExpanded) && (
        <CardContent className="space-y-3 text-sm pt-0">
          {/* XP and Level */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-400" />
                <span className="text-yellow-300">Level {level}</span>
              </div>
              <span className="text-xs text-gray-400">{Math.round(currentLevelXp)}/{Math.round(xpForNextLevel)} XP</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          
          {/* Total XP */}
          <div className="flex justify-between">
            <span className="text-gray-400">Total XP:</span>
            <span className="text-yellow-300 font-mono">{Math.round(xp)}</span>
          </div>
          
          {/* Threats */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Threats Destroyed:</span>
            <span className="text-green-400 font-mono">{totalThreatsDestroyed}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Threats Missed:</span>
            <span className="text-red-400 font-mono">{totalThreatsMissed}</span>
          </div>
          
          {/* Accuracy */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-1 text-cyan-400" />
                <span className="text-gray-400">Accuracy:</span>
              </div>
              <span className="text-cyan-300 font-mono">{accuracy}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
          
          {/* Shot details */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total Shots:</span>
            <span className="text-gray-300 font-mono">{totalShots}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Hits:</span>
            <span className="text-gray-300 font-mono">{totalHits}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GameStats; 