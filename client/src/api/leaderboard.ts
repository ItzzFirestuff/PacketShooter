import { getAllUsers, updateUserStats, LeaderboardEntry, UserData, getCurrentUser } from '@/lib/firebase';

export { LeaderboardEntry };

// Get the leaderboard from Firebase
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Use Firebase function to get all users
    return await getAllUsers();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Update the leaderboard in Firebase
export async function updateLeaderboard(data: { name: string; score: number; level: number }): Promise<LeaderboardEntry[]> {
  try {
    const currentUser = getCurrentUser();
    let tagId = '@user'; // Default tag
    
    if (currentUser) {
      tagId = currentUser.userData.tagId;
    }
    
    // Convert to UserData format
    await updateUserStats({
      username: data.name,
      level: data.level,
      score: data.score
    });
    
    // Return fresh leaderboard
    return await getAllUsers();
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return [];
  }
} 