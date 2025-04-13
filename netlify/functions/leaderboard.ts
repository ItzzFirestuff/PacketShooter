import { Handler } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';

interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  level: number;
  created_at?: string;
}

// Path to our JSON file (relative to the function)
const DATA_FILE = path.join('/tmp', 'leaderboard.json');

// Helper function to read leaderboard data
const getLeaderboardData = (): LeaderboardEntry[] => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading leaderboard data:', error);
    return [];
  }
};

// Helper function to write leaderboard data
const saveLeaderboardData = (data: LeaderboardEntry[]): void => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing leaderboard data:', error);
  }
};

const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // GET request - return the leaderboard
    if (event.httpMethod === 'GET') {
      const leaderboardData = getLeaderboardData();
      
      // Sort by score in descending order
      const sortedData = leaderboardData.sort((a, b) => b.score - a.score);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sortedData)
      };
    }

    // POST request - add a new score
    if (event.httpMethod === 'POST' && event.body) {
      const data: LeaderboardEntry = JSON.parse(event.body);
      
      // Validate required fields
      if (!data.name || typeof data.score !== 'number' || typeof data.level !== 'number') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: name, score, level' })
        };
      }

      // Add timestamp and ID
      const entry: LeaderboardEntry = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };

      // Get current leaderboard data
      const leaderboardData = getLeaderboardData();
      
      // Add new entry and save
      leaderboardData.push(entry);
      saveLeaderboardData(leaderboardData);

      // Sort by score in descending order
      const sortedData = leaderboardData.sort((a, b) => b.score - a.score);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sortedData)
      };
    }

    // Unsupported method
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export { handler }; 