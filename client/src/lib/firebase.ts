import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, query, orderByChild } from 'firebase/database';
import { usePacketSniper } from './stores/usePacketSniper';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "your-database-url",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// User types
export interface UserData {
  username: string;
  tagId: string;
  password: string;
  level: number;
  score: number;
  totalThreatsDestroyed: number;
  totalThreatsMissed: number;
  totalShots: number;
  totalHits: number;
  accuracy: number; // Calculated field: totalHits / totalShots
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  tagId: string;
  level: number;
  score: number;
  totalThreatsDestroyed: number;
  totalThreatsMissed: number;
  totalShots: number;
  totalHits: number;
  accuracy: number;
}

// Current user session
let currentUser: { uid: string; userData: UserData } | null = null;

// Load user session from localStorage on startup
const loadSavedSession = () => {
  const savedSession = localStorage.getItem('packetSniper_userSession');
  if (savedSession) {
    try {
      currentUser = JSON.parse(savedSession);
    } catch (error) {
      console.error("Error loading saved session:", error);
      // Clear invalid session data
      localStorage.removeItem('packetSniper_userSession');
    }
  }
};

// Save current session to localStorage
const saveSession = () => {
  if (currentUser) {
    localStorage.setItem('packetSniper_userSession', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('packetSniper_userSession');
  }
};

// Initialize session
loadSavedSession();

// Simple authentication functions using RTDB
export async function registerUser(username: string, tagId: string, password: string): Promise<UserData> {
  try {
    // Ensure tag ID starts with @
    if (!tagId.startsWith('@')) {
      tagId = '@' + tagId;
    }
    
    // Enforce character limits
    if (username.length > 20) {
      throw new Error("Username must be 20 characters or less");
    }
    
    if (tagId.length > 10) { // Including the @ symbol
      throw new Error("Tag ID must be 9 characters or less (not including @)");
    }
    
    // Check if tag ID already exists
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const uid in users) {
        if (users[uid].tagId === tagId) {
          throw new Error("Tag ID already exists");
        }
      }
    }
    
    // Create a unique ID for the user
    const uid = Date.now().toString();
    
    // Create user profile in the database
    const userData: UserData = {
      username,
      tagId,
      password, // Note: In a real app, never store plain text passwords
      level: 1,
      score: 0,
      totalThreatsDestroyed: 0,
      totalThreatsMissed: 0, 
      totalShots: 0,
      totalHits: 0,
      accuracy: 0,
      createdAt: new Date().toISOString(),
    };
    
    await set(ref(db, `users/${uid}`), userData);
    
    // Set current user
    currentUser = { uid, userData };
    // Save session to localStorage
    saveSession();
    
    return userData;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function loginUser(tagId: string, password: string): Promise<UserData | null> {
  try {
    // Ensure tag ID starts with @
    if (!tagId.startsWith('@')) {
      tagId = '@' + tagId;
    }
    
    // Find user with matching tag ID
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const uid in users) {
        const user = users[uid];
        if (user.tagId === tagId && user.password === password) {
          // Set current user
          currentUser = { uid, userData: user };
          // Save session to localStorage
          saveSession();
          return user;
        }
      }
    }
    
    throw new Error("Invalid tag ID or password");
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    // Clear current user
    currentUser = null;
    // Remove session from localStorage
    saveSession();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

export function getCurrentUser(): { uid: string; userData: UserData } | null {
  return currentUser;
}

// Update user stats in Firebase
export async function updateUserStats(userData: Partial<UserData>): Promise<void> {
  try {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    // Get current user data
    const userRef = ref(db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const existingData = snapshot.val() as UserData;
      
      // Calculate accuracy
      const totalShots = userData.totalShots || existingData.totalShots || 0;
      const totalHits = userData.totalHits || existingData.totalHits || 0;
      const accuracy = totalShots > 0 ? (totalHits / totalShots) * 100 : 0;
      
      // Merge data and update
      const updatedData: UserData = {
        ...existingData,
        ...userData,
        accuracy: Math.round(accuracy * 10) / 10 // Round to 1 decimal place
      };
      
      await set(userRef, updatedData);
      
      // Update current user session
      currentUser.userData = updatedData;
      saveSession();
    }
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

// Get all users for the leaderboard
export async function getAllUsers(): Promise<LeaderboardEntry[]> {
  try {
    // Get all users
    const usersRef = ref(db, 'users');
    
    return new Promise((resolve) => {
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          resolve([]);
          return;
        }
        
        // Convert to array and map to leaderboard entries
        const leaderboardArray = Object.entries(data).map(([id, userData]) => {
          const user = userData as UserData;
          return {
            id,
            username: user.username,
            tagId: user.tagId,
            level: user.level,
            score: user.score,
            totalThreatsDestroyed: user.totalThreatsDestroyed || 0,
            totalThreatsMissed: user.totalThreatsMissed || 0,
            totalShots: user.totalShots || 0,
            totalHits: user.totalHits || 0,
            accuracy: user.accuracy || 0
          };
        });
        
        // Default sort by score descending
        leaderboardArray.sort((a, b) => b.score - a.score);
        resolve(leaderboardArray);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

// Sync user stats between game state and Firebase
export async function syncUserStats(): Promise<void> {
  try {
    // Import dynamically to avoid circular dependency
    const { usePacketSniper } = await import('./stores/usePacketSniper');
    
    // If user is not logged in, exit early
    if (!currentUser) {
      console.log("No user logged in, skipping sync");
      return;
    }
    
    // Get the current player stats from game state
    const gameState = usePacketSniper.getState();
    const gameStats = {
      level: gameState.level,
      score: gameState.score,
      totalThreatsDestroyed: gameState.totalThreatsDestroyed,
      totalThreatsMissed: gameState.totalThreatsMissed,
      totalShots: gameState.totalShots,
      totalHits: gameState.totalHits
    };
    
    // Get current user data from Firebase
    const userRef = ref(db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const firebaseData = snapshot.val() as UserData;
      
      // Determine which stats are higher in each source
      const syncedStats = {
        level: Math.max(gameStats.level, firebaseData.level || 1),
        score: Math.max(gameStats.score, firebaseData.score || 0),
        totalThreatsDestroyed: Math.max(gameStats.totalThreatsDestroyed, firebaseData.totalThreatsDestroyed || 0),
        totalThreatsMissed: Math.max(gameStats.totalThreatsMissed, firebaseData.totalThreatsMissed || 0),
        totalShots: Math.max(gameStats.totalShots, firebaseData.totalShots || 0),
        totalHits: Math.max(gameStats.totalHits, firebaseData.totalHits || 0)
      };
      
      // Calculate accuracy
      const accuracy = syncedStats.totalShots > 0 
        ? (syncedStats.totalHits / syncedStats.totalShots) * 100 
        : 0;
      
      // Update Firebase if needed
      if (
        syncedStats.level !== firebaseData.level ||
        syncedStats.score !== firebaseData.score ||
        syncedStats.totalThreatsDestroyed !== firebaseData.totalThreatsDestroyed ||
        syncedStats.totalThreatsMissed !== firebaseData.totalThreatsMissed ||
        syncedStats.totalShots !== firebaseData.totalShots ||
        syncedStats.totalHits !== firebaseData.totalHits
      ) {
        const updatedData = {
          ...firebaseData,
          ...syncedStats,
          accuracy: Math.round(accuracy * 10) / 10 // Round to 1 decimal place
        };
        
        await set(userRef, updatedData);
        currentUser.userData = updatedData;
        saveSession();
        
        console.log("Firebase data updated with synced stats");
      }
      
      // Update game state if needed
      if (
        syncedStats.level !== gameStats.level ||
        syncedStats.score !== gameStats.score ||
        syncedStats.totalThreatsDestroyed !== gameStats.totalThreatsDestroyed ||
        syncedStats.totalThreatsMissed !== gameStats.totalThreatsMissed ||
        syncedStats.totalShots !== gameStats.totalShots ||
        syncedStats.totalHits !== gameStats.totalHits
      ) {
        usePacketSniper.getState().setPlayerStats(syncedStats);
        console.log("Game state updated with synced stats");
      }
    }
  } catch (error) {
    console.error("Error syncing user stats:", error);
  }
}

// Delete user account from Firebase
export async function deleteUserAccount(): Promise<void> {
  try {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }
    
    // Reference to the user in the database
    const userRef = ref(db, `users/${currentUser.uid}`);
    
    // Remove the user data from Firebase
    await set(userRef, null);
    
    // Clear current user data and session
    currentUser = null;
    saveSession();
    
    console.log("User account deleted successfully");
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
}

export { db }; 