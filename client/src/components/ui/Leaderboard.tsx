import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, Trophy, User, Zap } from 'lucide-react';
import { getLocalStorage } from '@/lib/utils';

interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  useEffect(() => {
    // Load leaderboard from localStorage
    const savedLeaderboard = getLocalStorage('packetSniper_leaderboard') || [];
    
    // If no leaderboard exists, create mock data for first-time players
    if (!savedLeaderboard.length) {
      const mockLeaderboard: LeaderboardEntry[] = [
        { name: 'CyberH4ck3r', score: 9850, level: 12 },
        { name: 'PacketMaster', score: 7620, level: 10 },
        { name: 'F1rew4ll', score: 5430, level: 8 },
        { name: 'N3tN1nj4', score: 3200, level: 6 },
        { name: 'Zer0C00l', score: 1800, level: 4 }
      ];
      setLeaderboard(mockLeaderboard);
    } else {
      // Sort leaderboard by score
      const sorted = [...savedLeaderboard].sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
    }
  }, []);

  // Function to get medal for top 3 positions
  const getMedal = (position: number) => {
    switch (position) {
      case 0: 
        return <Medal className="h-4 w-4 text-yellow-400" />; // Gold
      case 1: 
        return <Medal className="h-4 w-4 text-gray-300" />; // Silver
      case 2: 
        return <Medal className="h-4 w-4 text-amber-700" />; // Bronze
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
          <Trophy className="h-5 w-5" />
          Top Snipers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0 ${
                index < 3 ? 'bg-gray-800 bg-opacity-40 rounded-md px-2' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 text-center font-bold ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-amber-700' : 'text-gray-500'
                }`}>
                  {getMedal(index) || (index + 1)}
                </div>
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-white">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs flex items-center text-yellow-400">
                  <Zap className="h-3 w-3 mr-1" />
                  {entry.level}
                </div>
                <div className="text-cyan-400 font-bold w-16 text-right">{entry.score.toLocaleString()}</div>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No scores yet. Start playing!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
