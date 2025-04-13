// Netlify serverless function to handle leaderboard operations
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (environment variables set in Netlify dashboard)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or your domain in production
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Handle GET request - retrieve leaderboard data
    if (event.httpMethod === 'GET') {
      // Fetch leaderboard data from Supabase
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // Handle POST request - update leaderboard data
    if (event.httpMethod === 'POST') {
      const { name, score, level } = JSON.parse(event.body);

      // Validate required fields
      if (!name || score === undefined || level === undefined) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      // Check if player already exists
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('name', name)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw fetchError;
      }

      let result;

      // Update or insert based on existing record and higher score
      if (existingPlayer) {
        // Only update if new score is higher
        if (score > existingPlayer.score) {
          const { data, error } = await supabase
            .from('leaderboard')
            .update({ score, level })
            .eq('name', name)
            .select();
            
          if (error) throw error;
          result = data;
        } else {
          // No update needed
          result = [existingPlayer];
        }
      } else {
        // Insert new player record
        const { data, error } = await supabase
          .from('leaderboard')
          .insert([{ name, score, level }])
          .select();
          
        if (error) throw error;
        result = data;
      }

      // Fetch updated leaderboard
      const { data: updatedLeaderboard, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          player: result[0],
          leaderboard: updatedLeaderboard
        })
      };
    }

    // Handle unsupported methods
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 