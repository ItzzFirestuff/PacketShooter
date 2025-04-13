import React, { useEffect, useState } from 'react';
import { getAllUsers, LeaderboardEntry } from '@/lib/firebase';
import styles from './Leaderboard.module.css';
import { ArrowDownAZ, ArrowUpAZ, Trophy, Target, Ban, Crosshair, CheckCircle, Swords, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardProps {
  className?: string;
}

type SortField = 'score' | 'level' | 'totalThreatsDestroyed' | 'totalThreatsMissed' | 'totalShots' | 'totalHits' | 'accuracy';

const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Sort the leaderboard data
  const sortLeaderboard = (data: LeaderboardEntry[], field: SortField, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const multiplier = direction === 'desc' ? 1 : -1;
      return (b[field] - a[field]) * multiplier;
    });
  };

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        const sortedData = sortLeaderboard(data, sortField, sortDirection);
        setLeaderboardData(sortedData);
        setError(null);
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Re-sort when sort parameters change
  useEffect(() => {
    setLeaderboardData(sortLeaderboard(leaderboardData, sortField, sortDirection));
  }, [sortField, sortDirection]);

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? 
      <ArrowUpAZ size={14} className="inline ml-1" /> : 
      <ArrowDownAZ size={14} className="inline ml-1" />;
  };

  // Render leaderboard content
  const renderLeaderboardContent = () => {
    if (loading && leaderboardData.length === 0) {
      return <div className={styles.loading}>Loading leaderboard...</div>;
    }

    if (error && leaderboardData.length === 0) {
      return <div className={styles.error}>{error}</div>;
    }

    if (leaderboardData.length === 0) {
      return <div className={styles.emptyState}>No agents yet. Be the first!</div>;
    }

    return (
      <div className={`overflow-auto ${isFullscreen ? "max-h-[70vh]" : "max-h-72"} w-full`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={isFullscreen ? "" : "w-10"}>Rank</th>
              <th className={isFullscreen ? "" : "w-1/3"}>Agent</th>
              <th 
                onClick={() => handleSortChange('level')}
                className={`cursor-pointer hover:text-cyan-400 ${isFullscreen ? "" : "w-14"}`}
              >
                <Swords size={14} className="inline mr-1" />
                Lvl {renderSortIndicator('level')}
              </th>
              <th 
                onClick={() => handleSortChange('score')}
                className="cursor-pointer hover:text-cyan-400"
              >
                <Trophy size={14} className="inline mr-1" />
                Score {renderSortIndicator('score')}
              </th>
              <th 
                onClick={() => handleSortChange('accuracy')}
                className={`cursor-pointer hover:text-cyan-400 ${isFullscreen ? "" : "w-14"}`}
              >
                <CheckCircle size={14} className="inline mr-1" />
                Acc% {renderSortIndicator('accuracy')}
              </th>
              <th 
                onClick={() => handleSortChange('totalThreatsDestroyed')}
                className={`cursor-pointer hover:text-cyan-400 ${isFullscreen ? "" : "w-14"}`}
              >
                <Target size={14} className="inline mr-1" />
                Hits {renderSortIndicator('totalThreatsDestroyed')}
              </th>
              {isFullscreen && (
                <>
                  <th 
                    onClick={() => handleSortChange('totalThreatsMissed')}
                    className="cursor-pointer hover:text-cyan-400"
                  >
                    <Ban size={14} className="inline mr-1" />
                    Missed {renderSortIndicator('totalThreatsMissed')}
                  </th>
                  <th 
                    onClick={() => handleSortChange('totalShots')}
                    className="cursor-pointer hover:text-cyan-400"
                  >
                    <Crosshair size={14} className="inline mr-1" />
                    Shots {renderSortIndicator('totalShots')}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr key={entry.id} className={styles.entry}>
                <td className={styles.rank}>{index + 1}</td>
                <td className={isFullscreen ? "" : styles.name}>
                  <span className="font-bold">{entry.username}</span>
                  <span className="text-xs text-cyan-400 ml-2">{entry.tagId}</span>
                </td>
                <td className={styles.level}>{entry.level}</td>
                <td className={styles.score}>{entry.score.toLocaleString()}</td>
                <td className={styles.accuracy}>{entry.accuracy.toFixed(1)}%</td>
                <td className={styles.threats}>{entry.totalThreatsDestroyed}</td>
                {isFullscreen && (
                  <>
                    <td className={styles.threats}>{entry.totalThreatsMissed}</td>
                    <td className={styles.threats}>{entry.totalShots}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render the leaderboard header
  const renderLeaderboardHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Top Agents</h2>
      <div className="flex items-center">
        <div className="text-xs text-gray-400 mr-2">
          Sort by:{' '}
          <select 
            value={sortField}
            onChange={(e) => handleSortChange(e.target.value as SortField)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
            aria-label="Sort leaderboard by"
            title="Choose a stat to sort by"
          >
            <option value="score">XP Score</option>
            <option value="level">Level</option>
            <option value="totalThreatsDestroyed">Threats Destroyed</option>
            <option value="totalThreatsMissed">Threats Missed</option>
            <option value="totalShots">Total Shots</option>
            <option value="totalHits">Total Hits</option>
            <option value="accuracy">Accuracy</option>
          </select>
          <button 
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
            className="ml-2 text-gray-400 hover:text-white"
            aria-label={`Sort ${sortDirection === 'desc' ? 'ascending' : 'descending'}`}
          >
            {sortDirection === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-gray-400 hover:text-white ml-2"
          aria-label="View leaderboard in fullscreen"
          title="View fullscreen"
        >
          <Maximize size={16} />
        </Button>
      </div>
    </div>
  );

  // If loading and it's the initial board (not fullscreen modal), show loading
  if (loading && leaderboardData.length === 0 && !isFullscreen) {
    return (
      <div className={`${styles.leaderboard} ${className || ''} w-full`}>
        <h2>Top Agents</h2>
        <div className={styles.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  // If error and it's the initial board (not fullscreen modal), show error
  if (error && leaderboardData.length === 0 && !isFullscreen) {
    return (
      <div className={`${styles.leaderboard} ${className || ''} w-full`}>
        <h2>Top Agents</h2>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // Render fullscreen modal
  if (isFullscreen) {
    return (
      <>
        <div className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 ${styles.fullscreenModal}`}>
          <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden ${styles.modalContent}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">Packet Sniper Leaderboard</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleFullscreen}
                className="text-gray-400 hover:text-white"
                aria-label="Close fullscreen view"
              >
                <X size={20} />
              </Button>
            </div>
            {renderLeaderboardContent()}
            <div className="mt-4 text-xs text-gray-500 flex justify-between">
              <span>Total Agents: {leaderboardData.length}</span>
              <span className="text-cyan-500">Data refreshes automatically every 30 seconds</span>
            </div>
          </div>
        </div>
        
        {/* Keep the original leaderboard in place but hidden */}
        <div className={`${styles.leaderboard} ${className || ''} w-full hidden`}>
          {renderLeaderboardHeader()}
          {renderLeaderboardContent()}
        </div>
      </>
    );
  }

  // Regular non-fullscreen leaderboard
  return (
    <div className={`${styles.leaderboard} ${className || ''} w-full`}>
      {renderLeaderboardHeader()}
      {renderLeaderboardContent()}
      <div className="mt-4 text-xs text-gray-500">
        Total Agents: {leaderboardData.length}
      </div>
    </div>
  );
};

export default Leaderboard; 