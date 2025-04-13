import { useEffect } from 'react';
import { usePacketSniper } from '@/lib/stores/usePacketSniper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, XCircle, Zap, Award } from 'lucide-react';

const WaveStats = () => {
  const {
    waveStatus,
    waveNumber,
    score,
    xpGained,
    level,
    shotsHit,
    shotsMissed,
    maliciousHit,
    benignHit
  } = usePacketSniper();
  
  // Calculate accuracy
  const totalShots = shotsHit + shotsMissed;
  const accuracy = totalShots > 0 ? (shotsHit / totalShots) * 100 : 0;
  
  // Determine performance grade
  const getPerformanceGrade = () => {
    if (accuracy >= 90 && benignHit === 0) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    if (accuracy >= 50) return 'C';
    return 'D';
  };
  
  return (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-center gap-2 text-cyan-400">
          <Award className="h-6 w-6" />
          Wave {waveNumber} Complete!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat-item flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">SCORE</div>
            <div className="text-2xl font-bold text-cyan-400">{score}</div>
          </div>
          
          <div className="stat-item flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">XP GAINED</div>
            <div className="text-2xl font-bold text-yellow-400">+{xpGained}</div>
          </div>
          
          <div className="stat-item flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">LEVEL</div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{level}</span>
            </div>
          </div>
          
          <div className="stat-item flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">PERFORMANCE</div>
            <div className="text-2xl font-bold text-white">{getPerformanceGrade()}</div>
          </div>
        </div>
        
        <div className="detailed-stats space-y-3">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-gray-300">Malicious packets hit</span>
            </div>
            <span className="font-mono text-green-400">{maliciousHit}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-gray-300">Benign packets hit</span>
            </div>
            <span className="font-mono text-red-400">{benignHit}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2 text-cyan-500" />
              <span className="text-gray-300">Accuracy</span>
            </div>
            <span className="font-mono text-cyan-400">{accuracy.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="text-gray-300">Total shots</span>
            </div>
            <span className="font-mono text-gray-400">{totalShots}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaveStats;
